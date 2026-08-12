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

Exports the finished sector artwork and its manifest into the shape `teim-app`
expects, so the same imagery can be used inside the product without the two
repositories drifting to different crops. Run it after `naics:duotone`, then
copy the output into the app repository.

## `npm run shots:examples`

`scripts/screenshots/capture-examples.mjs`

Drives a real browser over the running product and captures the screenshots
used on the home page, `/cedar` and the example pages, in both light and dark.
Run it when a product surface changes visibly, otherwise the marketing site
shows an interface that no longer exists. It needs the app running locally and
it writes into `public/`.

## The ordinary ones

`dev`, `build`, `preview`, `check`, `format`, `format:check` are the standard
Astro and Prettier commands. `test:smoke` runs the Playwright suite in
`tests/`, which is what CI runs on every pull request.
