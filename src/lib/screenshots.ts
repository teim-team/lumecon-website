/**
 * `srcset` for a product screenshot, so a browser downloads the copy it will
 * actually draw instead of always the 1920px render.
 *
 * The narrower copies are written by `npm run shots:variants`
 * (scripts/screenshots/responsive-variants.mjs) at the widths in
 * src/data/screenshotWidths.json. `src` stays the 1920px file on purpose: the
 * lightbox enlarges `src`, so "click for full size" still opens full size.
 *
 * Only copies that exist on disk at build time are listed, so a capture added
 * without re-running the generator degrades to the single 1920px file rather
 * than to a broken image.
 * scripts/responsive-images.test.mjs is what notices that and fails.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import WIDTHS from '../data/screenshotWidths.json';

const SHOT = /^\/app\/([a-z0-9-]+)\.webp$/;

/* The copies on disk, by frame name. Read once per build. The widths are not
   always the targets in screenshotWidths.json: the generator rounds each up
   to the nearest width that keeps the frame's proportions exact, so the
   files themselves are the record. */
let onDisk: Map<string, number[]> | undefined;
function copies(name: string): number[] {
  if (!onDisk) {
    onDisk = new Map();
    for (const f of readdirSync(join(process.cwd(), 'public', 'app'))) {
      const m = /^([a-z0-9-]+)-(\d+)w\.webp$/.exec(f);
      if (!m) continue;
      onDisk.set(m[1], [...(onDisk.get(m[1]) ?? []), Number(m[2])]);
    }
  }
  return [...(onDisk.get(name) ?? [])].sort((a, b) => a - b);
}

export function shotSrcset(src: string): string | undefined {
  const m = SHOT.exec(src);
  if (!m || m[1].endsWith('-narrow')) return undefined;
  const widths = copies(m[1]);
  if (!widths.length) return undefined;
  return [...widths.map((w) => `/app/${m[1]}-${w}w.webp ${w}w`), `${src} ${WIDTHS.source}w`].join(', ');
}
