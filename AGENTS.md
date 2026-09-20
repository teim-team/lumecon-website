# Agent field guide — lumecon-website

Astro static marketing site for Lumecon (economic impact analysis
software), deployed to GitHub Pages at lumecon.ai. Brand rules live
with the founder; the standing engineering rule is below. Verify
every rendering change by building, screenshotting the affected
output and visually inspecting it.

## Standing instruction: the AI-frontend-tell audit

Run this audit whenever touching layout or styles, and periodically
across the whole site. The job is subtraction, correction and
refinement, never adding visual elements to fix visual problems.

Visually inspect rendered pages at roughly 1440, 1024, 768, 430 and
375px. For every border, card, background, radius, shadow, width
constraint and decorative element ask: what visual or informational
job is this doing? No defensible answer means remove it and let
spacing, alignment, typography, scale or a hairline divider do the
work.

Design tells to hunt:

- Cardification: every concept wrapped in a rounded, bordered,
  shadowed box. Boundaries must communicate something (selection,
  interactivity); otherwise columns + hairlines.
- Arbitrary max-widths: essay-width caps on marketing copy while the
  rest of the row sits empty. Section intros run to roughly 65-75%
  of the container.
- Everything centered, everything symmetric, uniform grids of
  identical boxes. Prefer strong axes, top-aligned content with
  natural copy lengths, and normalized visual weight over identical
  pixel dimensions.
- Pronounced rounded corners and pills. Controls use 8px, product
  frames use 14px and genuine grouped panels use 18-20px. A radius
  communicates one assembled object; it is not permission to wrap
  every idea in a card. Eyebrows are plain mono typography, not pills.
- Icons imprisoned in tinted circles or squares inside cards; the
  custom illustrations stand on their own.
