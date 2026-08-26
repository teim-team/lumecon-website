// Capture the three frames the homepage ProductTour serves:
//
//   trace.webp      a results page with the lineage panel open on a figure
//   compare.webp    two analyses side by side
//   dashboard.webp  the Workspace board
//
// These three had drifted badly. dashboard.webp had capture-board.mjs;
// trace.webp and compare.webp had no script at all, so every recapture of the
// example library left them behind and they still showed a layout the app had
// moved on from months earlier. One script owns the tour row now, so they
// cannot drift apart again. (capture-board.mjs is gone; this replaces it.)
//
// Usage:
//   1. Run the app dev server (teim-app): npm run dev  (port 5173)
//   2. node scripts/screenshots/capture-tour.mjs
//   3. node scripts/screenshots/optimize-tour.mjs
//
// The API is mocked from examples-data.mjs exactly as capture-examples.mjs does
// it, so no backend or database is needed.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { USER, PROJECTS, RUNS, RESULTS, CAPTURE_TARGETS } from './examples-data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-tour');
mkdirSync(OUT, { recursive: true });
const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const json = (body) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

// The nation example: a multi-year, multi-scope analysis, so the lineage panel
// and the comparison both have something worth showing.
const TARGET = CAPTURE_TARGETS.find((t) => t.id === 'nation');
if (!TARGET) throw new Error('capture-tour: the nation example is missing');

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);

// See capture-examples.mjs: layouts that size on `ch` measure against fallback
// metrics until the real faces land, so two runs of the same page can differ.
async function settleFonts(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

// Two floating things that do not belong in a marketing frame: the Cedar
// launcher, and the "pick up where you left off" resume card, which is a
// session prompt rather than product and lands on top of the board's cards.
async function stripChrome(page) {
  await page.evaluate(() => {
    document.querySelector('.rd-continue-card')?.closest('[class]')?.remove();
    for (const el of document.querySelectorAll('body *')) {
      if (/ask cedar/i.test(el.textContent || '') && el.children.length <= 3) {
        let node = el;
        for (let i = 0; i < 10 && node.parentElement; i++) {
          if (getComputedStyle(node).position === 'fixed') {
            node.remove();
            return;
          }
          node = node.parentElement;
        }
      }
    }
  });
  await page.waitForTimeout(250);
}

for (const theme of ['light', 'dark']) {
  const suffix = theme === 'dark' ? '-dark' : '';

  const mockApi = async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    if (p === '/me') return route.fulfill(json(USER));
    if (p === '/events') return route.fulfill(json({}));
    if (p === '/projects')
      return route.fulfill(json(url.searchParams.get('archived') === 'archived' ? [] : PROJECTS));
    if (p === '/project-drafts') return route.fulfill(json([]));
    let m = p.match(/^\/projects\/([^/]+)\/runs\/([^/]+)\/results$/);
    if (m) return route.fulfill(json(RESULTS[m[2]]));
    m = p.match(/^\/projects\/([^/]+)\/runs\/([^/]+)$/);
    if (m) return route.fulfill(json(RUNS[m[2]]));
    m = p.match(/^\/projects\/([^/]+)\/cedar\/messages/);
    if (m) return route.fulfill(json({ messages: [], threadId: null }));
    m = p.match(/^\/projects\/([^/]+)$/);
    if (m) {
      const proj = PROJECTS.find((x) => x.id === m[1]);
      return route.fulfill(
        proj ? json(proj) : { status: 404, contentType: 'application/json', body: '{}' },
      );
    }
    return route.continue();
  };

  const makeContext = async (width, height, scale) => {
    const c = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: scale,
      colorScheme: theme,
    });
    // Turns off the ProtectedSurface identity watermark. See capture-cedar.mjs.
    await c.addInitScript(() => {
      window.__LUMECON_CAPTURE__ = true;
    });
    await c.route('**/*', mockApi);
    return c;
  };

  // Every frame lands as 3840x2160 raw and 1920x1080 optimized. The comparison
  // page is short, so it reaches that from a smaller viewport at a higher scale
  // factor rather than leaving the bottom of the frame blank.
  const ctx = await makeContext(1920, 1080, 2);
  const cmpCtx = await makeContext(1600, 900, 2.4);

  // ---- trace: the lineage panel open on economic output -------------------
  const trace = await ctx.newPage();
  await trace.goto(`${APP}/app/projects/${TARGET.b.projectId}/runs/${TARGET.b.runId}/results`, {
    waitUntil: 'networkidle',
  });
  await trace.waitForTimeout(2600);
  await settleFonts(trace);
  await stripChrome(trace);
  // Open the lineage on the last metric card (economic output), which is the
  // largest figure and so the one whose breakdown reads best at a glance.
  const opened = await trace.evaluate(() => {
    const buttons = [...document.querySelectorAll('.metric__trace')];
    const last = buttons[buttons.length - 1];
    if (!last) return false;
    last.click();
    return true;
  });
  if (!opened) throw new Error('capture-tour: no .metric__trace control on the results page');
  await trace.waitForTimeout(1200);
  // Frame on the headline so the lineage panel sits in the lower half with the
  // figure it explains above it; the panel alone reads as a table with no
  // subject.
  await trace.evaluate(() => {
    const h1 = document.querySelector('.reshead h1');
    if (h1) window.scrollTo({ top: h1.getBoundingClientRect().top + window.scrollY - 24 });
  });
  await trace.waitForTimeout(500);
  await trace.screenshot({ path: `${OUT}/trace${suffix}.png` });
  await trace.close();

  // ---- dashboard: the Workspace board -------------------------------------
  const board = await ctx.newPage();
  await board.goto(`${APP}/app`, { waitUntil: 'networkidle' });
  // The trace capture above ran in this same context, so the app remembers a
  // results page and offers "pick up where you left off" over the board.
  // Clear the remembered place and reload, or the marketing shot ships a
  // resume toast covering a card.
  await board.evaluate(() => localStorage.removeItem('teim:last-location'));
  await board.reload({ waitUntil: 'networkidle' });
  await board.waitForTimeout(2600);
  await settleFonts(board);
  await stripChrome(board);
  await board.screenshot({ path: `${OUT}/dashboard${suffix}.png` });
  await board.close();

  // ---- compare: the earlier analysis against the current one --------------
  const cmp = await cmpCtx.newPage();
  await cmp.goto(
    `${APP}/app/analyses/compare?a=${TARGET.a.projectId}:${TARGET.a.runId}&b=${TARGET.b.projectId}:${TARGET.b.runId}`,
    { waitUntil: 'networkidle' },
  );
  await cmp.waitForTimeout(2600);
  await settleFonts(cmp);
  await stripChrome(cmp);
  await cmp.screenshot({ path: `${OUT}/compare${suffix}.png` });
  await cmp.close();

  await ctx.close();
  await cmpCtx.close();
  console.log(`tour${suffix}: trace, dashboard, compare`);
}
await browser.close();
console.log('tour capture done');
