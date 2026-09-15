/**
 * Team headshot pipeline: the pitch deck's team slide in, the site's
 * committed duotone headshots out.
 *
 * Usage:
 *   node scripts/team/headshots.mjs <team-slide.jpg>
 *
 * The source is the team slide of the Lumecon pitch deck, exported at its
 * native raster size (2112x1632). The deck is not in this repository and
 * must not be: it is confidential. Export the page, pass the path, commit
 * the eight webps this writes, and leave the slide out of git.
 *
 * Why regenerate rather than cut the slide up by hand: the deck washes the
 * eight portraits at two different depths (the first two leads print
 * noticeably darker than the other three), which reads as an uneven row
 * once they sit side by side at one size. Each crop is flattened to
 * luminance, stretched to the full range and washed through WASHES.teal
 * from scripts/naics/sectors.mjs — the same ramp, through the same lookup,
 * as every licensed photograph on the site. One treatment, and the color
 * keeps one source of truth.
 *
 * Output: public/team/<slug>.webp, circular with transparent corners so a
 * headshot sits on any ground instead of carrying the slide's white with
 * it. Written at the crop's native size; nothing is upscaled, so the leads
 * carry 284px and the advisors 144px, and team.css renders each at half
 * that.
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { WASHES } from '../naics/sectors.mjs';

const SRC = process.argv[2];
if (!SRC) {
  console.error('Usage: node scripts/team/headshots.mjs <team-slide.jpg>');
  process.exit(1);
}
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'team');
mkdirSync(OUT, { recursive: true });

/**
 * Circle positions on the 2112x1632 slide, as [slug, left, top, size].
 * Measured off the slide rather than eyeballed: the washed pixels are the
 * only ones on the page where the green channel leads the red one, so
 * thresholding on that and reading the runs returns both bands exactly —
 * five 284px circles at y=510, three 144px circles at y=1342. Re-measure
 * the same way if the slide is ever re-laid-out; do not nudge these.
 */
const CIRCLES = [
  ['elijah-moreno', 124, 510, 284],
  ['laurel-wheeler', 508, 510, 284],
  ['isabella-agnes', 890, 510, 284],
  ['francesca-agnes', 1274, 510, 284],
  ['kaylyn-lee', 1656, 510, 284],
  ['brian-kim', 124, 1342, 144],
  ['vod-vilfort', 766, 1342, 144],
  ['havala-hanson', 1406, 1342, 144],
];

/** Map a grayscale byte through the wash ramp, shadow -> highlight. The
 *  same linear per-channel lookup scripts/naics/duotone.mjs applies. */
function ramp(g, wash) {
  return [0, 1, 2].map((i) =>
    Math.round(wash.shadow[i] + ((wash.highlight[i] - wash.shadow[i]) * g) / 255),
  );
}

const wash = WASHES.teal;

for (const [slug, left, top, size] of CIRCLES) {
  const gray = await sharp(SRC)
    .extract({ left, top, width: size, height: size })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = gray.data;
  const rgb = Buffer.alloc((px.length / gray.info.channels) * 3);
  for (let i = 0, o = 0; i < px.length; i += gray.info.channels, o += 3) {
    const [r, g, b] = ramp(px[i], wash);
    rgb[o] = r;
    rgb[o + 1] = g;
    rgb[o + 2] = b;
  }
  // The crop is a circle printed on the slide's white page, so the corners
  // have to be cut away rather than trusted: masking with dest-in keeps the
  // circle's own antialiased edge and drops everything outside it.
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  await sharp(rgb, { raw: { width: size, height: size, channels: 3 } })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .webp({ quality: 92, effort: 6 })
    .toFile(join(OUT, `${slug}.webp`));
  console.log(`${slug}.webp  ${size}x${size}`);
}
console.log('done');
