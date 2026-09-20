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

// Values that mean "not CI" when CI is nonetheless set. `CI=false` is
// conventional in shells and tooling that want to force a local build, and a
// bare truthiness test read that nonempty string as CI -- so both lifecycle
// hooks refused an ordinary `npm run build` with no origins set, which is the
// exact case the skip exists for.
const CI_FALSEY = new Set(["", "0", "false", "no", "off"]);

/** Whether this is a CI build, by the value of `CI` rather than its presence. */
export function isCI(env = process.env) {
  return !CI_FALSEY.has(String(env.CI ?? "").trim().toLowerCase());
}

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
// WHATWG strips every ASCII tab, LF and CR from a URL -- anywhere in it,
// before anything else is parsed. They are therefore invisible to `new URL`
// and fully visible to any scan of the raw string, which is the gap that
// produced the fifth round of this fix.
const URL_IGNORED = "\t\n\r";

/** Where the authority sits in `raw`, and where its userinfo ends.
 *
 * scheme ":" then any run of "/", "\" or an ignored character; the authority
 * ends at the first "/", "\", "?" or "#"; userinfo runs to its LAST "@".
 * `lastAt` is null when the authority carries no userinfo; `end` is returned
 * either way, because everything past it is dropped from a diagnostic whether
 * this function found the credential or the parser did.
 */
function authorityBounds(raw) {
  const schemeEnd = raw.indexOf(":");
  if (schemeEnd === -1) return null;

  let start = schemeEnd + 1;
  while (
    start < raw.length &&
    (raw[start] === "/" || raw[start] === "\\" || URL_IGNORED.includes(raw[start]))
  ) {
    start += 1;
  }

  let end = raw.length;
  for (let i = start; i < raw.length; i += 1) {
    if ("/\\?#".includes(raw[i])) {
      end = i;
      break;
    }
  }

  const lastAt = raw.lastIndexOf("@", end - 1);
  return { start, end, lastAt: lastAt >= start ? lastAt : null };
}

/** The credential `new URL` finds in `value`, or null. */
function parsedCredential(raw) {
  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!parsed.username && !parsed.password) return null;
  const secrets = [parsed.username, parsed.password].filter(Boolean);
  for (const secret of [...secrets]) {
    try {
      const decoded = decodeURIComponent(secret);
      if (decoded !== secret) secrets.push(decoded);
    } catch {
      // A malformed percent sequence is not a second spelling to check.
    }
  }
  return { parsed, secrets };
}

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
 *
 * TWO MECHANISMS, NOT ONE
 * Five review rounds went to this function, and four of them were the same
 * mistake: I hand-wrote a URL parser, a spelling I had not thought of got
 * through, and I added that spelling. `@` then the last `@`; `//` then `\`;
 * and then tab, LF and CR, which WHATWG deletes outright. Extending the scan
 * a sixth time would be the same bet.
 *
 * So the scan is no longer trusted on its own. `new URL` -- the same parser
 * the rest of this file validates with, and the authority on what the
 * credential actually *is* -- reads the value independently, and every
 * occurrence of what it found is struck from the output, wherever it sits.
 * The scan still runs first because it preserves the raw spelling, which is
 * what makes these diagnostics worth reading; it is simply no longer the
 * last word.
 *
 * AND THE TAIL IS NOT PRINTED AT ALL
 * Everything from the first "/", "\", "?" or "#" after the authority is
 * dropped, replaced by a single ellipsis, whenever the value carries a
 * credential. Two previous rounds went to that tail: first a rebuild that
 * copied `pathname`, `search` and `hash` through unchanged, restoring a
 * password the value repeated later in itself; then a literal scrub, which
 * `.../%68%75%6e%74%65%72%32` walks straight past. Decoding before comparing
 * only moves the question -- `%2568%2575...` survives one decode, and there
 * is no last decode.
 *
 * So the tail is not normalized, it is removed. It is the one region of the
 * value that is unbounded and attacker-shaped, and a credential-bearing value
 * is refused whatever its path, so the path was never what the reader needed.
 * What is left -- scheme, host, port, in their raw spelling -- is short,
 * bounded, and still carries the diagnostic that matters: which variable, and
 * that it embeds a credential.
 *
 * Two consequences worth naming rather than discovering later. A one- or
 * two-character credential matches all over the remaining text and the output
 * becomes mostly `<redacted>` -- unhelpful, never unsafe. And a value
 * `new URL` refuses (`https://u:p@*.lumecon.ai`) has no second opinion
 * available, so there the scan stands alone, which is why it is written to
 * the authority's definition rather than to a pattern -- and why the tail is
 * dropped on the scan's own reading too, not only on the parser's.
 */
