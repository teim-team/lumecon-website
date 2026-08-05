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
//
// Every frame lands as 3840x2160 raw, which optimize-examples.mjs emits at
// 1920x1080 and the <img width/height> attributes on the site declare. It used
// to be 1600x1000, a 16:10 frame that matched neither.
//
// The comparison page uses a smaller viewport at a higher device scale factor
// to get there. It is a short page: at 1920x1080 its content ends at 847px and
// the bottom fifth of the frame is blank. 1600x900 puts the same content at 93%
// of the frame height for the same output pixels.
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

  // Both contexts render the same mocked app; they differ only in how much page
  // fits the frame. See the header comment.
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
  const ctx = await makeContext(1920, 1080, 2);
  const cmpCtx = await makeContext(1600, 900, 2.4);

  for (const t of CAPTURE_TARGETS) {
    // Results and map share one visit to the current analysis (run B).
    const page = await ctx.newPage();
    await page.goto(`${APP}/app/projects/${t.b.projectId}/runs/${t.b.runId}/results`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(2600);
    await settleFonts(page);
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
      // Anchor on the .restop row (the geography card and the export panel),
      // not on the map SVG with a 40px lead-in. That lead-in used to sit on
      // empty page; now that the map card is compact it catches the bottom
      // edge of the KPI cards, so the frame opens on a row of sliced cards.
      // 18px is the row's own top margin: white above it, nothing cut.
      const row = document.querySelector('.restop');
      const anchor =
        row ||
        [...document.querySelectorAll('svg')].reduce(
          (best, svg) =>
            !best || svg.querySelectorAll('path').length > best.querySelectorAll('path').length
              ? svg
              : best,
          null,
        );
      if (anchor) {
        const r = anchor.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.scrollY - 18, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/ex-${t.id}-map${suffix}.png` });
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
    console.log(`ex-${t.id}${suffix}: results, map, compare`);
  }
  await ctx.close();
  await cmpCtx.close();
}
await browser.close();
console.log('example captures done');
