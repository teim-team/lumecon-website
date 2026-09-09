// Capture the homepage example library from the running product:
// 10 examples x 3 archetypes (results, map, comparison) x 2 themes,
// at marketing-safe frames that end on complete interface modules.
//
// Usage:
//   1. Run the app dev server (teim-app): npm run dev  (port 5173)
//   2. node scripts/screenshots/capture-examples.mjs
//   3. node scripts/screenshots/optimize-examples.mjs
//
// The app's API is fully mocked from examples-data.mjs, so no backend or
// database is needed; the module refuses to load if the fictional numbers
// stop cross-footing. Set PW_CHROMIUM to your Chromium binary if Playwright's
// default download is unavailable.
//
// Results and map captures measure their final interface boundary in the DOM,
// so a longer headline or a different geography can never leave half a card in
// frame. Comparisons use a smaller 16:10 viewport at a higher scale factor so
// their controls remain in frame without shrinking the type.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { USER, PROJECTS, RUNS, RESULTS, CAPTURE_TARGETS } from './examples-data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw');
mkdirSync(OUT, { recursive: true });
const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const json = (body) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});
const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);

// Inter and JetBrains Mono decide the width of a `ch`, and several layouts
// size on `ch` (the results headline is capped at 44ch). Capturing before the
// faces land measures those caps against the fallback metrics, which moves the
// headline wrap and can push the export button onto its own row. Two captures
// of the same page then differ for no reason visible in the diff.
async function settleFonts(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

async function stripChrome(page) {
  await page.evaluate(() => {
    // The floating Cedar launcher does not belong in marketing frames.
    for (const el of document.querySelectorAll('body *')) {
      if (/ask cedar/i.test(el.textContent || '') && el.children.length <= 3) {
        let node = el;
        for (let i = 0; i < 10 && node.parentElement; i++) {
          const cs = getComputedStyle(node);
          if (cs.position === 'fixed') {
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

async function fitTopBoundary(
  page,
  selector,
  { width = 1920, minHeight, maxHeight, padding = 24, label },
) {
  await page.setViewportSize({ width, height: maxHeight });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(100);
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`capture-examples: could not find ${label}`);
  const height = Math.max(minHeight, Math.ceil(box.y + box.height + padding));
  if (height > maxHeight) {
    throw new Error(`capture-examples: ${label} needs ${height}px, above ${maxHeight}px limit`);
  }
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(100);
  const fitted = await page.locator(selector).first().boundingBox();
  if (!fitted || fitted.y + fitted.height > height + 1) {
    throw new Error(`capture-examples: ${label} does not end inside the capture frame`);
  }
  return height;
}

async function fitScrolledBoundary(
  page,
  anchorSelector,
  boundarySelector,
  { width = 1920, minHeight, maxHeight, topPadding = 18, bottomPadding = 24, label },
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
  if (!box) throw new Error(`capture-examples: could not find ${label}`);
  const height = Math.max(minHeight, Math.ceil(box.y + box.height + bottomPadding));
  if (height > maxHeight) {
    throw new Error(`capture-examples: ${label} needs ${height}px, above ${maxHeight}px limit`);
  }
  await page.setViewportSize({ width, height });
  await positionAtAnchor();
  const fitted = await page.locator(boundarySelector).first().boundingBox();
  if (!fitted || fitted.y + fitted.height > height + 1) {
    throw new Error(`capture-examples: ${label} does not end inside the capture frame`);
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

  // The contexts render the same mocked app; they differ only in how much page
  // fits each purpose-built frame. See the header comment.
  const makeContext = async (width, height, scale) => {
    const c = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: scale,
      colorScheme: theme,
    });
    // ResultDetail and Workspace are wrapped in ProtectedSurface, which stamps a
    // tiled identity watermark and a "Watermarked, access is recorded" flag over
    // the content. That is correct for a real session and must never reach public
    // marketing imagery, so the capture harness declares itself. Without this the
    // captures carry a fake user's address tiled across the screenshot.
    await c.addInitScript(() => {
      window.__LUMECON_CAPTURE__ = true;
    });
    await c.route('**/*', mockApi);
    return c;
  };
  const resultsCtx = await makeContext(1920, 1400, 2);
  const mapCtx = await makeContext(1920, 1080, 2);
  const cmpCtx = await makeContext(1600, 1000, 2.4);

  for (const t of CAPTURE_TARGETS) {
    // Results and map use separate visits to the current analysis (run B),
    // because each frame has its own measured content boundary.
    const page = await resultsCtx.newPage();
    await page.goto(`${APP}/app/projects/${t.b.projectId}/runs/${t.b.runId}/results`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(2600);
    await settleFonts(page);
    await stripChrome(page);
    const resultsHeight = await fitTopBoundary(page, '.restop', {
      minHeight: 1120,
      maxHeight: 1400,
      label: `${t.id} results geography row`,
    });
    await page.screenshot({ path: `${OUT}/ex-${t.id}-results${suffix}.png` });

    // Use a fresh 16:9 page for the geography crop. Reusing the taller results
    // page made every map asset inherit the results frame even though the map
    // is explicitly positioned at the top of its own capture.
    const mapPage = await mapCtx.newPage();
    await mapPage.goto(`${APP}/app/projects/${t.b.projectId}/runs/${t.b.runId}/results`, {
      waitUntil: 'networkidle',
    });
    await mapPage.waitForTimeout(2600);
    await settleFonts(mapPage);
    await stripChrome(mapPage);

    // Map crop: the geography leads the frame. No repeated KPI row (the
    // results frame already owns it); the map panel sits at the top with
    // the breakdown below. Tribal examples switch to the Homelands scope
    // first, so the map zooms to the reservation and its overlapping
    // counties: across the set the visitor sees eight different statewide
    // county maps, a multi-county reservation (Warm Springs) and a
    // single-county homeland (Tulalip), not ten copies of one map.
    if (t.example.reservationShare) {
      await mapPage.locator('button:has-text("Homelands")').first().click();
      await mapPage.waitForTimeout(1800);
    }
    // End after the result-navigation row. That shows the complete geography
    // and export surface without slicing into the operations table below it.
    const mapHeight = await fitScrolledBoundary(mapPage, '.restop', '.rsec-nav', {
      minHeight: 720,
      maxHeight: 1000,
      label: `${t.id} map and result navigation`,
    });
    await mapPage.waitForTimeout(700);
    await mapPage.screenshot({ path: `${OUT}/ex-${t.id}-map${suffix}.png` });
    await mapPage.close();
    await page.close();

    // Comparison: the earlier analysis against the current one. The
    // pick-different-studies row stays in frame. It used to be stripped as
    // navigation chrome, but the comparison table is short and stripping it
    // left the bottom fifth of the frame blank; with the row, and at the
    // smaller viewport this context uses, the content reaches the edge.
    const cmp = await cmpCtx.newPage();
    await cmp.goto(
      `${APP}/app/analyses/compare?a=${t.a.projectId}:${t.a.runId}&b=${t.b.projectId}:${t.b.runId}`,
      { waitUntil: 'networkidle' },
    );
    await cmp.waitForTimeout(2600);
    await settleFonts(cmp);
    await stripChrome(cmp);
    await cmp.waitForTimeout(250);
    await cmp.screenshot({ path: `${OUT}/ex-${t.id}-compare${suffix}.png` });
    await cmp.close();
    console.log(`ex-${t.id}${suffix}: results ${resultsHeight}px, map ${mapHeight}px, compare`);
  }
  await resultsCtx.close();
  await mapCtx.close();
  await cmpCtx.close();
}
await browser.close();
console.log('example captures done');