export function redactCredentials(value) {
  const raw = String(value);
  const bounds = authorityBounds(raw);
  const found = parsedCredential(raw);

  // No credential by either reading: print the value as it was given.
  if (!found && (!bounds || bounds.lastAt === null)) return raw;

  // Longest first, so a secret nested inside another is not fragmented by the
  // replacement of the shorter one.
  const secrets = found
    ? [...found.secrets].sort((a, b) => b.length - a.length)
    : [];
  // Scrub the surviving slices, never the assembled string: a one-character
  // credential otherwise matches inside the marker this function just wrote
  // and produces `<red<redacted>cted>`.
  const scrub = (text) =>
    secrets.reduce((acc, secret) => acc.split(secret).join("<redacted>"), text);

  if (!bounds) return `${scrub(raw)}`;

  const head = scrub(raw.slice(0, bounds.start));

  // Credentials present, by either reading: nothing past the marker is
  // printed. Two rounds got here one piece at a time -- the tail went first
  // because it is unbounded, then the authority when the parser could not
  // read the value -- and the host was kept on the reasoning that a parsed
  // credential is a *known* string, so scrubbing it is exact.
  //
  // It is not. The scrub is literal, and the host can carry the same secret
  // in another spelling: `https://user:hunter2@%68%75%6e%74%65%72%32.lumecon.ai`
  // parses to host `hunter2.lumecon.ai` and prints the encoded copy intact.
  // Scrubbing equivalent encodings is the game already declined for the tail,
  // since `%2568%2575...` survives a decode and there is no last decode.
  //
  // So the rule is now uniform and total: a credential-bearing value prints
  // its scheme, the marker, and an ellipsis. The host is what is lost, and
  // the message still names the variable, which is the actionable half.
  if (bounds.lastAt !== null) {
    // The parser could not read the value, so `secrets` is empty and `head`
    // was never actually scrubbed -- `hunter2://user:hunter2@bad host`
    // printed its scheme intact. The prefix goes too: nothing of an
    // unreadable value is printed except the marker.
    if (!found) return `<redacted>@\u2026`;
    // When the value *does* parse, the scheme is safe to keep. A scheme token
    // is letters, digits and `+-.` only, so it can carry the secret solely as
    // a literal, which the scrub above catches -- an encoded spelling like
    // `%68%75...://` is not a valid scheme and lands in the branch above.
    // Verified rather than assumed: `new URL` accepts `hunter2://...` and
    // rejects `%68%75%6e%74%65%72%32://...`.
    return `${head}<redacted>@\u2026`;
  }

  const host = scrub(raw.slice(bounds.start, bounds.end));
  // The tail is dropped, not scrubbed. See the note above for why.
  return `${head}${host}${bounds.end < raw.length ? "\u2026" : ""}`;
}

/** Why `value` is not usable as a production origin, or null when it is. */
export function originProblem(name, value) {
  const problem = describeOriginProblem(name, value);
  if (problem === null) return null;
  // One scrub at the exit, not one per message. Eight credential findings on
  // this file went to individual diagnostics -- and the one that caught this
  // was a message whose own comment claimed it "deliberately does not include
  // the value" while interpolating `url.host`. Several others interpolate
  // `url.origin`, `url.hostname` or `url.port`, any of which can repeat the
  // credential. Whatever is returned from here is checked against what the
  // parser says the secret is, so a message added later inherits it.
  const found = parsedCredential(String(value ?? "").trim());
  if (!found) return problem;
  return [...found.secrets]
    .sort((a, b) => b.length - a.length)
    .reduce((message, secret) => message.split(secret).join("<redacted>"), problem);
}

