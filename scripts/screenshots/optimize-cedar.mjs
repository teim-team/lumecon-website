// Convert the raw Cedar teaser capture (3840x2160, deviceScaleFactor 2) into
// the webp the homepage and /cedar serve, straight into public/app/.
// Same 1920 width as the rest of the /app series, which is what the
// <img width="1920" height="1080"> attributes on the site declare.
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'raw-cedar');
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
