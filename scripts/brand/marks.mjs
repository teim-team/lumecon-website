/**
 * Display-size copies of the Lumecon mark.
 *
 * Usage: npm run brand:marks
 *
 * The two masters in public/brand/ are 895x866. The nav draws the teal one at
 * about 34 CSS pixels on every page, and the sign-in panels draw the
 * full-colour one as a faint white silhouette at most 480 CSS pixels wide, so
 * every visitor was downloading the whole master (51KB for the teal PNG, 631KB
 * for the full-colour PNG) to paint a fraction of it. These copies are what
 * the `srcset`s in BrandWordmark.astro, MarkArt.astro and CedarChat.astro
 * offer; the masters stay, because structured data, Open Graph and the CSS
 * image-sets name them by URL.
 *
 * Output, next to each master:
 *   <name>-128.png, <name>-256.png   the nav seal and Cedar's avatar
 *   <name>-480.png                   MarkArt at 1x
 *   <name>.webp                      MarkArt at 2x, full size, only when
 *                                    missing: the full-colour one already
 *                                    exists and the CSS image-sets name it
 *
 * Palette PNG, not WebP, for the small copies. Measured 2026-10 on these two
 * masters: the teal seal at 128px is 3KB as a palette PNG against 8-11KB as
 * WebP (lossless or lossy), and the full-colour mark at 480px is 40KB against
 * 56-90KB. The mark is flat colour with a soft edge, which is the case a
 * palette suits and WebP's lossy alpha does not. quality 92 is the setting
 * optimize-art.mjs used for the card art.
 *
 * Run it only when a master changes, and commit the output with it.
 */
import sharp from 'sharp';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const brand = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'brand');
const MASTERS = ['lumecon-logo-mark-teal', 'lumecon-logo-mark-transparent'];
const WIDTHS = [128, 256, 480];

for (const name of MASTERS) {
  for (const w of WIDTHS) {
    const out = join(brand, `${name}-${w}.png`);
    await sharp(join(brand, `${name}.png`))
      .resize({ width: w })
      .png({ compressionLevel: 9, palette: true, quality: 92 })
      .toFile(out);
    console.log(`${name}-${w}.png  ${Math.round(statSync(out).size / 1024)}KB`);
  }
  const full = join(brand, `${name}.webp`);
  if (!existsSync(full)) {
    await sharp(join(brand, `${name}.png`))
      // alphaQuality 100: MarkArt reduces the mark to its alpha channel
      // alone, so the edge is the part to keep.
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(full);
    console.log(`${name}.webp  ${Math.round(statSync(full).size / 1024)}KB`);
  }
}
