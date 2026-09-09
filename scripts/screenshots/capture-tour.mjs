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

async function fitScrolledBoundary(
  page,
  anchorSelector,
  boundarySelector,
  { width = 1920, minHeight, maxHeight, topPadding = 24, bottomPadding = 20, label },
) {
  await page.setViewportSize({ width, height: maxHeight });
  const positionAtAnchor = async () => {
    await page.evaluate(
      ({ selector, padding }) => {
        const anchor = document.querySelector(selector);
        if (!anchor) return;
        const top = anchor.getBoundingClientRect().top + window.scrollY - padding;
        window.scrollTo({ top, behavior: 'instant' });
      },
      { selector: anchorSelector, padding: topPadding },
    );
    await page.waitForTimeout(100);
  };
  await positionAtAnchor();
  const box = await page.locator(boundarySelector).first().boundingBox();
  if (!box) throw new Error(`capture-tour: could not find ${label}`);
  const height = Math.max(minHeight, Math.ceil(box.y + box.height + bottomPadding));
  if (height > maxHeight) {
    throw new Error(`capture-tour: ${label} needs ${height}px, above ${maxHeight}px limit`);
  }
  await page.setViewportSize({ width, height });
  await positionAtAnchor();
  const fitted = await page.locator(boundarySelector).first().boundingBox();
  if (!fitted || fitted.y + fitted.height > height + 1) {
    throw new Error(`capture-tour: ${label} does not end inside the capture frame`);
  }
  return height;
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

  // Each marketing frame stops on a complete product boundary. Trace ends just
  // after its lineage panel; the board and comparison use a taller frame so a
  // project card or the comparison controls are not sliced by the viewport.
  const traceCtx = await makeContext(1920, 1120, 2);
  const boardCtx = await makeContext(1920, 1200, 2);
  const cmpCtx = await makeContext(1600, 1000, 2.4);

  // ---- trace: the lineage panel open on economic output -------------------
  const trace = await traceCtx.newPage();
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
  // Include the complete results header, not just its headline, and stop after
  // the full lineage panel. Measuring both boundaries prevents a clipped
  // eyebrow at the top or the next card appearing at the bottom.
  const traceHeight = await fitScrolledBoundary(trace, '.reshead', '.lineage', {
    minHeight: 1020,
    maxHeight: 1120,
    label: 'results header and lineage panel',
  });
  await trace.waitForTimeout(500);
  await trace.screenshot({ path: `${OUT}/trace${suffix}.png` });
  await trace.close();

  // ---- dashboard: the Workspace board -------------------------------------
  const board = await boardCtx.newPage();
  await board.goto(`${APP}/app`, { waitUntil: 'networkidle' });
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

  await traceCtx.close();
  await boardCtx.close();
  await cmpCtx.close();
  console.log(`tour${suffix}: trace ${traceHeight}px, dashboard, compare`);
}
await browser.close();
console.log('tour capture done');
