# scripts/

Asset pipelines. None of these run during `npm run build` or in CI: they are
run by hand when a source asset changes, and they commit their output. That is
deliberate, because every one of them is slow, needs a browser or a source file
that is not in the repository, and produces something a human should look at
before it ships.

This file exists because the `package.json` entries were not self-explanatory
(Brian's review on #300).

## `npm run naics:duotone`

`scripts/naics/duotone.mjs scripts/naics/sources`

Takes the raw sector photographs in `scripts/naics/sources/` and renders the
duotone treatment used on `/naics`: the image is desaturated and remapped onto
the brand's ink and teal, then written out as `webp` at the sizes the page
requests. Run it when a sector photograph is replaced. The sources are large
originals and are kept out of `public/` on purpose.

## `npm run naics:export-app`

`scripts/naics/export-app.mjs`

Exports the sector catalog (codes, titles, descriptions, wash colors, photo
variant counts) as a JS module in the shape `teim-app` expects, so the product
uses exactly the same sector data as `/naics` without the two repositories
drifting. The script prints the module to stdout, so redirect it into the app
repository:

```
node scripts/naics/export-app.mjs > ../teim-app/src/data/naicsSectors.js
```

The images travel separately: copy the bare-slug `.webp` files (the
1200x800 full-size renders the app displays) and the `-wide.webp` banners
(including the `-v2`, `-v3`, ... variants) from `public/naics/` into
`teim-app/public/naics/`. The `-sm.webp` thumbnails are site-only and stay
here. Run all of this after `naics:duotone` and commit both repositories
together.

## `npm run shots:examples`

`scripts/screenshots/capture-examples.mjs`

Drives a real browser over the running product and captures the screenshots
used on the home page, `/cedar` and the example pages, in both light and dark.
Run it when a product surface changes visibly, otherwise the marketing site
shows an interface that no longer exists. It needs the app running locally and
it writes into `public/`.

## `npm run shots:commons`

`scripts/screenshots/capture-commons.mjs`, twice, then `optimize-commons.mjs`

Captures the Cedar Commons frames — an organization's roster and a
consultancy's, the board, and the records panel — against a mocked API, then
cuts the `-narrow` crops the phone layout serves. Run the whole npm script
rather than the capture alone: re-capturing the raw PNGs without re-running
the optimizer leaves a stale `webp` under a fresh caption, which is how a
screenshot and its own caption once came to disagree.

It refuses to write a frame whose board did not load, one containing a broken
image, or one whose seat meter fell back to counting members alone. Those
three guards exist because each of them shipped once.

## `npm run team:headshots`

`scripts/team/headshots.mjs <dir>`

Cuts the deck's portrait masters to discs at 480px. The masters are already
washed in the teal duotone, so this deliberately does not re-wash them — a
second ramp on the first is the failure mode. See AGENTS.md for where the
masters live and why never to re-cut from a rendered PDF.

## `npm run docs:copy`, `docs:plan`, `docs:questions`

`scripts/docs/`

`docs:copy` walks the built site in a browser and writes
`docs/site-copy-and-architecture.md` — every page's rendered copy, its head
metadata, and appendices measuring repetition across pages. CI regenerates it
and fails on a diff, so it is a gate, not a convenience: if you changed copy
and did not re-run it, CI will say so.

`docs:plan` writes the two onboarding resources from
`src/data/planFirstAnalysis.js`, so the page, the call and the coordinator's
handout cannot say different things. `docs:questions` renders the methodology
open-questions PDF.

`docs:copy` needs the built site being served; the others do not.

## `npm run llms:pages` and `npm run llms:roster`

`scripts/docs/llms-pages.mjs`, `scripts/docs/llms-roster.mjs`

Two blocks of `public/llms.txt` are generated; the rest is prose.

`llms:pages` rewrites `## Pages` from `src/data/siteMap.ts` — every indexed
page and the question it answers. No browser, no running site. Run it when a
page is added or its question changes.

`llms:roster` rewrites `## Team and advisors` from the rendered `/team` page,
so the public roster cannot drift from the page a visitor reads. **Do not
hand-edit either block.** Serve the build first, same as `docs:copy`.

## `npm run stress`

`scripts/test/stress.mjs`

The one script here that generates nothing. A dozen concurrent clients walk
every page several rounds each, half of them on a phone viewport, and then one
client drives Cedar's chat and the disclosure sets far harder than a person
would, reporting DOM node counts before and after so a leak is a number rather
than a hunch. Round-over-round timings are the other signal: a site that gets
slower the longer a browser stays on it is holding something it should have
released.

Not in CI. Run it against a preview when touching anything that holds state:

```
npm run build && npm run preview &
STRESS_BASE_URL=http://127.0.0.1:4321 npm run stress
```

A request cancelled by navigating away is not a failure, and the script says
so — the first version counted 115 of those as errors and buried the real
signal underneath them.

## The ordinary ones

`dev`, `build`, `preview`, `check`, `format`, `format:check` are the standard
Astro and Prettier commands. `test:smoke` runs the Playwright suite in
`tests/`, which is what CI runs on every pull request.

`docs:copy`, `llms:pages` and `stress` import `src/data/siteMap.ts` and so run
under `node --experimental-strip-types`.
