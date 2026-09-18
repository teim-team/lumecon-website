/**
 * Turn the raw /cedar-commons captures into the webp assets the page ships.
 *
 * Full frames at 1920px, the same treatment every other app shot on this
 * site gets. `crop` is supported and currently unused: a crop is taken in
 * source pixels (the capture is 3200x2000, a 1600x1000 viewport at
 * deviceScaleFactor 2), so it moves whenever the app's layout does and has
 * to be rechecked after a recapture rather than assumed.
 *
 * Usage:
 *   node scripts/screenshots/optimize-commons.mjs <rawDir>
 *
 * One directory, because every raw frame carries the variant that produced
 * it (`commons-board-org.png`, `commons-board-consultant.png`, ...). An
 * earlier version took two directories, which was the workaround for the
 * two capture runs overwriting each other's files.
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'public', 'app');
mkdirSync(out, { recursive: true });

const [raw] = process.argv.slice(2);
if (!raw) {
  console.error('Usage: node scripts/screenshots/optimize-commons.mjs <rawDir>');
  process.exit(1);
}
const frame = (name) => join(raw, `${name}.png`);

/* Only what /cedar-commons ships. The page carries four frames, each doing a
   job no other frame does; publishing the rest would put unused binaries on
   the site and invite the page to become an inventory of drawers again,
   which is what it was told to stop being.
   The raw directory still holds every surface the capture drives — the
   access drawer, the Cedar panel, the note thread, both variants of each —
   so cutting one of those later is a one-line addition here and no
   re-capture. */
const JOBS = [
  { src: frame('commons-board-org'), name: 'commons-board-org' },
  { src: frame('commons-collaborators-org'), name: 'commons-collaborators' },
  { src: frame('commons-collaborators-consultant'), name: 'commons-collaborators-consultant' },
  { src: frame('commons-documents-org'), name: 'commons-documents' },
];

for (const job of JOBS) {
  /* A missing raw frame fails the run rather than quietly leaving the
     committed webp stale, which is the same rule the capture script now
     applies to a control it cannot find. */
  if (!existsSync(job.src)) {
    throw new Error(
      `optimize-commons: missing ${job.src}.\n` +
        '  Run both capture passes into this directory first:\n' +
        '    node scripts/screenshots/capture-commons.mjs <rawDir>\n' +
        '    CAPTURE_VARIANT=consultant node scripts/screenshots/capture-commons.mjs <rawDir>',
    );
  }
  let pipeline = sharp(job.src);
  if (job.crop) pipeline = pipeline.extract(job.crop);
  const file = join(out, `${job.name}.webp`);
  await pipeline
    .resize({ width: job.width || 1920 })
    .webp({ quality: 88 })
    .toFile(file);
  const meta = await sharp(file).metadata();
  console.log(`${job.name}.webp  ${meta.width}x${meta.height}`);
}
