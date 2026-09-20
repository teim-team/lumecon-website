import test from "node:test";
import assert from "node:assert/strict";
import {
  originProblem,
  collectOriginProblems,
  isNonPublicHost,
  expandIpv6,
  invalidDnsLabel,
  redactCredentials,
  isCI,
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
import { execFileSync } from "node:child_process";

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

test("a public IPv6 literal is allowed where a policy never sees it", () => {
  // The dot rule is there to catch single-label names like https://intranet.
  // An IPv6 literal is not a name and has no dots, so it must be exempt or
  // the guard rejects a legitimate origin. Still true -- but only for
  // PUBLIC_APP_URL, which is a link target.
  assert.equal(originProblem("PUBLIC_APP_URL", "https://[2606:4700::1111]"), null);

  // PUBLIC_API_URL is different, and this assertion is the reverse of what it
  // was: that value becomes a `connect-src` host-source, and CSP's grammar
  // has no form for an IPv6 literal -- no brackets, no colons in the host
  // part. The browser discards the source and keeps only `'self'`, so every
  // cross-origin call is blocked while this guard and the post-build check
  // both pass, the latter because it finds the same literal text in the
  // directive it just wrote.
  assert.match(
    originProblem("PUBLIC_API_URL", "https://[2606:4700::1111]") ?? "",
    /IPv6 literal/,
  );
  // A non-public v6 address is still reported as non-public, not as this --
  // the more specific diagnosis comes first.
  assert.match(
    originProblem("PUBLIC_API_URL", "https://[fe80::1]") ?? "",
    /non-public address/,
  );
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

test("no message leaks a credential, whatever else is wrong with the value", () => {
  // The credential check was not first: a single leading space routed the
  // value to the whitespace complaint, which printed the password into the
  // Actions log before the credential check ran. Repository variables are
  // not masked the way secrets are, so that log is readable by anyone who
  // can see the run.
  //
  // Fixed by redacting in every message rather than by reordering, which
  // would fix one path and leave the next message added above it leaking.
  // This test walks the paths rather than the one that was reported.
  const withSecret = [
    " https://user:hunter2@app.lumecon.ai",      // whitespace
    "https://user:hunter2@app.lumecon.ai",       // credentials
    "https://user:hunter2@app.lumecon.ai/v1",    // path
    "https://user:hunter2@app.lumecon.ai?",      // empty query marker
    "https://user:hunter2@*.lumecon.ai",         // unresolvable hostname
    "https://user:hunter2@api.lumecon.ai/",      // trailing slash
  ];
  for (const value of withSecret) {
    for (const name of ["PUBLIC_API_URL", "PUBLIC_APP_URL"]) {
      const problem = originProblem(name, value);
      assert.ok(problem, `${value} should be refused`);
      assert.ok(!problem.includes("hunter2"), `leaked via ${name}: ${problem}`);
    }
  }
  assert.equal(
    redactCredentials(" https://user:hunter2@app.lumecon.ai"),
    " https://<redacted>@app.lumecon.ai",
  );
  // A value with no userinfo is printed unchanged.
  assert.equal(redactCredentials("https://api.lumecon.ai/v1"), "https://api.lumecon.ai/v1");
});

test("port 0 and the IPv6 benchmarking range are refused", () => {
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai:0") ?? "", /refuse to fetch/);
  // 2001:2::/48 is IPv4 198.18.0.0/15's counterpart, which was already out.
  assert.match(originProblem("PUBLIC_API_URL", "https://[2001:2::1]") ?? "", /non-public/);
  // Matched as the /48, not a wider prefix: these neighbours stay allowed.
  assert.equal(isNonPublicHost("[2001:3::1]"), false);
  assert.equal(isNonPublicHost("[2001:2:1::1]"), false);
});

test("redaction reaches the final userinfo delimiter, not the first", () => {
  // WHATWG splits userinfo at the LAST `@`, so a password may contain one.
  // A non-greedy match redacted up to the first and printed the rest.
  const parsed = new URL("https://user:first@second@app.lumecon.ai");
  assert.equal(parsed.password, "first%40second", "premise: the @ is in the password");

  for (const value of [
    " https://user:first@second@app.lumecon.ai",
    "https://usr9:aaa9@bbb9@ccc9@app.lumecon.ai",
  ]) {
    const redacted = redactCredentials(value);
    assert.ok(!/second|aaa9|bbb9|ccc9/.test(redacted), `leaked: ${redacted}`);
    assert.match(redacted, /<redacted>@app\.lumecon\.ai|<redacted>@app/);
  }

  // An `@` in a path is not userinfo and must survive: `[^/]*` cannot cross
  // a separator, so ordinary diagnostics keep their detail.
  assert.equal(redactCredentials("https://api.lumecon.ai/a@b"), "https://api.lumecon.ai/a@b");
  assert.equal(redactCredentials("https://api.lumecon.ai"), "https://api.lumecon.ai");
});

test("a trailing backslash is refused on the API base, like a slash", () => {
  // WHATWG canonicalizes a trailing `\` to `/`, so `pathname` is "/" and the
  // component check sees nothing wrong -- while the raw value concatenates
  // into `https://api.lumecon.ai\/auth/login`, path `//auth/login`.
  assert.equal(new URL("https://api.lumecon.ai\\").pathname, "/", "premise: canonicalized");
  assert.equal(new URL("https://api.lumecon.ai\\" + "/auth/login").pathname, "//auth/login");

  assert.match(
    originProblem("PUBLIC_API_URL", "https://api.lumecon.ai\\") ?? "",
    /slash or backslash/,
  );
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai"), null);
  // PUBLIC_APP_URL tolerates it for the same reason it tolerates a trailing
  // slash: its consumers strip it and it is not concatenated.
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai\\"), null);
});

test("a backslash authority separator is redacted too, and benign values survive", () => {
  // Fourth round on one leak. Each previous fix matched the spelling of
  // credential I had in mind -- first `@`, then last `@`, then `//` but not
  // `\\`, which WHATWG accepts as an authority separator for a special
  // scheme. So the guard is no longer a pattern: it locates the authority
  // by its definition and redacts up to its last `@`.
  assert.equal(
    new URL("https:\\\\user:hunter2@app.lumecon.ai").password,
    "hunter2",
    "premise: a backslash separator parses as userinfo",
  );
  assert.equal(new URL("https:/\\user:hunter2@app.lumecon.ai").password, "hunter2");

  for (const value of [
    "https:\\\\user:hunter2@app.lumecon.ai",
    "https:\\/user:hunter2@app.lumecon.ai",
    "https:/\\user:hunter2@app.lumecon.ai/v1",
    "https:\\\\user:hunter2@app.lumecon.ai?x=1",
    "https:\\\\user:hunter2@app.lumecon.ai#f",
    "https:\\\\usr9:aaa9@bbb9@app.lumecon.ai",
    " https:\\\\user:hunter2@app.lumecon.ai",
  ]) {
    const redacted = redactCredentials(value);
    assert.ok(!redacted.includes("hunter2"), `leaked: ${redacted}`);
    assert.ok(!/aaa9|bbb9/.test(redacted), `leaked: ${redacted}`);
    assert.match(redacted, /<redacted>@app\.lumecon\.ai/, value);
    // Redaction IS truncation, as of the encoded-copy round: everything past
    // the authority is dropped rather than cleaned, because the tail is the
    // one unbounded region and `%68%75%6e%74%65%72%32` walks past any literal
    // comparison. An ellipsis marks that something was there.
    for (const tail of ["/v1", "?x=1", "#f"]) {
      if (value.endsWith(tail)) {
        assert.ok(!redacted.endsWith(tail), `tail survived: ${redacted}`);
        assert.ok(redacted.endsWith("\u2026"), `no truncation marker: ${redacted}`);
      }
    }
  }

  // Structural parsing must not start rewriting values that carry no
  // userinfo at all. The rewrite in this round was the risk: the previous
  // one lost a case it had already handled.
  for (const value of [
    "https://api.lumecon.ai",
    "https://api.lumecon.ai:8443/path?q=1",
    "https://api.lumecon.ai/a@b",
    "https://api.lumecon.ai#a@b",
    "not a url at all",
  ]) {
    assert.equal(redactCredentials(value), value, `rewrote a benign value: ${value}`);
  }
});

test("no spelling of a URL leaks its credential, checked against the parser", () => {
  // Fifth round on one leak, and the fourth with the same shape: I hand-wrote
  // a URL parser, a spelling I had not thought of got through, and I added
  // that spelling. `@` then the last `@`; `//` then `\`; and now tab, LF and
  // CR, which WHATWG deletes from a URL outright -- invisible to `new URL`,
  // fully visible to a scan of the raw string.
  //
  // So this is a property, not a list. Every combination below is generated
  // and checked against what `new URL` says the credential actually is,
  // rather than against a regex I would have to be right about.
  const SEPARATORS = ["//", "\\\\", "/\\", "\\/", "\n//", "\t//", "\r\n//", "//\t"];
  // Distinctive tokens on purpose. A one-character username is a substring of
  // any host, so `includes` would report a leak for every output -- and the
  // implementation's own verification step has the same blind spot, where it
  // errs toward rebuilding the value rather than printing it.
  const USERINFO = [
    "usr9:hunter2",
    "usr9:first@second",
    "aaa9:bbb9@ccc9@ddd9",
    ":hunter2",
    "usr9",
  ];
  const TAILS = ["", "/", "/v1", "?x=1", "#f", "/v1?x=1#f"];
  const LEADS = ["", " ", "\n"];

  let checked = 0;
  for (const lead of LEADS) {
    for (const sep of SEPARATORS) {
      for (const info of USERINFO) {
        for (const tail of TAILS) {
          const value = `${lead}https:${sep}${info}@app.lumecon.ai${tail}`;
          let parsed;
          try {
            parsed = new URL(value.trim());
          } catch {
            continue; // No second opinion available; covered by the cases above.
          }
          const secrets = [parsed.username, parsed.password].filter(Boolean);
          if (secrets.length === 0) continue; // Not a credential-bearing spelling.

          const redacted = redactCredentials(value);
          for (const secret of secrets) {
            assert.ok(
              !redacted.includes(secret),
              `leaked ${JSON.stringify(secret)} from ${JSON.stringify(value)}: ${JSON.stringify(redacted)}`,
            );
            let decoded = secret;
            try {
              decoded = decodeURIComponent(secret);
            } catch {
              /* malformed escape; nothing further to check */
            }
            assert.ok(
              !redacted.includes(decoded),
              `leaked decoded ${JSON.stringify(decoded)}: ${JSON.stringify(redacted)}`,
            );
          }
          assert.match(redacted, /<redacted>@/, value);
          checked += 1;
        }
      }
    }
  }
  // A silent zero would make every assertion above vacuous.
  assert.ok(checked > 300, `only ${checked} spellings were checked`);
});

test("ignored whitespace inside a URL does not hide a credential", () => {
  // The reported case, kept as a named example of the class above.
  assert.equal(
    new URL(" https:\n//user:hunter2@app.lumecon.ai".trim()).password,
    "hunter2",
    "premise: WHATWG strips the LF and parses the userinfo",
  );
  for (const value of [
    " https:\n//user:hunter2@app.lumecon.ai",
    "https:/\t/user:hunter2@app.lumecon.ai",
    "https:\r\n//user:hunter2@app.lumecon.ai",
    "https://user:hun\nter2@app.lumecon.ai",
    "ht\ntps://user:hunter2@app.lumecon.ai",
  ]) {
    const redacted = redactCredentials(value);
    assert.ok(!redacted.includes("hunter2"), `leaked: ${JSON.stringify(redacted)}`);
    assert.match(redacted, /<redacted>@app\.lumecon\.ai/);
  }

  // And no message reaches the log unredacted, whichever complaint fires.
  for (const name of ["PUBLIC_API_URL", "PUBLIC_APP_URL"]) {
    const problem = originProblem(name, " https:\n//user:hunter2@app.lumecon.ai");
    assert.ok(problem, "should be refused");
    assert.ok(!problem.includes("hunter2"), `leaked via ${name}: ${problem}`);
  }
});

test("a credential repeated in the tail is struck there too", () => {
  // The previous round's fix reintroduced the leak it was written to close.
  // On a survival hit it rebuilt the value from the parsed components -- and
  // copied `pathname`, `search` and `hash` through unchanged, so a value that
  // repeated its own password later in the URL had the secret restored by the
  // very branch that existed to remove it.
  for (const value of [
    "https://user:hunter2@app.lumecon.ai/hunter2",
    "https://user:hunter2@app.lumecon.ai?token=hunter2",
    "https://user:hunter2@app.lumecon.ai#hunter2",
    "https://user:hunter2@app.lumecon.ai/a/hunter2/b?x=hunter2#hunter2",
    // The host itself is no exception: a match there is struck as well.
    "https://user:hunter2@hunter2.lumecon.ai",
  ]) {
    const redacted = redactCredentials(value);
    assert.ok(!redacted.includes("hunter2"), `leaked: ${JSON.stringify(redacted)}`);
  }

  // The username is a secret too, not just the password.
  const named = redactCredentials("https://svcaccount:pw@app.lumecon.ai/svcaccount");
  assert.ok(!named.includes("svcaccount"), named);

  // And the raw spelling survives, which the rebuild destroyed: a leading
  // space and an ignored newline are the thing the message is complaining
  // about, so printing a canonicalized URL hid the evidence.
  assert.equal(
    redactCredentials(" https://user:hunter2@app.lumecon.ai"),
    " https://<redacted>@app.lumecon.ai",
  );

  // A one-character credential matches all over an ordinary URL. The output
  // is noisy, never unsafe -- and in particular the scrub must not eat into
  // the marker this function itself wrote (`<red<redacted>cted>`).
  const noisy = redactCredentials("https://a:b@app.lumecon.ai");
  assert.ok(!/<red<redacted>/.test(noisy), `marker corrupted: ${noisy}`);
  assert.match(noisy, /<redacted>@/);
});

test("a root-anchored special-use name is still non-public", () => {
  // `URL.hostname` keeps the terminal dot, so an end-anchored suffix test
  // missed `localhost.` while `invalidDnsLabel` deliberately stripped the
  // same dot and accepted the value -- two functions disagreeing about one
  // character, and the deploy stayed green pointing visitors at their own
  // loopback.
  assert.equal(new URL("https://localhost.").hostname, "localhost.", "premise: dot kept");

  for (const host of ["localhost.", "foo.localhost.", "svc.internal.", "box.local.", "a.test."]) {
    assert.equal(isNonPublicHost(host), true, host);
    assert.match(
      originProblem("PUBLIC_API_URL", `https://${host}`) ?? "",
      /non-public/,
      host,
    );
  }

  // A root-anchored *public* FQDN resolves and must keep working -- the fix
  // is to normalize the dot, not to refuse it. `invalidDnsLabel` already
  // strips it for exactly that reason.
  assert.equal(isNonPublicHost("app.lumecon.ai."), false);
  assert.equal(originProblem("PUBLIC_APP_URL", "https://app.lumecon.ai."), null);

  // The IPv4 path never had the gap: WHATWG canonicalizes the trailing dot
  // away before this sees it. Pinned so a future refactor cannot introduce it.
  assert.equal(new URL("https://10.0.0.1.").hostname, "10.0.0.1");
  assert.match(originProblem("PUBLIC_API_URL", "https://10.0.0.1.") ?? "", /non-public/);
});

test("an encoded copy of the credential cannot survive in the tail", () => {
  // Sixth round on this function, and the third on the tail specifically: a
  // rebuild copied it through, then a literal scrub missed
  // `%68%75%6e%74%65%72%32`. Decoding before comparing only moves the
  // question -- `%2568%2575...` survives one decode, and there is no last
  // decode. So the tail is no longer normalized, it is removed.
  const ENCODED = [
    "/%68%75%6e%74%65%72%32",              // fully percent-encoded
    "/%2568%2575%256e%2574%2565%2572%2532", // double-encoded
    "?t=%68unter2",                         // partially encoded
    "#%68%75%6e%74%65%72%32",
    "/hunter2",                             // the literal case, still covered
    "/a/hunter2/b?x=hunter2#hunter2",
  ];
  for (const tail of ENCODED) {
    const redacted = redactCredentials(`https://user:hunter2@app.lumecon.ai${tail}`);
    // Decode repeatedly: a single check would pass on the double-encoded case
    // for the wrong reason, which is exactly how the last fix looked correct.
    let decoded = redacted;
    for (let i = 0; i < 5; i += 1) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        break;
      }
    }
    assert.ok(!redacted.includes("hunter2"), `leaked literally: ${redacted}`);
    assert.ok(!decoded.includes("hunter2"), `leaked once decoded: ${redacted}`);
    assert.equal(redacted, "https://<redacted>@app.lumecon.ai…");
  }

  // The diagnostic that matters survives: which variable, and that it embeds
  // a credential. The message says the rest.
  for (const name of ["PUBLIC_API_URL", "PUBLIC_APP_URL"]) {
    const problem = originProblem(name, "https://user:hunter2@app.lumecon.ai/%68%75%6e%74%65%72%32");
    assert.ok(problem.includes(name), problem);
    assert.ok(!problem.includes("hunter2"), problem);
  }

  // No tail, no ellipsis -- the marker means something was dropped.
  assert.equal(
    redactCredentials(" https://user:hunter2@app.lumecon.ai"),
    " https://<redacted>@app.lumecon.ai",
  );
  // A port is part of the authority and is kept.
  assert.equal(
    redactCredentials("https://user:hunter2@app.lumecon.ai:8443/x"),
    "https://<redacted>@app.lumecon.ai:8443…",
  );
});

test("a value with no credential keeps its whole path", () => {
  // Truncation is scoped to credential-bearing values. Every other refusal --
  // a trailing slash, a non-public host, a blocked port -- still prints what
  // it was given, which is the whole point of those messages.
  for (const value of [
    "https://api.lumecon.ai/v1",
    "https://api.lumecon.ai/v1?x=1#f",
    "https://api.lumecon.ai/a@b",
    "https://10.0.0.1/internal/path",
  ]) {
    assert.equal(redactCredentials(value), value, `rewrote ${value}`);
  }
  assert.match(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai/v1") ?? "", /\/v1/);
});

test("CI is read by its value, not its presence", () => {
  // `CI=false` is conventional in shells and tooling that want to force a
  // local build. A bare truthiness test read that nonempty string as CI, so
  // both lifecycle hooks refused an ordinary `npm run build` with no origins
  // set -- the exact case the skip exists for.
  for (const value of ["false", "FALSE", " false ", "0", "no", "off", ""]) {
    assert.equal(isCI({ CI: value }), false, JSON.stringify(value));
  }
  assert.equal(isCI({}), false, "unset is not CI");
  for (const value of ["true", "1", "yes", "on", "github"]) {
    assert.equal(isCI({ CI: value }), true, JSON.stringify(value));
  }
});

test("both lifecycle hooks take the local path under CI=false", () => {
  // The property that matters is the process's behaviour, not the predicate:
  // the finding was that `npm run build` exited 1. Exercised end to end.
  const env = { ...process.env, CI: "false" };
  delete env.PUBLIC_API_URL;
  delete env.PUBLIC_APP_URL;
  for (const [script, args] of [
    ["scripts/check-public-origins.mjs", ["--skip-if-unset"]],
    ["scripts/sync-headers-csp.mjs", ["dist", "--skip-if-unset"]],
  ]) {
    const out = execFileSync("node", [script, ...args], { env, encoding: "utf8" });
    assert.match(out, /local-only/, script);
  }
});

test("the generator refuses a credential-bearing origin instead of logging it", () => {
  // `--write-public` went straight to `new URL(origin).origin`, which strips
  // userinfo -- so the generated header looked correct while the log line
  // carried the password. A clean output file is not the same as an
  // acceptable input.
  const env = { ...process.env, PUBLIC_API_URL: "https://user:hunter2@api.lumecon.ai" };
  let failed = false;
  let output = "";
  try {
    execFileSync("node", ["scripts/sync-headers-csp.mjs", "--write-public"],
      { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    failed = true;
    output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  assert.ok(failed, "the generator accepted a credential-bearing origin");
  assert.ok(!output.includes("hunter2"), `leaked: ${output}`);
  assert.match(output, /must not embed credentials/);

  // And the committed file is untouched by the refusal.
  const committed = readFileSync(PUBLIC_HEADERS_PATH, "utf8");
  assert.ok(committed.includes(PRODUCTION_API_ORIGIN), "the generator rewrote the file anyway");
});

test("ORCHID address space is not public", () => {
  // 2001:10::/28 (RFC 4843) and 2001:20::/28 (RFC 7343) are overlay routable
  // cryptographic hash identifiers: they look like ordinary global unicast
  // and are not routed at all.
  for (const host of ["[2001:10::1]", "[2001:1f::1]", "[2001:20::1]", "[2001:2f:ffff::1]"]) {
    assert.equal(isNonPublicHost(host), true, host);
    assert.match(originProblem("PUBLIC_API_URL", `https://${host}`) ?? "", /non-public/, host);
  }
  // Matched as the two /28s, so the neighbouring space stays usable -- the
  // same discipline as the 3fff::/20 and 2001:2::/48 entries.
  for (const host of ["[2001:30::1]", "[2001:f::1]", "[2001:0::1]", "[2606:4700::1111]"]) {
    assert.equal(isNonPublicHost(host), false, host);
  }
});

test("no message from originProblem can contain the credential", () => {
  // Replaces a source grep. That version listed the variable names it
  // expected to see interpolated -- `origin`, `apiOrigin`, `appOrigin` -- and
  // so was blind to `${url.host}`, which is exactly what leaked next: the
  // eighth credential finding on this file, in a message whose own comment
  // claimed it "deliberately does not include the value".
  //
  // A property expressed over source text can be defeated by a naming choice.
  // This one is expressed over behaviour: plant the secret in every position
  // a URL has, walk every refusal branch, and assert no returned message
  // contains it.
  const SECRET = "hunter2";
  const VALUES = [
    `https://user:${SECRET}@api.lumecon.ai`,                 // credentials
    `https://user:${SECRET}@${SECRET}.lumecon.ai`,           // repeated in the host
    `https://${SECRET}:pw@${SECRET}.lumecon.ai`,             // username in the host
    `https://user:${SECRET}@${SECRET}.localhost`,            // non-public host
    `https://user:${SECRET}@${SECRET}.alt`,                  // reserved namespace
    `https://user:${SECRET}@*.${SECRET}.ai`,                 // unresolvable label
    `https://user:${SECRET}@${SECRET}`,                      // single label
    `https://user:${SECRET}@api.lumecon.ai:22`,              // blocked port
    `http://user:${SECRET}@api.lumecon.ai`,                  // wrong scheme
    `https://user:${SECRET}@api.lumecon.ai/${SECRET}`,       // path
    `https://user:${SECRET}@api.lumecon.ai?t=${SECRET}`,     // query
    `https://user:${SECRET}@api.lumecon.ai#${SECRET}`,       // fragment
    `https://user:${SECRET}@api.lumecon.ai/`,                // trailing slash
    ` https://user:${SECRET}@api.lumecon.ai`,                // leading whitespace
    `https://user:${SECRET}@api.lumecon.ai\\`,               // trailing backslash
    `https:\\\\user:${SECRET}@api.lumecon.ai`,               // backslash separator
    ` https:\n//user:${SECRET}@api.lumecon.ai`,              // ignored whitespace
    `https://user:${SECRET}@[2606:4700::1111]`,              // IPv6 literal
    `https://user:${SECRET}@[not-an-ipv6]`,                  // unparseable
    `user:${SECRET}@api.lumecon.ai`,                         // no scheme of its own
    `ftp://user:${SECRET}@api.lumecon.ai`,                   // wrong scheme entirely
  ];

  let refusals = 0;
  for (const value of VALUES) {
    for (const name of ["PUBLIC_API_URL", "PUBLIC_APP_URL"]) {
      const problem = originProblem(name, value);
      if (problem === null) continue;
      refusals += 1;
      assert.ok(
        !problem.includes(SECRET),
        `${name} leaked from ${JSON.stringify(value)}: ${problem}`,
      );
      // And once decoded, repeatedly -- a single decode passes the
      // double-encoded case for the wrong reason.
      let decoded = problem;
      for (let i = 0; i < 5; i += 1) {
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          break;
        }
      }
      assert.ok(!decoded.includes(SECRET), `${name} leaked once decoded: ${problem}`);
    }
  }
  // A silent zero would make every assertion above vacuous.
  assert.ok(refusals > 30, `only ${refusals} refusals were exercised`);

  // The boundary, pinned deliberately. A value with no colon cannot carry
  // userinfo in any URL sense, so there is no credential to hide and the
  // diagnostic echoes it whole -- which is what makes these messages useful.
  // An unparseable value that *does* carry userinfo is still redacted, by the
  // scan rather than by the parser. My first version of this sweep listed a
  // prose fixture containing the word "hunter2" and read the echo as a leak;
  // the difference is worth a test rather than a memory.
  assert.equal(
    originProblem("PUBLIC_API_URL", "not a url at all"),
    'PUBLIC_API_URL is not a URL: "not a url at all"',
  );
  assert.match(
    originProblem("PUBLIC_API_URL", `https://user:${SECRET}@[not-an-ipv6]`) ?? "",
    /<redacted>@/,
  );
});

test("the reserved .alt namespace is not public", () => {
  // RFC 9476 reserves it for non-DNS naming, so it never resolves for an
  // ordinary visitor however well-formed the name looks.
  for (const host of ["api.alt", "a.b.alt", "alt"]) {
    assert.equal(isNonPublicHost(host), true, host);
  }
  assert.match(originProblem("PUBLIC_API_URL", "https://api.alt") ?? "", /non-public/);
  // Anchored on a label boundary, so an ordinary name ending in those three
  // letters is untouched.
  for (const host of ["salt.lumecon.ai", "api.altitude.com", "basalt.io"]) {
    assert.equal(isNonPublicHost(host), false, host);
  }
});
