import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE   = process.env.SHOT_BASE || 'http://127.0.0.1:4327';
const OUT    = process.env.SHOT_OUT  || '/tmp/shots5';

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

// Pre-set consent to "denied" via init script using the CORRECT key
// (lumecon:consent:analytics) so the banner doesn't cover the picker.
async function ctx(width, height) {
  const c = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await c.addInitScript(() => {
    try { localStorage.setItem('lumecon:consent:analytics', 'denied'); } catch {}
  });
  return c;
}

const desktop = await ctx(1440, 900);
const tablet  = await ctx(900, 1100);
const phone   = await ctx(390, 844);

async function shot(c, url, name, opts = {}) {
  const page = await c.newPage();
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (opts.before) await opts.before(page);
  await page.waitForTimeout(opts.wait ?? 800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? false });
  await page.close();
  console.log('shot', name);
}

await shot(desktop, '/pricing', '01-picker-4up-desktop',   { wait: 700 });
await shot(tablet,  '/pricing', '02-picker-2up-tablet',    { wait: 700 });
await shot(phone,   '/pricing', '03-picker-1up-mobile',    { wait: 700 });

// Local picked at desktop — show full flow with new Cedar copy
await shot(desktop, '/pricing', '04-local-full-desktop', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1800);
  },
  wait: 0,
});

// Consultant picked — verify Cedar Grove now explicitly excluded
await shot(desktop, '/pricing', '05-consultant-full', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="consultant-economic-impact"]');
    await page.waitForTimeout(1500);
  },
  wait: 0,
});

// Comparison table — verify the new Cedar/Cedar Grove plain-English rows
await shot(desktop, '/pricing', '06-comparison-table', {
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

await browser.close();
console.log('done');
