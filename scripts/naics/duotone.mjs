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
  // v2 photos (second photograph per sector), reviewed 2026-07-27: the
  // attention crop beheads the janitor and both scaffold workers in the
  // 5:2 banner. Keys prefix-match the source basename, so these apply to
  // the *_v2_* sources only and leave each sector's first photo alone.
  administrative_v2: { wide: 'top' },
  construction_v2: { wide: 'top' },
};

/** Longest override key that prefix-matches the source basename, else the
 *  sector slug, else nothing. */
function cropOverridesFor(name, slug) {
  const prefixKey = Object.keys(CROP_OVERRIDES)
    .filter((k) => name === k || name.startsWith(k + '_') || name.startsWith(k + '-'))
    .sort((a, b) => b.length - a.length)[0];
  return CROP_OVERRIDES[prefixKey] || CROP_OVERRIDES[slug] || {};
}

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

  const overrides = cropOverridesFor(name, sector.slug);
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
// A sector's second and later photos become -v2/-v3 variants instead of
// silently overwriting the first. The variant index comes from an explicit
// `_v2_`/`-v2-` marker in the source name when present, so re-running the
// pipeline on a partial directory can never demote a v2 photo into the
// sector's primary slot; unmarked extra files fall back to alphabetical
// order within the run.
const variantFromName = (name, slug) => {
  const m = name.slice(slug.length).match(/^[-_]v(\d+)[-_]/);
  return m ? Math.max(parseInt(m[1], 10) - 1, 0) : null;
};
const seenPerSlug = new Map();
for (const f of files) {
  const name = basename(f, extname(f)).toLowerCase();
  const sector = bySlug(name);
  let idx = 0;
  if (sector) {
    const marked = variantFromName(name, sector.slug);
    idx = marked !== null ? marked : seenPerSlug.get(sector.slug) || 0;
    seenPerSlug.set(sector.slug, Math.max(seenPerSlug.get(sector.slug) || 0, idx) + 1);
  }
  await processOne(f, idx);
}
console.log('done');
