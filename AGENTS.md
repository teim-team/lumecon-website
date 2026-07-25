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
