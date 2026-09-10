# Lumecon

Public marketing site for **Lumecon Inc.**, the intelligent economic
analysis platform. Lumecon offers the Cedar product family: **Cedar
Impact**, where you run economic impact analysis; **Cedar Commons**, the
shared project workspace; **Cedar Grove**, the advanced data library; and
**Cedar**, the AI economic analyst, in every plan. Built as a static
[Astro](https://astro.build) site and deployed to GitHub Pages at
[lumecon.ai](https://lumecon.ai). Lumecon is a standalone brand; the
authenticated product and its data layer live in sibling repositories (see
[The product ecosystem](#where-this-fits-the-product-ecosystem)).

The site follows a one-argument-per-page architecture: the homepage says
why Lumecon matters (trio money shot cycling sample analyses in the
center frame only, why cards, product tour, the Lumecon edge, a compact
Cedar teaser and the mission close); **/cedar** owns the AI story
(designed-in-from-the-beginning positioning, real captures of the docked
Cedar panel on sample entities, three thin-line diagrams);
**/pricing** is ruthlessly about pricing (four plans led by Seed, the
free account, the creed "Complexity belongs in the model. Not the
pricing.", multi-year and lowest-applicable-price policies, Whole
Nation, Cedar Commons, Cedar Grove on its own, and consultant
licensing; prices include taxes and fees); **/methodology** argues the economics are credible (equations,
the six-stage flow, the data manifest, validation, lineage and comparisons);
the glossary defines terms and
nothing more. Around those: a sign-up page that takes private-beta
requests through the contact endpoint, log-in, choose-plan and checkout
pages that post to the product API when a backend is configured, /naics
(deliberately
unlisted in nav, indexed for search), /accessibility (WCAG 2.2 AA
statement), /terms and /privacy (substantive working drafts under
counsel review), /ai-and-data-use (plain-language AI and data-handling
statement, also a counsel draft), /security (the current control program
and SOC 2 preparation status) and a 404. There is one Lumecon platform; the retired
per-audience entry-point domains are gone, and the products adapt to the
organization type instead. On the static deploy (no backend configured),
Cedar's chat is answered entirely by a local keyword classifier and
calls no upstream provider; when `PUBLIC_API_URL` is set it calls the
Cedar backend and falls back to the local classifier on any error. The
Cedar launcher opens a chat docked to the bottom edge of the viewport (a
full-width bottom sheet on phones), matching the product's pinned
widget.

## Tech stack

- **Astro 7** (`output: 'static'`) — zero-JS-by-default, per-island scripts
- **@astrojs/sitemap** — sitemap generation at build time
- **TypeScript** (`astro/tsconfigs/strict`)
- **Prettier** (with `prettier-plugin-astro`) for formatting
- **Playwright** for smoke tests; **Lighthouse CI** for performance budgets

No runtime framework (React/Vue/etc.) and no client database — every page is
prerendered HTML with small inline scripts for the interactive pieces (the
hero trio rotation, Cedar chat, nav, scroll reveals).

## Requirements

- Node `>=22` (see `.nvmrc`)

## Getting started

Node 22 or newer (`.nvmrc` pins it; `nvm use` picks it up).

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
```

## Scripts

| Script                     | What it does                                             |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Astro dev server with HMR                                |
| `npm run build`            | `astro check` (type-check) then `astro build` to `dist/` |
| `npm run preview`          | Serve the built `dist/` locally                          |
| `npm run check`            | Type-check only                                          |
| `npm run format`           | Prettier write across `src/`                             |
| `npm run format:check`     | Prettier check, no writes                                |
| `npm run test:smoke`       | Playwright smoke tests — **build first**, see below      |
| `npm run docs:copy`        | Regenerate `docs/site-copy-and-architecture.md`          |
| `npm run naics:duotone`    | Regenerate the sector thumbnails                         |
| `npm run naics:export-app` | Regenerate the app's sector data                         |
| `npm run shots:examples`   | Recapture the hero example screenshots                   |

The last three are generators whose output is committed. Nothing in
`scripts/` runs at build time; run them when their inputs change. See
[AGENTS.md](./AGENTS.md) for what each one owns.

## Testing

Two things bite on a first run, and neither is obvious from the script name:

```bash
npx playwright install --with-deps chromium webkit   # once
npm run build                                        # required every time
npm run test:smoke
```

`playwright.config.ts` serves `dist/`, not the dev server, so **the tests
run against your last build**. Forgetting `npm run build` means testing
stale output, which usually looks like a test failing for a change you
already made.

`tests/` holds four specs: `smoke.spec.ts` (routes, hero rotation, pricing,
auth flows, heading and asset checks, `security.txt` expiry) plus three
covering the Cedar chat classifier, its focus trap, and the nudge. CI runs
chromium and webkit; webkit is informational only, so a webkit-only failure
does not block. In sandboxes without the pinned browser, the config falls
back to a system Chromium — `PW_CHROMIUM_EXECUTABLE` overrides it.

There is no lint step beyond `astro check` and Prettier. `format:check` is
**not** wired into CI today; run it before pushing.

## Project structure

```
src/
  components/   Astro components (Hero, WhyBand, ProductTour, Edge,
                  FinalCta, Nav, Footer, CedarFAB, CedarChat,
                  Lightbox, ConsentBanner, Contours, AuthBrandPanel,
                  MarkArt, BrandWordmark)
  pages/        One file per route: index, cedar, pricing, methodology,
                  glossary, naics, signup, login, choose-plan, checkout,
                  welcome, accessibility, ai-and-data-use, security,
                  terms, privacy and 404
  layouts/      BaseLayout.astro — <head>, meta, OG/Twitter, JSON-LD, CSP;
                LegalLayout.astro — legal/reference wrapper (methodology,
                glossary, terms, privacy, ai-and-data-use)
  data/         Single sources of truth:
                  pricing.ts      plans, comparison rows, Cedar Grove
                                  standalone, consultant licensing
                  team.ts         team + advisors (feeds founder JSON-LD)
                  cedarIntents.ts Cedar chat intent bank
  assets/       Build-time inlined assets (the AI assistant brand marks)
  lib/          api.ts (ApiResult fallback), cedarChat.ts (chat runtime),
                consent.ts, observability.ts (consent-gated analytics shim),
                flowState.ts (signup/checkout hand-off), passwordRules.ts
  styles/       global.css + per-section stylesheets
public/         Static assets: brand marks, app screenshots (light + dark),
                why-card art, sector photography, self-hosted fonts,
                favicons, OG image, robots.txt, llms.txt, _headers,
                .well-known/security.txt
scripts/        Generators whose output is committed, never run at build
                time: naics/ (sector data + duotone thumbnails + app
                export), screenshots/ (hero examples), docs/ (the copy and
                architecture export)
docs/           Brand brief, legal review, the reconciliation roadmap
                (the cross-repo tracker AGENTS.md refers to), and the
                generated copy/architecture export
tests/          Playwright specs (smoke, Cedar classifier, focus trap, nudge)
```

### Where content lives

Page copy is authored directly in the `.astro` files, but structured,
reused data is centralized in `src/data/` so a change lands in one place and
flows to the page, the footer, the JSON-LD, and the sitemap. Changing a
plan, a product one-liner, or a Cedar chat answer is a single edit in the
relevant data file.

## SEO & crawlers

- Per-page `<title>`, meta description, canonical, Open Graph, and Twitter
  card tags are set in `BaseLayout.astro`.
- JSON-LD (Organization + SoftwareApplication, BreadcrumbList, FAQPage on
  the homepage and methodology, a Service node describing the Cedar
  product family, DefinedTermSet on the glossary) is emitted from the
  same data that renders the page.
- `public/robots.txt` explicitly allows search crawlers and the AI
  assistants' crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
  Google-Extended and peers) so the product is discoverable through AI
  search.
- `public/llms.txt` provides an AI-readable site summary kept consistent
  with the on-page copy; the generated sitemap is `sitemap-index.xml`
  (there is no hand-maintained sitemap file).
- A light/dark `theme-color` and `prefers-color-scheme` support adapt the
  site to the visitor's OS appearance without a manual toggle.

## CI / CD

GitHub Actions workflows in `.github/workflows/`:

- **deploy.yml** — builds and deploys to GitHub Pages on push to `main`.
- **smoke.yml** — installs Chromium and runs the Playwright smoke test on PRs
  and pushes to `main`.
- **lighthouse.yml** — runs Lighthouse CI against the build (budgets in
  `lighthouserc.json`).

The custom domain is set via `CNAME`. `public/.nojekyll` ships so the site
is still correct if anyone ever switches Pages to "deploy from a branch" —
Jekyll would otherwise silently strip `_astro/` (the whole CSS and JS
bundle) and `.well-known/`.

Deploying by hand: `deploy.yml` carries `workflow_dispatch`, so it can be
run from the Actions tab without a push. There is **no rollback button** —
to undo a deploy, revert the commit on `main` and let the push redeploy.

Two things worth knowing before touching `deploy.yml`: `pages: write` and
`id-token: write` are scoped to the `deploy` job rather than the workflow,
because together they can publish arbitrary content to lumecon.ai and the
build job has no need of them; and the actions are still pinned to mutable
tags rather than commit SHAs. Dependabot already watches the
`github-actions` ecosystem, so SHA pins would be kept current
automatically — that swap is a known open item, tracked in `SECURITY.md`.

## Environment

Copy `.env.example` to `.env` for local configuration. The site runs fully
without any env vars — `src/lib/api.ts` and `observability.ts` degrade
gracefully when `PUBLIC_API_URL` and analytics keys are unset (the
`api-unconfigured` path), so the static marketing site works on its own.
Never commit a real `.env`.

In production the site-to-product handoff needs two build-time values,
passed by `.github/workflows/deploy.yml` from repository variables:
`PUBLIC_APP_URL` (the product origin; login redirect and the welcome page's
Open Lumecon button) and `PUBLIC_API_URL` (the product API base; auth and
checkout calls, and the CSP `connect-src` is derived from it). The product
API must list this site's origin in its `ALLOWED_ORIGINS` for those calls to
succeed. See "Product handoff contract" in `AGENTS.md`.

These are **repository variables**, not secrets — set them under Settings →
Secrets and variables → Actions → _Variables_. Looking under Secrets is the
usual first wrong turn.

`.env.example` is the complete list of what the site reads; the five
`PUBLIC_DATADOG_*` values there belong to the observability shim in
`src/lib/observability.ts`, which is scaffolding and ships as a no-op until
they are set. No analytics or tracker code is in the bundle today.

## Repository conventions

- **Read [`AGENTS.md`](./AGENTS.md) before changing layout, styles or
  copy.** It carries the standing design audit, the vocabulary standard,
  the teal-is-semantic rule and the page-ownership rule, and it is the
  document that settles arguments. This README describes the machine;
  AGENTS.md describes the judgment.
- Work on a branch and open a PR; `main` deploys on push.
- Verify rendering changes by building and looking at the result at several
  widths. Cleaner code is not evidence of better design.
- Comments in `.astro` templates must use `{/* */}`, not `<!-- -->`.
  Astro compiles the first away and **ships the second to every visitor**.
  This has leaked twice: an unannounced product name in 2026-08, and later
  an API hostname, the observability vendor and a note about which security
  headers are unenforced.

## Design system (colors, type, fonts)

The canonical source of truth is the `:root` block in
[`src/styles/global.css`](./src/styles/global.css) — every value below is a
CSS custom property defined there. This is the **Lumecon marketing site's**
system; the product carries its own, and the type scale and spacing are a
good shared baseline between them.

### Fonts

**Self-hosted** from `public/fonts/`, declared in the `@font-face` block at
the top of [`src/styles/global.css`](./src/styles/global.css) and preloaded
in `BaseLayout.astro`. The files are copied from the
`@fontsource-variable/*` devDependencies and committed; to update, bump the
packages and re-copy the four `*-latin-*.woff2` files.

These are the two-axis variable builds, so `font-optical-sizing: auto` is
live and display sizes are drawn with display letterforms. The site makes
no third-party requests, which is why `font-src` is `'self'` and why the
privacy policy can say there is no font CDN. Exactly **two families** ship
(per the brand lock):

| Role                                  | Family (token)                              | Weights loaded                           |
| ------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| Display + UI sans (almost everything) | **Inter** (`--font-sans`, `--font-display`) | 400, 500, 600, 700, 800 + 400/500 italic |
| Mono labels / eyebrows / data chips   | **JetBrains Mono** (`--font-mono`)          | 400, 500, 700                            |

One sans (Inter) carries the hierarchy via weight + size. The italic gold
_luminate_ emphasis (`.lumin`) is Inter italic; `--font-serif` resolves to
system serifs and no serif webfont is loaded.

### Logo / lockup

The only logo image is the **mark** (`public/brand/lumecon-logo-mark-*.png`,
concentric rings + gold arc). The word LUMECON is always **typeset text**
(Inter caps, weight 800, ~0.14em tracking) next to the mark — see
`BrandWordmark.astro`. The old serif horizontal wordmark PNGs are retired;
do not reintroduce a word-bearing logo image.

### Type scale

Root is 16px; **body copy is set to 18px** with `line-height: 1.6`. The token
ladder (rem):

| Token            | Size                         | Typical use                      |
| ---------------- | ---------------------------- | -------------------------------- |
| `--type-xs`      | 0.75rem / 12px               | fine print, mono captions        |
| `--type-sm`      | 0.875rem / 14px              | small UI text                    |
| `--type-base`    | 1rem / 16px                  | base unit (body renders at 18px) |
| `--type-md`      | 1.125rem / 18px              | lede / large body                |
| `--type-lg`      | 1.375rem / 22px              | sub-headings                     |
| `--type-xl`      | 1.75rem / 28px               | h3                               |
| `--type-2xl`     | 2.25rem / 36px               | section headings (h2)            |
| `--type-3xl`     | 3rem / 48px                  | large section headings           |
| `--type-display` | `clamp(2.8rem, 7.5vw, 6rem)` | display / hero                   |

Headlines are fluid: the homepage hero (`.hero2-title`) is
`clamp(2.3rem, 5.6vw, 4.3rem)` at weight 700. Eyebrows / kickers are mono,
uppercase, ~0.64–0.82rem with wide letter-spacing.
Weights: `--weight-regular 400` · `--weight-medium 500` · `--weight-semi 600`
· `--weight-bold 700` · `--weight-black 800`.

### Color scheme

Cool, modern palette: white/near-black-navy surfaces with a **teal** UI accent
and **gold** reserved for the brand wordmark.

| Token                             | Hex                          | Role                                                                    |
| --------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `--white`                         | `#FFFFFF`                    | primary surface                                                         |
| `--paper`                         | `#F7F7F8`                    | rare soft surface (forms/panels)                                        |
| `--navy` / `--ink`                | `#0A0F26`                    | primary text / darkest surface                                          |
| `--ink-2`                         | `#353B5C`                    | body text                                                               |
| `--ink-3`                         | `#6B6F8A`                    | muted text, eyebrows                                                    |
| `--ink-4`                         | `#9DA1B5`                    | faint dividers/dots                                                     |
| `--accent`                        | `#0FB5A5`                    | **teal UI accent** — eyebrows, focus rings, hovers, dividers            |
| `--accent-deep`                   | `#0A8A7E`                    | accent text/links, hovers                                               |
| `--accent-chip`                   | `#0A7F74`                    | white-on-teal surfaces (chips/bubbles/send) — deepened to clear WCAG AA |
| `--accent-light` / `--accent-bar` | `#5FD9CC` / `#B8EDE6`        | teal tints (highlights, bands)                                          |
| `--gold`                          | `#F0A91A`                    | **reserved for the wordmark / "luminate" emphasis — not a UI accent**   |
| `--green`                         | `#0E8B4F`                    | highlight tint / "complete" status                                      |
| `--terra`                         | `#E04A2A`                    | warm highlight tint                                                     |
| `--blue` / `--purple`             | `#2E5BD6` / `#6E3DD8`        | highlight tints                                                         |
| `--rule` / `--rule-strong`        | `rgba(10,15,38,.12)` / `.24` | hairline borders                                                        |
| `--error-color`                   | `#DC2626`                    | error / validation                                                      |
| `--map-tribal`                    | `#C77A18`                    | map: tribal-lands layer                                                 |

Notes: corner radii are deliberately tight — a two-step scale of **8px**
(cards, frames, panels) and **6px** (buttons, chips, small elements);
headline highlights use the `.hl-block` smear system with rotating tints; a
`prefers-color-scheme: dark` block in `global.css` flips the surface/ink
tokens (teal/gold stay put).

## Where this fits: the product ecosystem

Lumecon is a **standalone brand**, and this repository is its public
marketing site — its own design system, its own deploy, intentionally
independent. It does **not** import code or styles from the product. The
product and the data it runs on live in sibling `teim-team` repositories:

| Repo              | What it is                                                                                                                                                                                                                                                                                                                                                          | Relationship to this site                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`teim-app`**    | The authenticated product where the Cedar family lives — Cedar Impact, Cedar Commons and Cedar Grove in one React 19 + Vite SPA with a Fastify backend. ("TEIM" survives only in repo/DB/resource names, never as user-facing branding.) It also carries its own in-app marketing surface under a separate visual brand (warm-paper/forest palette, Fraunces type). | This site sends visitors into the product (sign-up / "open workspace"). The two marketing surfaces are **deliberately separate visual brands** — do not cross-import styles or tokens.                                                                                                            |
| **`cedar`**       | A standalone FastAPI conversational-AI service (Python 3.13, OpenAI Agents SDK, Postgres). It orchestrates analysis agents and keeps only compressed chat memory; it never stores project data, files, or results.                                                                                                                                                  | The **`teim-app` backend** calls Cedar server-to-server. This site's Cedar chat is a _separate_, lightweight, anonymous keyword-classifier surface (`src/lib/cedarChat.ts`) and does **not** call the Cedar service. The contract is documented below for whenever a server-side caller is added. |
| **`teim-engine`** | The economic-accounts data layer: EPA `stateior` StateIO supply/use tables shipped as CSV.                                                                                                                                                                                                                                                                          | Upstream of the impact math the site describes. Keep the homepage "foundational data" strip consistent with the public sources the engine actually draws on.                                                                                                                                      |

### Cedar service contract (server-to-server)

Documented here so any future server-side integration matches the canonical
shape. The **authenticated app — not this marketing site — is the intended
caller**, because Cedar needs the `user` + `project` context an anonymous
visitor here doesn't have.

- **Endpoint:** `POST /api/v1/messages` (the only public endpoint today).
- **Auth:** `Authorization: Bearer <CEDAR_INTERNAL_API_KEY>` (shared secret).
  Missing/bad token → 401.
- **Health:** `GET /ready` → 200 (503 if Postgres is down). Point uptime
  checks here, not at `/health`.
- **Wire format:** **camelCase** in both directions (snake_case tolerated,
  but send camelCase).
- **Request** (required: `requestId`, `user{id}`, `project{id,name}`,
  `message{id,text}`; optional: `threadId`, `projectContext`, `context`).
- **Response:** `{ messageId, threadId, answer, contextUsed, unavailable }`.
- **Session lifecycle:** omit `threadId` on the first turn; Cedar returns one;
  persist it per conversation and echo it on every later turn (`threadId` is
  Cedar's session id).
- **Error handling:** refusals (out-of-scope / prompt-injection) and
  `unavailable: true` still return **HTTP 200** — treat as normal answers, not
  errors. Handle 401 (key) and 5xx (Cedar/DB down) explicitly.
- **Gotcha:** `contextUsed` is reflected back only from the top-level
  `context` object (route, pathname, `latestRun.status`,
  `latestResultSummary`) — not from `projectContext`.

### Underlying data (teim-engine)

teim-engine assembles EPA `stateior` StateIO accounts as CSV: years
**2015–2023**, **50 states + DC**, **71 BEA Summary sectors**, five tables per
region (`Industry_Output`, `Make`, `Use`, `Domestic_Use`, `Import`) with the
identity `Use = Domestic_Use + Import` (the in-region vs. rest-of-US split).
Values are nominal USD. This supply/use base is what the impact multipliers
the site describes are built on, so the homepage data-sources strip should
stay consistent with the public sources behind it (Census ACS/LODES/QWI/CBP/
TIGER, BEA Input-Output, BLS QCEW, USDA NASS, USAspending, FRED, NOAA).

## Standing decisions (2026-07)

Decisions made with the founder that future work must respect. The
engineering rules live in [`AGENTS.md`](./AGENTS.md) (AI-frontend-tell
audit, semantic teal, the approved brand-phrase vocabulary and the
page-ownership rule); this list records the product/brand calls.

- **Positioning.** Lead with traceable economic analysis, reviewable inputs
  and transparent annual pricing. Cedar organizes source material and proposes
  inputs; Cedar Impact performs the calculations, and the person running an
  analysis approves assumptions and final results. Avoid campaign slogans that
  obscure those product boundaries.
- **Pricing policies (public commitments).** Prices include taxes and
  fees. Multi-year agreements qualify for preferred pricing with prepaid
  savings; multiple qualifying rates resolve to the lowest applicable
  price. The competitive transition offer no longer appears on /pricing
  (cut in the 2026-08 pricing pass); do not reintroduce it on the page
  without the founder. Counsel must review the security claims and the
  /cedar privacy language before launch; "Patent pending" is confirmed
  on file (founder, 2026-08).
- **Numbers are used sparingly.** No mono section numbering; equations
  (Eq. 01…) and ordered flow steps keep their numbers because order is
  the content.
- **Screenshots are real captures at a uniform 1600x1000** from teim-app
  (1440px shell, demo user Wassily Leontief), taken via the mock-route
  pipeline in the session scratchpad; the hero trio never shuffles
  positions, only the center frame advances in order.
- **Cedar chat docks to the bottom edge** when open, on the site and in
  the product; it is never a floating window.
- **Auth pages are mirrored counterparts** built on the product's
  sign-in screen (teim-app AuthGate): /login puts the teal brand panel
  left and the form right (continuity: pick up where you left off);
  /signup mirrors it, form left and teal panel right (forward-looking:
  start with the full platform). Proof points are quiet icon + text
  rows with hairline separators, never cards; the primary action is
  the dark teal token; Google sign-in stays hidden until
  PUBLIC_API_URL is configured. On mobile the split stacks: login
  leads with a compact teal band, signup closes on one. Edit the two
  pages together or not at all.
- **The acquisition flow is staged, one job per page:** /signup (create
  the account) -> /choose-plan (pick the size; compact, not /pricing)
  -> /checkout (payment only: teal order summary left, white
  transactional column right, quiet Change plan link, never a plan
  picker) -> /welcome (full teal "You're in.", one action into the
  product). The free trial never passes through checkout; signup with
  tier=free goes straight to /welcome?plan=free. Teal progressively
  takes over across the flow (white/teal -> mostly teal -> teal/white
  -> full teal): the visitor is moving from the public site into the
  product. The Ask Cedar launcher is hidden on signup, choose-plan,
  checkout and welcome (BaseLayout cedar={false}): one obvious next
  action, no escape hatches; Cedar stays on /login and everywhere
  else.
- **Every AskAI tile must carry the question.** A tile that opens an
  empty composer reads as broken. Gemini has no public prefill
  parameter, so its tile goes through Google AI Mode (udm=50).
- **Renewal and referrals (billing policy).** Subscriptions renew
  automatically by default, with an auto-renew switch the customer
  controls in the product and transparent notice emails 90 and 30
  days ahead (never sneaky); the renewal notice offers preferred pricing for
  renewing more than one year. Referrals earn one month of
  subscription time at the customer's current plan per qualifying
  referral (new customer via the referral link, paid subscription
  completed), capped at 12 months; credits are time, not dollars.
  The referral surface lives in the product (Settings > Referrals);
  the site mentions the program only in the pricing fine print.
- **Launch blockers owned by the founder:** final Terms/Privacy from the
  Cornell clinic; Stripe backend (`POST /billing/checkout-session` +
  webhook) in teim-app; Google OAuth origin for the website signup;
  teim-app migrations 021 and 022 on deploy; counsel review items above.

## Security

See [`SECURITY.md`](./SECURITY.md) and `public/.well-known/security.txt` for
the disclosure policy.

## License

© Lumecon Inc. All rights reserved. Not open source; this repository is
published for transparency and is not licensed for reuse.
