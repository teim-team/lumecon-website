// Convert raw capture PNGs into 1920px-wide webp assets, preserving each
// purpose-built frame. Results and maps use DOM-measured boundaries;
// comparisons use a 16:10 frame.
//
// 1920 wide is not arbitrary: it is what the site declares, so the browser
// reserves the right box before the file arrives.
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'raw');
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