function describeOriginProblem(name, value) {
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
  // `new URL(raw)` with no base canonicalizes `https:/api.lumecon.ai` and
  // `https:api.lumecon.ai` to the intended origin, so every component check
  // below passes. The browser does not: the raw value is what Astro inlines,
  // and `${API_BASE}${path}` is resolved against the *document*, where a
  // scheme without `//` is a relative path. Measured -- both spellings become
  // `https://lumecon.ai/api.lumecon.ai/auth/login`, so every API call lands on
  // the marketing site while the CSP and the post-build check stay green,
  // because they only ever see the canonicalized origin.
  //
  // Applied to both variables: PUBLIC_APP_URL is inlined into an href and
  // resolves against the document in exactly the same way.
  if (!/^https:\/\//i.test(raw)) {
    return `${name} must begin with "https://", got ${JSON.stringify(redactCredentials(raw))}; a scheme without two forward slashes is resolved as a path relative to the page`;
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
  // ...but only PUBLIC_APP_URL may actually be one. PUBLIC_API_URL becomes a
  // `connect-src` host-source, and CSP's host-source grammar has no form for
  // an IPv6 literal -- no brackets, no colons in the host part -- so the
  // browser discards that source and `connect-src` falls back to `'self'`
  // alone. Every cross-origin API call is then blocked while both this guard
  // and the post-build check pass, because the check looks for the same
  // literal text in the directive and finds it. PUBLIC_APP_URL is only a link
  // target and never reaches a policy, so it stays exempt.
  if (isIpv6Literal && name === "PUBLIC_API_URL") {
    return `${name} cannot be an IPv6 literal: CSP host-source syntax has no form for one, so connect-src would silently drop it and keep only 'self', blocking every API call`;
  }
  // Same failure, different spelling. CSP's host-source grammar has no place
  // for a terminal root dot either, so `https://api.lumecon.ai.` produces a
  // source the browser discards -- and the post-build check confirms it,
  // because it looks for the same token it just wrote. Rejected rather than
  // normalized: stripping the dot for the policy while the value keeps it for
  // `${API_BASE}${path}` would leave the request origin and the authorized
  // source differing by exactly the character in question. The fix for the
  // deploy is to drop the dot, which is unambiguous.
  if (name === "PUBLIC_API_URL" && url.hostname.endsWith(".")) {
    return `${name} must not end in a root dot: CSP host-source syntax has no form for one, so connect-src would silently drop it and keep only 'self', blocking every API call`;
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
    return `${name} must not embed credentials; browsers refuse to fetch such a URL, and the value is inlined into the published bundle`;
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
  // The terminal root dot goes first, and it has to. `URL.hostname` keeps it,
  // so `localhost.` -- an ordinary absolute DNS spelling that resolves exactly
  // like `localhost` -- slipped past the end-anchored test below, while
  // `invalidDnsLabel` deliberately strips the same dot and let the value
  // through. Two functions disagreeing about one character, and the deploy
  // stayed green pointing visitors at their own loopback. The IPv4 path was
  // never affected: WHATWG canonicalises `10.0.0.1.` to `10.0.0.1` before
  // this sees it, which is exactly why the gap was name-only and easy to miss.
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  // Reserved and special-use names (RFC 6761, RFC 8375). `.local` is mDNS;
  // `foo.localhost` is still loopback however many labels precede it.
  // `alt` is RFC 9476 and `onion` is RFC 7686: both reserved for naming
  // systems that are not public DNS, so neither resolves for an ordinary
  // visitor however well-formed it looks.
  if (/(^|\.)(localhost|local|internal|intranet|home\.arpa|test|invalid|example|alt|onion)$/.test(host)) {
    return true;
  }

  // RFC 2606 also reserves three second-level names for documentation, which
  // the TLD rule above does not cover: `example` matches the `.example` TLD,
  // not `api.example.com`. These are the likeliest placeholder of the lot --
  // they appear in every API tutorial -- and they resolve, so nothing later
  // catches them either.
  if (/(^|\.)example\.(com|net|org)$/.test(host)) return true;

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
  // 192.88.99.0/24 was the 6to4 relay anycast prefix, deprecated by RFC 7526
  // and not globally reachable. Unlike IPv6, IPv4 has no single global-unicast
  // block to check against -- allocations are scattered across the space -- so
  // this list is the right shape here even though enumerating was the wrong
  // shape for IPv6. It is IANA's IPv4 Special-Purpose Address Registry, not a
  // guess at what might be unreachable.
  if (a === 192 && b === 88 && v4[3] === "99") return true;        // 192.88.99.0/24 6to4 anycast
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
  // 2001::/23, the IETF Protocol Assignments aggregate (2001:0000:: through
  // 2001:01ff::). Everything the block is carved into is a protocol
  // mechanism -- Teredo, benchmarking, ORCHID, DET, AMT, AS112 -- rather than
  // space anyone is assigned a server in, and the unassigned remainder is not
  // routed at all. `2001:40::1` and `2001:50::1` both read as ordinary global
  // unicast before this.
  //
  // Refused wholesale rather than with an exception list. A couple of
  // suballocations in here really are globally reachable, and none of them is
  // a plausible product origin -- they are anycast protocol endpoints and DNS
  // blackhole infrastructure -- so over-rejecting costs nothing real, where
  // guessing at a registry list I cannot verify from here would risk being
  // confidently wrong. That trade only works because the block is this
  // specific; it is the opposite of the reasoning for 2000::/3.
  //
  // This subsumes the 2001:2::/48, 2001:10::/28, 2001:20::/28 and 2001:30::/28
  // entries above, which are kept because each names why its own range is
  // unreachable. 2001:db8::/32 is *not* inside it -- 0xdb8 is past 0x01ff --
  // so the documentation carve-out is still doing its own work.
  if (groups[0] === 0x2001 && (groups[1] & 0xfe00) === 0x0000) return true;
  // 2002::/16, 6to4 transition space. It sits inside 2000::/3, so the scope
  // rule cannot reach it, and it encodes an IPv4 address rather than naming an
  // ordinarily reachable destination -- the v6 counterpart of the 192.88.99.0/24
  // relay prefix refused above.
  if (groups[0] === 0x2002) return true;
  // 2001:db8::/32, the IPv6 documentation range: the same trap as the IPv4
  // TEST-NET blocks, and just as likely to be copied out of an example.
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true;
  // 2001:2::/48, the IPv6 benchmarking range (RFC 5180) -- the counterpart
  // of IPv4's 198.18.0.0/15, which is already refused.
  if (groups[0] === 0x2001 && groups[1] === 0x0002 && groups[2] === 0) return true;
  // 2001:10::/28 (ORCHIDv1, RFC 4843) and 2001:20::/28 (ORCHIDv2, RFC 7343):
  // overlay routable cryptographic hash identifiers. They look like ordinary
  // global unicast and are not routed at all. Matched as the two /28s, so
  // 2001:30:: and the rest of 2001::/16 stay public.
  // ...and 2001:30::/28, reserved for DRIP Entity Tags (DET). Same shape as
  // the two ORCHID /28s beside it: identifiers, not destinations, inside
  // global unicast where the scope rule cannot reach them. Listed in IANA's
  // IPv6 Special-Purpose Address Registry.
  if (
    groups[0] === 0x2001 &&
    [0x0010, 0x0020, 0x0030].includes(groups[1] & 0xfff0)
  ) {
    return true;
  }
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
  // ::ffff:7f00:1 is 127.0.0.1 wearing a hat. Checked before the scope rule
  // below, since these sit at ::/96 and would otherwise all be refused,
  // including the ones wrapping a perfectly public address.
  const zeroPrefix = groups.slice(0, 5).every((g) => g === 0);
  if (zeroPrefix && (groups[5] === 0xffff || groups[5] === 0)) {
    if (groups[6] === 0 && groups[7] === 0) return true;
    // Only the mapped form, ::ffff:0:0/96, carries IPv4 semantics. The
    // IPv4-compatible form `::a.b.c.d` was deprecated by RFC 4291 and is not
    // a routed destination, so `[::8.8.8.8]` is unreachable however public
    // 8.8.8.8 is -- it was being judged as the address it merely embeds.
    if (groups[5] === 0) return true;
    const a = groups[6] >> 8, b = groups[6] & 0xff;
    const c = groups[7] >> 8, d = groups[7] & 0xff;
    return isNonPublicIpv4(`${a}.${b}.${c}.${d}`);
  }

  // Everything above enumerates what is *not* public, which means anything
  // nobody has thought to list reads as public -- and `4000::1`, `8000::1`
  // and `c000::1` all did. IANA has allocated exactly one block for global
  // unicast, 2000::/3 (RFC 4291 §2.4, IANA IPv6 Address Space registry);
  // every other top-level block is reserved. So the default is inverted:
  // outside 2000::/3 an address is not globally routable, full stop, and a
  // future reservation needs no change here.
  //
  // The listed prefixes stay. Those inside 2000::/3 -- 2001:db8::/32,
  // 2001:2::/48, the two ORCHID /28s and 3fff::/20 -- are the only ones this
  // rule cannot reach, so they remain load-bearing; the ones outside it
  // (fe80::/10, fc00::/7, fec0::/10, ff00::/8, 100::/64, ::1) are now
  // redundant, and are kept because they name the RFC that makes each one
  // unreachable, which a range check alone does not.
  if (groups[0] < 0x2000 || groups[0] > 0x3fff) return true;

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
  if (process.argv.includes("--skip-if-unset") && bothUnset && !isCI()) {
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
  // Redacted even here. Nothing credential-bearing reaches this line today --
  // `originProblem` refuses it above -- but six rounds of review went to
  // messages that leaked, and every one of them was a line somebody was sure
  // could not be reached with a secret in it.
  console.log(
    "Public origins look deployable: " +
      REQUIRED.map((n) => `${n}=${redactCredentials(process.env[n])}`).join(", "),
  );
}
