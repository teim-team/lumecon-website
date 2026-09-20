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
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const REQUIRED = ["PUBLIC_APP_URL", "PUBLIC_API_URL"];

// https://fetch.spec.whatwg.org/#bad-port -- ports Fetch blocks outright.
const BLOCKED_PORTS = new Set([
  // 0 is reserved and can never identify a listening service.
  0, 1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79,
  87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137,
  139, 143, 161, 179, 389, 427, 465, 512, 513, 514, 515, 526, 530, 531, 532,
  540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993, 995, 1719, 1720, 1723,
  2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669,
  6679, 6697, 10080,
]);

/** A value safe to print: any userinfo replaced, whatever else is wrong with it.
 *
 * Applied to every message rather than relying on the credential check
 * running first. It did not: a single leading space routed the value to the
 * whitespace complaint, which printed the password into the Actions log
 * before the credential check was ever reached. Ordering would fix that one
 * path and leave the next message added above it leaking again.
 *
 * Repository variables are not masked the way secrets are, so anything this
 * file prints is visible in the log to everyone who can read the run.
 */
export function redactCredentials(value) {
  // Greedy up to the FINAL `@` of the authority, not the first. A password
  // may contain a literal `@` -- WHATWG splits userinfo at the last one --
  // and a non-greedy match left everything after the first delimiter in the
  // log. `[^/]*` cannot cross a path separator, so an `@` in a path is not
  // touched.
  return String(value).replace(
    /(\/\/)[^/]*@/g,
    (_match, slashes) => `${slashes}<redacted>@`,
  );
}

/** Why `value` is not usable as a production origin, or null when it is. */
export function originProblem(name, value) {
  const original = value ?? "";
  const raw = original.trim();
  if (!raw) return `${name} is not set`;
  // Astro inlines the value as given, and src/lib/api.ts concatenates it raw,
  // so a stray space survives into `https://api.lumecon.ai /auth/login` while
  // every check here and after the build trims or re-parses it back to
  // something that looks correct.
  if (original !== raw) {
    return `${name} has leading or trailing whitespace: ${JSON.stringify(redactCredentials(original))}`;
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    return `${name} is not a URL: ${JSON.stringify(redactCredentials(raw))}`;
  }
  // http:// would publish a site whose auth posts credentials in clear, and
  // the CSP's upgrade-insecure-requests would break the call rather than
  // protect it.
  if (url.protocol !== "https:") {
    return `${name} must be https, got ${url.protocol}//`;
  }
  // Ports the Fetch standard refuses before opening a connection, so a
  // request to one fails in the browser with no network activity at all.
  if (url.port && BLOCKED_PORTS.has(Number(url.port))) {
    return `${name} uses port ${url.port}, which browsers refuse to fetch from`;
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
    return `${name} has no public hostname: ${JSON.stringify(redactCredentials(raw))}`;
  }
  // `new URL` is far more permissive than DNS: it happily parses
  // `https://*.lumecon.ai` (a wildcard copied out of an allowlist) and
  // `https://api..lumecon.ai` (a doubled-dot typo). Both then satisfy the
  // has-a-dot rule and the bare-origin comparison, and fail only at
  // resolution time, in the browser, on the published site.
  if (!isIpv6Literal) {
    const badLabel = invalidDnsLabel(url.hostname);
    if (badLabel) return `${name} is not a resolvable hostname: ${badLabel}`;
  }
  // The API base is concatenated raw -- `${API_BASE}${path}` in src/lib/api.ts
  // -- so a trailing slash silently produces `https://api.lumecon.ai//auth/login`.
  // A post-build check comparing origins cannot see that, because the origin of
  // the bad value is still correct. PUBLIC_APP_URL is exempt: it is a link
  // target, legitimately a path (`https://lumecon.ai/app`), and welcome.astro
  // normalizes it.
  // Both values name an origin (AGENTS.md: "product origin" / "product API
  // base"), so a path, query or fragment on either is a misconfiguration --
  // PUBLIC_APP_URL with a path silently lands every logged-in visitor on the
  // wrong page, which no later check can see.
  //
  // They differ only on a trailing slash. PUBLIC_API_URL is concatenated raw
  // (`${API_BASE}${path}`), so a slash there really does produce
  // //auth/login. Both PUBLIC_APP_URL consumers -- welcome.astro:19 and
  // login.astro:309 -- strip it before use, so refusing it there would block
  // a deploy that demonstrably works.
  // Compared by component rather than against `url.origin` as a string.
  // `origin` drops an explicit default port, so a string comparison rejected
  // `https://api.lumecon.ai:443` -- a perfectly deployable value that creates
  // no path, concatenates correctly, and matches a CSP source that omits the
  // port, since 443 is the default for https.
  // Credentials, checked before anything that echoes the value. Astro inlines
  // PUBLIC_* into the client bundle, so a userinfo-bearing origin is published
  // to every visitor -- measured: the password appeared in three files under
  // dist/_astro/ while the build exited 0. `fetch` also refuses to construct a
  // request from such a URL, so the deploy is broken *and* the secret is out.
  //
  // The message deliberately does not include the value: every other refusal
  // here quotes what it got, and doing that with a password would copy it into
  // the CI log this guard's failure is read from.
  if (url.username !== "" || url.password !== "") {
    return `${name} must not embed credentials (found userinfo before ${url.host}); browsers refuse to fetch such a URL, and the value is inlined into the published bundle`;
  }
  // The raw delimiters, not just their parsed contents. `https://api.lumecon.ai?`
  // has an empty `search` and an empty `hash`, so a component check alone
  // passes it -- while the concatenation produces
  // `https://api.lumecon.ai?/auth/login`, which the browser resolves to path
  // `/`. Every API call would reach the root. The string comparison this
  // replaced caught that case; the component rewrite that fixed the :443
  // over-rejection lost it, so both are checked now.
  if (raw.includes("?") || raw.includes("#")) {
    return `${name} must be a bare origin with no query or fragment marker, got ${JSON.stringify(redactCredentials(raw))}`;
  }
  if (url.pathname !== "/") {
    return `${name} must be a bare origin (${url.origin}), got ${JSON.stringify(redactCredentials(raw))}`;
  }
  // The API base is the only one where a trailing slash is fatal, because it
  // is concatenated raw; welcome.astro and login.astro both strip it.
  // A backslash too: WHATWG canonicalizes a trailing `\` to `/`, so the
  // parsed pathname is "/" and the component check sees nothing wrong, while
  // the raw value concatenates into `https://api.lumecon.ai\/auth/login` --
  // path `//auth/login`, which need not match the backend route.
  if (name === "PUBLIC_API_URL" && /[\\/]$/.test(raw)) {
    return `${name} must not end in a slash or backslash (it is concatenated with the path), got ${JSON.stringify(redactCredentials(raw))}`;
  }
  return null;
}

