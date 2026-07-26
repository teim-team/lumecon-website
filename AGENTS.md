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
- Pronounced rounded corners and pills. This site's scale is 8px
  cards/frames, 6px buttons/chips; eyebrows are plain mono
  typography, not pill objects.
- Icons imprisoned in tinted circles or squares inside cards; the
  custom illustrations stand on their own.
- Decorative gradients, glows, blobs, sparkles, dotted connectors
  and other fake complexity. Only the real Lumecon mark is used as
  background art.
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
says why Lumecon matters; /pricing says what it costs and why the
pricing is different; /methodology says why the economics are
credible; /cedar says why Lumecon's use of AI is different; the
glossary defines terms and nothing more. Do not re-explain Cedar on
other pages beyond a one-line pointer to /cedar.

## No ampersands in displayed copy (2026-07)

Write "and", never "&", anywhere a visitor can read it (founder
rule; ampersands read as unprofessional). Code identifiers and TS
types are exempt. Same rule applies in teim-app.

## Vocabulary standard (2026-07, both repos)

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

- Sector thumbnails (duotone): `scripts/naics/sectors.mjs` is the
  single source for the 20 NAICS sectors + the Tribal Government
  category, their descriptions and wash colors; `/naics` and the
  thumbnail pipeline both read it, so tiles and images cannot drift.
  `node scripts/naics/duotone.mjs scripts/naics/sources` regenerates
  `public/naics/*.webp` (three crops per sector: 1200x800, 600x400
  `-sm`, 1500x600 `-wide`). Sources are licensed Shutterstock
  originals named `<slug>_shutterstock_<imageID>_<downloadID>.jpeg`;
  the licensing record is `scripts/naics/LICENSES.md`. Never use the
  NACA proposal photos.
- App handoff: `node scripts/naics/export-app.mjs >
  ../teim-app/src/data/naicsSectors.js` regenerates the app's sector
  data, and the full-size + `-wide` webps in `public/naics/` exist
  for the app to copy (the site itself only renders `-sm`). Edit
  sectors.mjs, never naicsSectors.js directly.
- Hero example screenshots: `scripts/screenshots/capture-examples.mjs`
  captures the 60 `public/app/ex-*.webp` hero images from a running
  teim-app dev server; `optimize-examples.mjs` compresses them.
- Smoke tests: `npm run test:smoke` (Playwright; CI runs chromium +
  webkit). In a sandbox without Google Fonts the home smoke test
  fails on a blocked font request; every other failure is real.

Known heavy directory: `scripts/naics/sources/` (~250 MB of licensed
originals) is tracked in git. Moving it to external storage is a
history decision for the founder; do not delete it casually, the
filenames encode the Shutterstock license IDs.
