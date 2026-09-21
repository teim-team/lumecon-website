# Lumecon

Public marketing site for **Lumecon Inc.**, the intelligent economic
analysis platform. Lumecon offers the Cedar product family: **Cedar
Impact**, where you run economic impact analysis; **Cedar Commons**, the
shared project workspace; **Cedar Grove**, the living evidence base for
your organization’s economy; and **Cedar**, the AI economic analyst, in
every plan. Built as a static
[Astro](https://astro.build) site and deployed to GitHub Pages at
[lumecon.ai](https://lumecon.ai). Lumecon is a standalone brand; the
authenticated product, the model engine and Cedar live in sibling repositories (see
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
nothing more; **/start** answers the question a reader has before any of
those, which is what their own organization could begin with (a short
scoping flow, a proposed starting scope, a printable checklist of records
they already own, and what more information would make possible).
Around those: a sign-up page that takes private-beta
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
Cedar launcher opens a chat docked to the bottom edge of the viewport,
matching the product's pinned widget; on a phone it takes the whole
screen instead.

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
| `npm run stress`           | Concurrency and leak stress against a running preview    |
| `npm run docs:copy`        | Regenerate `docs/site-copy-and-architecture.md`          |
| `npm run docs:plan`        | Regenerate the onboarding resources in `docs/onboarding/`|
| `npm run docs:questions`   | Regenerate the methodology open-questions PDF            |
| `npm run llms:pages`       | Rewrite the `## Pages` block in `public/llms.txt`        |
| `npm run llms:roster`      | Rewrite the roster block in `public/llms.txt` from /team |
| `npm run naics:duotone`    | Regenerate the sector thumbnails                         |
| `npm run naics:export-app` | Regenerate the app's sector data                         |
| `npm run team:headshots`   | Regenerate the team portraits                            |
| `npm run shots:examples`   | Recapture the hero example screenshots                   |
| `npm run shots:commons`    | Recapture the Cedar Commons frames, both variants        |

Everything below `test:smoke` except `stress` is a generator whose output is
committed. Nothing in `scripts/` runs at build time; run them when their inputs
change. See [AGENTS.md](./AGENTS.md) for what each one owns.

`docs:copy`, `llms:pages` and `stress` read `src/data/siteMap.ts` and so run
under `node --experimental-strip-types`. `docs:copy` and `llms:roster` also need
the built site being served — see Testing below for the preview command.

`npm run stress` walks every page with a dozen concurrent clients, half of them
on a phone viewport, several rounds each, then drives Cedar and the disclosure
sets hard and reports node counts before and after. It is not part of CI: run it
against a preview when touching anything that holds state.

```bash
npm run build && npm run preview &
STRESS_BASE_URL=http://127.0.0.1:4321 npm run stress
```

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

`tests/` holds six specs: `smoke.spec.ts` (routes, hero rotation, pricing,
auth flows, heading and asset checks, `security.txt` expiry, the crawl
surface, and a per-width pass over the product pages on a phone), three
covering the Cedar chat — classifier, focus trap and nudge — one for the
plan flow, and `rich-text.spec.ts`, which is a pure unit spec with no
browser navigation at all.

CI runs Chromium and WebKit as required gates; a failure in either browser
blocks the smoke job. In sandboxes without the pinned browser, the config
falls back to a system Chromium — `PW_CHROMIUM_EXECUTABLE` overrides it.

**WebKit is not optional, and it has caught what Chromium could not.** The
two engines disagree about a lazy `<picture>` image inside a `display: none`
element: Chromium leaves `currentSrc` empty, WebKit populates it and then
never loads the image. A test that keyed off `currentSrc` passed on one and
hung for fifteen seconds on the other. If WebKit will not install in your
environment, say so rather than treating a Chromium-only run as a pass.

`npm run stress` is separate and is not in CI. See Scripts above.

There is no lint step beyond `astro check` and Prettier. `format:check` is
**not** wired into CI today; run it before pushing.

## Project structure

```
src/
  components/   Astro components (Hero, WhyBand, ProductTour, Edge,
                  FinalCta, Nav, Footer, CedarFAB, CedarChat,
                  Lightbox, ConsentBanner, Contours, AuthBrandPanel,
                  MarkArt, BrandWordmark)
  pages/        One file per route. Marketing: index, why-lumecon,
                  pricing, cedar, cedar-commons, cedar-grove, methodology,
                  start, naics, glossary, team, contact. Reference and
                  legal: security, ai-and-data-use, accessibility, privacy,
                  terms. Flow: signup, login, choose-plan, checkout,
                  welcome. Plus 404.
                The inventory of all of them, with the question each one
                  answers, is src/data/siteMap.ts — see below.
  layouts/      BaseLayout.astro — <head>, meta, OG/Twitter, JSON-LD, CSP;
                LegalLayout.astro — legal/reference wrapper (methodology,
                glossary, terms, privacy, ai-and-data-use)
  data/         Single sources of truth:
                  siteMap.ts      every page, the question it answers and
                                  whether it is indexed. Read by the copy
                                  export, the llms.txt page list and the
                                  stress script; checked against the
                                  sitemap by the smoke suite
                  pricing.ts      plans, comparison rows, Cedar Grove
                                  standalone, consultant licensing
                  team.ts         team + advisors (feeds founder JSON-LD,
                                  the /team page, the llms.txt roster and
                                  the staff row on /why-lumecon)
                  cedarIntents.ts Cedar chat intent bank
                  groveCollections.ts  the Cedar Grove atlas
                  planFirstAnalysis.js the /start scoping model
  assets/       Build-time inlined assets (the Cedar brand marks)
  lib/          api.ts (ApiResult fallback), cedarChat.ts (chat runtime),
                richText.ts (the reply linkifier, its own module so a test
                can import it without booting the chat), consent.ts,
                observability.ts (consent-gated analytics shim),
                flowState.ts (signup/checkout hand-off), passwordRules.ts
  styles/       global.css + per-section stylesheets
public/         Static assets: brand marks, app screenshots (light + dark),
                why-card art, sector photography, self-hosted fonts,
                favicons, OG image, robots.txt, llms.txt, _headers,
                .well-known/security.txt
scripts/        Generators whose output is committed, never run at build
                time: naics/ (sector data + duotone thumbnails + app
                export), screenshots/ (hero examples, the Cedar Commons
                frames), team/ (portraits), docs/ (the copy and
                architecture export, the onboarding resources, the
                llms.txt roster and page list). Plus test/stress.mjs,
                which generates nothing and is run by hand.
docs/           Brand brief, legal review, the reconciliation roadmap
                (the cross-repo tracker AGENTS.md refers to), and the
                generated copy/architecture export
tests/          Playwright specs: smoke (the bulk), Cedar classifier,
                Cedar focus trap, Cedar nudge, the plan flow, and
                rich-text (a pure unit spec for the reply linkifier)
```

### Where content lives

Page copy is authored directly in the `.astro` files, but structured,
reused data is centralized in `src/data/` so a change lands in one place and
flows to the page, the footer, the JSON-LD, and the sitemap. Changing a
plan, a product one-liner, or a Cedar chat answer is a single edit in the
relevant data file.

Navigation is grouped rather than flat: `Nav.astro` holds a `NAV` array of
four top-level items, three of which open a short panel — Product (where the
Cedar family lives), Why Lumecon (the buyer's argument, the team, security
and contact), and Resources (the starting guide, methodology, sectors and
glossary), with Pricing on its own. The same array renders the phone overlay
as headed sections.

Adding a page is two edits, and both matter: a line in that `NAV` array so a
reader can reach it, and an entry in `src/data/siteMap.ts` so the copy
export, `llms.txt` and the stress walk all know it exists. A smoke test
compares the inventory against the generated sitemap, so a page added to the
site and forgotten in the inventory fails CI rather than going quietly
missing from what crawlers and assistants are given.

`src/data/planFirstAnalysis.js` goes one step further and is worth knowing
about before editing anything onboarding-related. It holds the scoping
questions, the branching rules, the records catalog, the capability matrix
and the onboarding call outline, plus the pure functions that turn a set of
answers into a proposed scope and a checklist. `/start` renders it, the
browser evaluates the same functions to build a tailored plan, and
`npm run docs:plan` writes the internal guide and the coordinator brief
from it. The website, the economist-led call and the material a coordinator
circulates inside their organization therefore cannot say different things.
Two rules are load-bearing in that file: organizational complexity and data
readiness are scored separately and never merged, and every capability
carries a status (`available`, `proposed`, `research`) so nothing on the
public page promises an output the product does not produce.

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
- `public/llms.txt` is the AI-readable site summary. Two of its blocks are
  generated rather than written: `## Pages`, from `src/data/siteMap.ts`
  (`npm run llms:pages`), and the roster, from the rendered `/team` page
  (`npm run llms:roster`). The rest is prose kept consistent with the
  on-page copy by hand. A smoke test requires the page list to match the
  inventory, and every `lumecon.ai` URL anywhere in the file to resolve.
- The generated sitemap is `sitemap-index.xml` (there is no hand-maintained
  sitemap file), and a smoke test requires it to name exactly the pages
  `siteMap.ts` marks as indexed.
- `robots.txt` has no inheritance: a crawler matches one group and ignores
  every other, so each group repeats its `Disallow` lines rather than
  stating them once. A smoke test checks each group still carries them —
  a group that lost them would quietly expose what the others withhold.
- A light/dark `theme-color` and `prefers-color-scheme` support adapt the
  site to the visitor's OS appearance without a manual toggle.

## CI / CD

GitHub Actions workflows in `.github/workflows/`:

- **deploy.yml** — builds and deploys to GitHub Pages on push to `main`.
- **smoke.yml** — installs Chromium and WebKit and runs the Playwright suite
  on PRs and pushes to `main`. It also regenerates
  `docs/site-copy-and-architecture.md` and `git diff --exit-code`s it, so a
  copy change pushed without re-running `npm run docs:copy` fails the job.
- **lighthouse.yml** — runs Lighthouse CI against the build (budgets in
  `lighthouserc.json`).
- **codex-polish-qa.yml** and **regenerate-approved-review-documents.yml** —
  review automation; both regenerate the copy document the same way.

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
`clamp(3.25rem, 4.8vw, 4.8rem)` at `--weight-hero` (675). Section headings use
`--weight-display` (600), not 700 — a page where every heading sits at the
heaviest weight has hierarchy of size but none of voice. Tracking tightens as
size grows: `--track-display -0.032em` (hero h1), `--track-title -0.024em`
(section h2), `--track-sub -0.015em` (card h3).

Eyebrows / kickers are mono, uppercase, letter-spaced. The canonical values are
the product's section-band tokens: **0.62rem at 0.14em tracking**.
Weights: `--weight-regular 400` · `--weight-medium 500` · `--weight-semi 600`
· `--weight-bold 700` · `--weight-black 800`.

### Color scheme

Cool, modern palette: near-white surfaces with a **teal** UI accent, **gold**
reserved for the brand wordmark, and **amber** as the one data color.

The page ground is not pure white. It sits two cool steps off, so a genuinely
white surface can rise off it without every card proving its depth with a heavy
shadow.

| Token                      | Value                        | Role                                                                    |
| -------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `--ground`                 | `#F3F6F8`                    | the page ground                                                         |
| `--ground-bright`          | `#FAFCFD`                    | lifted ground                                                           |
| `--surface`                | `#FFFFFF`                    | raised white: product frames, plans, forms, overlays                    |
| `--surface-2`              | `#EDF2F4`                    | filled panels and callouts                                              |
| `--surface-inset`          | `#E5EBEE`                    | inset wells, chart tracks                                               |
| `--navy` / `--ink`         | `#071824`                    | primary text                                                            |
| `--ink-2`                  | `#33434A`                    | body text                                                               |
| `--ink-3`                  | `#647279`                    | muted text, captions                                                    |
| `--ink-4`                  | `#93A0A5`                    | faintest text, dots, ticks                                              |
| `--accent`                 | `#0FB5A5`                    | **teal accent.** Fills, rules, focus rings (2.6:1 on white, so not text) |
| `--accent-text`            | `#0A7F74`                    | **teal text and links.** 4.88:1 on white (AA)                           |
| `--accent-chip`            | `#0A7F74`                    | surfaces carrying white text (chips / bubbles / send)                   |
| `--accent-deep`            | `#0A8A7E`                    | button hover                                                            |
| `--accent-light` / `--accent-bar` | `#5FD9CC` / `#B8EDE6` | teal tints; `--accent-bar` is the 1px link underline                    |
| `--gold`                   | `#F0A91A`                    | **wordmark and "luminate" only. Not UI, not charts**                    |
| `--cedar` / `--cedar-text` | `#0E8B4F` / `#0B5E36`        | Cedar AI fills, and cedar-green **text** (`--cedar` fails AA for body)  |
| `--map-tribal`             | `#C77A18`                    | map tribal-lands layer, the same hue as the product's `--amber`, **the data color** |
| `--terra`                  | `#E04A2A`                    | warm highlight, used sparingly                                          |
| `--blue` / `--purple`      | `#2E5BD6` / `#6E3DD8`        | highlight tints                                                         |
| `--rule` / `--rule-strong` | `rgba(10,28,52,.1)` / `.2`   | hairline borders                                                        |
| `--error-color`            | `#DC2626`                    | error / validation                                                      |

`--white`, `--cream` and `--paper` remain as legacy aliases of `--ground`,
`--surface-2` and `--surface-inset`. New work names the material it needs.

**Contrast rule.** Anything a reader has to read uses `--accent-text` or
`--cedar-text`; `--accent` and `--cedar` are fill colors and both fail AA as
body text. Dark mode flips them to their lighter steps.

**Gold is not a chart color.** For data, teal is series one and amber
`#C77A18` is series two — the same ruling the product's design system states
explicitly. Gold appears only in the wordmark and the word *luminate*.

Notes: corner radii are a three-step scale. `--radius-control` is **8px**
(buttons, small controls), `--radius-frame` is **14px** (cards, frames, tables,
panels, the default) and `--radius-panel` is **20px** (large panels). Shadows are
**neutral, never tinted**: `--lift -3px` with `--lift-shadow`, `--shadow-frame`
and `--shadow-control` is the whole vocabulary. A `prefers-color-scheme: dark`
block in `global.css` selects dark steps for the surface and ink tokens — it
does not simply invert them.

> The `.hl-block` marker-smear system behind headlines **no longer exists**. A
> standalone heading is a mono kicker over a bare Inter headline, with the
> section opening on a hairline rule. See `docs/brand/brand-aesthetic.md` §4.
> Do not reintroduce it from an old deck or an exported PDF.

## Where this fits: the product ecosystem

Lumecon is a **standalone brand**, and this repository is its public
marketing site — its own design system, its own deploy, intentionally
independent. It does **not** import code or styles from the product. The
product and the data it runs on live in sibling `teim-team` repositories:

| Repo              | What it is                                                                                                                                                                                                                                                                                                                                                          | Relationship to this site                                                                                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`teim-app`**    | The authenticated product where the Cedar family lives — Cedar Impact, Cedar Commons and Cedar Grove in one React 19 + Vite SPA with a Fastify backend. ("TEIM" is intended to survive only in repo/DB/resource names; **it has not yet, see the note below the table.**) Its public routes are sign-in, /terms, /privacy, /methodology and /verify; it carries **no** in-app marketing surface today. | This site sends visitors into the product (sign-up / "open workspace"). The two keep separate code and CSS implementations: do not cross-import source styles or generated tokens. The website is still the shared visual contract. Product work should reproduce its typography, navy/mineral hierarchy, disciplined teal and progressive disclosure in its own system. The app self-hosts Inter, JetBrains Mono and Spectral italic; the DM Sans / Nunito / **Fraunces** / DM Mono / Crimson faces it once used are retired as off-brand and no longer loaded (`src/index.css`). |
| **`cedar`**       | A standalone FastAPI conversational-AI service (Python 3.13, OpenAI Agents SDK, Postgres). It orchestrates analysis agents. What it persists: compressed chat memory, raw agent conversation items, and document extraction jobs including cached per-file digests. Runs, numerical results and the economics stay in the product. **The digests are the nuance** — they are compact summaries and candidate values derived from a customer's uploaded documents, so "Cedar stores nothing of the project" is too strong a claim to make on a customer-facing page. Deriving the exact wording from a real data-flow spec is P0 item 9 in `docs/reconciliation-roadmap.md`. | The **`teim-app` backend** calls Cedar server-to-server. This site's Cedar chat is a _separate_, lightweight, anonymous keyword-classifier surface (`src/lib/cedarChat.ts`) and does **not** call the Cedar service. The contract is documented below for whenever a server-side caller is added. |
| **`teim-engine`** | The model engine behind Cedar Impact: a Python service that takes an analysis and a geography, fetches Census, BLS and BEA data, regionalizes a state input-output table, closes it as a social accounting matrix and returns direct, indirect and induced effects. It vendors the EPA `stateior` StateIO supply/use tables as CSV as its base structure. ("TEIM" is the model's and the repository's name only.) | The `teim-app` backend submits runs to it over an authenticated HTTP API. Every number the site's /methodology page describes is computed here, so keep that page, and the homepage "foundational data" strip, consistent with what the engine actually implements and draws on. |

Two notes on the table, both as of the 2026-09-18 cross-repository audit:

- **The naming rule is a rule, not a description of today.** "TEIM" is meant to
  live only in repository, database and resource names, and the app has not got
  there: **"Tribal Economic Impact" is still its visible brand**, in the
  side-rail wordmark, the public shell, the wizard cover, the Terms, Privacy and
  Methodology page titles, the email sender and subject lines, and the export
  filename prefix. That is the entry-point taxonomy this site retired. It is a
  founder and counsel decision rather than a copy sweep, because Terms §9 still
  claims those names as marks and the export filename is a data contract
  customers already hold. Inventory in `teim-app/AGENTS.md` §9, tracked as item
  9 in `docs/reconciliation-roadmap.md`.
- **Every sibling now publishes a `SECURITY.md` and an `AGENTS.md`.** Until this
  audit, `cedar` and `teim-engine` published neither, while `teim-app`'s policy
  put both out of its own scope and told researchers to report issues there "to
  their owners". Each repository's `AGENTS.md` carries a reviewer checklist;
  `docs/reconciliation-roadmap.md` indexes them and lists the two checks that
  belong to whoever reviews across repositories.

### Cedar service contract (server-to-server)

Documented here so any future server-side integration matches the canonical
shape. The **authenticated app — not this marketing site — is the intended
caller**, because Cedar needs the `user` + `project` context an anonymous
visitor here doesn't have.

- **Endpoint:** `POST /api/v1/messages` for conversation. Document extraction is a separate asynchronous pair, `POST /api/v1/documents/extract` and `GET /api/v1/documents/extract/{jobId}`, which the app backend calls for the intake documents step. The document routes are mounted a second time without the version prefix, at `/documents/extract`, because that is the app's default `CEDAR_DOCUMENT_API_PATH`; both paths are the same handlers behind the same auth.
- **Auth:** `Authorization: Bearer <CEDAR_INTERNAL_API_KEY>` (shared secret).
  Missing or bad token → 401. Cedar **fails closed**, so an unset
  `CEDAR_INTERNAL_API_KEY` on Cedar's side → **503** on every protected route,
  with no opt-out. Treat 503 as "Cedar is misconfigured", not as "Cedar is
  down". `teim-engine` answers 503 for the same condition.
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

teim-engine's base structure is the EPA `stateior` StateIO accounts, vendored as CSV: years
**2015–2023** as installed today, **50 states + DC**, **71 BEA Summary sectors**,
five tables per region (`Industry_Output`, `Make`, `Use`, `Domestic_Use`,
`Import`) with the identity `Use = Domestic_Use + Import` (the in-region vs.
rest-of-US split).

> **The year range on this site says 2009–2025; the engine holds 2015–2023.**
> That is the owner's decision about what the product covers, and the gap is a
> data-vendoring task tracked in teim-engine's README — 2009–2014 and 2024–2025
> are not on disk. Do not treat the number in this paragraph as the authority
> either way: teim-engine serves `GET /coverage`, which reads the vendored
> directory on every call, and that is the only statement of coverage that
> cannot go stale. A year outside it now fails as a typed
> `YearNotCoveredError` naming the real span rather than as an internal error.
>
> Before the range is promoted anywhere new, the methodology page needs a
> sentence on how years outside the benchmark are constructed. An economist
> evaluating "2009–2025" against a 2015-based structural table will ask, and
> the site should answer before they do.
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
- **Screenshots are real captures, 1920px wide** (heights vary by surface: 1004 for the lineage panel, 1200 for the workspace, comparison and Cedar captures, 1080 for Grove, 1170 for the hero results page) from teim-app
  (1440px shell, demo user Wassily Leontief), taken via the mock-route
  pipeline in the session scratchpad; the hero trio never shuffles
  positions, only the center frame advances in order.
- **Cedar chat docks to the bottom edge** when open, on the site and in
  the product; it is never a floating window. **On a phone (2026-09) it is
  full-screen instead** — `inset: 0`, `100dvh`, above the site nav, with the
  safe-area insets on the dialog's own edges. The docked sheet gave the
  transcript about half a screen and clipped the last starter prompt
  mid-word. The launcher there is a 60px circle with the brand mark, and a
  greeting bubble appears once per visit, phone only, after the opening
  composition has been read past; it yields to the same protected content
  the launcher avoids, and tapping it opens Cedar.
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
