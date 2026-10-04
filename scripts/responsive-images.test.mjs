import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname, join } from "node:path";
import sharp from "sharp";

import WIDTHS from "../src/data/screenshotWidths.json" with { type: "json" };

/**
 * The narrower copies that `srcset`s point at are generated and committed,
 * so nothing at build time notices when one is missing or stale.
 * `shotSrcset()` quietly drops a missing copy (the page still works, it just
 * downloads the 1920px file again), which is exactly why a test has to say
 * so instead. A stale copy is worse: after a re-capture changes a frame's
 * height, the browser would draw the old interface at some widths and the
 * new one at others, so each copy's aspect ratio is checked against its
 * source.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "public", "app");

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if ([".astro", ".ts", ".json"].includes(extname(e.name))) yield p;
  }
}

/* What the pages can ask for: every `/app/<name>.webp` literal, plus the
   Cedar Grove frames, which the page names through `shot('<name>')`. */
function referencedShots() {
  const names = new Set();
  for (const f of walk(join(ROOT, "src"))) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/\/app\/([a-z0-9-]+)\.webp/g)) names.add(m[1]);
    for (const m of text.matchAll(/shot\('([a-z0-9-]+)'\)/g)) names.add(m[1]);
  }
  return [...names].filter((n) => !n.endsWith("-narrow") && !/-\d+w$/.test(n)).sort();
}

function exactWidth(target, height) {
  for (let w = target; w < WIDTHS.source; w++) if ((w * height) % WIDTHS.source === 0) return w;
  return null;
}

test("every product screenshot a page shows has its narrower copies, in exact proportion", async () => {
  const shots = referencedShots();
  assert.ok(shots.length >= 10, `expected the site's screenshots, found ${shots.length}`);
  const files = readdirSync(APP);
  for (const name of shots) {
    const src = join(APP, `${name}.webp`);
    assert.ok(existsSync(src), `${name}.webp is referenced but missing`);
    const master = await sharp(src).metadata();
    if (master.width !== WIDTHS.source) continue;
    const expected = [
      ...new Set(WIDTHS.variants.map((t) => exactWidth(t, master.height)).filter(Boolean)),
    ].sort((x, y) => x - y);
    const present = files
      .map((f) => new RegExp(`^${name}-(\\d+)w\\.webp$`).exec(f))
      .filter(Boolean)
      .map((m) => Number(m[1]))
      .sort((x, y) => x - y);
    assert.deepEqual(present, expected, `${name}: copies on disk differ from what the generator writes; run npm run shots:variants`);
    for (const w of expected) {
      const meta = await sharp(join(APP, `${name}-${w}w.webp`)).metadata();
      assert.equal(meta.width, w, `${name}-${w}w.webp is ${meta.width}px wide`);
      // Exact, not rounded: the loaded file's own proportions size the box,
      // and a copy taller or shorter than its source moves the page below it.
      assert.equal(
        meta.height * WIDTHS.source,
        master.height * w,
        `${name}-${w}w.webp is ${meta.width}x${meta.height}, not in ${master.width}x${master.height} proportion: stale copy, run npm run shots:variants`,
      );
    }
  }
});

test("the display-size brand marks exist for every master", () => {
  for (const name of ["lumecon-logo-mark-teal", "lumecon-logo-mark-transparent"]) {
    for (const file of [`${name}-128.png`, `${name}-256.png`, `${name}-480.png`, `${name}.webp`]) {
      assert.ok(
        existsSync(join(ROOT, "public", "brand", file)),
        `public/brand/${file} is missing; run npm run brand:marks`,
      );
    }
  }
});
