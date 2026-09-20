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
 * WHY THE COMMITTED FILE CARRIES THE ORIGIN TOO
 * Deriving it only in the deploy workflow fixed the wrong deploy. GitHub
 * Pages, which that workflow drives, ignores `_headers` entirely; the hosts
 * that honour it -- Cloudflare Pages, Netlify -- run a plain `npm run build`
 * and never execute that step. So the rewrite landed exclusively where the
 * file is inert, and the committed `connect-src 'self'` shipped verbatim
 * wherever it is enforced. `--write-public` makes the committed copy correct,
 * per AGENTS.md's rule that a generator's output is committed rather than run
 * at build time, and deploy-guards.test.mjs fails if the two disagree. The
 * deploy still re-derives dist/_headers, so a preview on a different API
 * origin is right as well.
 *
 * Usage:
 *   node scripts/sync-headers-csp.mjs --write-public   # regenerate + commit
 *   node scripts/sync-headers-csp.mjs [dist-dir]       # deploy: sync + verify
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isCI, originProblem, redactCredentials } from "./check-public-origins.mjs";

/** Replace connect-src in one CSP header line, keeping every other directive. */
export function withConnectSrc(policy, apiOrigin) {
  const sources = ["'self'", apiOrigin].filter(Boolean).join(" ");
  if (!/connect-src\s+[^;]*/.test(policy)) {
    throw new Error("the CSP has no connect-src directive to update");
  }
  return policy.replace(/connect-src\s+[^;]*/, `connect-src ${sources}`);
}

// HTTP header names are case-insensitive, so `content-security-policy:` is a
// valid spelling of the line we have to rewrite.
//
// Anchored to an actual `_headers` field: leading whitespace, then the name,
// then the colon. Unanchored, the regex counted a *comment* -- and this file
// opens with a long one that mentions the directive by name. With the real
// header removed and the comment left behind, the count came to exactly one,
// the comment got rewritten, and the run exited 0: a header-capable deploy
// with no HTTP CSP at all, and no `frame-ancestors`, which a meta policy
// cannot enforce. The later verification never catches it because it inspects
// the HTML meta tag instead.
//
// The indentation requirement also excludes a prefixed name such as
// `X-Content-Security-Policy:`, since the field name must begin immediately
// after the indent.
const CSP_LINE = /^[ \t]+content-security-policy[ \t]*:/i;

export function syncHeaders(contents, apiOrigin) {
  const lines = contents.split("\n");
  const matches = lines.filter((line) => CSP_LINE.test(line)).length;
  // Silence here was the failure mode: with no matching line this returned the
  // file untouched and exited 0, and because every later assertion inspects
  // HTML rather than the header, a header-capable host would serve a stale
  // connect-src -- or none -- behind a green deploy.
  if (matches !== 1) {
    throw new Error(
      `_headers must contain exactly one Content-Security-Policy line, found ${matches}. ` +
        "Nothing was written; the CSP the deploy would serve is not the one this build derived.",
    );
  }
  return lines
    .map((line) => (CSP_LINE.test(line) ? withConnectSrc(line, apiOrigin) : line))
    .join("\n");
}

