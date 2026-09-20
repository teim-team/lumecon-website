/**
 * Emit the sector catalog as a JS module for the Lumecon app (teim-app),
 * so the in-app sector guide and study-card covers use exactly the same
 * codes, titles, descriptions and wash colors as lumecon.ai/naics.
 *
 * Usage:
 *   node scripts/naics/export-app.mjs > ../teim-app/src/data/naicsSectors.js
 *
 * Run it after any change to sectors.mjs and commit both repos together.
 */
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTORS, TRIBAL_GOVERNMENT, CONTEXT_FALLBACKS, WASHES } from './sectors.mjs';

// How many photographs each sector actually ships, counted from the
// generated files (slug-sm.webp plus slug-v2-sm.webp, slug-v3-sm.webp, ...)
// so the app's variety rotation always matches what exists on disk.
const NAICS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'naics');
const generated = new Set(readdirSync(NAICS_DIR));
const photoVariants = (slug) => {
  let n = generated.has(`${slug}-sm.webp`) ? 1 : 0;
  while (generated.has(`${slug}-v${n + 1}-sm.webp`)) n += 1;
  return Math.max(n, 1);
};

const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const entry = (s) => ({
  code: s.code,
  slug: s.slug,
  title: s.title,
  description: s.description,
  wash: s.wash,
  shadow: rgb(WASHES[s.wash].shadow),
  mid: rgb(WASHES[s.wash].mid),
  highlight: rgb(WASHES[s.wash].highlight),
  photoVariants: photoVariants(s.slug),
});

const out = `// GENERATED FILE, do not edit by hand.
// Source of truth: lumecon-website/scripts/naics/sectors.mjs
// Regenerate: node scripts/naics/export-app.mjs > ../teim-app/src/data/naicsSectors.js
// The washed images live in public/naics/ (copied from the website build):
//   /naics/<slug>-sm.webp    600x400 tile
//   /naics/<slug>-wide.webp  1500x600 analysis-card banner
// The contextual fallbacks are cut smaller (840x560 / 600x400 / 1000x400)
// because their masters are 1000px; see scripts/naics/fallbacks.mjs.

export const NAICS_SECTORS = ${JSON.stringify(SECTORS.map(entry), null, 2)};

export const TRIBAL_GOVERNMENT_SECTOR = ${JSON.stringify(entry(TRIBAL_GOVERNMENT), null, 2)};

export const ALL_SECTORS = [...NAICS_SECTORS, TRIBAL_GOVERNMENT_SECTOR];

export const SECTOR_BY_SLUG = Object.fromEntries(ALL_SECTORS.map((s) => [s.slug, s]));

// Covers for an analysis with no resolvable primary sector. Kept OUT of
// ALL_SECTORS and SECTOR_BY_SLUG on purpose: nothing that resolves a NAICS
// code should be able to reach one, because these carry no analytic meaning.
// Their wash is \`slate\`, which is not a sector wash, so the colour itself
// does not assert an industry.
export const CONTEXT_FALLBACK_COVERS = ${JSON.stringify(CONTEXT_FALLBACKS.map(entry), null, 2)};
`;
process.stdout.write(out);
