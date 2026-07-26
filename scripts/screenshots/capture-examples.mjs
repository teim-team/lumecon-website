// Capture the homepage example library from the running product:
// 10 examples x 3 archetypes (results, map, comparison) x 2 themes,
// all at the same 1600x1000 frame.
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

for (const theme of ['light', 'dark']) {
  const suffix = theme === 'dark' ? '-dark' : '';
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  await ctx.route('**/*', async (route) => {
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
  });

  for (const t of CAPTURE_TARGETS) {
    // Results and map share one visit to the current analysis (run B).
    const page = await ctx.newPage();
    await page.goto(`${APP}/app/projects/${t.b.projectId}/runs/${t.b.runId}/results`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(2600);
    await stripChrome(page);
    await page.screenshot({ path: `${OUT}/ex-${t.id}-results${suffix}.png` });

    // Map crop: the geography leads the frame. No repeated KPI row (the
    // results frame already owns it); the map panel sits at the top with
    // the breakdown below. Tribal examples switch to the Homelands scope
    // first, so the map zooms to the reservation and its overlapping
    // counties: across the set the visitor sees eight different statewide
    // county maps, a multi-county reservation (Warm Springs) and a
    // single-county homeland (Tulalip), not ten copies of one map.
    if (t.example.reservationShare) {
      await page.locator('button:has-text("Homelands")').first().click();
      await page.waitForTimeout(1800);
    }
    await page.evaluate(() => {
      let best = null;
      for (const svg of document.querySelectorAll('svg')) {
        const n = svg.querySelectorAll('path').length;
        if (!best || n > best.n) best = { n, svg };
      }
      if (best) {
        const r = best.svg.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.scrollY - 40, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/ex-${t.id}-map${suffix}.png` });
    await page.close();

    // Comparison: the earlier analysis against the current one. The
    // pick-different-studies row is navigation chrome; without it the
    // bottom edge falls on whitespace instead of sliced buttons.
    const cmp = await ctx.newPage();
    await cmp.goto(
      `${APP}/app/analyses/compare?a=${t.a.projectId}:${t.a.runId}&b=${t.b.projectId}:${t.b.runId}`,
      { waitUntil: 'networkidle' },
    );
    await cmp.waitForTimeout(2600);
    await stripChrome(cmp);
    await cmp.evaluate(() => {
      document.querySelector('.compare__actions')?.remove();
    });
    await cmp.waitForTimeout(250);
    await cmp.screenshot({ path: `${OUT}/ex-${t.id}-compare${suffix}.png` });
    await cmp.close();
    console.log(`ex-${t.id}${suffix}: results, map, compare`);
  }
  await ctx.close();
}
await browser.close();
console.log('example captures done');
