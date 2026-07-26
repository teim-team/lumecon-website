/**
 * Sector thumbnail pipeline: real photographs in, uniform brand-washed
 * thumbnails out, in the treatment of the NACA proposal cover (grayscale
 * photography washed in a single brand color).
 *
 * Usage:
 *   node scripts/naics/duotone.mjs <input-dir>
 *
 * Input naming: each file must start with a sector slug from
 * scripts/naics/sectors.mjs, e.g. `construction-crane.jpg`,
 * `healthcare.png`, `tribalgov-council.jpg`. The slug decides the sector
 * and therefore the wash color; the color rule lives in sectors.mjs, not
 * here, so it cannot be improvised per image.
 *
 * Every image is smart-cropped (sharp attention crop) to the same 3:2
 * frame and written twice under public/naics/:
 *   <slug>.webp        1200x800, page and study-thumbnail size
 *   <slug>-sm.webp     600x400, grid and card size
 * A grayscale copy of the crop is kept next to the source as
 * <name>.gray.png so the pre-wash framing can be inspected.
 */
import { readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SECTORS, TRIBAL_GOVERNMENT, WASHES } from './sectors.mjs';

const IN = process.argv[2];
if (!IN) {
  console.error('Usage: node scripts/naics/duotone.mjs <input-dir>');
  process.exit(1);
}
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'naics');
mkdirSync(OUT, { recursive: true });

const ALL = [...SECTORS, TRIBAL_GOVERNMENT];
const bySlug = (name) => ALL.find((s) => name === s.slug || name.startsWith(s.slug + '-'));

/** Map a grayscale byte through the wash ramp, shadow -> highlight, the
 *  same linear per-channel lookup the NACA proposal's duotone() applies. */
function ramp(g, wash) {
  return [0, 1, 2].map((i) => Math.round(wash.shadow[i] + ((wash.highlight[i] - wash.shadow[i]) * g) / 255));
}

async function processOne(file) {
  const name = basename(file, extname(file)).toLowerCase();
  const sector = bySlug(name);
  if (!sector) {
    console.warn(`skip ${file}: no sector slug prefix matches sectors.mjs`);
    return;
  }
  const wash = WASHES[sector.wash];
  // Same frame for every thumbnail; attention crop keeps the subject.
  const cropped = sharp(join(IN, file)).rotate().resize(1200, 800, { fit: 'cover', position: 'attention' });
  const gray = await cropped.clone().grayscale().normalise().raw().toBuffer({ resolveWithObject: true });
  await sharp(gray.data, { raw: gray.info }).png().toFile(join(IN, `${name}.gray.png`));

  // Duotone: one lookup table application over the normalized grayscale.
  const px = gray.data;
  const outBuf = Buffer.alloc((px.length / gray.info.channels) * 3);
  for (let i = 0, o = 0; i < px.length; i += gray.info.channels, o += 3) {
    const [r, g2, b] = ramp(px[i], wash);
    outBuf[o] = r;
    outBuf[o + 1] = g2;
    outBuf[o + 2] = b;
  }
  const washed = sharp(outBuf, { raw: { width: 1200, height: 800, channels: 3 } });
  await washed.clone().webp({ quality: 86 }).toFile(join(OUT, `${sector.slug}.webp`));
  await washed.resize(600, 400).webp({ quality: 84 }).toFile(join(OUT, `${sector.slug}-sm.webp`));
  console.log(`${file} -> ${sector.slug}.webp (${sector.wash})`);
}

const files = readdirSync(IN).filter((f) => /\.(jpe?g|png|webp|tiff?|avif)$/i.test(f) && !f.endsWith('.gray.png'));
if (!files.length) console.warn(`no images found in ${IN}`);
for (const f of files) await processOne(f);
console.log('done');