- Decorative blobs, sparkles, dotted connectors and other fake
  complexity. Only the real Lumecon mark is used as background art.
  Founder-approved treatments (2026-09) are about optical surface
  quality and real economic context rather than ornament:
  - A cool mineral page ground (#F3F6F8) beneath pure-white working
    surfaces. Directional, low-frequency light planes may shape a
    hero or product stage; they must not read as colored circles or
    generic SaaS blobs. Never add grain/noise overlays.
  - Translucency is reserved for navigation, captions over licensed
    photography and copy panes that genuinely overlap a product
    screen. Use crisp inset highlights and neutral multi-distance
    shadows to separate working surfaces from the ground.
  - Broad white, mineral and deep-navy planes may organize a long
    page when the change of material carries meaning. Avoid a stripe
    pattern and do not tint every individual content section.
  - A two-stop vertical gradient on the primary button, dark enough
    at its lightest stop to keep white text at 4.75:1. It reads as a
    physical control, not as decoration. Deep research covers and
    acquisition fields may use restrained directional gradients;
    ordinary cards do not.
  - Licensed sector photography may create a full-bleed editorial
    passage or sit behind a real product screen. Use the committed
    duotone derivatives, keep the photography subordinate to the
    product argument and state clearly when people or facilities are
    illustrative rather than customers. A solid image wash is allowed
    when text needs contrast; decorative color gradients are not.
- Repetitive section rhythm (eyebrow, giant heading, paragraph,
  cards) with no compositional variation.
- Huge empty vertical gaps; phone sections carry less padding than
  desktop.
- Motion on everything. Animate only what communicates; never
  transition-all; respect prefers-reduced-motion.
- Desktop shrunk onto mobile. Mobile is its own composition
  (ordering, illustration scale, dividers), not a stacked grid, and
  breakpoints come from where the layout actually breaks.

Code tells to hunt:

- Competing overrides and dead rules left by iteration; media
  queries losing to source order; compensating margins layered over
  a root cause.
- Magic-number positioning and fixed heights without a reason.
- Wrapper-div nesting that exists only as edit history.
- Premature abstraction: generic components with configuration-prop
  sprawl where two or three plain compositions are clearer.
- JavaScript doing CSS's job (hover, layout, visibility).
- Inconsistent spacing vocabulary drifting across sections.
- Accessibility sprinkled as aria-labels while heading order,
  focus, semantics and reduced motion go unhandled.

After changes, compare before/after screenshots at multiple widths
and revert any technically elegant change that makes the actual
composition worse. Cleaner code is not evidence of better design;
only the rendered result is.

## Standing instruction: full width, foldable length (2026-08)

Pages use the site container width (--container-max); do not ship a
narrower reading column as a page's main layout — the 840px legal
column read as an afterthought and is gone. Long document-style
content (legal drafts, long reference sections) folds into
disclosure rows (the pricing-FAQ device, .legal-sec in legal.css) so
a page reads as a scannable set of sections, not one long scroll.
LegalLayout opens all disclosures for print.

## Standing instruction: no decorative circles (2026-08)

The only circles on the site are the Lumecon mark itself (including
MarkArt background usage) and functional icons. The old topographic
contour ring linework on the auth brand panels and teal flow surfaces
read as random circles and is deliberately removed; do not reintroduce
contour rings, orbit lines, or generic circle patterns as decoration.
Directional light fields are fine when they read as illumination on
a plane. Avoid discrete radial circles; the moment a glow reads as a
shape, remove it.

## Standing instruction: teal is semantic

Teal has semantic meaning in the Lumecon visual language. Do not use
teal merely to make a page more colorful. Teal identifies three
things: interactive links and actions, economically important
concepts such as "economic impact", and the short recurring brand
phrases we deliberately want the reader to remember (`.brand-em` in
global.css).

Treat teal emphasis as editorial highlighting. On any viewport, a
reader who skims only the teal language should encounter a coherent
version of the Lumecon story. Reserve the emphasis for a small
vocabulary of recurring ideas; prefer intentional repetition of
established phrases over inventing new highlighted slogans per page.

The approved recurring brand phrases (founder-approved 2026-07;
these are sanctioned exceptions to the no-antithesis and
no-fragment copy rules, verbatim only). Do not invent a new teal
slogan for every section: teal represents Lumecon ideas we
deliberately want people to remember, so reuse this established
language across pages where appropriate.

Homepage: "economic impact" / "every result is traceable" /
"not frozen in it" / "make it visible" ("Make yours visible.")

Pricing: "We tailor the modeling, not the price." / "Complexity
belongs in the model. Not the pricing." / "lowest applicable price"

Methodology: "proven foundations" / "better inputs" / "the model
keeps improving" / "every number has a lineage" / "Built on decades
of economic science. Not frozen in it." / "Economic judgment stays
human."

Cedar: "AI built for economic analysis, from the beginning." /
"Not a chatbot added to old software. Part of how Lumecon works." /
"Your existing work becomes context, not baggage." / "Thought
partner, not autopilot." / "AI in the workflow. Economists in the
loop." / "the model, data infrastructure, software and AI evolve
together"

Shared: "Every organization has an economic impact." / "We invest
in the model, not just the software (around it)."

Do not turn these into badges, pills, cards, callouts or gradients;
the emphasis comes from color within the existing composition. Never
make whole paragraphs teal; emphasize the smallest phrase that
carries the idea. Review test: if someone remembers only the teal
phrases, do they understand what makes Lumecon different?

Page ownership (keep each page making one argument): the homepage
says why Lumecon matters and hands off; **/why-lumecon (2026-09) owns
the buyer's argument** — why an organization should choose this, with
price, preparation work, traceability and the team as its evidence;
/pricing says what it costs and why the pricing is different;
/methodology says why the economics are credible and where they stop,
and sends the comparison against established platforms to
/why-lumecon rather than answering it; /start says what getting
started involves; /cedar says why Lumecon's use of AI is different;
the glossary defines terms and nothing more. Do not re-explain Cedar
on other pages beyond a one-line pointer to /cedar.

The four questions, so a new page knows which one it is answering:
Why Lumecon — why should our organization choose this? · the product
pages — what can we do with it? · Methodology — how are the estimates
built, and what are their limits? · Plan your first analysis — what
does getting started involve?

## Standing instruction: the copy document is a CI gate (2026-09)

The smoke workflow's last step regenerates
`docs/site-copy-and-architecture.md` from the built site and runs
`git diff --exit-code` on it. Change any visible copy and that file is
stale, so the job fails even when every test passed, which is how it
reads in the log: 63 chromium and 63 webkit green, then a failure.

Regenerate and commit it in the same change:

```
npm run build && npm run preview -- --host 127.0.0.1 &
DOCS_BASE_URL=http://127.0.0.1:4321 npm run docs:copy
```

`astro preview` is a singleton, so stop an existing one first
(`npx astro preview stop`) or the second call silently serves nothing.

## Standing instruction: verify with `npm run build` (2026-09)

`npm run build` is `astro check && astro build`, and it is what all three
workflows run. Run it before pushing, and read the whole result.

`astro check` prints errors first and finishes with the warning and hint
counts, so `astro check | tail -3` shows `0 warnings / 0 hints` on a run
that failed. That exact mistake shipped a type error to `main`, where it
broke the Pages deploy, the smoke job and Lighthouse at once, because each
of them starts with the same build.

The error itself is worth knowing too: indexing a keyed object with a
`string[]`'s element type fails, because `string` has no index signature on
it. Use `as const` on the id list so each element is a literal key.

## No ampersands in displayed copy (2026-07)

Write "and", never "&", anywhere a visitor can read it (founder
rule; ampersands read as unprofessional). Code identifiers and TS
types are exempt. The same rule applies in every sibling repository,
not only teim-app.

**Grep for both forms, because each one misses the other.** Searching
for a bare `&` does not match `&amp;`, and searching for `&amp;` does
not match a plain `&` inside a string literal. Both were live on
2026-09-18: `Help &amp; support` in teim-app's footer and
`Requests &amp; support` in Cedar Press's settings, then, after a sweep
that only looked for the entity, `"Access & workspace"` and
`"Data & privacy"` in teim-app's `Settings.jsx`. One regex catches
both:

```
&amp;|[A-Za-z0-9] & [A-Za-z0-9]
```

Two things worth knowing beyond the grep. The Cedar Press occurrence had
a correct `aria-label` two lines above it, so a screen reader was given
the right wording and the screen was not: check the visible label
against its own label attribute. And an ampersand inside a URL query
string is a separator, not copy — the only ones in this site's `dist`
are in Google Scholar hrefs on `/team`.

**Not every ampersand can simply be fixed.** Cedar Press's collection
`Native Federal Advocacy & Engagement` is embedded verbatim in the
citation written into every downloaded CSV, so renaming it changes how
files subscribers already hold cite themselves. It waits for a version
bump on that collection, tracked as item 11 in that repository's
`docs/TERMINAL_HANDOFF.md`.

## Vocabulary standard (2026-07; all five repositories)

This site is the **North Star**: where a sibling repository and this file
disagree about what something is called, this file wins and the sibling is the
one to correct. As of 2026-09-18 each sibling carries the relevant part of this
standard in its own `AGENTS.md`, so a contributor who never opens this file
still meets it. `cedar` is the one to watch, because its product copy is written
as Markdown agent prompts and therefore reads as configuration rather than as
voice.

User-facing word choices, everywhere a customer reads:
- "analysis / analyses", not "study/studies" ("project" is the
  backend object; "study" is reserved for a formal deliverable).
- "organization" (use "organization or nation" only where the
  distinction earns its place). Account = authentication identity;
  Organization = customer entity; Workspace = the collaborative
  space; Analysis = the analytical project; Run = an immutable model
  execution.
- "Cedar", never "AI assistant"; Cedar is Lumecon's AI economic
  analyst on every surface, and the site chat is a lightweight
  Cedar, never a downgraded "site assistant" in schema or copy.
- The platform phrase (founder-approved 2026-08, verbatim): Lumecon
  is "the intelligent economic analysis platform". This is the
  category-level positioning, used in the homepage title, the hero
  kicker, the canonical pitch and page metas. In running text it stays
  lowercase. Where it stands alone as a name (the homepage `<title>`
  and `og:title`, which link previews in iMessage and elsewhere show,
  and the nav tagline) it is title case, "The Intelligent Economic
  Analysis Platform" (founder decision 2026-09-12). "Economic impact
  analysis" remains the search term customers type and stays the
  category wording on Cedar Impact surfaces.
- "Intelligent", not "AI", is how the products are described. The
  word "AI" appears only where Cedar itself is being explained
  (the /cedar page, "Cedar, the AI economic analyst" and the
  approved Cedar phrases above). Everywhere else, embed intelligence
  as a quality of the product, not a technology label.
- The Cedar family (2026-08): Cedar is the brand that ties the
  products together, and also Lumecon's AI economic analyst. The
  sibling products, with their canonical one-line definitions,
  verbatim wherever the family is introduced:
  - "Cedar Impact, where you run economic impact analysis" — a
    product beside Commons and Grove, not an engine label behind
    them. In the app the side rail says Cedar Impact.
  - "Cedar Commons, the shared project workspace"
  - "Cedar Grove, the living evidence base for your organization’s
    economy" (owner ruling 2026-09-13, replacing "the advanced data
    library": the old line invited comparison with data portals and
    undersold the product, which is the connection between a finding
    and what it rests on)
  - "Cedar, the AI economic analyst, in every plan"
  - "Seed, the free account" (2026-08) — the fourth plan, first on
    /pricing: the real platform, where you build a full analysis and
    see your direct effects; indirect, induced and total impact, and
    exports, unlock on any paid plan. Display name only: the tier id
    stays `free` everywhere machines read it (signup handoff, product
    tierCapabilities). Seed never passes through checkout.
  Lumecon offers the products; Cedar is the brand. Do not describe
  Commons or Grove as plan features only — they are products that
  plans include.
