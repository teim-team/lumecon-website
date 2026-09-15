/**
 * Team headshots: the deck's portrait masters in, the site's circles out.
 *
 * Usage:
 *   npm run team:headshots -- <dir>
 *
 * `<dir>` is `public/pitch/team` from the deck branch in the app repository
 * (`claude/pitch-deck-budget-update-838i7g` in teim-app), which holds the
 * eight portraits as 1200x1200 masters. They arrive already washed in the
 * teal duotone — the same SHADOW #09444A to HIGHLIGHT #86BFBA ramp that
 * `WASHES.teal` in scripts/naics/sectors.mjs applies to the licensed sector
 * photography — and already evened out for exposure by the deck's own
 * scripts/pitch-portraits.py, which normalises each disc to a common mean
 * and spread. Eight portraits shot by eight people in eight rooms is the
 * problem that script solves, and it is solved; re-washing here would only
 * put a second ramp on top of the first.
 *
 * So this does two things and no more: resize, and cut the disc. The masters
 * are square with image in the corners, and the deck clips them at render
 * time, so the corners are cut here instead and written as transparency —
 * a circle in the file, not a circle drawn by whatever CSS happens to be
 * around it.
 *
 * Output: public/team/<slug>.webp at 480px, which is 2x the largest size the
 * page renders (a 240px selected portrait). Nothing is upscaled; the masters
 * have the resolution to spare.
 */
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SRC = process.argv[2];
if (!SRC) {
  console.error('Usage: npm run team:headshots -- <dir with the deck portrait masters>');
  process.exit(1);
}
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'team');
mkdirSync(OUT, { recursive: true });

/** The deck names its files by first name; the site keys people by slug. */
const PEOPLE = [
  ['elijah', 'elijah-moreno'],
  ['laurel', 'laurel-wheeler'],
  ['isabella', 'isabella-agnes'],
  ['francesca', 'francesca-agnes'],
  ['kaylyn', 'kaylyn-lee'],
  ['brian', 'brian-kim'],
  ['vod', 'vod-vilfort'],
  ['havala', 'havala-hanson'],
];

const SIZE = 480;
/** Supersampled so the disc edge is smooth rather than stepped. */
const mask = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#fff"/></svg>`,
);

for (const [stem, slug] of PEOPLE) {
  const file = join(SRC, `${stem}.webp`);
  if (!existsSync(file)) {
    console.error(`missing ${file}`);
    process.exit(1);
  }
  await sharp(file)
    .resize(SIZE, SIZE, { fit: 'cover' })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .webp({ quality: 90, effort: 6 })
    .toFile(join(OUT, `${slug}.webp`));
  console.log(`${slug}.webp  ${SIZE}x${SIZE}`);
}
console.log('done');
