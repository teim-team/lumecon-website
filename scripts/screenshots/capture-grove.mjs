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

// ONE FRAME, 1920x1080.
//
// These used to be captured at whatever height the surface happened to run to,
// measured from its last module: 985, 1019, 1475, 1856, 720. Five shots at five
// aspect ratios down one marketing page, where every other product shot on this
// site is 1920x1080 (see cedar.astro, three acts, three identical frames). The
// page looked like a scrapbook, and each row's picture changed size when the
// product changed, which is a layout the page could not compose against.
//
// A fixed frame is also a test. A surface that will not fit a screen is a
// surface with more than one thing on it, and the two that did not fit were
// the two that were overloaded: Explore stacked the map above the workbench,
// so the coverage a lens changes sat a screen above the figure it changes, and
// Outputs put a second findings list and a six-column ledger under the one
// claim it exists to make. Both were fixed in the product rather than cropped
// here. If a surface stops fitting again, `assertFits` below fails the run
// rather than letting the page go back to irregular pictures.
const FRAME = { width: 1920, height: 1080 };

// The surfaces, in the order the rail lists them. `settle` is generous on
// Explore and Outputs: both draw a figure whose line animates in, and a capture
// taken mid-draw shows a trend line that stops halfway across its own axis.
const SURFACES = [
  { name: 'grove-home', path: '', settle: 1800 },
  { name: 'grove-projects', path: '/projects', settle: 1500 },
  { name: 'grove-explore', path: '/explore', settle: 2800 },
  { name: 'grove-library', path: '/library', settle: 1600 },
  { name: 'grove-outputs', path: '/outputs', settle: 2800 },
];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);

/**
 * Fail if anything the surface draws falls below the frame.
 *
 * Not `document.scrollHeight <= 1080`: the page carries about 120px of bottom
 * padding, and a real 1080px screen clips that same empty space. What must not
 * be clipped is drawn content, so this measures the lowest element that paints
 * anything and leaves a margin of air under it.
 *
 * Stopping is the point. The old script measured a height instead, so an
 * overloaded surface produced a taller picture and nobody learned anything;
 * this one says which surface stopped fitting and by how much.
 *
 * Verified by breaking it on purpose: raising the product's --gv-plot-w to
 * 1600px failed the run with "grove-outputs draws to 1080px in a 1080px frame
 * (span.gv-more__n)". Two earlier versions of this check passed everything
 * while measuring nothing, because the deepest box on every surface was the
 * page container: min-height 100vh, and in the dark theme carrying the
 * surface's own gradient. A test that cannot fail is worse than no test.
 */
const FLOOR = 24;
async function assertFits(page, name, height) {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    let lowest = 0;
    let culprit = '';
    const note = (bottom, el) => {
      if (bottom <= lowest) return;
      lowest = bottom;
      culprit = `${el.tagName.toLowerCase()}.${(el.className.baseVal ?? el.className ?? '').toString().split(' ')[0]}`;
    };
    // Ink, not boxes. The page container is min-height:100vh with about 120px
    // of bottom padding under the last thing on it, so measuring every box put
    // the floor at the container every time and said nothing about the
    // surface. What must stay above the fold is what paints: text, figures,
    // and anything drawing its own background, border or shadow.
    for (const el of main.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      // A closed <details> keeps boxes for its hidden children; they are not
      // drawn, and the disclosure's own summary already stands for them.
      if (el.closest('details:not([open])') && !el.closest('summary')) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.opacity === '0') continue;
      const bottom = r.bottom + window.scrollY;
      // Only a leaf's own paint counts, plus the replaced elements. A
      // container's background IS the ground: `.rd-page` is min-height:100vh,
      // and in the dark theme it carries the surface's gradient, so counting
      // container backgrounds put the floor at the viewport on every surface
      // and the test said nothing. A panel's frame sits within a couple of
      // dozen pixels of its last child, which is what FLOOR is for.
      const leaf = el.childElementCount === 0;
      const replaced = el.tagName === 'SVG' || el.tagName === 'IMG' || el.tagName === 'CANVAS';
      const paints =
        replaced ||
        (leaf &&
          (style.borderBottomWidth !== '0px' ||
            (style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
              style.backgroundColor !== 'transparent') ||
            style.backgroundImage !== 'none' ||
            style.boxShadow !== 'none'));
      if (paints) note(bottom, el);
      // Text measured through a Range, so the line box is what counts rather
      // than a block that reserves room below its last line.
      for (const node of el.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.height >= 1) note(rect.bottom + window.scrollY, el);
      }
    }
    return { lowest: Math.ceil(lowest), culprit };
  });
  if (overflow.lowest > height - FLOOR) {
    throw new Error(
      `capture-grove: ${name} draws to ${overflow.lowest}px in a ${height}px frame ` +
        `(${overflow.culprit}). Restrain the surface; do not grow the frame.`,
    );
  }
  return overflow.lowest;
}

for (const theme of ['light', 'dark']) {
  const suffix = theme === 'dark' ? '-dark' : '';
  const context = await browser.newContext({
    viewport: { ...FRAME },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  // Turns off the ProtectedSurface identity watermark, which is stamped with
  // the signed-in address and would otherwise be tiled across every frame.
  await context.addInitScript(() => {
    window.__LUMECON_CAPTURE__ = true;
  });
  // The rail collapses to an icon strip for every shot but Home. It is 264px
  // expanded and 75px collapsed, and on a marketing page each capture is shown
  // at about half size, so those 189px are the difference between a readable
  // shelf and a grey texture. Home keeps the labelled rail: it is the first
  // frame on the page and the only one that says the product has named
  // surfaces at all, which the tour stopped saying when it went to three acts.
  // "1" is the value the app writes.
  await context.addInitScript(() => {
    try {
      if (!location.pathname.replace(/\/$/, "").endsWith("/grove")) {
        localStorage.setItem("teim.sidenav.collapsed", "1");
      }
    } catch { /* not persisted */ }
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
    const drawn = await assertFits(page, surface.name, FRAME.height);
    await page.screenshot({ path: join(OUT, `${surface.name}${suffix}.png`) });
    console.log(
      `${surface.name}${suffix}.png  ${FRAME.width}x${FRAME.height}  (draws to ${drawn})`,
    );
    await page.close();
  }
  await context.close();
}

await browser.close();