- NOT PUBLIC: Cedar Press is unannounced and must not appear
  anywhere a visitor or a crawler can reach, which includes HTML
  comments and CSS comments, both of which ship in the built
  output. It was found in `dist/methodology/index.html` that way in
  2026-08. Grep `dist/`, not just `src/`.
  **Open, founder call (raised 2026-09-18):** the rule as written says
  "anywhere a crawler can reach", and a public GitHub repository is
  crawler-reachable. `cedar-press`'s own public `README.md` names the
  product and links this site, and `teim-app`'s and `cedar`'s do too.
  Either the rule means "nothing in the built site", in which case it
  should say so, or it means what it says, in which case those READMEs
  are out of bounds. The two readings are currently inconsistent.
  Pending that call, nothing was changed in either direction and no
  reference to Cedar Press was added to this repository.
- There is deliberately no platform page. The five product names are
  introduced where they do work on the pages that already exist, not
  gathered onto a page of their own.
- "GDP contribution" for the primary value-added metric; "economic
  output" not "sales"; results vocabulary (Jobs supported, Labor
  income, GDP contribution, Economic output, Tax impacts, Direct,
  Indirect, Induced) is shared with the product verbatim.
- "every supported U.S. geography" generally; enumerate "counties,
  states, the nation, reservations and trust lands" when precision
  helps. Every geography ships in every plan; analysis types may
  depend on organizational context.
