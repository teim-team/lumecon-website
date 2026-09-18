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
 *   node scripts/screenshots/optimize-commons.mjs <rawOrgDir> <rawConsultantDir>
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'public', 'app');
mkdirSync(out, { recursive: true });

const [orgDir, conDir] = process.argv.slice(2);
if (!orgDir || !conDir) {
  console.error('Usage: node scripts/screenshots/optimize-commons.mjs <rawOrg> <rawConsultant>');
  process.exit(1);
}

// The two rosters, without the invite rail beside them: this section is
// about who is on a project, and the form is a different subject.
const ROSTER_CROP = { left: 580, top: 520, width: 1530, height: 1450 };

const JOBS = [
  { src: join(orgDir, 'commons-board.png'), name: 'commons-board-org' },
  { src: join(conDir, 'commons-board.png'), name: 'commons-board-consultant' },
  { src: join(orgDir, 'commons-collaborators.png'), name: 'commons-collaborators' },
  {
    src: join(conDir, 'commons-collaborators.png'),
    name: 'commons-collaborators-consultant',
  },
  {
    src: join(orgDir, 'commons-collaborators.png'),
    name: 'commons-roles',
    crop: ROSTER_CROP,
    width: 1400,
  },
  { src: join(orgDir, 'commons-access.png'), name: 'commons-access' },
  { src: join(orgDir, 'commons-documents.png'), name: 'commons-documents' },
  { src: join(orgDir, 'commons-cedar.png'), name: 'commons-cedar' },
  { src: join(orgDir, 'commons-notes.png'), name: 'commons-notes' },
];

for (const job of JOBS) {
  if (!existsSync(job.src)) {
    console.error(`missing ${job.src}`);
    process.exitCode = 1;
    continue;
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
