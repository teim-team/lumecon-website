import test from "node:test";
import assert from "node:assert/strict";
import {
  originProblem,
  collectOriginProblems,
  isNonPublicHost,
  expandIpv6,
  invalidDnsLabel,
} from "./check-public-origins.mjs";
import {
  withConnectSrc,
  syncHeaders,
  welcomeButtonHref,
  metaConnectSrc,
  PRODUCTION_API_ORIGIN,
  PUBLIC_HEADERS_PATH,
} from "./sync-headers-csp.mjs";
import { readFileSync } from "node:fs";

// A missing or malformed origin used to build a perfectly valid, quietly
// degraded site: Open Lumecon falling back to /login, auth and checkout on
// the contact-email path, and connect-src without the API origin. The
// workflow went green either way, which is the worst shape for it — the
// deploy looks like it worked.

test("an absent origin is refused", () => {
  for (const value of [undefined, "", "   "]) {
    assert.match(originProblem("PUBLIC_API_URL", value), /is not set/);
  }
});

test("a non-https origin is refused", () => {
  // http would publish a site whose auth posts credentials in clear, and
  // upgrade-insecure-requests would break the call rather than protect it.
  assert.match(originProblem("PUBLIC_API_URL", "http://api.lumecon.ai"), /must be https/);
});

test("a local address is refused, because it builds and then points at nothing", () => {
  for (const value of ["https://localhost:3001", "https://127.0.0.1", "https://[::1]"]) {
    assert.ok(originProblem("PUBLIC_API_URL", value), `${value} was accepted`);
  }
});

test("something that is not a URL is refused", () => {
  assert.match(originProblem("PUBLIC_APP_URL", "app.lumecon.ai"), /not a URL|must be https/);
});

test("a real production origin passes", () => {
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai"), null);
  assert.deepEqual(
    collectOriginProblems({
      PUBLIC_APP_URL: "https://app.lumecon.ai",
      PUBLIC_API_URL: "https://api.lumecon.ai",
    }),
    [],
  );
});

test("both missing origins are reported, not just the first", () => {
  assert.equal(collectOriginProblems({}).length, 2);
});

// The meta CSP derives connect-src from PUBLIC_API_URL; _headers could not,
// so it shipped 'self'. GitHub Pages ignores the file, which is why nothing
// is broken today and why it is worth fixing before a host honours it.
test("connect-src is rewritten and every other directive survives", () => {
  const policy =
    "Content-Security-Policy: default-src 'self'; object-src 'none'; connect-src 'self'; upgrade-insecure-requests";
  const out = withConnectSrc(policy, "https://api.lumecon.ai");
  assert.match(out, /connect-src 'self' https:\/\/api\.lumecon\.ai;/);
  assert.match(out, /default-src 'self'/);
  assert.match(out, /object-src 'none'/);
  assert.match(out, /upgrade-insecure-requests/);
});

test("a policy with no connect-src is an error, not a silent no-op", () => {
  assert.throws(() => withConnectSrc("Content-Security-Policy: default-src 'self'", "https://x.y"));
});

test("only the CSP line is touched", () => {
  const file = [
    "/*",
    "  X-Frame-Options: DENY",
    "  Content-Security-Policy: default-src 'self'; connect-src 'self'; upgrade-insecure-requests",
    "  Referrer-Policy: no-referrer",
  ].join("\n");
  const out = syncHeaders(file, "https://api.lumecon.ai").split("\n");
  assert.equal(out[1], "  X-Frame-Options: DENY");
  assert.equal(out[3], "  Referrer-Policy: no-referrer");
  assert.match(out[2], /connect-src 'self' https:\/\/api\.lumecon\.ai/);
});

// ---------------------------------------------------------------------------
// Codex review, PR #341. Five ways a guard reported success while the deploy
// it guards was still broken. Each test below fails against the code as it
// stood when the review was written.
// ---------------------------------------------------------------------------

test("a private or link-local address is refused, not just localhost", () => {
  // The first cut matched a four-item prefix list, so every one of these --
  // each of which contains a dot and reaches no public visitor -- passed.
  for (const host of [
    "https://10.0.0.1",
    "https://192.168.1.5",
    "https://172.16.0.9",
    "https://172.31.255.254",
    "https://169.254.1.1",
    "https://100.64.0.1",
    "https://foo.localhost",
    "https://api.local",
    "https://api.internal",
    "https://service.test",
    "https://[fe80::1]",
    "https://[fd00::1]",
  ]) {
    assert.match(
      originProblem("PUBLIC_API_URL", host) ?? "",
      /non-public address/,
      `${host} should be refused`,
    );
  }
});

