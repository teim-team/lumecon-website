/**
 * /pricing visual-verification screenshot script.
 *
 * Captures the 4-tier pricing flow end-to-end so changes to the
 * picker, tier cards, comparison table, Toolbox add-on, and the
 * Arborist consultant card can be eyeballed without launching a
 * browser by hand. Used during the price-cuts + animated-icons +
 * comparison-table-precision pass; rerun anytime the pricing page
 * gets touched.
 *
 * Usage:
 *   1. Start the preview server:  npx astro preview --port 4324
 *   2. In another shell:          node scripts/screenshot.mjs
 *   3. Screenshots land in:       $SHOT_OUT (default /tmp/lumecon-shots)
 *
 * Env vars:
 *   SHOT_BASE      URL of the running preview (default http://127.0.0.1:4324)
 *   SHOT_OUT       Output directory (default /tmp/lumecon-shots)
 *   CHROME_BIN     Optional explicit Chromium binary. Useful in
 *                  sandboxed environments where Playwright's CDN is
 *                  blocked but a system Chromium is already on disk
 *                  (e.g. /opt/pw-browsers/chromium-XXXX/chrome-linux/chrome).
 *                  If unset, Playwright uses its own bundled browser.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4324';
const OUT  = process.env.SHOT_OUT  || '/tmp/lumecon-shots';
const CHROME_BIN = process.env.CHROME_BIN || '';

await mkdir(OUT, { recursive: true });

const launchOpts = { args: ['--no-sandbox'] };
if (CHROME_BIN) launchOpts.executablePath = CHROME_BIN;
const browser = await chromium.launch(launchOpts);
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const phone   = await browser.newContext({ viewport: { width: 390,  height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function shot(ctx, url, name, opts = {}) {
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('lumecon.consent', 'denied'); } catch {}
  });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (opts.before) await opts.before(page);
  await page.waitForTimeout(opts.wait ?? 800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? false });
  await page.close();
  console.log('shot', name);
}

// 1. Nav with Pricing
const navPage = await desktop.newPage();
await navPage.addInitScript(() => { try { localStorage.setItem('lumecon.consent', 'denied'); } catch {} });
await navPage.goto(BASE + '/', { waitUntil: 'networkidle' });
await navPage.waitForTimeout(500);
await navPage.locator('#nav').screenshot({ path: `${OUT}/01-nav.png` });
await navPage.close();
console.log('shot 01-nav');

// 2. Pricing — initial state (grouped picker)
await shot(desktop, '/pricing', '02-picker-grouped', { wait: 800 });

// 3. Pricing — Local picked, full page (verify Sprout $7.5K + Toolbox + new comparison)
await shot(desktop, '/pricing', '03-local-picked-full', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1800);
  },
  wait: 0,
});

// 4. Pricing — Local picked, viewport snap to comparison table area
await shot(desktop, '/pricing', '04-local-comparison-table', {
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const el = document.querySelector('.pricing-compare');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
  },
  wait: 0,
});

// 5. Pricing — Tribal picked, just the tier row (verify Sprout $10K)
await shot(desktop, '/pricing', '05-tribal-tiers', {
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="tribal-economic-impact"]');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const el = document.querySelector('.pricing-tier-grid');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
  },
  wait: 0,
});

// 6. Pricing — Consultant picked. Must show ONLY the Arborist card, NOT
// the regional grid. NOT the Toolbox. NOT the comparison table.
await shot(desktop, '/pricing', '06-consultant-isolated', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="consultant-economic-impact"]');
    await page.waitForTimeout(1800);
  },
  wait: 0,
});

// 7. Pricing — Consultant, Arborist card close up
await shot(desktop, '/pricing', '07-arborist-card', {
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="consultant-economic-impact"]');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const el = document.querySelector('[data-tier-grid="consultant"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(300);
  },
  wait: 0,
});

// 8. Pricing — Local picked, Toolbox card in view
await shot(desktop, '/pricing', '08-toolbox-card', {
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const el = document.querySelector('.pricing-addon');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(300);
  },
  wait: 0,
});

// 9. Mobile pricing full page
await shot(phone, '/pricing', '09-mobile-local', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1500);
  },
  wait: 0,
});

await browser.close();
console.log('done');
