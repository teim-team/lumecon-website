/**
 * Contextual-fallback thumbnails: the covers used when an analysis has no
 * resolvable primary sector.
 *
 * Separate from duotone.mjs on purpose. That script resolves a sector from the
 * filename slug and refuses anything it cannot place, which is exactly right
 * for sector photography and exactly wrong here: these images have no sector,
 * and the whole point is that they never acquire one.
 *
 * Usage:
 *   node scripts/naics/fallbacks.mjs <input-dir>
 *
 * Input naming matches the sector sources so provenance stays uniform:
 *   <slug>_shutterstock_<assetId>_<licenseId>.jpeg
 *
 * CROP SIZES DIFFER FROM THE SECTOR PIPELINE, DELIBERATELY. duotone.mjs cuts
 * 1200x800, 600x400 and 1500x600 from masters several thousand pixels wide.
 * The fallback masters are 1000px, so the 1200 and 1500 crops are not
 * reachable without upscaling, and the sector pipeline never upscales. These
 * are cut at the largest true size the source supports, keeping the same
 * aspect ratios so the app can swap them in without knowing the difference:
 *   <slug>.webp       840x560  (3:2)
 *   <slug>-sm.webp    600x400  (3:2)
 *   <slug>-wide.webp  1000x400 (5:2)
 * 1000x400 is ample for the board cards, which render at 270 CSS px. If larger
 * masters are supplied later, raise these to the sector sizes; nothing else
 * has to change.
 */
import { readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { CONTEXT_FALLBACKS, WASHES } from './sectors.mjs';

const IN = process.argv[2];
if (!IN) {
  console.error('Usage: node scripts/naics/fallbacks.mjs <input-dir>');
  process.exit(1);
}
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'naics');
mkdirSync(OUT, { recursive: true });

/** The same linear per-channel lookup duotone.mjs applies. */
const rampOf = (g, wash) =>
  [0, 1, 2].map((i) =>
    Math.round(wash.shadow[i] + ((wash.highlight[i] - wash.shadow[i]) * g) / 255),
  );

const bySlug = (name) => CONTEXT_FALLBACKS.find((f) => name.startsWith(f.slug));

const SIZES = [
  ['', 840, 560],
  ['-sm', 600, 400],
  ['-wide', 1000, 400],
];

for (const file of readdirSync(IN).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
  const name = basename(file, extname(file));
  const entry = bySlug(name);
  if (!entry) continue;
  const wash = WASHES[entry.wash];
  const src = join(IN, file);

  const meta = await sharp(src).metadata();
  for (const [suffix, w, h] of SIZES) {
    if (meta.width < w || meta.height < h) {
      throw new Error(
        `${file} is ${meta.width}x${meta.height}; ${w}x${h} would upscale. Supply a larger master.`,
      );
    }
    const gray = await sharp(src)
      .rotate()
      .resize(w, h, { fit: 'cover', position: 'attention' })
      .grayscale()
      .normalise()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const px = gray.data;
    const out = Buffer.alloc((px.length / gray.info.channels) * 3);
    for (let i = 0, o = 0; i < px.length; i += gray.info.channels, o += 3) {
      const [r, g2, b] = rampOf(px[i], wash);
      out[o] = r;
      out[o + 1] = g2;
      out[o + 2] = b;
    }
    await sharp(out, { raw: { width: w, height: h, channels: 3 } })
      .webp({ quality: 85 })
      .toFile(join(OUT, `${entry.slug}${suffix}.webp`));
  }
  console.log(`${file} -> ${entry.slug}{,-sm,-wide}.webp (${entry.wash})`);
}
