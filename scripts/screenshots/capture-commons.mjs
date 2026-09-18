/**
 * Capture the Cedar Commons surfaces from the running application.
 *
 * HOW TO RUN
 *   In the app repository, on the branch that carries the Commons surface:
 *     npx vite dev --port 4400 --host 127.0.0.1
 *   Then here:
 *     node scripts/screenshots/capture-commons.mjs <outDir>
 *     CAPTURE_VARIANT=consultant node scripts/screenshots/capture-commons.mjs <outDir>
 *
 * WHY A DEV SERVER AND NOT A BUILD
 * The Commons board watermarks itself with the viewer's identity, by design:
 * `ProtectedSurface` tiles the account and timestamp across the content so any
 * screenshot or phone photo carries who took it. It honours a capture escape
 * hatch, `window.__LUMECON_CAPTURE__`, but only when the build is NOT
 * production, so nobody can strip the watermark from real shared data in the
 * shipped app. `vite build --mode development` does not clear that flag; the
 * dev server does. Marketing frames therefore come from `vite dev`.
 *
 * THE DATA IS FIXTURES AND THE PEOPLE ARE FICTIONAL
 * The API is fully mocked, the same convention as capture-cedar-page.mjs: no
 * backend and no database, the real UI rendering invented data. Every
 * organization, person, project and note below is made up. Anything published
 * from this script must say "Shown with sample data".
 *
 * IT REFUSES TO WRITE A BROKEN FRAME
 * If the board renders an error or retry state, nothing is written, so a
 * failure cannot be published as a screenshot.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const APP = 'http://127.0.0.1:4400';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const json = (body) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const CONSULTANT = process.env.CAPTURE_VARIANT === 'consultant';

const OWNER = CONSULTANT
  ? {
      id: 'u-con',
      email: 'priya@ferreira-econ.example',
      name: 'Priya Raman',
      workspaceTier: 'sapling',
      emailVerifiedAt: '2026-01-04T10:00:00.000Z',
      workspace: { id: 'w-2', name: 'Ferreira Economic Consulting', tier: 'sapling' },
    }
  : {
  id: 'u-owner',
  email: 'dana@example.org',
  name: 'Dana Whitecloud',
  workspaceTier: 'tree',
  emailVerifiedAt: '2026-01-04T10:00:00.000Z',
  workspace: { id: 'w-1', name: 'Prairie Wind Development Authority', tier: 'tree' },
};

const ORG_NAME = CONSULTANT ? 'Ferreira Economic Consulting' : 'Prairie Wind Development Authority';

const PEOPLE = [
  { id: 'u-owner', name: 'Dana Whitecloud', email: 'dana@example.org', role: 'owner' },
  { id: 'u-fin', name: 'Marcus Oldbear', email: 'marcus@example.org', role: 'collaborator' },
  { id: 'u-ops', name: 'Sofia Reyes', email: 'sofia@example.org', role: 'collaborator' },
  { id: 'u-lead', name: 'Aaron Fields', email: 'aaron@example.org', role: 'viewer' },
  { id: 'u-con', name: 'Priya Raman', email: 'priya@ferreira-econ.example', role: 'collaborator' },
];

const proj = (id, name, location, businessType, year, participants, noteCount, status) => ({
  id,
  name,
  ownerId: OWNER.id,
  organizationId: 'w-1',
  analysisYear: year,
  archivedAt: null,
  createdAt: '2026-02-02T10:00:00.000Z',
  updatedAt: '2026-03-04T16:20:00.000Z',
  projectData: { location, businessType, studyType: 'enterprise' },
  latestRunId: `r-${id}`,
  latestRunStatus: status === 'draft' ? null : 'completed',
  latestRunCompletedAt: status === 'draft' ? null : '2026-03-04T16:20:00.000Z',
  participants,
  noteCount,
  sponsorName: null,
});

const CLIENT_PROJECTS = [
  {
    ...proj('p-wind', 'Wind Ridge Energy Expansion', 'Nebraska', 'Utilities', 2026,
      [PEOPLE[4], PEOPLE[0], PEOPLE[1]], 6, 'draft'),
    ownerId: 'u-owner',
    sponsorName: 'Prairie Wind Development Authority',
  },
];

const OWN_PROJECTS = [
  proj('p-wind', 'Wind Ridge Energy Expansion', 'Nebraska', 'Utilities', 2026,
    [PEOPLE[0], PEOPLE[1], PEOPLE[2]], 4, 'draft'),
  proj('p-health', 'Community Health Campus', 'South Dakota', 'Healthcare', 2026,
    [PEOPLE[0], PEOPLE[3]], 2, 'draft'),
  proj('p-rail', 'Rail Corridor and Terminal', 'Nebraska', 'Public Infrastructure', 2025,
    [PEOPLE[0], PEOPLE[1]], 1, 'complete'),
];

const PROJECTS = CONSULTANT ? CLIENT_PROJECTS : OWN_PROJECTS;

const NOTES = [
  { id: 'n1', projectId: 'p-wind', authorName: 'Marcus Oldbear',
    body: 'FY2026 payroll summary is the audited one, not the draft I sent in February. Employment figure is 214, not 208.',
    createdAt: '2026-03-02T15:12:00.000Z' },
  { id: 'n2', projectId: 'p-wind', authorName: 'Dana Whitecloud',
    body: 'Updated. Using 214 across both operations. Sofia, does the substation contract belong in this analysis or the next one?',
    createdAt: '2026-03-03T09:40:00.000Z' },
  { id: 'n3', projectId: 'p-wind', authorName: 'Sofia Reyes',
    body: 'Next one. It is not committed until the interconnection agreement is signed, and that is a 2027 decision.',
    createdAt: '2026-03-03T11:05:00.000Z' },
  { id: 'n4', projectId: 'p-wind', authorName: 'Dana Whitecloud',
    body: 'Noted. Scope is the two operating sites only, reporting year 2026.',
    createdAt: '2026-03-04T16:20:00.000Z' },
];

const CEDAR = [
  { id: 'c1', role: 'user', content: 'Which figures in this project still have no source document?',
    createdAt: '2026-03-04T16:25:00.000Z' },
  { id: 'c2', role: 'assistant',
    content:
      'Two. The substation line carries a value with no document attached, and the 2026 payroll figure was entered by hand after Marcus flagged the February draft. Everything else traces to a file in this project.',
    createdAt: '2026-03-04T16:25:04.000Z' },
];

const mock = async (route) => {
  const url = new URL(route.request().url());
  const p = url.pathname;
  if (p === '/me') return route.fulfill(json(OWNER));
  if (p === '/events') return route.fulfill(json({}));
  if (p === '/workspace')
    return route.fulfill(
      json({
        id: 'w-1',
        organizationId: 'w-1',
        organizationName: ORG_NAME,
        name: ORG_NAME,
        tier: CONSULTANT ? 'sapling' : 'tree',
        members: PEOPLE.map((x) => ({ ...x, role: x.role === 'owner' ? 'admin' : 'member' })),
        invites: [],
      }),
    );
  if (p === '/commons/projects' || p === '/projects')
    return route.fulfill(json(url.searchParams.get('archived') === 'archived' ? [] : PROJECTS));
  if (p === '/project-drafts') return route.fulfill(json([]));
  let m = p.match(/^\/projects\/([^/]+)\/participants$/);
  if (m) {
    const found = PROJECTS.find((x) => x.id === m[1]);
    return route.fulfill(json({ participants: found ? found.participants : [] }));
  }
  m = p.match(/^\/projects\/([^/]+)\/notes$/);
  if (m) return route.fulfill(json({ notes: NOTES.filter((n) => n.projectId === m[1]) }));
  m = p.match(/^\/projects\/([^/]+)\/cedar\/messages$/);
  if (m) return route.fulfill(json({ messages: CEDAR }));
  m = p.match(/^\/projects\/([^/]+)$/);
  if (m) return route.fulfill(json(PROJECTS.find((x) => x.id === m[1]) || PROJECTS[0]));
  return route.fulfill(json({}));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  /* The sanctioned capture hatch. ProtectedSurface honours it only when the
     build is not production, so the shipped app cannot have its viewer
     watermark stripped this way. The dist here is built with
     `vite build --mode development` for exactly that reason. */
  window.__LUMECON_CAPTURE__ = true;
  try {
    localStorage.setItem('lumecon.analytics', 'declined');
  } catch {}
});
/* VITE_API_URL is empty in this build, so the app fetches relative paths on
   its own origin. The static server answers those with index.html, which is
   why an unrouted run shows "malformed response". Everything that is not a
   static asset or an app route goes to the mock. */
