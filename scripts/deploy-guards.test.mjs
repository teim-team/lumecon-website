import test from "node:test";
import assert from "node:assert/strict";
import { originProblem, collectOriginProblems } from "./check-public-origins.mjs";
import { withConnectSrc, syncHeaders } from "./sync-headers-csp.mjs";

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
