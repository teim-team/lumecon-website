/**
 * Full-site visual sweep: every public page at the audit widths from
 * AGENTS.md (1440, 1024, 768, 430, 375, plus 390 as the device-frame
 * phone), in both light and dark color schemes at the endpoints, plus
 * the signup page arriving from each real pricing tier. The output
 * grid is the review surface for theme and responsive regressions —
 * dark mode renders from the same stylesheets via
 * prefers-color-scheme, so a hardcoded light-only color shows up here
 * before a visitor sees it, and the intermediate widths catch layouts
 * (like the two-column pricing band between 641 and 1080px) that
 * neither endpoint renders.
 *
 * Run against a served build:
 *   npm run build && npx serve dist -l 4330   (or astro preview)
 *   node scripts/screenshot.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4330';
const OUT = process.env.SHOT_OUT || '/tmp/shots';

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function ctx(width, height, colorScheme, isMobile = false) {
  const c = await browser.newContext({
    viewport: { width, height },
    colorScheme,
    // Full-page capture never scrolls, so IntersectionObserver-driven
    // reveals below the fold would stay at opacity 0 and the shots
    // would show fake gaps where real content lives. The site honors
    // prefers-reduced-motion by forcing every reveal visible, so
    // requesting it here makes the capture show the page as built.
    reducedMotion: 'reduce',
    deviceScaleFactor: isMobile ? 2 : 1,
    isMobile,
    hasTouch: isMobile,
  });
  await c.addInitScript(() => {
    try {
      localStorage.setItem('lumecon:consent:analytics', 'denied');
    } catch {}
  });
  return c;
}

/**
 * Native lazy images only begin loading after they enter the viewport.
 * A full-page screenshot does not perform that scroll itself, so without
 * this pass it can look as if real artwork or product captures are missing.
 * Prime each lazy image in reading order, confirm it decoded, then return to
 * the page top before the actual capture.
 */
async function primeLazyImages(page) {
  const lazyImages = page.locator('img[loading="lazy"]');
  const count = await lazyImages.count();

  for (let index = 0; index < count; index += 1) {
    const image = lazyImages.nth(index);
    await image.scrollIntoViewIfNeeded();
    const result = await image.evaluate(async (node) => {
      const img = node;
      if (!img.complete) {
        await Promise.race([
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
          new Promise((resolve) => window.setTimeout(resolve, 7_500)),
        ]);
      }
      if (!img.complete || !img.naturalWidth) return img.currentSrc || img.src;
      try {
        await img.decode();
      } catch {
        // A complete image may reject decode when it is already available;
        // naturalWidth above remains the source-of-truth check.
      }
      return null;
    });
    if (result) throw new Error(`Lazy image did not load: ${result}`);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);

  const failed = await page.evaluate(() =>
    Array.from(document.images)
      .filter(
        (img) =>
          img.id !== 'lightboxImg' &&
          img.getAttribute('src') &&
          (!img.complete || !img.naturalWidth),
      )
      .map((img) => img.currentSrc || img.src),
  );
  if (failed.length) throw new Error(`Image asset check failed: ${failed.join(', ')}`);
}

const surfaces = [
  { name: 'desktop-light', c: await ctx(1440, 900, 'light') },
  { name: 'desktop-dark', c: await ctx(1440, 900, 'dark') },
  { name: 'tablet-light', c: await ctx(1024, 768, 'light') },
  { name: 'tablet-dark', c: await ctx(1024, 768, 'dark') },
  { name: 'tablet-narrow-light', c: await ctx(768, 1024, 'light') },
  { name: 'phone-430-light', c: await ctx(430, 932, 'light', true) },
  { name: 'phone-light', c: await ctx(390, 844, 'light', true) },
  { name: 'phone-dark', c: await ctx(390, 844, 'dark', true) },
  { name: 'phone-375-light', c: await ctx(375, 667, 'light', true) },
];

async function shot(c, url, name, opts = {}) {
  const page = await c.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (opts.before) await opts.before(page);
  if (opts.full ?? true) await primeLazyImages(page);
  await page.waitForTimeout(opts.wait ?? 800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? true });
  await page.close();
  console.log('shot', name);
}

// Every public page. /naics is deliberately unlisted in nav but indexed,
// so it stays in the sweep.
const PAGES = [
  ['/', 'home'],
  ['/cedar', 'cedar'],
  ['/pricing', 'pricing'],
  ['/methodology', 'methodology'],
  ['/glossary', 'glossary'],
  ['/naics', 'naics'],
  ['/signup', 'signup'],
  ['/login', 'login'],
  ['/choose-plan', 'choose-plan'],
  ['/welcome', 'welcome'],
  ['/accessibility', 'accessibility'],
  ['/ai-and-data-use', 'ai-and-data-use'],
  ['/security', 'security'],
  ['/terms', 'terms'],
  ['/privacy', 'privacy'],
  ['/404', '404'],
];

for (const { name: surface, c } of surfaces) {
  for (const [url, slug] of PAGES) {
    await shot(c, url, `${slug}--${surface}`);
  }
}

// ---- Signup arrival from each real pricing tier ----
const desktopLight = surfaces[0].c;
for (const tier of ['sprout', 'sapling', 'tree', 'free']) {
  await shot(desktopLight, `/signup?tier=${tier}`, `signup-tier-${tier}--desktop-light`, {
    wait: 500,
    full: false,
  });
}

// ---- Interactive states worth pinning ----
// Pricing FAQ: first disclosure open.
await shot(desktopLight, '/pricing', 'pricing-faq-open--desktop-light', {
  before: async (page) => {
    const opened = await page.evaluate(() => {
      const d = document.querySelector('.pr-faq details.pr-more--faq');
      if (d) d.open = true;
      return Boolean(d);
    });
    if (!opened) {
      throw new Error(
        'pricing FAQ disclosure (.pr-faq details.pr-more--faq) not found; the open-state shot would capture the closed default',
      );
    }
    await page.waitForTimeout(300);
  },
  wait: 0,
});

// Cedar appears only after the opening composition and intentionally moves
// away from dense controls. Capture a real, unobstructed viewport at #why,
// then pin both its closed and open states.
async function showCedarFab(page) {
  const why = page.locator('#why');
  await why.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const fab = page.locator('.cedar-fab');
  await fab.waitFor({ state: 'visible', timeout: 5_000 });
  return fab;
}

for (const { name: surface, c } of [surfaces[0], surfaces[1], surfaces[6]]) {
  await shot(c, '/', `cedar-fab--${surface}`, {
    full: false,
    before: showCedarFab,
    wait: 150,
  });
}

// Cedar chat open: the docked panel has its own surface styles and a
// disclaimer line that must hold on desktop, dark, and phone layouts.
for (const { name: surface, c } of [surfaces[0], surfaces[1], surfaces[6]]) {
  await shot(c, '/', `cedar-chat-open--${surface}`, {
    full: false,
    before: async (page) => {
      const fab = await showCedarFab(page);
      await fab.click();
      const panel = page.locator('#cedarFabPanel');
      await panel.waitFor({ state: 'visible', timeout: 5_000 });
      if ((await panel.getAttribute('aria-hidden')) !== 'false') {
        throw new Error('Cedar panel did not enter its open state');
      }
    },
    wait: 550,
  });
}

for (const { c } of surfaces) await c.close();
await browser.close();
console.log('done');
