import test from "node:test";
import assert from "node:assert/strict";
import { originProblem, collectOriginProblems } from "./check-public-origins.mjs";
import {
  withConnectSrc,
  syncHeaders,
  welcomeButtonHref,
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
  for (const value of [
    "https://api.lumecon.ai/",
    "https://api.lumecon.ai/v1",
    "https://api.lumecon.ai?x=1",
  ]) {
    assert.match(originProblem("PUBLIC_API_URL", value) ?? "", /must be a bare origin/);
  }
  assert.equal(originProblem("PUBLIC_API_URL", "https://api.lumecon.ai"), null);
});

test("the app URL may carry a path, since it is a link target rather than a base", () => {
  assert.equal(originProblem("PUBLIC_APP_URL", "https://lumecon.ai/app"), null);
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