- "Log in" and "Continue with Google", identical on both surfaces.
- To the customer everything is Lumecon; "Team App" is repository
  shorthand only.

The full reconciliation tracker lives in
docs/reconciliation-roadmap.md.

## Generators and pipelines (2026-07)

Nothing in `scripts/` runs at build time; each is a generator whose
output is committed. Run them when their inputs change.

One exception, added deliberately: `scripts/sync-headers-csp.mjs` runs as
a `postbuild` hook. Its committed output (`public/_headers`) names the
production API origin, which covers every deploy that uses it — but a
Cloudflare Pages or Netlify preview pointed at a *different*
`PUBLIC_API_URL` cannot be covered by a committed file, because that
origin is not known at commit time, and those hosts run a plain
`npm run build` rather than the GitHub Pages workflow. The hook takes
`--skip-if-unset`, so a contributor's build with no production origins is
a no-op; the deploy workflow calls the script without that flag, so a
deploy can never skip it.

- Sector photography (duotone): `scripts/naics/sectors.mjs` is the
  single source for the 20 NAICS sectors + the Tribal Government
  category, their descriptions and wash colors; `/naics` and the
  photography pipeline both read it, so tiles and images cannot drift.
  `node scripts/naics/duotone.mjs scripts/naics/sources` regenerates
  `public/naics/*.webp` (three crops per sector: 1200x800, 600x400
  `-sm`, 1500x600 `-wide`). The `/naics` directory uses the small
  crops and the homepage may use selected wide crops. Sources are
  licensed Shutterstock
  originals named `<slug>_shutterstock_<imageID>_<downloadID>.jpeg`;
  the licensing record is `scripts/naics/LICENSES.md`. Never use the
  NACA proposal photos.
