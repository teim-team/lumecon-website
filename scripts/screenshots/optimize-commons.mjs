/**
 * Turn the raw /cedar-commons captures into the webp assets the page ships.
 *
 * Two kinds of output:
 *   - full frames at 1920px, the same treatment every other app shot on this
 *     site gets, for the hero and the four per-project surfaces;
 *   - one crop, of the Collaborators view, for the section that is about who
 *     is on a project rather than about the whole screen. The crop is taken
 *     in source pixels (the capture is 3200x2000: a 1600x1000 viewport at
 *     deviceScaleFactor 2), so it moves if the app's layout does. Recheck it
 *     after a recapture rather than assuming.
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

// The two rosters, without the invite rail beside them: this section is
// about who is on a project, and the form is a different subject.
const ROSTER_CROP = { left: 580, top: 520, width: 1530, height: 1450 };

const JOBS = [
  { src: frame('commons-board-org'), name: 'commons-board-org' },
  { src: frame('commons-board-consultant'), name: 'commons-board-consultant' },
  { src: frame('commons-collaborators-org'), name: 'commons-collaborators' },
  { src: frame('commons-collaborators-consultant'), name: 'commons-collaborators-consultant' },
  {
    src: frame('commons-collaborators-org'),
    name: 'commons-roles',
    crop: ROSTER_CROP,
    width: 1400,
  },
  { src: frame('commons-access-org'), name: 'commons-access' },
  { src: frame('commons-documents-org'), name: 'commons-documents' },
  { src: frame('commons-cedar-org'), name: 'commons-cedar' },
  { src: frame('commons-notes-org'), name: 'commons-notes' },
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
