/**
 * A compact visual handoff for the release pass. It deliberately captures
 * the pages and breakpoints where the most recent decisions are visible:
 * the homepage, pricing, and methodology on desktop and phone.
 *
 * Run against a served production build:
 *   SHOT_BASE=http://127.0.0.1:4321 node scripts/screenshots/capture-finish-pass.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4321';
const OUT = process.env.SHOT_OUT || '/tmp/lumecon-finish-pass';

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });

async function primeLazyImages(page) {
  const images = page.locator('img[loading="lazy"]');
  const count = await images.count();

  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    const failedSource = await image.evaluate(async (node) => {
      const img = node;
      if (!img.complete) {
        await Promise.race([
          new Promise((resolve) => img.addEventListener('load', resolve, { once: true })),
          new Promise((resolve) => img.addEventListener('error', resolve, { once: true })),
          new Promise((resolve) => window.setTimeout(resolve, 7_500)),
        ]);
      }
      return img.complete && img.naturalWidth ? null : img.currentSrc || img.src;
    });
    if (failedSource) throw new Error(`Lazy image did not load: ${failedSource}`);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);
}

const captures = [
  { name: 'home-desktop', path: '/', width: 1440, height: 900 },
  { name: 'home-mobile', path: '/', width: 390, height: 844, mobile: true },
  { name: 'pricing-desktop', path: '/pricing', width: 1440, height: 900 },
  { name: 'pricing-mobile', path: '/pricing', width: 390, height: 844, mobile: true },
  { name: 'methodology-desktop', path: '/methodology', width: 1440, height: 900 },
  { name: 'methodology-mobile', path: '/methodology', width: 390, height: 844, mobile: true },
];

for (const width of [1440, 1024, 768, 430, 375]) {
  for (const [name, path, selector] of [
    ['home-copy', '/', '.hero2'],
    ['glossary-copy', '/glossary', '.meth-hero'],
    ['naics-disclosure', '/naics', '.meth-hero'],
  ]) {
    captures.push({ name: `${name}-${width}`, path, selector, width, height: 1000 });
  }
}

for (const capture of captures) {
  const context = await browser.newContext({
    viewport: { width: capture.width, height: capture.height },
    deviceScaleFactor: capture.mobile ? 2 : 1,
    hasTouch: Boolean(capture.mobile),
    isMobile: Boolean(capture.mobile),
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => {
    try {
      // The consent choice belongs in product testing, not over the design
      // handoff. Keep analytics declined in these deterministic review shots.
      localStorage.setItem('lumecon:consent:analytics', 'denied');
    } catch {
      // A disabled storage context still produces a valid visual capture.
    }
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${capture.path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (capture.selector) {
    await page.locator(capture.selector).screenshot({ path: join(OUT, `${capture.name}.png`) });
  } else {
    await primeLazyImages(page);
    await page.screenshot({ path: join(OUT, `${capture.name}.png`), fullPage: true });
  }
  await context.close();
  console.log(`captured ${capture.name}`);
}

for (const path of ['/methodology', '/cedar']) {
  for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ colorScheme, reducedMotion: 'reduce' });
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print', colorScheme });
    await page.pdf({
      path: join(OUT, `${path.slice(1)}-print-${colorScheme}.pdf`),
      format: 'A4',
      printBackground: false,
    });
    await page.close();
  }
}

await browser.close();
