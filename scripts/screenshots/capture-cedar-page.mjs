// Capture the three frames the /cedar page uses.
//
// These three were made by hand and no script reached them, so while the app
// was redesigned they stayed on the old teal rail and the eight-step wizard
// while every other asset moved on. That is the whole reason they need a
// script: a screenshot no rerun can reproduce goes stale silently.
//
// Usage:
//   1. Run teim-app: npx vite --port 5173   (on the branch you want published)
//   2. node scripts/screenshots/capture-cedar-page.mjs
//   3. node scripts/screenshots/optimize-cedar-page.mjs
//
// The API is mocked from examples-data.mjs, so no backend or database is
// needed. Set PW_CHROMIUM if Playwright's own download is unavailable.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { USER, PROJECTS, RUNS, RESULTS } from './examples-data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-cedar');
mkdirSync(OUT, { recursive: true });
const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

// What Cedar is asked, and what it answers, in the two intake frames.
//
// Nothing here is a claim about a real project. The figures belong to the same
// fictional wind build the rest of this capture uses. What the exchange is
// meant to show is the behaviour that actually matters: Cedar says which
// operations it could set up from the documents, and refuses to invent the one
// figure it could not source, naming where it came up short instead.
const CEDAR_QUESTION = 'Check my operations against the documents.';
const CEDAR_ANSWER = [
  'All three are set up from your documents, and two are model ready.',
  '',
  '**Grid interconnection** has no sales figure yet. The procurement workbook carries',
  'the contract at $207.5M, and the substation line you flagged should split from labor.',
  '',
  'Want me to apply both? Nothing runs until you review it.',
].join('\n');

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);

const mockApi = async (route) => {
  const p = new URL(route.request().url()).pathname;
  if (p === '/me') return route.fulfill(json(USER));
  if (p === '/events') return route.fulfill(json({}));
  if (p === '/projects') {
    const url = new URL(route.request().url());
    return route.fulfill(json(url.searchParams.get('archived') === 'archived' ? [] : PROJECTS));
  }
  // The board asks for drafts too, and an unanswered call leaves the projects
  // list in its error state rather than rendering the cards.
  if (p === '/project-drafts') return route.fulfill(json([]));
  // Cedar Commons does not read /projects. It reads /commons/projects twice,
  // once for active and once for archived, and Promise.all means a miss on
  // either one puts the whole board in its retry state.
  if (p === '/commons/projects') {
    const url = new URL(route.request().url());
    return route.fulfill(json(url.searchParams.get('archived') === 'archived' ? [] : PROJECTS));
  }
  if (p === '/workspace') {
    return route.fulfill(json({ name: 'Economic Development Office', tier: 'tree', members: [] }));
  }
  let m = p.match(/^\/projects\/([^/]+)\/runs\/([^/]+)\/results$/);
  if (m) return route.fulfill(json(RESULTS[m[2]]));
  m = p.match(/^\/projects\/([^/]+)\/runs\/([^/]+)$/);
  if (m) return route.fulfill(json(RUNS[m[2]]));
  // Cedar answering is the whole point of these frames, so the panel is shown
  // mid-conversation rather than closed. The widget reads its local history
  // first and falls back to the server, and a fresh capture context has no
  // local history, so this transcript is what renders.
  //
  // Nothing here is a claim about a real project: the numbers belong to the
  // same fictional wind build the rest of the capture uses, and the exchange
  // shows the behaviour that matters, which is Cedar declining to guess at a
  // figure it cannot source and saying which document it came up short on.
  if (/\/cedar\/messages/.test(p)) {
    // A POST is a question the capture just typed. Answering it is the point:
    // Cedar with its panel closed, or open on an empty welcome, shows nothing
    // about what Cedar is for. The API does not have to be up for the product
    // to be photographed doing its job.
    if (route.request().method() === 'POST') {
      return route.fulfill(json({ answer: CEDAR_ANSWER, threadId: 'capture', contextUsed: null }));
    }
    return route.fulfill(json({ threadId: null, messages: [] }));
  }
  m = p.match(/^\/projects\/([^/]+)$/);
  if (m) {
    const proj = PROJECTS.find((x) => x.id === m[1]);
    return route.fulfill(proj ? json(proj) : { status: 404, contentType: 'application/json', body: '{}' });
  }
  return route.continue();
};