/** The sources listed in a page's meta-CSP `connect-src`, or null. */
export function metaConnectSrc(html) {
  // The delimiter is captured and back-referenced rather than excluded from
  // the value: a CSP is full of single quotes ('self', 'unsafe-inline'), so a
  // [^"'] class stops at the first source and the directive is never found.
  const tag = html.match(/<meta[^>]*http-equiv=(["'])Content-Security-Policy\1[^>]*>/i);
  if (!tag) return null;
  const meta = tag[0].match(/content=(["'])([\s\S]*?)\1/i);
  if (!meta) return null;
  const directive = meta[2].split(";").map((d) => d.trim()).find((d) => /^connect-src\b/i.test(d));
  return directive ? directive.split(/\s+/).slice(1) : null;
}

/** The href the welcome page's single call-to-action actually carries. */
export function welcomeButtonHref(html) {
  const match = html.match(/<a[^>]*class="[^"]*\bwelc-btn\b[^"]*"[^>]*href="([^"]*)"/i)
    || html.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*\bwelc-btn\b[^"]*"/i);
  return match ? match[1] : null;
}

// The origin the production API is served from. Already the documented value
// in AGENTS.md and in four workflows, so naming it here invents no config --
// it makes `public/_headers` correct as committed, which AGENTS.md ("Nothing
// in scripts/ runs at build time; each is a generator whose output is
// committed") requires and which a deploy-workflow-only rewrite could not
// give: a host that honours _headers and runs a plain `npm run build` -- the
// only host on which this file does anything -- never saw the deploy step.
export const PRODUCTION_API_ORIGIN = "https://api.lumecon.ai";

export const PUBLIC_HEADERS_PATH = "public/_headers";

// Resolved-path comparison rather than a filename suffix, matching
// check-public-origins.mjs. This spelling happened to be Windows-safe, but
// two different ways of answering one question is how the other one drifted.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  // Generator mode: regenerate the committed source file, then commit it.
  if (process.argv[2] === "--write-public") {
    const origin = process.env.PUBLIC_API_URL || PRODUCTION_API_ORIGIN;
    // Validate before doing anything with it. This branch used to go straight
    // to `new URL(origin).origin`, which silently strips userinfo -- so a
    // credential-bearing PUBLIC_API_URL produced a correct-looking header and
    // a log line carrying the password. The generated file being clean is not
    // the same as the input being acceptable.
    const problem = originProblem("PUBLIC_API_URL", origin);
    if (problem) {
      console.error(`Cannot regenerate ${PUBLIC_HEADERS_PATH}: ${problem}`);
      process.exit(1);
    }
    const shown = redactCredentials(origin);
    const before = readFileSync(PUBLIC_HEADERS_PATH, "utf8");
    const after = syncHeaders(before, new URL(origin).origin);
    if (before === after) {
      console.log(`${PUBLIC_HEADERS_PATH} already names ${shown}`);
    } else {
      writeFileSync(PUBLIC_HEADERS_PATH, after);
      console.log(`${PUBLIC_HEADERS_PATH} connect-src set to 'self' ${shown}`);
    }
    process.exit(0);
  }

  const args = process.argv.slice(2);
  // Used by the postbuild hook only. A contributor's `npm run build` has no
  // production origins and must keep working; a deploy's must not be allowed
  // to skip, which is why the deploy step does not pass this.
  const skipIfUnset = args.includes("--skip-if-unset");
  const dist = args.find((a) => !a.startsWith("--")) || "dist";

  // Skip only when BOTH are absent -- that is a contributor's local build.
  // One set and one missing is a misconfigured deploy: Astro has already
  // emitted a fallback for the missing one, and on a host that runs only
  // `npm run build` nothing downstream would ever catch it. So a partial
  // configuration falls through and fails on the missing value below.
  // ...and only outside CI. Cloudflare Pages, Netlify and GitHub Actions all
  // set CI=true and all run the same `npm run build` a contributor does, so
  // "no variables" is not by itself evidence of a local build -- it is also
  // exactly what a newly created or accidentally cleared hosted deploy looks
  // like, with Astro's login-only fallbacks already emitted.
  const noneSet = !process.env.PUBLIC_API_URL && !process.env.PUBLIC_APP_URL;
  if (skipIfUnset && noneSet && !isCI()) {
    console.log(
      "PUBLIC_APP_URL/PUBLIC_API_URL unset: leaving dist/_headers as committed " +
        "(it names the production API). This build is local-only.",
    );
    process.exit(0);
  }

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
  // Read the directive, not the document. Searching the whole page for the
  // origin passes on any site whose PUBLIC_API_URL is its own origin, because
  // the canonical link and the Open Graph tags already contain that string --
  // reproduced against a fallback build: connect-src was 'self' and the check
  // still reported success. Exactly the substring mistake fixed below for the
  // welcome button, left in place one line above it.
  const home = readFileSync(join(dist, "index.html"), "utf8");
  const connectSrc = metaConnectSrc(home);
  if (connectSrc === null) {
    console.error("dist/index.html has no meta CSP connect-src to verify.");
    process.exit(1);
  }
  if (!connectSrc.includes(apiOrigin)) {
    console.error(
      `dist/index.html's connect-src is ${JSON.stringify(connectSrc.join(" "))}, ` +
        `which does not name ${redactCredentials(apiOrigin)}; the CSP fell back.`,
    );
    process.exit(1);
  }
  // Check the button, not the page. welcome.astro hardcodes
  // canonical="https://lumecon.ai/welcome", so for an app URL on that same
  // host a substring search for the origin succeeds against the canonical tag
  // while the button itself still reads /login -- the exact fallback this is
  // here to catch. Compare the href to the configured URL, normalized the way
  // welcome.astro normalizes it.
  // Absent is a failure, not a skip. /welcome is the post-purchase
  // destination; a build that stopped emitting it has lost the page this
  // whole handoff exists to reach, and the deploy job uploads straight from
  // here without waiting on the smoke job that walks the page inventory.
  // Skipping also made the success line below claim a handoff it never saw.
  const welcome = join(dist, "welcome", "index.html");
  if (!existsSync(welcome)) {
    console.error(`No ${welcome}; the build emitted no /welcome page to hand off to.`);
    process.exit(1);
  }
  const expected = process.env.PUBLIC_APP_URL.replace(/\/+$/, "");
  const href = welcomeButtonHref(readFileSync(welcome, "utf8"));
  if (href === null) {
    console.error("dist/welcome/index.html has no .welc-btn link to verify.");
    process.exit(1);
  }
  if (href !== expected) {
    console.error(
      `dist/welcome/index.html's Open Lumecon points at ${JSON.stringify(href)}, ` +
        `not ${JSON.stringify(expected)}; PUBLIC_APP_URL did not reach the build.`,
    );
    process.exit(1);
  }
  // `new URL(...).origin` already drops userinfo and `originProblem` has
  // refused it above, so neither of these can carry a credential today. They
  // are redacted anyway, because every message in this pair of files that
  // prints one of these variables now goes through one function -- six review
  // rounds went to the ones that did not.
  console.log(
    `CSP synced: connect-src 'self' ${redactCredentials(apiOrigin)}; ` +
      `app handoff ${redactCredentials(appOrigin)} present.`,
  );
}