/** Why `hostname` cannot resolve, or null when its labels are all well-formed. */
export function invalidDnsLabel(hostname) {
  // One trailing dot is a root-anchored FQDN -- unusual in config, but it
  // resolves, so stripping it is right where refusing it would block a
  // working deploy.
  const name = hostname.replace(/\.$/, "");
  // A name is capped at 253 characters as well as 63 per label: four maximal
  // labels are each individually legal and together unresolvable.
  if (name.length > 253) {
    return `hostname is ${name.length} characters, past DNS's 253 limit`;
  }
  const labels = name.split(".");
  for (const label of labels) {
    if (label === "") return `empty label in ${JSON.stringify(redactCredentials(hostname))}`;
    if (label.includes("*")) return `wildcard in ${JSON.stringify(redactCredentials(hostname))}`;
    if (label.length > 63) return `label longer than 63 characters in ${JSON.stringify(redactCredentials(hostname))}`;
    if (label.startsWith("-") || label.endsWith("-")) {
      return `label ${JSON.stringify(label)} starts or ends with a hyphen`;
    }
    if (!/^[a-z0-9-]+$/i.test(label)) {
      return `label ${JSON.stringify(label)} has characters DNS will not resolve`;
    }
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

  if (host.includes(":")) return isNonPublicIpv6(host);
  return isNonPublicIpv4(host);
}

function isNonPublicIpv4(hostname) {
  const v4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;
  const [a, b] = v4.slice(1).map(Number);
  if (a === 0 || a === 127) return true;                 // this-host, loopback
  if (a === 10) return true;                             // RFC 1918
  if (a === 172 && b >= 16 && b <= 31) return true;      // RFC 1918
  if (a === 192 && b === 168) return true;               // RFC 1918
  if (a === 169 && b === 254) return true;               // link-local
  if (a === 100 && b >= 64 && b <= 127) return true;     // CGNAT, RFC 6598
  // Special-use ranges that are not globally routable either. None can serve
  // a product origin, and each is a plausible typo or copied example.
  if (a === 192 && b === 0 && v4[3] === "0") return true;          // 192.0.0.0/24 IETF protocol
  if (a === 192 && b === 0 && v4[3] === "2") return true;          // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true;            // 198.18.0.0/15 benchmarking
  if (a === 198 && b === 51 && v4[3] === "100") return true;       // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && v4[3] === "113") return true;        // 203.0.113.0/24 TEST-NET-3
  if (a >= 224) return true;                                       // multicast, reserved, broadcast
  return false;
}

/** The eight 16-bit groups of an IPv6 address, or null if it is not one. */
export function expandIpv6(hostname) {
  let text = hostname;

  // A dotted-quad tail (::ffff:127.0.0.1) is the same address as ::ffff:7f00:1.
  // Rewriting it to hex means one code path decides, rather than two.
  const tail = text.match(/^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (tail) {
    const [a, b, c, d] = tail.slice(2).map(Number);
    if ([a, b, c, d].some((n) => n > 255)) return null;
    text = `${tail[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }

  const halves = text.split("::");
  if (halves.length > 2) return null;
  const parse = (part) =>
    part === "" ? [] : part.split(":").map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));

  const head = parse(halves[0]);
  const tailGroups = halves.length === 2 ? parse(halves[1]) : [];
  if ([...head, ...tailGroups].some(Number.isNaN)) return null;

  if (halves.length === 1) return head.length === 8 ? head : null;
  const gap = 8 - head.length - tailGroups.length;
  if (gap < 1) return null;
  return [...head, ...Array(gap).fill(0), ...tailGroups];
}

function isNonPublicIpv6(hostname) {
  const groups = expandIpv6(hostname);
  if (!groups) return false;

  // ::1 loopback and :: unspecified.
  if (groups.slice(0, 7).every((g) => g === 0) && (groups[7] === 1 || groups[7] === 0)) {
    return true;
  }
  // fe80::/10 is fe80 through febf -- a `^fe80:` prefix test misses fe90::1
  // and febf::1, which are every bit as link-local.
  if (groups[0] >= 0xfe80 && groups[0] <= 0xfebf) return true;
  // fc00::/7 unique-local.
  if (groups[0] >= 0xfc00 && groups[0] <= 0xfdff) return true;
  // fec0::/10 site-local: deprecated by RFC 3879 and never reallocated, so
  // nothing legitimate uses it and it routes nowhere.
  if (groups[0] >= 0xfec0 && groups[0] <= 0xfeff) return true;
  // ff00::/8 multicast -- never a unicast origin a browser can fetch from.
  if (groups[0] >= 0xff00) return true;
  // 2001:db8::/32, the IPv6 documentation range: the same trap as the IPv4
  // TEST-NET blocks, and just as likely to be copied out of an example.
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true;
  // 2001:2::/48, the IPv6 benchmarking range (RFC 5180) -- the counterpart
  // of IPv4's 198.18.0.0/15, which is already refused.
  if (groups[0] === 0x2001 && groups[1] === 0x0002 && groups[2] === 0) return true;
  // 3fff::/20, the second documentation range (RFC 9637). Matched as the
  // exact /20 rather than the whole 3fff::/16, so neighbouring space is not
  // rejected along with it.
  if (groups[0] === 0x3fff && (groups[1] & 0xf000) === 0) return true;
  // 100::/64, the discard-only prefix (RFC 6666): traffic to it is dropped
  // by design, which is the most thorough way to be unreachable.
  if (groups[0] === 0x0100 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0) {
    return true;
  }

  // IPv4-mapped (::ffff:a.b.c.d) and the deprecated IPv4-compatible form
  // both carry a v4 address that has to be judged on its own terms --
  // ::ffff:7f00:1 is 127.0.0.1 wearing a hat.
  const zeroPrefix = groups.slice(0, 5).every((g) => g === 0);
  if (zeroPrefix && (groups[5] === 0xffff || groups[5] === 0)) {
    const a = groups[6] >> 8, b = groups[6] & 0xff;
    const c = groups[7] >> 8, d = groups[7] & 0xff;
    if (groups[6] === 0 && groups[7] === 0) return true;
    return isNonPublicIpv4(`${a}.${b}.${c}.${d}`);
  }
  return false;
}

export function collectOriginProblems(env) {
  return REQUIRED.map((name) => originProblem(name, env[name])).filter(Boolean);
}

// Only act when run directly, so the tests can import the checks. Compared as
// resolved filesystem paths rather than by splitting on "/": on Windows
// process.argv[1] uses backslashes, so the split left the whole path and the
// comparison was always false -- this guard would have printed nothing and
// exited 0, which is the one thing a guard must never do.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  // `--skip-if-unset` is for the prebuild hook: a contributor's build has no
  // production origins and must still work. Same rule as sync-headers-csp --
  // skip only when BOTH are absent and we are not in CI, since a hosted build
  // with nothing set is a misconfigured deploy, not a laptop. The deploy
  // workflow calls this without the flag, so it can never skip there.
  const bothUnset = !process.env.PUBLIC_API_URL && !process.env.PUBLIC_APP_URL;
  if (process.argv.includes("--skip-if-unset") && bothUnset && !process.env.CI) {
    console.log(
      "PUBLIC_APP_URL/PUBLIC_API_URL unset: skipping the origin check. " +
        "This build is local-only and will be login-only.",
    );
    process.exit(0);
  }
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
