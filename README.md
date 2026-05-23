# Lumecon

Marketing and product site for **Lumecon Inc.** — economic impact analysis
software for governments, enterprises, and mission-driven organizations.
Built as a static [Astro](https://astro.build) site and deployed to GitHub
Pages at [lumecon.ai](https://lumecon.ai).

The site explains the three Lumecon platforms (Local, Tribal, and Global
Economic Impact), demonstrates the workflow through an interactive US map,
introduces Cedar (the AI assistant), and carries the pricing, about/team,
and join-the-team pages. Cedar's marketing-page chat is keyword-classified
and self-contained — it does not call any upstream model provider.

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
  pages/        One file per route (index, about, cedar, map, pricing, join, ...)
  layouts/      BaseLayout.astro — <head>, meta, OG/Twitter, JSON-LD, CSP
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

## Security

See [`SECURITY.md`](./SECURITY.md) and `public/.well-known/security.txt` for
the disclosure policy.

## License

© Lumecon Inc. All rights reserved. Not open source; this repository is
published for transparency and is not licensed for reuse.
