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
 * Every image is smart-cropped (sharp attention crop) and written three
 * times under public/naics/:
 *   <slug>.webp        1200x800 (3:2), page and detail size
 *   <slug>-sm.webp     600x400 (3:2), grid and tile size
 *   <slug>-wide.webp   1500x600 (5:2), study-card banner crop
 * The wide crop is cut independently from the original, not from the
 * 3:2 frame, so the banner keeps the subject too. A grayscale copy of
 * the 3:2 crop is kept next to the source as <name>.gray.png so the
 * pre-wash framing can be inspected.
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
const bySlug = (name) =>
  ALL.find((s) => name === s.slug || name.startsWith(s.slug + '-') || name.startsWith(s.slug + '_'));

/**
 * Per-sector crop gravity overrides, checked against the rendered output.
 * The default sharp 'attention' crop is right most of the time, but it has
 * decapitated subjects near the top of the frame (education, healthcare) and
 * locked onto cloud texture instead of the Capitol dome (publicadmin). Keys
 * are `main` (the 3:2 crops) and `wide` (the 5:2 banner crop); values are
 * sharp gravity strings ('top', 'bottom', 'left', 'right', ...). Add an
 * entry here when a contact-sheet review shows a bad crop; never fix it by
 * editing the generated webp. With several photos per sector, a key may
 * also be a full source basename (e.g. 'retail-checkout') to override one
 * photo without touching the sector's others.
 */
const CROP_OVERRIDES = {
  education: { wide: 'top' },
  healthcare: { wide: 'top' },
  publicadmin: { wide: 'bottom' },
};

/** Map a grayscale byte through the wash ramp, shadow -> highlight, the
 *  same linear per-channel lookup the NACA proposal's duotone() applies. */
function ramp(g, wash) {
  return [0, 1, 2].map((i) => Math.round(wash.shadow[i] + ((wash.highlight[i] - wash.shadow[i]) * g) / 255));
}

async function processOne(file, variantIndex = 0) {
  const name = basename(file, extname(file)).toLowerCase();
  const sector = bySlug(name);
  if (!sector) {
    console.warn(`skip ${file}: no sector slug prefix matches sectors.mjs`);
    return;
  }
  const wash = WASHES[sector.wash];
  // A sector can ship several photographs so repeated projects in the same
  // sector get visual variety. The first (alphabetical) source keeps the
  // bare slug name, so nothing that references `<slug>-sm.webp` breaks;
  // later sources become `<slug>-v2`, `<slug>-v3`, ...
  const outName = variantIndex === 0 ? sector.slug : `${sector.slug}-v${variantIndex + 1}`;

  // Duotone a crop: normalized grayscale through the wash lookup table.
  const washCrop = async (w, h, position = 'attention') => {
    const gray = await sharp(join(IN, file))
      .rotate()
      .resize(w, h, { fit: 'cover', position })
      .grayscale()
      .normalise()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const px = gray.data;
    const outBuf = Buffer.alloc((px.length / gray.info.channels) * 3);
    for (let i = 0, o = 0; i < px.length; i += gray.info.channels, o += 3) {
      const [r, g2, b] = ramp(px[i], wash);
      outBuf[o] = r;
      outBuf[o + 1] = g2;
      outBuf[o + 2] = b;
    }
    return { washed: sharp(outBuf, { raw: { width: w, height: h, channels: 3 } }), gray };
  };

  const overrides = CROP_OVERRIDES[name] || CROP_OVERRIDES[sector.slug] || {};
  const main = await washCrop(1200, 800, overrides.main || 'attention');
  await sharp(main.gray.data, { raw: main.gray.info }).png().toFile(join(IN, `${name}.gray.png`));
  await main.washed.clone().webp({ quality: 86 }).toFile(join(OUT, `${outName}.webp`));
  await main.washed.resize(600, 400).webp({ quality: 84 }).toFile(join(OUT, `${outName}-sm.webp`));
  const wide = await washCrop(1500, 600, overrides.wide || 'attention');
  await wide.washed.webp({ quality: 84 }).toFile(join(OUT, `${outName}-wide.webp`));
  console.log(`${file} -> ${outName}.webp (${sector.wash})`);
}

const files = readdirSync(IN)
  .filter((f) => /\.(jpe?g|png|webp|tiff?|avif)$/i.test(f) && !f.endsWith('.gray.png'))
  .sort();
if (!files.length) console.warn(`no images found in ${IN}`);
// Group per sector so a second photo for a sector becomes its -v2 variant
// instead of silently overwriting the first. Alphabetical order keeps the
// variant assignment stable across re-runs.
const seenPerSlug = new Map();
for (const f of files) {
  const sector = bySlug(basename(f, extname(f)).toLowerCase());
  const idx = sector ? (seenPerSlug.get(sector.slug) || 0) : 0;
  await processOne(f, idx);
  if (sector) seenPerSlug.set(sector.slug, idx + 1);
}
console.log('done');
