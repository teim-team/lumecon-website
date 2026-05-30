/**
 * Thorough visual + clickability check across desktop, tablet, and
 * mobile viewports. Captures the pricing page in every meaningful
 * state, plus signup arriving from each tier/plan handoff, and runs
 * basic click validation on every interactive surface so we catch
 * "this thing doesn't fire" before the visitor does.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE   = process.env.SHOT_BASE  || 'http://127.0.0.1:4328';
const OUT    = process.env.SHOT_OUT   || '/tmp/shots6';

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function ctx(width, height, isMobile = false) {
  const c = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: isMobile ? 2 : 1,
    isMobile, hasTouch: isMobile,
  });
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

// ---- Pricing visual states across viewports ----
await shot(desktop, '/pricing', '01-picker-desktop',  { wait: 600 });
await shot(tablet,  '/pricing', '02-picker-tablet',   { wait: 600 });
await shot(phone,   '/pricing', '03-picker-phone',    { wait: 600, full: true });

// Local picked, full page (verify section deck mentions unlimited
// use + quarterly refresh, comparison table is tightened)
await shot(desktop, '/pricing', '04-local-desktop-full', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1800);
  },
  wait: 0,
});

// Tribal picked, just the comparison table
await shot(desktop, '/pricing', '05-tribal-compare', {
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="tribal-economic-impact"]');
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const el = document.querySelector('.pricing-compare');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(300);
  },
  wait: 0,
});

// Consultant picked, full page (verify project-based prose)
await shot(desktop, '/pricing', '06-consultant-desktop-full', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="consultant-economic-impact"]');
    await page.waitForTimeout(1500);
  },
  wait: 0,
});

// Mobile, Local picked, full scroll
await shot(phone, '/pricing', '07-local-phone-full', {
  full: true,
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1500);
  },
  wait: 0,
});

// Tree tier card up close on desktop (verify the new admin data benefit copy)
await shot(desktop, '/pricing', '08-tree-card-zoom', {
  before: async (page) => {
    await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const el = document.querySelector('.pricing-tier-card--featured');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(300);
    // Expand the Tree details so the new admin data feature copy is visible
    await page.evaluate(() => {
      const featured = document.querySelector('.pricing-tier-card--featured');
      const details = featured?.querySelector('details');
      if (details) details.open = true;
    });
    await page.waitForTimeout(200);
  },
  wait: 0,
});

// ---- Signup arrival flows ----
await shot(desktop, '/signup?tier=starter&platform=local', '09-signup-local-sprout', { wait: 500 });
await shot(desktop, '/signup?tier=arborist&platform=consultant', '10-signup-arborist', { wait: 500 });
await shot(phone,   '/signup?tier=standard&platform=tribal', '11-signup-mobile-sapling', { wait: 500 });

// ---- Clickability tests ----
async function clickabilityProbe(c, viewport) {
  const page = await c.newPage();
  await page.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Each of the 4 tiles should fire and bring up the right tier grid
  const tiles = ['local-economic-impact', 'tribal-economic-impact', 'consultant-economic-impact'];
  for (const id of tiles) {
    await page.click(`.pricing-platform-tile[data-platform-id="${id}"]`);
    await page.waitForTimeout(900);
    const visible = await page.evaluate(() => {
      const section = document.querySelector('[data-platform-section]');
      return section && !section.hidden;
    });
    if (!visible) throw new Error(`Tile ${id} did not reveal the tier section on ${viewport}`);
    // Click again to deselect
    await page.click(`.pricing-platform-tile[data-platform-id="${id}"]`);
    await page.waitForTimeout(500);
    const hidden = await page.evaluate(() => {
      const section = document.querySelector('[data-platform-section]');
      return section && section.hidden;
    });
    if (!hidden) throw new Error(`Tile ${id} did not hide on re-click (${viewport})`);
  }

  // 2. Pick Local, confirm the Toolbox aside is visible
  await page.click('.pricing-platform-tile[data-platform-id="local-economic-impact"]');
  await page.waitForTimeout(800);
  const toolboxVisible = await page.evaluate(() => {
    const t = document.querySelector('[data-addon="toolbox"]');
    return t && !t.hidden;
  });
  if (!toolboxVisible) throw new Error(`Toolbox aside did not appear after Local pick (${viewport})`);

  // 3. Pick Consultant, confirm Toolbox is hidden, regional grid hidden
  await page.click('.pricing-platform-tile[data-platform-id="consultant-economic-impact"]');
  await page.waitForTimeout(800);
  const consultantState = await page.evaluate(() => {
    const tb = document.querySelector('[data-addon="toolbox"]');
    const regional = document.querySelector('[data-tier-grid="regional"]');
    const consultant = document.querySelector('[data-tier-grid="consultant"]');
    return {
      toolboxHidden: tb && tb.hidden,
      regionalHidden: regional && regional.hidden,
      consultantVisible: consultant && !consultant.hidden,
    };
  });
  if (!consultantState.toolboxHidden) throw new Error(`Toolbox visible on Consultant pick (${viewport})`);
  if (!consultantState.regionalHidden) throw new Error(`Regional grid visible on Consultant pick (${viewport})`);
  if (!consultantState.consultantVisible) throw new Error(`Consultant grid hidden on Consultant pick (${viewport})`);

  await page.close();
  console.log('clickability OK:', viewport);
}

await clickabilityProbe(desktop, 'desktop 1440');
await clickabilityProbe(tablet,  'tablet 900');
await clickabilityProbe(phone,   'phone 390');

await browser.close();
console.log('done');