- Team headshots: `npm run team:headshots -- <dir>` resizes the deck's
  1200px portrait masters and cuts each to a disc, writing
  `public/team/<slug>.webp` at 480px. `<dir>` is `public/pitch/team` from
  the deck branch in the app repository (`claude/pitch-deck-budget-update-838i7g`
  in teim-app). Those masters are **already** washed in the teal duotone
  and already evened for exposure by the deck's own
  `scripts/pitch-portraits.py`, so this script deliberately does not
  re-wash them; a second ramp on top of the first is the failure mode to
  avoid. Never re-cut these from a rendered PDF page: a deck page is a
  flattened raster, and the portraits come out at about a fifth of the
  resolution the masters have. Who appears, and their education and
  experience lines, live in `src/data/team.ts`, which stays the single
  record for the team.
- Public roster for assistants: `npm run llms:roster` rewrites the
  `## Team and advisors` block of `public/llms.txt` from the rendered
  `/team` page (serve the build first, same as `docs:copy`). **Do not
  hand-edit that block.** It used to be a second hand-written roster and
  it drifted into a public-record mismatch: it named a person the page
  does not show and published a fact about tribal membership that
  appears nowhere a visitor can read. Anything that should be public
  about a person goes on `/team` first and arrives in llms.txt because
  it is there.
- Page inventory for crawlers and assistants: `src/data/siteMap.ts` is
  the single record of what pages exist, the question each one answers
  and whether it is indexed. `npm run llms:pages` rewrites the
  `## Pages` block of `public/llms.txt` from it (no browser, no running
  site), and `npm run docs:copy` and `npm run stress` read it too.
  **Adding a page is two edits**: a line in `Nav.astro`'s `NAV` array so
  a reader can reach it, and an entry here so the copy document, llms.txt
  and the stress walk know it exists. A smoke test compares the inventory
  against the generated sitemap and fails when they disagree — that check
  exists because /why-lumecon shipped into the sitemap automatically,
  was silently skipped by the copy export until its array was edited by
  hand, and was named nowhere at all in llms.txt.
- Stress: `npm run stress` against a running preview. Not a generator and
  not in CI. A dozen concurrent clients walk every page several rounds
  each, half on a phone viewport, then one client drives Cedar and the
  disclosure sets hard and reports node counts before and after, so a
  leak is a number rather than a hunch. It distinguishes a request
  cancelled by navigating away from one that failed — the first version
  did not, and reported 115 failures that were all cancellations.
- App handoff: `node scripts/naics/export-app.mjs >
  ../teim-app/src/data/naicsSectors.js` regenerates the app's sector
  data, and the full-size + `-wide` webps in `public/naics/` exist
  for the app to copy. Edit
  sectors.mjs, never naicsSectors.js directly.
