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
- The sign-up, log-in and checkout pages. While the beta is closed, the signup form posts a beta-access request to the contact endpoint (`/v1/contact`); the log-in page posts to the Lumecon product API (`/auth/login`, `/auth/password-reset-request`, `/auth/password-reset`) when a backend is configured, and checkout is a planned `/billing/checkout-session` Stripe handoff.

Out of scope:

- Findings on third-party services we link to (LinkedIn).
- Brute-force attacks, denial-of-service tests, social engineering.
- Reports about missing security headers without an exploitable consequence.

## Safe harbour

If you make a good-faith effort to follow this policy, we will treat your research as authorised. We will not initiate or support legal action against you, and if a third party brings action against you for research conducted under this policy, we will make it known that your work was authorised.

Good faith means:

- Stop as soon as you have demonstrated the issue. Do not pivot further into the system than the vulnerability requires.
- Do not access, modify, delete or retain data belonging to anyone else. If you encounter personal data, stop immediately, do not save a copy, and tell us what you saw so we can assess exposure.
- Do not degrade the service for others: no denial-of-service testing, no automated scanning at volumes that affect availability, no spam or social engineering of our people or customers.
- Give us a reasonable opportunity to fix the issue before disclosing it publicly.

This authorisation covers only systems we operate. It cannot and does not authorise testing against third parties, including our hosting and payment providers.

## Coordinated disclosure

We follow coordinated disclosure. We will acknowledge receipt within 5 business days, tell you our assessment and expected fix timeline within 10 business days, and credit you (if you wish) in a public disclosure note.

Please do not publicly disclose until we confirm a fix has shipped **or 90 days have passed** from your report, whichever comes first. The backstop matters: an open-ended embargo is not a fair ask, and if we go quiet you should not be trapped by our silence. If a fix will legitimately take longer than 90 days we will say so and why, and agree an extension with you rather than assume one.

## Reporting confidentially

We do not yet publish a PGP key, so email to the address above is currently the only channel and it is not end-to-end encrypted. If you are holding something serious enough that plaintext email is the wrong medium, send a short message with no detail asking for a secure channel, and we will arrange one before you send anything further.

## Bounty

Lumecon does not currently offer a paid bounty program. We will credit researchers who wish to be credited, in the disclosure note for the fix.

## Languages

We read and respond in English.

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
  _Fallbacks, if Cloudflare is not the answer:_ Netlify honors a `_headers`
  file with no code change, so the existing file ships as written; Vercel does
  not read `_headers`, so moving there means restating the same headers in a
  `vercel.json` `headers` block; an Astro Node adapter behind our own reverse
  proxy gives the same headers at the cost of running a server; and AWS
  CloudFront with a response-headers policy suits us if the rest of the stack
  ends up on AWS. Whichever is chosen, the requirement is real HTTP headers,
  not the vendor.
- SHA-pin GitHub Actions (currently tag refs) and pin `@lhci/cli` exactly.
