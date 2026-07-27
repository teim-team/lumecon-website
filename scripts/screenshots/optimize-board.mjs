// Convert raw board captures (3200x1800, deviceScaleFactor 2) into the
// 1920x1080 webp assets the homepage tour serves, straight into public/app/.
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'raw-board');
const out = join(here, '..', '..', 'public', 'app');
mkdirSync(out, { recursive: true });

for (const f of readdirSync(src).filter((f) => f.endsWith('.png'))) {
  const name = basename(f, '.png');
  await sharp(join(src, f))
    .resize({ width: 1920 })
    .webp({ quality: 88 })
    .toFile(join(out, `${name}.webp`));
  console.log(`${name}.webp`);
}
