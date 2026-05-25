# Lumecon

Public marketing site for **Lumecon Inc.** — economic impact analysis
software for governments, enterprises, and mission-driven organizations.
Built as a static [Astro](https://astro.build) site and deployed to GitHub
Pages at [lumecon.ai](https://lumecon.ai). Lumecon is a standalone brand; the
authenticated product and its data layer live in sibling repositories (see
[The TEIM ecosystem](#where-this-fits-the-teim-ecosystem)).

The site explains the three Lumecon platforms (Local, Tribal, and Global
Economic Impact), demonstrates the workflow through an interactive US map,
introduces Cedar (the AI assistant), and carries the pricing, about/team,
and join-the-team pages. On the static deploy (no backend configured),
Cedar's chat is answered entirely by a local keyword classifier and calls
no upstream provider; when `PUBLIC_API_URL` is set it calls the Cedar
backend and falls back to the local classifier on any error.

## Tech stack

- **Astro 5** (`output: 'static'`) — zero-JS-by-default, per-island scripts
- **d3-geo + topojson-client + us-atlas** — the interactive impact map
- **@astrojs/sitemap** — sitemap generation at build time
- **TypeScript** (`astro/tsconfigs/strict`)
- **Prettier** (with `prettier-plugin-astro`) for formatting
- **Playwright** for smoke tests; **Lighthouse CI** for performance budgets

No runtime framework (React/Vue/etc.) and no client database — every page is
prerendered HTML with small inline scripts for the interactive pieces (map,
Cedar chat, nav, scroll reveals).

## Requirements

- Node `>=22` (see `.nvmrc`)

## Getting started

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Astro dev server with HMR |
| `npm run build` | `astro check` (type-check) then `astro build` to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run check` | Type-check only |
| `npm run format` | Prettier write across `src/` |
| `npm run format:check` | Prettier check (CI-safe, no writes) |
| `npm run test:smoke` | Playwright smoke tests |

## Project structure

```
src/
  components/   Astro components (Hero, Nav, Footer, MapWorkspace, CedarFAB, ...)
  pages/        One file per route (index, about, cedar, map, pricing, join,
                  login, signup, status, privacy, terms, 404), dynamic routes
                  (team/[slug], demo/[slug]), and JSON endpoints
                  (data/aiannh.json.ts, data/counties.json.ts)
  layouts/      BaseLayout.astro — <head>, meta, OG/Twitter, JSON-LD, CSP;
                LegalLayout.astro — privacy/terms wrapper
  data/         Single sources of truth:
                  platforms.ts    the three product lines
                  team.ts         team + advisors + working areas
                  pricing.ts      tiers, comparison rows, discount codes
                  cedarIntents.ts Cedar chat intent bank
                  countyMatch.ts, tribalLookup.ts, scenes.ts  map + demo data
  lib/          api.ts (ApiResult fallback), cedarChat.ts (chat runtime),
                observability.ts (analytics shim)
  scripts/      hero.ts and other page-level behavior
  styles/       global.css + per-section stylesheets
public/         Static assets: brand marks, favicons, OG image, robots.txt,
                llms.txt, sitemap, tier icons
tests/          Playwright specs (smoke.spec.ts)
```

### Where content lives

Page copy is authored directly in the `.astro` files, but structured,
reused data is centralized in `src/data/` so a change lands in one place and
flows to the page, the footer, the JSON-LD, and the sitemap. Adding a fourth
platform, a new teammate, or a pricing tier is a single edit in the relevant
data file.

## SEO & crawlers

- Per-page `<title>`, meta description, canonical, Open Graph, and Twitter
  card tags are set in `BaseLayout.astro`.
- JSON-LD (Organization, AboutPage, Person, BreadcrumbList, FAQPage, Service)
  is emitted from the same data that renders the page.
- `public/robots.txt` allows search crawlers (with crawl delays for the noisy
  ones) and blocks AI training crawlers by default.
- `public/llms.txt` provides an AI-readable site summary.
- A light/dark `theme-color` and `prefers-color-scheme` support adapt the
  site to the visitor's OS appearance without a manual toggle.

## CI / CD

GitHub Actions workflows in `.github/workflows/`:

- **deploy.yml** — builds and deploys to GitHub Pages on push to `main`.
- **smoke.yml** — installs Chromium and runs the Playwright smoke test on PRs
  and pushes to `main`.
- **lighthouse.yml** — runs Lighthouse CI against the build (budgets in
  `lighthouserc.json`).

The custom domain is set via `CNAME`.

## Environment

Copy `.env.example` to `.env` for local configuration. The site runs fully
without any env vars — `src/lib/api.ts` and `observability.ts` degrade
gracefully when `PUBLIC_API_URL` and analytics keys are unset (the
`api-unconfigured` path), so the static marketing site works on its own.
Never commit a real `.env`.

## Where this fits: the TEIM ecosystem

Lumecon is a **standalone brand**, and this repository is its public
marketing site — its own design system, its own deploy, intentionally
independent. It does **not** import code or styles from the product. The
product and the data it runs on live in sibling `teim-team` repositories:

| Repo | What it is | Relationship to this site |
| --- | --- | --- |
| **`teim-app`** | The authenticated product: TEIM (Tribal Economic Impact Model), a React 19 + Vite SPA with a Fastify backend. It also carries its own in-app marketing surface under a separate "TEIM by Lumecon" brand (warm-paper/forest palette, Fraunces type). | This site sends visitors into the product (sign-up / "open workspace"). The two marketing surfaces are **deliberately separate brands** — do not cross-import styles or tokens. |
| **`cedar`** | A standalone FastAPI conversational-AI service (Python 3.13, OpenAI Agents SDK, Postgres). It orchestrates analysis agents and keeps only compressed chat memory; it never stores project data, files, or results. | The **`teim-app` backend** calls Cedar server-to-server. This site's Cedar chat is a *separate*, lightweight, anonymous keyword-classifier surface (`src/lib/cedarChat.ts`) and does **not** call the Cedar service. The contract is documented below for whenever a server-side caller is added. |
| **`teim-engine`** | The economic-accounts data layer: EPA `stateior` StateIO supply/use tables shipped as CSV. | Upstream of the impact math the site describes. Keep the homepage "foundational data" strip consistent with the public sources the engine actually draws on. |

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

## Security

See [`SECURITY.md`](./SECURITY.md) and `public/.well-known/security.txt` for
the disclosure policy.

## License

© Lumecon Inc. All rights reserved. Not open source; this repository is
published for transparency and is not licensed for reuse.
