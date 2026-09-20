/**
 * Make the `_headers` CSP agree with the one Astro inlines, and prove the
 * built site carries the real origins.
 *
 * TWO POLICIES, ONE OF THEM WRONG
 * BaseLayout.astro derives connect-src from PUBLIC_API_URL, so the meta CSP
 * names the API origin. `public/_headers` is a static file that cannot see
 * build-time env, so it shipped `connect-src 'self'` — its own comment says
 * it "must ALSO name the app backend origin", and it did not.
 *
 * GitHub Pages ignores `_headers`, so today the meta tag is the only policy
 * in force and nothing is broken. That is exactly why it is worth fixing now:
 * the day this is served by a host that honours the file, the header wins
 * over the meta tag and every auth, checkout and Cedar call is blocked, with
 * the cause sitting in a file nobody edited that release.
 *
 * So the header is derived from the same value rather than maintained beside
 * it, and dist is checked afterwards to confirm the build really inlined the
 * origins instead of falling back.
 *
 * Runs against `dist/` after the build, in the deploy workflow.
 *
 * Usage:
 *   node scripts/sync-headers-csp.mjs [dist-dir]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { originProblem } from "./check-public-origins.mjs";

/** Replace connect-src in one CSP header line, keeping every other directive. */
export function withConnectSrc(policy, apiOrigin) {
  const sources = ["'self'", apiOrigin].filter(Boolean).join(" ");
  if (!/connect-src\s+[^;]*/.test(policy)) {
    throw new Error("the CSP has no connect-src directive to update");
  }
  return policy.replace(/connect-src\s+[^;]*/, `connect-src ${sources}`);
}

export function syncHeaders(contents, apiOrigin) {
  return contents
    .split("\n")
    .map((line) =>
      /Content-Security-Policy:/.test(line) ? withConnectSrc(line, apiOrigin) : line,
    )
    .join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("sync-headers-csp.mjs")) {
  const dist = process.argv[2] || "dist";
  const problem =
    originProblem("PUBLIC_API_URL", process.env.PUBLIC_API_URL) ||
    originProblem("PUBLIC_APP_URL", process.env.PUBLIC_APP_URL);
  if (problem) {
    console.error(`Cannot sync the CSP: ${problem}`);
    process.exit(1);
  }
  const apiOrigin = new URL(process.env.PUBLIC_API_URL).origin;
  const appOrigin = new URL(process.env.PUBLIC_APP_URL).origin;

  const headersPath = join(dist, "_headers");
  if (!existsSync(headersPath)) {
    console.error(`No ${headersPath}; the build did not copy public/_headers.`);
    process.exit(1);
  }
  writeFileSync(headersPath, syncHeaders(readFileSync(headersPath, "utf8"), apiOrigin));

  // The build is what ships, so assert against it rather than against the
  // intent. A variable that was set but never reached Astro looks identical
  // to one that was never set, in the only place it matters.
  const home = readFileSync(join(dist, "index.html"), "utf8");
  if (!home.includes(apiOrigin)) {
    console.error(`dist/index.html does not name ${apiOrigin}; the CSP fell back to 'self'.`);
    process.exit(1);
  }
  const welcome = join(dist, "welcome", "index.html");
  if (existsSync(welcome) && !readFileSync(welcome, "utf8").includes(appOrigin)) {
    console.error(`dist/welcome/index.html does not name ${appOrigin}; it fell back to /login.`);
    process.exit(1);
  }
  console.log(`CSP synced: connect-src 'self' ${apiOrigin}; app handoff ${appOrigin} present.`);
}
