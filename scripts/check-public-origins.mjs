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
  if (!url.hostname || !url.hostname.includes(".")) {
    return `${name} has no public hostname: ${JSON.stringify(raw)}`;
  }
  // localhost and friends build fine and then point real visitors at nothing.
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname)) {
    return `${name} points at a local address: ${url.hostname}`;
  }
  return null;
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