const ctx = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
// Declares the session to ProtectedSurface so no watermark tiles across public
// imagery, and to the rail so focus routes keep their toggle. Pinning the
// collapse preference stops a remembered state making two runs disagree.
await ctx.addInitScript(() => {
  window.__LUMECON_CAPTURE__ = true;
  try {
    localStorage.setItem('teim.sidenav.collapsed', '0');
  } catch {
    /* the default is expanded anyway */
  }
});
await ctx.route('**/*', mockApi);

const settle = async (page, ms = 1400) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
};
// The launcher is a closed pill until it is clicked, and a closed pill says
// nothing about what Cedar does. Every frame that has a Cedar shows it open.
// The launcher is a closed pill until it is clicked, and a closed pill says
// nothing about what Cedar does. Every frame that has a Cedar shows it open and
// mid-answer, which means actually asking: the widget keeps its transcript in
// local state, so a question typed here is the only way to put one on screen.
const openCedar = async (page) => {
  const launcher = page.locator('.cedar-widget__launcher');
  if (!(await launcher.count())) return;
  await launcher.first().click();
  await page.waitForTimeout(1200);
  const box = page.locator('.cedar-widget__panel input[type=text], .cedar-widget__panel textarea');
  if (!(await box.count())) return;
  await box.first().fill(CEDAR_QUESTION);
  await box.first().press('Enter');
  await page.waitForTimeout(2200);
};
const next = async (page) => {
  await page.locator('button').filter({ hasText: /^Next/ }).first().click();
  await settle(page, 2000);
};

// ---- the two intake frames -------------------------------------------------
// Driven rather than seeded: the draft lives in localStorage behind a schema
// this script has no business knowing, and the wizard re-derives its step from
// it. Clicking through is what a reader does, so it cannot drift from the app.
const wiz = await ctx.newPage();
await wiz.goto(`${APP}/app/analyses/new`, { waitUntil: 'networkidle' });
await settle(wiz, 2000);

// Basics. Placeholders rotate per load (pickExample in exampleContent.js), so
// the fields are addressed by position, not by their example text.
const boxes = wiz.locator('input[type=text], input:not([type])');
await boxes.nth(0).fill('Wind Farm Phase II');
await wiz.locator('button').filter({ hasText: /^2024$/ }).first().click();
await boxes.nth(1).fill('Cheyenne River Sioux Tribe');
await settle(wiz, 900);

await next(wiz); // geography
await next(wiz); // documents
await openCedar(wiz);
await wiz.screenshot({ path: join(OUT, 'cedar-wind-upload.png') });
console.log('cedar-wind-upload');

await next(wiz); // operations
// One card per selection on the next step. These three are the shape of a
// wind build: the works, the interconnection, and who keeps it running.
for (const sector of ['Construction', 'Utilities', 'Professional services']) {
  await wiz.locator('label, button, [role=checkbox]').filter({ hasText: sector }).first().click();
  await wiz.waitForTimeout(350);
}
await settle(wiz, 900);
await next(wiz); // details, now carrying three operations
await openCedar(wiz);
await wiz.screenshot({ path: join(OUT, 'cedar-wind-entities.png') });
console.log('cedar-wind-entities');
await wiz.close();

// ---- Cedar Commons ---------------------------------------------------------
// The board's own retry state is indistinguishable from a real screenshot at a
// glance, and publishing one is exactly how this set drifted before. So the
// capture reads the page back and refuses to write anything if the projects
// did not load, rather than trusting that the mocks are still right.
const commons = await ctx.newPage();
await commons.goto(`${APP}/app/workspace`, { waitUntil: 'networkidle' });
await settle(commons, 4000);
const broken = await commons.evaluate(() =>
  /did not load|Reconnecting/i.test(document.body.innerText),
);
if (broken) {
  await commons.close();
  await ctx.close();
  await browser.close();
  throw new Error(
    'capture-cedar-page: the Cedar Commons board did not load its projects, so ' +
      'cedar-context was not written. The two intake frames above are good.',
  );
}
await commons.screenshot({ path: join(OUT, 'cedar-context.png') });
console.log('cedar-context');
await commons.close();

await ctx.close();
await browser.close();
console.log('cedar page captures done');
