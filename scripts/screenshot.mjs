/**
 * Full-site visual sweep: every public page at desktop (1440) and
 * phone (390) widths, in both light and dark color schemes, plus the
 * signup page arriving from each real pricing tier. The output grid is
 * the review surface for theme and responsive regressions — dark mode
 * renders from the same stylesheets via prefers-color-scheme, so a
 * hardcoded light-only color shows up here before a visitor sees it.
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

const surfaces = [
  { name: 'desktop-light', c: await ctx(1440, 900, 'light') },
  { name: 'desktop-dark', c: await ctx(1440, 900, 'dark') },
  { name: 'phone-light', c: await ctx(390, 844, 'light', true) },
  { name: 'phone-dark', c: await ctx(390, 844, 'dark', true) },
];

async function shot(c, url, name, opts = {}) {
  const page = await c.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (opts.before) await opts.before(page);
  await page.waitForTimeout(opts.wait ?? 800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? true });
  await page.close();
  console.log('shot', name);
}

// Every public page. /film is unlisted but still shippable; /naics is
// deliberately unlisted in nav but indexed, so both stay in the sweep.
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
  ['/terms', 'terms'],
  ['/privacy', 'privacy'],
  ['/404', '404'],
  ['/film', 'film'],
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
    await page.evaluate(() => {
      const d = document.querySelector('.pricing-faq details, [data-pricing-faq] details');
      if (d) d.open = true;
    });
    await page.waitForTimeout(300);
  },
  wait: 0,
});

// Cedar chat open, both themes: the docked panel has its own surface
// styles and a disclaimer line that must hold on dark grounds too.
for (const { name: surface, c } of [surfaces[0], surfaces[1]]) {
  await shot(c, '/', `cedar-chat-open--${surface}`, {
    full: false,
    before: async (page) => {
      const fab = page.locator('[data-cedar-fab], .cedar-fab');
      if (await fab.count()) {
        await fab.first().click();
        await page.waitForTimeout(600);
      }
    },
    wait: 0,
  });
}

for (const { c } of surfaces) await c.close();
await browser.close();
console.log('done');