- Hero example screenshots: `scripts/screenshots/capture-examples.mjs`
  captures the 30 `public/app/ex-*.webp` example images (ten examples,
  each as results, map and compare) from a running
  teim-app dev server; `optimize-examples.mjs` compresses them.
- Cedar Commons frames: `npm run shots:commons` captures both variants
  (an organization and a consultancy) against a mocked API and then cuts
  the `-narrow` phone crops. It refuses to write a frame whose board did
  not load, that contains a broken image, or whose seat meter fell back
  to counting members alone, so a retry state or a wrong seat count
  cannot reach the page. Run the whole script: re-capturing the raw PNGs
  without re-running the optimizer leaves a stale webp under a fresh
  caption.
- Smoke tests: `npm run build` first (Playwright serves `dist/`), then
  `npm run test:smoke` (CI runs chromium + webkit). The site makes no
  third-party requests since the typefaces were self-hosted, so there is
  no network failure mode to discount.
- **Build the way CI does, or two tests fail for no reason.** The smoke
  workflow builds with `PUBLIC_APP_URL=https://app.lumecon.ai` and
  `PUBLIC_API_URL=https://api.lumecon.ai`; Astro inlines both at build
  time. There is no tracked `.env`, so a plain `npm run build` produces
  the login-only fallback and these two fail:
  *the production build preserves the app handoff and API CSP* and
  *welcome closes the flow in full teal with one action*. Locally:

  ```sh
  PUBLIC_APP_URL=https://app.lumecon.ai PUBLIC_API_URL=https://api.lumecon.ai npm run build
  ```

  Those two are the only known environmental failures. Anything else is
  real: check before discounting it, never the other way round.
- **`astro check` passing is not the build passing.** `npm run build` is
  `astro check && astro build`, and the two fail in different places. A
  grep for the check's `Result / 0 errors` summary reports green while
  `astro build` is failing underneath it: a malformed stylesheet gives
  `[lightningcss minify] Invalid empty selector` and writes **no `dist/`
  at all**, which looks like success to any filter watching the top of the
  output. Read to the end and confirm the last line is `[build] Complete!`
  with a page count. `ls dist/<route>/index.html` settles it in one
  command.

Known heavy directory: `scripts/naics/sources/` (~250 MB of licensed
originals) is tracked in git. Moving it to external storage is a
history decision for the founder; do not delete it casually, the
filenames encode the Shutterstock license IDs.

## Product handoff contract (2026-07, final integration pass)

- **Plan ids are the product's tier vocabulary:** `free | sprout | sapling |
  tree` (matching `server/lib/tierCapabilities.js` in teim-app). They appear
  in `/signup?tier=`, `/checkout?tier=` and `src/data/pricing.ts`. Never
  reintroduce the old `starter/standard/leader` aliases; the server silently
  normalizes unknown tiers to sprout, which would hand a Tree buyer a Sprout
  account.
- **Build-time env (inlined by Astro, passed by deploy.yml from repository
  variables):** `PUBLIC_APP_URL` (product origin; login redirect and the
  welcome page's Open Lumecon) and `PUBLIC_API_URL` (product API base; auth,
  checkout session and the CSP's connect-src are derived from it). Unset,
  the site builds "login-only": auth forms degrade to the contact-email path.
- **App-side prerequisites the site depends on:** the product API's
  `ALLOWED_ORIGINS` must include this site's origin (the auth fetches send
  `credentials: 'include'`), and `AUTH_ALLOWLIST_EMAILS` must be empty for
  public signup to accept registrations (the pilot lockdown 403s them).
- **Referral links:** the app shares `lumecon.ai/r/<code>`. GitHub Pages has
  no dynamic routes, so `src/pages/404.astro` forwards `/r/<code>` to
  `/signup?ref=<code>`. Keep that forwarding if the 404 page is reworked.
- Signup does not transmit the chosen tier to the server: every self-serve
  account starts Free and paid tiers land with billing. The tier query only
  routes the visitor between signup, checkout and welcome.
