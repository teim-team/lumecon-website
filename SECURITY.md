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
- The three platform domains: `localeconomicimpact.com`, `tribaleconomicimpact.com`, `globaleconomicimpact.com`.
- The marketing-page Cedar assistant (local keyword classifier on the static deploy; an optional backend API path exists behind `PUBLIC_API_URL`).

Out of scope:
- Findings on third-party services we link to (LinkedIn, font CDNs).
- Brute-force attacks, denial-of-service tests, social engineering.
- Reports about missing security headers without an exploitable consequence.

## Coordinated disclosure

We follow coordinated disclosure. We will acknowledge receipt, investigate, ship a fix, and credit you (if you wish) in a public disclosure note. Please do not publicly disclose the vulnerability until we confirm a fix has shipped.

## Bounty

Lumecon does not currently offer a paid bounty program. We will credit researchers in our security disclosure history at our discretion.
