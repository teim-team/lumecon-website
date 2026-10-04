/**
 * Narrower copies of the product screenshots, so a browser can fetch the
 * size it will actually draw.
 *
 * Usage: npm run shots:variants
 *
 * Every product screenshot is a 1920px render. On a phone the page draws one
 * at about 1,000 device pixels, and on a 1440px laptop a half-column shot
 * draws at about 700, so most visitors were downloading two to four times the
 * pixels they could see. The <img> keeps `src` pointing at the 1920px file —
 * the lightbox opens `src`, so "click for full size" still means full size —
 * and gains a `srcset` of these copies through `shotSrcset()` in
 * src/lib/screenshots.ts.
 *
 * Widths: the targets in src/data/screenshotWidths.json, each rounded up to
 * the nearest width that keeps the source's proportions exact (see
 * exactWidth below), so the published set differs slightly per frame.
 * shotSrcset() lists whatever copies are on disk.
 *
 * Which files: every 1920px-wide `public/app/*.webp` whose name appears
 * somewhere under `src/`, so the thirty example captures teim-app copies but
 * this site never shows do not each grow three more files. The phone crops
 * (`-narrow`) are left alone; they are already cut for a phone.
 *
 * Run it after `shots:examples`, `shots:commons` or any capture that rewrites
 * a screenshot, and commit the output with it. A copy left over from an older
 * capture would show the old interface at some widths and the new one at
 * others, so this always rewrites every variant rather than only missing ones.
 * `scripts/responsive-images.test.mjs` fails when a referenced screenshot has
 * no variants.
 */
import sharp from 'sharp';
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';

import WIDTHS from '../../src/data/screenshotWidths.json' with { type: 'json' };

const SHOT_SOURCE_WIDTH = WIDTHS.source;
const SHOT_WIDTHS = WIDTHS.variants;
const VARIANT_SUFFIX = /-\d+w\.webp$/;

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const app = join(root, 'public', 'app');

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (['.astro', '.ts', '.json', '.mjs', '.js'].includes(extname(e.name))) yield p;
  }
}
const corpus = [...walk(join(root, 'src'))].map((f) => readFileSync(f, 'utf8')).join('\n');

/* A copy must have exactly its source's proportions. Once an image loads,
   the browser sizes its box from the file's own width and height, not the
   attributes, so a 1280px copy of a 1920x1004 frame (669.33px tall, written
   as 669) makes the box a third of a pixel shorter and moves everything
   below it by that much. Invisible, but not nothing, and avoidable: a width
   w keeps the ratio exact when w x height is divisible by 1920. So each
   target width is rounded up to the next width that does, and a target with
   none below 1920 is skipped (grove-map, 1920x1249, gets no copies). */
function exactWidth(target, height) {
  for (let w = target; w < SHOT_SOURCE_WIDTH; w++) {
    if ((w * height) % SHOT_SOURCE_WIDTH === 0) return w;
  }
  return null;
}

let wrote = 0;
for (const f of readdirSync(app).sort()) {
  if (extname(f) !== '.webp' || VARIANT_SUFFIX.test(f) || f.includes('-narrow')) continue;
  const name = basename(f, '.webp');
  if (!corpus.includes(name)) continue;
  const src = join(app, f);
  const { width, height } = await sharp(src).metadata();
  if (width !== SHOT_SOURCE_WIDTH) continue;
  // Clear every old copy first, so a width that is no longer exact does not
  // linger and get listed by shotSrcset().
  for (const old of readdirSync(app)) {
    if (old.startsWith(`${name}-`) && VARIANT_SUFFIX.test(old) && old.slice(name.length + 1).match(/^\d+w\.webp$/)) {
      rmSync(join(app, old));
    }
  }
  const widths = [...new Set(SHOT_WIDTHS.map((t) => exactWidth(t, height)).filter(Boolean))];
  for (const w of widths) {
    const out = join(app, `${name}-${w}w.webp`);
    // effort 6 is the slowest, smallest encoder setting; quality matches
    // optimize-examples.mjs so a copy is never visibly softer per pixel than
    // the file it stands in for.
    await sharp(src)
      .resize({ width: w, height: (w * height) / SHOT_SOURCE_WIDTH, fit: 'fill' })
      .webp({ quality: 88, effort: 6 })
      .toFile(out);
    wrote++;
    console.log(`${name}-${w}w.webp  ${Math.round(statSync(out).size / 1024)}KB`);
  }
  if (!widths.length) console.log(`${name}: no width below ${SHOT_SOURCE_WIDTH} keeps ${width}x${height} exact; no copies`);
}
console.log(`${wrote} copies written`);