const STATIC = /^\/(@vite|@react-refresh|@fs|node_modules|src\/|assets\/|app(\/|$)|favicon|index\.html$|.*\.(js|css|map|webp|png|svg|ico|woff2?|json)$)/;
await ctx.route('**/*', (route) => {
  const u = new URL(route.request().url());
  if (u.port !== '4400') return route.abort();
  if (u.pathname === '/' || STATIC.test(u.pathname)) return route.continue();
  return mock(route);
});

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

const shot = async (name, clip) => {
  await page.screenshot({ path: join(OUT, `${name}.png`), ...(clip ? { clip } : {}) });
  console.log('wrote', name);
};

await page.goto(`${APP}/app/workspace`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

/* Refuse to write anything if the board did not load, so a retry state can
   never be published as a screenshot. */
const broken = await page.evaluate(() =>
  /did not load|Reconnecting|Authentication unavailable|malformed/i.test(document.body.innerText),
);
if (broken) {
  await browser.close();
  throw new Error('capture-commons: the board did not load; nothing written.');
}

await shot('commons-board');

// The Collaborators tab: who is on the projects, and with what access.
const collab = page.locator('button, [role="tab"]', { hasText: /^Collaborators$/ }).first();
if (await collab.count()) {
  await collab.click();
  await page.waitForTimeout(1200);
  await shot('commons-collaborators');
}

// Back to Projects, then open one to reach its notes and Cedar.
const projTab = page.locator('button, [role="tab"]', { hasText: /^Projects$/ }).first();
if (await projTab.count()) { await projTab.click(); await page.waitForTimeout(800); }

const card = page.locator('text=Wind Ridge Energy Expansion').first();
if (await card.count()) {
  await card.click();
  await page.waitForTimeout(2000);
  await shot('commons-project-open');
}

console.log('--- final text sample ---');
console.log((await page.evaluate(() => document.body.innerText)).slice(0, 400));
console.log('--- page errors ---', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
