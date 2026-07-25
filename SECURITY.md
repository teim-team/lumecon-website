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
