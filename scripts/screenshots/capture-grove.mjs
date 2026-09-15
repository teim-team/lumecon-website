// Capture the five Cedar Grove surfaces from the running product, for the
// Cedar Grove page.
//
// WHY THIS EXISTS
// The Cedar Grove page used to show the product by rebuilding it in Astro and
// CSS: a hero panel, a "pick a question" frame and three proof cards, each
// hand-drawn to look like Grove and each captioned ILLUSTRATIVE because the
// names and values in them were invented. Every other product page on this
// site shows real captures of the running app, and that difference showed.
// Two things go wrong with a drawn replica. It is a drawing of a promise
// rather than evidence of a product, on a page whose entire argument is that a
// number should be traceable to its source. And it drifts: Grove was rebuilt
// around a purpose carousel and five surfaces, and the replicas still showed an
// interface the product had left behind.
//
// Usage:
//   1. Run the Grove dev server (teim-app): npm run dev
//   2. node scripts/screenshots/capture-grove.mjs      (GROVE_URL to override)
//   3. node scripts/screenshots/optimize-grove.mjs
//
// The session is stubbed, exactly as capture-tour.mjs stubs it, so no backend
// or database is needed. Grove's demonstration workspace supplies the data, and
// every figure it draws already labels itself as demonstration data on the
// figure, so nothing here has to be captioned by hand.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-grove');
mkdirSync(OUT, { recursive: true });
const APP = process.env.GROVE_URL || 'http://127.0.0.1:5190';

// The demonstration workspace, as the app's own session shape.
const USER = {
  id: 'grove-demo',
  email: 'demo@lumecon.test',
  name: 'Demo',
  organization_name: 'Two Rivers Nation',
  workspace_tier: 'tree',
  email_verified: true,
  needsOnboarding: false,
  organization_type: 'tribal_government',
  workspace: { id: 'org-two-rivers', name: 'Two Rivers Nation', tier: 'tree' },
  groveOrganizationId: 'org-two-rivers',
  grove: { canOpen: true, orgInsights: true, ownsShell: true },
};

const json = (body) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

// Inter and JetBrains Mono decide the width of a `ch`, and Grove sizes several
// labels on it. Capturing before the faces land measures those against the
// fallback metrics and moves the wraps.
async function settleFonts(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
}

// The five surfaces, in the order the rail lists them, which is also the order
// the page tells the story in. `settle` is generous on Explore and Outputs:
// both draw a figure whose line animates in, and a capture taken mid-draw
// shows a trend line that stops halfway across its own axis.
// `stop` is the LAST element matching the selector, so a repeated module (the
// five shelves) frames on the end of the set rather than the end of the first.
// Each was measured in the browser rather than guessed: an absent selector
// silently falls back to the viewport and slices the figure in half, which is
// how the first run of this script cut the Explore trend line across its own
// axis.
const SURFACES = [
  { name: 'grove-home', path: '', settle: 1800, stop: '.gv-carousel__fact' },
  { name: 'grove-projects', path: '/projects', settle: 1500, stop: '.gv-covers' },
  { name: 'grove-explore', path: '/explore', settle: 2800, stop: '.gv-wb' },
  { name: 'grove-library', path: '/library', settle: 1600, stop: '.gv-shelf' },
  { name: 'grove-outputs', path: '/outputs', settle: 2800, stop: '.gv-pub' },
];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);

// Stop the frame on a complete interface module rather than wherever the
// viewport happens to fall, so no capture ends on half a card. Measured in the
// DOM, so a longer place name or a different theme cannot slice it.
async function frameHeight(page, selector) {
  const bottom = await page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)];
    if (!els.length) return null;
    const r = els[els.length - 1].getBoundingClientRect();
    return Math.ceil(r.bottom + window.scrollY);
  }, selector);
  // A missing selector is a bug in this file, not a reason to guess a height.
  // Falling back to the viewport is what produced a sliced figure, and it did
  // it silently, which is worse than stopping.
  if (bottom == null) throw new Error(`capture-grove: no ${selector} on the page`);
  return Math.min(Math.max(bottom + 48, 720), 2400);
}

for (const theme of ['light', 'dark']) {
  const suffix = theme === 'dark' ? '-dark' : '';
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1200 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  // Turns off the ProtectedSurface identity watermark, which is stamped with
  // the signed-in address and would otherwise be tiled across every frame.
  await context.addInitScript(() => {
    window.__LUMECON_CAPTURE__ = true;
  });
  const PASSTHROUGH = [
    '/account',
    '/auth',
    '/cedar',
    '/commons',
    '/events',
    '/projects',
    '/project-drafts',
    '/document-import-jobs',
  ];
  await context.route('**/*', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/me') return route.fulfill(json(USER));
    if (PASSTHROUGH.some((x) => p === x || p.startsWith(`${x}/`))) return route.fulfill(json({}));
    return route.continue();
  });

  for (const surface of SURFACES) {
    const page = await context.newPage();
    await page.goto(`${APP}/app/grove${surface.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(surface.settle);
    await settleFonts(page);
    const height = await frameHeight(page, surface.stop);
    await page.setViewportSize({ width: 1920, height });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `${surface.name}${suffix}.png`) });
    console.log(`${surface.name}${suffix}.png  ${1920}x${height}`);
    await page.close();
  }
  await context.close();
}

await browser.close();
