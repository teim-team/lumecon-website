// Capture the Workspace board (dashboard) marketing frame from the running
// product, light and dark, using the same fully mocked example library as
// capture-examples.mjs. Recapture whenever the sector photo set changes so
// the homepage tour shows the current card imagery (including per-sector
// photo variety, sectorArt.js in teim-app).
//
// Usage:
//   1. Run the app dev server (teim-app): npm run dev  (port 5173)
//   2. node scripts/screenshots/capture-board.mjs
//   3. node scripts/screenshots/optimize-board.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { USER, PROJECTS, RUNS, RESULTS } from './examples-data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-board');
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
  // 1600x900 at dsf 2 -> 3200x1800 raw; the optimizer emits 1920x1080,
  // matching the rest of the /app screenshot series.
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  await ctx.addInitScript(() => {
    window.__LUMECON_CAPTURE__ = true;
  });
  await ctx.route('**/*', async (route) => {
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
  });

  const page = await ctx.newPage();
  await page.goto(`${APP}/app`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  await stripChrome(page);
  await page.screenshot({ path: `${OUT}/dashboard${suffix}.png` });
  await page.close();
  await ctx.close();
  console.log(`dashboard${suffix}.png`);
}

await browser.close();
