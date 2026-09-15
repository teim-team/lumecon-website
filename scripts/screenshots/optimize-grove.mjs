// Convert the raw Cedar Grove captures into 1920px-wide webp assets.
//
// 1920 wide is not arbitrary: it is what the page declares, so the browser
// reserves the right box before the file arrives. The captures come off a
// deviceScaleFactor of 2, so each is halved here rather than upscaled.
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'raw-grove');
const out = join(here, '..', '..', 'public', 'app');
mkdirSync(out, { recursive: true });

for (const f of readdirSync(src).filter((f) => f.endsWith('.png'))) {
  const name = basename(f, '.png');
  const meta = await sharp(join(src, f)).metadata();
  await sharp(join(src, f))
    .resize({ width: 1920 })
    .webp({ quality: 90 })
    .toFile(join(out, `${name}.webp`));
  console.log(`${name}.webp  from ${meta.width}x${meta.height}`);
}
