// Turn the raw why-card illustrations into the PNGs the homepage serves.
//
// The source art arrives at 1536x1024 with a lot of transparent margin around
// the drawing, and the margin differs per image, so dropping the sources in
// as-is would leave the four cards visually misaligned even though every frame
// is the same size. Trimming to the drawing and resizing to a common 600px
// width gives each card art that fills its own box the same way.
//
// Usage: node scripts/screenshots/optimize-art.mjs
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'raw-art');
const out = join(here, '..', '..', 'public', 'art');

// threshold 2, not 0: the art has a faint anti-aliased halo at the edge of the
// alpha channel, and trimming at 0 keeps a few pixels of it as margin.
const TRIM_THRESHOLD = 2;
const WIDTH = 600;

for (const f of readdirSync(src).filter((f) => f.endsWith('-source.png'))) {
  const name = basename(f, '-source.png');
  const target = join(out, `${name}.png`);
  await sharp(join(src, f))
    .trim({ threshold: TRIM_THRESHOLD })
    .resize({ width: WIDTH })
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(target);
  const { width, height } = await sharp(target).metadata();
  console.log(`${name}.png  ${width}x${height}  ${Math.round(statSync(target).size / 1024)}KB`);
}