test("a public address that merely resembles a private one is still allowed", () => {
  // 172.32 is outside RFC 1918, and 11.x is public. A guard that over-rejects
  // blocks a legitimate deploy, which is its own kind of failure.
  for (const host of ["https://172.32.0.1", "https://11.0.0.1", "https://api.lumecon.ai"]) {
    assert.equal(originProblem("PUBLIC_API_URL", host), null, `${host} should pass`);
  }
});

test("the API base must be a bare origin, because it is concatenated raw", () => {
  // src/lib/api.ts builds `${API_BASE}${path}`, so a trailing slash yields
  // https://api.lumecon.ai//auth/login. Comparing origins post-build cannot
  // see it: the origin of the bad value is correct.
  // A trailing slash now reports the specific problem rather than the general
  // rule -- same refusal, a message that names what is wrong.
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai/") ?? "", /must not end in a slash/);
  for (const value of ["https://api.lumecon.ai/v1", "https://api.lumecon.ai?x=1"]) {
    assert.match(originProblem("PUBLIC_API_URL", value) ?? "", /must be a bare origin/);
  }
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai"), null);
});

test("the app URL must also be a bare origin, but tolerates a trailing slash", () => {
  // Corrected after the second review round. The first cut allowed a path
  // here on the reasoning that PUBLIC_APP_URL is a link target rather than a
  // concatenation base. True, but beside the point: AGENTS.md:458 defines it
  // as the product origin, and both consumers -- welcome.astro:19 and
  // login.astro:309 -- assign it straight to an href / location.href, so a
  // path lands every logged-in visitor on the wrong page with nothing
  // downstream able to notice.
  assert.match(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai/login") ?? "", /bare origin/);
  assert.match(originProblem("PUBLIC_APP_URL", "https://lumecon.ai/app") ?? "", /bare origin/);
  assert.match(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai?x=1") ?? "", /bare origin/);

  // A trailing slash is the one difference from PUBLIC_API_URL: both
  // consumers strip it, so it demonstrably works and refusing it would block
  // a good deploy. PUBLIC_API_URL is concatenated raw, so there it is fatal.
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai/"), null);
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai"), null);
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai/") ?? "", /must not end in a slash/);
});

test("a _headers file with no CSP line fails instead of passing silently", () => {
  // Previously this returned the file unchanged and exited 0. Every later
  // assertion reads HTML, so the stale header shipped behind a green deploy.
  assert.throws(
    () => syncHeaders("/*\n  X-Frame-Options: DENY\n", PRODUCTION_API_ORIGIN),
    /exactly one Content-Security-Policy line, found 0/,
  );
});

test("a _headers file with two CSP lines fails rather than rewriting both", () => {
  const two = "/*\n  Content-Security-Policy: connect-src 'self'\n/app/*\n  Content-Security-Policy: connect-src 'self'\n";
  assert.throws(() => syncHeaders(two, PRODUCTION_API_ORIGIN), /found 2/);
});

test("the CSP line is matched case-insensitively, as HTTP header names are", () => {
  const lower = "/*\n  content-security-policy: default-src 'self'; connect-src 'self'\n";
  assert.match(syncHeaders(lower, PRODUCTION_API_ORIGIN), /connect-src 'self' https:\/\/api\.lumecon\.ai/);
});

test("the welcome handoff is read off the button, not found anywhere in the page", () => {
  // welcome.astro hardcodes canonical="https://lumecon.ai/welcome". For an app
  // URL on that host, a substring search for the origin passes against the
  // canonical tag while the button still reads /login.
  const fellBack = '<link rel="canonical" href="https://lumecon.ai/welcome">'
    + '<a class="welc-btn" href="/login">Open Lumecon</a>';
  assert.equal(welcomeButtonHref(fellBack), "/login");

  const configured = '<a class="welc-btn" href="https://lumecon.ai/app">Open Lumecon</a>';
  assert.equal(welcomeButtonHref(configured), "https://lumecon.ai/app");

  assert.equal(welcomeButtonHref("<a href=\"/login\">no class</a>"), null);
});

test("the committed _headers names the production API origin", () => {
  // The file only does anything on hosts that run a plain `npm run build` and
  // never execute the deploy workflow's rewrite, so 'self' in the committed
  // copy meant no API origin on exactly the deploys that enforce it.
  // Regenerate with: node scripts/sync-headers-csp.mjs --write-public
  const committed = readFileSync(PUBLIC_HEADERS_PATH, "utf8");
  const csp = committed.split("\n").filter((l) => /content-security-policy:/i.test(l));
  assert.equal(csp.length, 1, "expected exactly one CSP line in public/_headers");
  assert.ok(
    csp[0].includes(`connect-src 'self' ${PRODUCTION_API_ORIGIN}`),
    `public/_headers connect-src does not name ${PRODUCTION_API_ORIGIN}`,
  );
});

test("a public IPv6 literal is allowed, despite containing no dot", () => {
  // The dot rule is there to catch single-label names like https://intranet.
  // An IPv6 literal is not a name and has no dots, so it must be exempt or
  // the guard rejects a legitimate origin.
  assert.equal(originProblem("PUBLIC_API_URL", "https://[2606:4700::1111]"), null);
});

test("the whole of fe80::/10 is link-local, not just the fe80 prefix", () => {
  // The first cut tested `^fe80:` textually, so fe90::1 and febf::1 -- the
  // rest of the same /10 -- passed as public.
  for (const host of ["https://[fe80::1]", "https://[fe90::1]", "https://[febf::1]"]) {
    assert.match(originProblem("PUBLIC_API_URL", host) ?? "", /non-public address/, host);
  }
});

test("an IPv4 address wearing an IPv6 hat is judged as the IPv4 address", () => {
  // ::ffff:7f00:1 and ::ffff:127.0.0.1 are both 127.0.0.1. A textual prefix
  // test sees neither.
  for (const host of [
    "https://[::ffff:7f00:1]",
    "https://[::ffff:127.0.0.1]",
    "https://[::ffff:10.0.0.1]",
    "https://[::ffff:192.168.1.5]",
    "https://[::1]",
    "https://[::]",
    "https://[fc00::1]",
    "https://[fd00::1]",
    "https://[fec0::1]",
  ]) {
    assert.match(originProblem("PUBLIC_API_URL", host) ?? "", /non-public address/, host);
  }
});

test("a public IPv6 address, mapped or native, is still allowed", () => {
  assert.equal(isNonPublicHost("[2606:4700::1111]"), false);
  assert.equal(isNonPublicHost("[::ffff:8.8.8.8]"), false);
  assert.equal(isNonPublicHost("[2001:4860:4860::8888]"), false);
});

test("expandIpv6 returns null for things that are not addresses", () => {
  // The range checks must not fire on a parse failure, or a hostname that
  // merely contains a colon would be judged as an address.
  for (const bad of ["not:an:address:at:all:x:y:z", "1::2::3", "12345::1", ""]) {
    assert.equal(expandIpv6(bad), null, bad);
  }
  assert.deepEqual(expandIpv6("::1"), [0, 0, 0, 0, 0, 0, 0, 1]);
});

// ---------------------------------------------------------------------------
// Third review round: three more ways a value passes every check and still
// cannot serve a request. Each of these was measured passing first.
// ---------------------------------------------------------------------------

test("whitespace is refused, because the build inlines the untrimmed value", () => {
  // Every check here trimmed, and the post-build check re-parses, so both saw
  // a correct origin -- while src/lib/api.ts concatenated the raw value into
  // "https://api.lumecon.ai /auth/login".
  for (const value of ["https://api.lumecon.ai ", " https://api.lumecon.ai", "https://api.lumecon.ai\t"]) {
    assert.match(originProblem("PUBLIC_API_URL", value) ?? "", /whitespace/);
  }
  // Whitespace-only is still "not set" rather than a whitespace complaint --
  // the more useful message for the commonest mistake.
  assert.match(originProblem("PUBLIC_API_URL", "   ") ?? "", /is not set/);
});

test("special-use IPv4 ranges are refused, not just the private ones", () => {
  for (const host of [
    "https://192.0.2.1",      // TEST-NET-1, the documentation range
    "https://198.51.100.1",   // TEST-NET-2
    "https://203.0.113.1",    // TEST-NET-3
    "https://198.18.0.1",     // benchmarking
    "https://224.0.0.1",      // multicast
    "https://240.0.0.1",      // reserved
    "https://255.255.255.255" // broadcast
  ]) {
    assert.match(originProblem("PUBLIC_API_URL", host) ?? "", /non-public address/, host);
  }
});

test("neighbouring public addresses are still allowed", () => {
  // The ranges above are narrow. 192.1.x, 198.20.x and 203.1.x sit just
  // outside them and are ordinary public space.
  for (const host of ["https://192.1.2.3", "https://198.20.0.1", "https://203.1.113.1", "https://8.8.8.8"]) {
    assert.equal(originProblem("PUBLIC_API_URL", host), null, host);
  }
});

test("a hostname DNS cannot resolve is refused, however happily URL parses it", () => {
  assert.match(originProblem("PUBLIC_API_URL", "https://*.lumecon.ai") ?? "", /wildcard/);
  assert.match(originProblem("PUBLIC_API_URL", "https://api..lumecon.ai") ?? "", /empty label/);
  assert.match(originProblem("PUBLIC_API_URL", "https://-api.lumecon.ai") ?? "", /hyphen/);
  assert.match(originProblem("PUBLIC_API_URL", "https://api-.lumecon.ai") ?? "", /hyphen/);
});

test("a root-anchored hostname is allowed, since it actually resolves", () => {
  // One trailing dot is unusual in configuration but valid DNS. Refusing it
  // would block a deploy that works, which is the failure this guard has in
  // the other direction.
  assert.equal(invalidDnsLabel("api.lumecon.ai."), null);
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai."), null);
  assert.equal(invalidDnsLabel("my-api.lumecon.ai"), null);
});

// ---------------------------------------------------------------------------
// Fourth review round. Two of these are defects in the previous round's own
// fixes, which is the more useful kind to catch.
// ---------------------------------------------------------------------------

test("IPv6 multicast and the documentation range are refused", () => {
  // The IPv4 pass covered TEST-NET; its IPv6 counterpart, 2001:db8::/32, is
  // the same trap and was left open. ff00::/8 is multicast and can never be
  // a unicast origin a browser fetches from.
  for (const host of [
    "https://[ff02::1]",
    "https://[ff00::1]",
    "https://[ff05::2]",
    "https://[2001:db8::1]",
    "https://[2001:db8:dead:beef::1]",
  ]) {
    assert.match(originProblem("PUBLIC_API_URL", host) ?? "", /non-public address/, host);
  }
});

test("addresses adjacent to the IPv6 documentation range stay allowed", () => {
  // 2001:db8::/32 is one /32. 2001:db7:: and 2001:db9:: are ordinary space,
  // and Google's and Cloudflare's resolvers both live in 2001::/16.
  for (const host of ["[2001:db7::1]", "[2001:db9::1]", "[2001:4860:4860::8888]", "[2606:4700::1111]"]) {
    assert.equal(isNonPublicHost(host), false, host);
  }
});

// ---------------------------------------------------------------------------
// Fifth review round.
// ---------------------------------------------------------------------------

test("the CSP check reads the directive, not the whole document", () => {
  // Reproduced against a real fallback build: connect-src was 'self', the
  // page contained "https://lumecon.ai" twice in its canonical and OG tags,
  // and the old whole-page substring search reported success. The same
  // mistake already fixed for the welcome button, one line above it.
  const fellBack =
    '<link rel="canonical" href="https://lumecon.ai/">' +
    '<meta property="og:url" content="https://lumecon.ai/">' +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; connect-src 'self'; img-src 'self' data:\">";
  assert.ok(fellBack.includes("https://lumecon.ai"), "the old check would have passed");
  assert.deepEqual(metaConnectSrc(fellBack), ["'self'"]);

  const configured =
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; connect-src 'self' https://api.lumecon.ai; font-src 'self'\">";
  assert.deepEqual(metaConnectSrc(configured), ["'self'", "https://api.lumecon.ai"]);
});

test("the CSP parser survives the single quotes a policy is full of", () => {
  // A [^"'] content class stops at the first 'self' and finds no directive,
  // which reads as "no CSP to verify" rather than as a mismatch. Caught by
  // running it against a real build rather than a hand-written fixture.
  const real =
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.lumecon.ai; " +
    "upgrade-insecure-requests\">";
  assert.deepEqual(metaConnectSrc(real), ["'self'", "https://api.lumecon.ai"]);
  assert.equal(metaConnectSrc("<html><body>no meta here</body></html>"), null);
  assert.equal(
    metaConnectSrc("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'\">"),
    null,
    "a policy with no connect-src has nothing to verify",
  );
});

test("ports the browser refuses to fetch from are rejected", () => {
  // https://fetch.spec.whatwg.org/#bad-port -- these fail in the browser
  // before any network connection, so nothing server-side would ever see it.
  for (const port of [22, 25, 110, 6667]) {
    assert.match(
      originProblem("PUBLIC_API_URL", `https://api.lumecon.ai:${port}`) ?? "",
      /refuse to fetch/,
      `port ${port}`,
    );
  }
  // A non-standard but perfectly fetchable port stays allowed.
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai:8443"), null);
});

// ---------------------------------------------------------------------------
// Sixth review round. The first is an over-rejection I had explicitly
// examined and called correct -- worth its own test for that reason.
// ---------------------------------------------------------------------------

test("an explicit default port is allowed, on both variables", () => {
  // `url.origin` drops :443, so comparing raw against it rejected a value
  // that deploys fine: no path, concatenates correctly, and matches a CSP
  // source written without the port, 443 being the https default. I reasoned
  // about this case last round and called the rejection correct. It wasn't.
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai:443"), null);
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai:443"), null);
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai:8443"), null);
});

test("the bare-origin rule still refuses what it was written for", () => {
  // Restated in components rather than by string comparison, so this pins
  // that nothing was loosened along with the port fix.
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai/") ?? "", /slash/);
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai/v1") ?? "", /bare origin/);
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai?x=1") ?? "", /bare origin/);
  assert.match(originProblem("PUBLIC_APP_URL", "https://lumecon.ai/app") ?? "", /bare origin/);
  // ...and the app variable still tolerates the slash its consumers strip.
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai/"), null);
});

test("a hostname over DNS's 253-character limit is refused", () => {
  // Four labels, each individually legal at 63 characters or fewer, together
  // unresolvable. Per-label validation alone cannot see it.
  const tooLong = `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(59)}.com`;
  assert.equal(tooLong.length, 255);
  assert.match(invalidDnsLabel(tooLong) ?? "", /253/);
  assert.equal(invalidDnsLabel(`${"a".repeat(63)}.${"b".repeat(63)}.example.com`), null);
});

test("the remaining reserved IPv6 prefixes are refused, to the bit", () => {
  // 3fff::/20 (RFC 9637 documentation) and 100::/64 (RFC 6666 discard).
  assert.match(originProblem("PUBLIC_API_URL", "https://[3fff::1]") ?? "", /non-public/);
  assert.match(originProblem("PUBLIC_API_URL", "https://[3fff:0800::1]") ?? "", /non-public/);
  assert.match(originProblem("PUBLIC_API_URL", "https://[100::1]") ?? "", /non-public/);

  // The boundaries matter: these sit just outside each prefix and are
  // ordinary space. Matching 3fff::/16 or 100::/16 would swallow them.
  assert.equal(isNonPublicHost("[3fff:1000::1]"), false);
  assert.equal(isNonPublicHost("[3ffe::1]"), false);
  assert.equal(isNonPublicHost("[101::1]"), false);
  assert.equal(isNonPublicHost("[100::1:0:0:0:1]"), false);
});

test("an empty query or fragment marker is refused", () => {
  // A regression from the previous round: `https://api.lumecon.ai?` has an
  // empty `search` AND an empty `hash`, so checking parsed components alone
  // passes it, while `${API_BASE}${path}` yields
  // "https://api.lumecon.ai?/auth/login" -- which the browser resolves to
  // path "/". Every API call would reach the root.
  //
  // The string comparison this replaced caught it. The rewrite that fixed
  // the :443 over-rejection lost it, so the raw delimiters are checked too.
  assert.equal(new URL("https://api.lumecon.ai?").search, "", "premise: search is empty");
  for (const value of [
    "https://api.lumecon.ai?",
    "https://api.lumecon.ai#",
    "https://api.lumecon.ai?#",
  ]) {
    assert.match(originProblem("PUBLIC_API_URL", value) ?? "", /query or fragment/, value);
    assert.match(originProblem("PUBLIC_APP_URL", value) ?? "", /query or fragment/, value);
  }
  // Non-empty ones were already refused and still are.
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai?x=1") ?? "", /query or fragment/);
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai#frag") ?? "", /query or fragment/);
  // ...and the round-6 allowances survive.
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai:443"), null);
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai/"), null);
});

test("credentials in an origin are refused, and not echoed back", () => {
  // Worse than a broken deploy. Astro inlines PUBLIC_* into the client
  // bundle, so a userinfo-bearing origin is published to every visitor:
  // measured against a real build, the password appeared in three files
  // under dist/_astro/ while the build exited 0 and the postbuild guard
  // printed success. `fetch` also refuses to construct a request from such
  // a URL, so every API call fails too.
  for (const value of [
    "https://user:hunter2@api.lumecon.ai",
    "https://user@api.lumecon.ai",
    "https://:hunter2@api.lumecon.ai",
  ]) {
    const problem = originProblem("PUBLIC_API_URL", value);
    assert.match(problem ?? "", /must not embed credentials/, value);
    // The message must not carry the secret into the CI log that this
    // guard's failure is read from. Every other refusal here quotes the
    // value it got; this one deliberately does not.
    assert.ok(!problem.includes("hunter2"), `message leaked the password: ${problem}`);
  }
  assert.equal(originProblem("PUBLIC_APP_URL", "https://user:hunter2@app.lumecon.ai") === null, false);

  // Ordinary origins are untouched.
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai"), null);
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai:443"), null);
});
