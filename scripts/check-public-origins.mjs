/**
 * Refuse to build a deploy that would silently publish a degraded site.
 *
 * PUBLIC_APP_URL and PUBLIC_API_URL are inlined by Astro at build time. When
 * either is missing the site still builds, and builds *wrong*: `Open Lumecon`
 * falls back to `/login`, the auth and checkout forms degrade to the
 * contact-email path, and the CSP's connect-src loses the API origin so every
 * call the remaining forms make is blocked before it leaves the browser.
 *
 * None of that fails anything. The workflow goes green and the live site is
 * quietly login-only, which is the worst shape for this failure: it looks
 * deployed. A typo in a repository variable is enough.
 *
 * So this runs before the build and fails the job instead. It is a CI step
 * rather than a build hook on purpose — `npm run build` must keep working
 * locally without production origins, which is how contributors and the smoke
 * tests run it.
 *
 * Usage:
 *   node scripts/check-public-origins.mjs
 */
const REQUIRED = ["PUBLIC_APP_URL", "PUBLIC_API_URL"];

/** Why `value` is not usable as a production origin, or null when it is. */
export function originProblem(name, value) {
  const raw = (value ?? "").trim();
  if (!raw) return `${name} is not set`;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return `${name} is not a URL: ${JSON.stringify(raw)}`;
  }
  // http:// would publish a site whose auth posts credentials in clear, and
  // the CSP's upgrade-insecure-requests would break the call rather than
  // protect it.
  if (url.protocol !== "https:") {
    return `${name} must be https, got ${url.protocol}//`;
  }
  // Checked before the dot rule below so an unreachable address is named as
  // such. Enumerating a few spellings is not enough: `https://10.0.0.1` and
  // `https://foo.localhost` both contain a dot and both reach no visitor.
  if (isNonPublicHost(url.hostname)) {
    return `${name} points at a non-public address: ${url.hostname}`;
  }
  // A single-label name like `https://intranet` resolves only on some private
  // network. An IPv6 literal is exempt: it has no dots and is not a name.
  const isIpv6Literal = url.hostname.includes(":");
  if (!url.hostname || (!isIpv6Literal && !url.hostname.includes("."))) {
    return `${name} has no public hostname: ${JSON.stringify(raw)}`;
  }
  // The API base is concatenated raw -- `${API_BASE}${path}` in src/lib/api.ts
  // -- so a trailing slash silently produces `https://api.lumecon.ai//auth/login`.
  // A post-build check comparing origins cannot see that, because the origin of
  // the bad value is still correct. PUBLIC_APP_URL is exempt: it is a link
  // target, legitimately a path (`https://lumecon.ai/app`), and welcome.astro
  // normalizes it.
  if (name === "PUBLIC_API_URL" && raw !== url.origin) {
    return `${name} must be a bare origin (${url.origin}), got ${JSON.stringify(raw)}`;
  }
  return null;
}

/** True for any host a public visitor cannot reach. */
export function isNonPublicHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // Reserved and special-use names (RFC 6761, RFC 8375). `.local` is mDNS;
  // `foo.localhost` is still loopback however many labels precede it.
  if (/(^|\.)(localhost|local|internal|intranet|home\.arpa|test|invalid|example)$/.test(host)) {
    return true;
  }

  // IPv6 loopback, link-local (fe80::/10) and unique-local (fc00::/7).
  if (host === "::1" || /^fe80:/.test(host) || /^f[cd][0-9a-f]{2}:/.test(host)) {
    return true;
  }

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = v4.slice(1).map(Number);
    if (a === 0 || a === 127) return true;                 // this-host, loopback
    if (a === 10) return true;                             // RFC 1918
    if (a === 172 && b >= 16 && b <= 31) return true;      // RFC 1918
    if (a === 192 && b === 168) return true;               // RFC 1918
    if (a === 169 && b === 254) return true;               // link-local
    if (a === 100 && b >= 64 && b <= 127) return true;     // CGNAT, RFC 6598
    return false;
  }
  return false;
}

export function collectOriginProblems(env) {
  return REQUIRED.map((name) => originProblem(name, env[name])).filter(Boolean);
}

// Only act when run directly, so the tests can import the checks.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const problems = collectOriginProblems(process.env);
  if (problems.length > 0) {
    console.error("Refusing to build: the deploy would publish a degraded site.\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      "\nSet both repository variables (Settings > Secrets and variables > Actions > Variables).",
    );
    process.exit(1);
  }
  console.log(`Public origins look deployable: ${REQUIRED.map((n) => `${n}=${process.env[n]}`).join(", ")}`);
}
