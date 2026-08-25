# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities by email to **contact@lumecon.ai** with the subject line `Security: <brief title>`. We aim to respond within 5 business days.

When reporting, please include:

- A description of the issue and where it appears (URL, page, or component).
- A clear path to reproduce.
- The potential impact you observe.
- Your name or handle if you would like attribution in the disclosure.

## Scope

In scope:
- `lumecon.ai` and any subdomain that resolves to Lumecon-operated infrastructure.
- The audience entry-point domains: `localeconomicimpact.com`, `tribaleconomicimpact.com`, `globaleconomicimpact.com` (marketing doors into the same Lumecon platform).
- The marketing-page Cedar assistant (local keyword classifier on the static deploy; an optional backend API path exists behind `PUBLIC_API_URL`).
- The sign-up, log-in and checkout pages, which post to the Lumecon product API (`/auth/register`, `/auth/login`, `/auth/password-reset-request`, `/auth/password-reset`, and the planned `/billing/checkout-session` Stripe handoff) when a backend is configured.

Out of scope:
- Findings on third-party services we link to (LinkedIn, font CDNs).
- Brute-force attacks, denial-of-service tests, social engineering.
- Reports about missing security headers without an exploitable consequence.

## Coordinated disclosure

We follow coordinated disclosure. We will acknowledge receipt, investigate, ship a fix, and credit you (if you wish) in a public disclosure note. Please do not publicly disclose the vulnerability until we confirm a fix has shipped.

## Bounty

Lumecon does not currently offer a paid bounty program. We will credit researchers in our security disclosure history at our discretion.

## Open hardening items (2026-07 audit)

An internal review confirmed the static site is solid where it counts: the
Cedar chat escapes all user input before building any markup (no XSS sink),
query-param handling is allowlisted, analytics are consent-gated end to end,
no secrets ship in the bundle, and `rel="noopener"` is present on every
external link.

Fixed in that pass: an allowlist (`hasOwnProperty`) guard on the signup
`?tier=` badge, validation of the Stripe checkout redirect URL before
navigation, and least-privilege `permissions: contents: read` on the smoke
and lighthouse workflows.

Needs an infrastructure decision (tracked, not yet done):

- **Serve real HTTP security headers.** GitHub Pages ignores `public/_headers`,
  so the site currently ships with no `X-Frame-Options`, HSTS or enforced CSP
  (the `<meta http-equiv>` forms of nosniff/Permissions-Policy are inert;
  only the CSP meta is honored, and it allows `unsafe-inline`). Fronting the
  site with Cloudflare (or Cloudflare Pages) makes the already-written
  `public/_headers` live and closes the clickjacking exposure on the auth and
  checkout pages. The `connect-src` CSP edit must ship in the same change as
  `PUBLIC_API_URL`, or the API calls will be blocked.
  *Fallbacks, if Cloudflare is not the answer:* Netlify honors a `_headers`
  file with no code change, so the existing file ships as written; Vercel does
  not read `_headers`, so moving there means restating the same headers in a
  `vercel.json` `headers` block; an Astro Node adapter behind our own reverse
  proxy gives the same headers at the cost of running a server; and AWS
  CloudFront with a response-headers policy suits us if the rest of the stack
  ends up on AWS. Whichever is chosen, the requirement is real HTTP headers,
  not the vendor.
- **Self-host Inter and JetBrains Mono.** Google Fonts loads before consent,
  which discloses visitor IPs to a third party and contradicts the privacy
  policy's "no tracking scripts" language; self-hosting removes the third
  party and lets the CSP tighten to `font-src 'self'`.
  *Fallbacks, if self-hosting is not done first:* proxy the font files through
  our own origin so no visitor IP reaches Google; or defer the Google Fonts
  link until after consent and ship the system stack
  (`ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`)
  until then. Both close the disclosure; only self-hosting also lets the CSP
  tighten, so they are stopgaps rather than substitutes.
- SHA-pin GitHub Actions (currently tag refs) and pin `@lhci/cli` exactly.
