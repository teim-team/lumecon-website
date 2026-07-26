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
import { SECTORS, TRIBAL_GOVERNMENT, WASHES } from './sectors.mjs';

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
});

const out = `// GENERATED FILE, do not edit by hand.
// Source of truth: lumecon-website/scripts/naics/sectors.mjs
// Regenerate: node scripts/naics/export-app.mjs > ../teim-app/src/data/naicsSectors.js
// The washed images live in public/naics/ (copied from the website build):
//   /naics/<slug>-sm.webp    600x400 tile
//   /naics/<slug>-wide.webp  1500x600 study-card banner

export const NAICS_SECTORS = ${JSON.stringify(SECTORS.map(entry), null, 2)};

export const TRIBAL_GOVERNMENT_SECTOR = ${JSON.stringify(entry(TRIBAL_GOVERNMENT), null, 2)};

export const ALL_SECTORS = [...NAICS_SECTORS, TRIBAL_GOVERNMENT_SECTOR];

export const SECTOR_BY_SLUG = Object.fromEntries(ALL_SECTORS.map((s) => [s.slug, s]));
`;
process.stdout.write(out);
