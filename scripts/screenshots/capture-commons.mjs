/**
 * Capture the Cedar Commons surfaces from the running application.
 *
 * HOW TO RUN
 *   In the app repository, on the branch that carries the Commons surface:
 *     npx vite dev --port 4400 --host 127.0.0.1
 *   Then here, in one command:
 *     npm run shots:commons
 *
 *   That is both variants plus the optimizer, deliberately as one script:
 *   running the capture and forgetting the optimizer leaves the committed
 *   webp files stale while the raw PNGs look freshly taken, which is how a
 *   caption reading "four of ten seats in use" came to sit under a frame
 *   still showing "1 of 10". The equivalent by hand, into one directory
 *   (every frame carries its variant, so the two passes do not overwrite
 *   each other):
 *     node scripts/screenshots/capture-commons.mjs <rawDir>
 *     CAPTURE_VARIANT=consultant node scripts/screenshots/capture-commons.mjs <rawDir>
 *     node scripts/screenshots/optimize-commons.mjs <rawDir>
 *
 * Chromium comes from PW_CHROMIUM, else Playwright's own managed browser,
 * else the container's /opt/pw-browsers/chromium.
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
import { mkdirSync, existsSync } from 'node:fs';
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
      cedarEntitled: true,
      cedarChatConfigured: true,
      cedarDocumentImportEntitled: true,
      cedarDocumentImportAvailable: true,
      emailVerifiedAt: '2026-01-04T10:00:00.000Z',
      workspace: { id: 'w-2', name: 'Ferreira Economic Consulting', tier: 'sapling' },
    }
  : {
      id: 'u-owner',
      email: 'dana@example.org',
      name: 'Dana Whitecloud',
      workspaceTier: 'tree',
      cedarEntitled: true,
      cedarChatConfigured: true,
      cedarDocumentImportEntitled: true,
      cedarDocumentImportAvailable: true,
      emailVerifiedAt: '2026-01-04T10:00:00.000Z',
      workspace: { id: 'w-1', name: 'Prairie Wind Development Authority', tier: 'tree' },
    };

const ORG_NAME = CONSULTANT ? 'Ferreira Economic Consulting' : 'Prairie Wind Development Authority';

/* Two axes, because the product has two.
   `kind` says whose organization a person belongs to: internal is staff of
   the sponsoring organization, external is a client, partner or advisor
   holding project-scoped access and nothing wider. `role` says what they
   can do on one project: owner, collaborator or viewer. The Collaborators
   view splits on `kind` (organization members above, external
   collaborators below) and reports `role` per project, so a fixture with
   no `kind` renders an empty external roster. */
const DANA = { id: 'u-owner', name: 'Dana Whitecloud', email: 'dana@example.org' };
const MARCUS = { id: 'u-fin', name: 'Marcus Oldbear', email: 'marcus@example.org' };
const SOFIA = { id: 'u-ops', name: 'Sofia Reyes', email: 'sofia@example.org' };
const AARON = { id: 'u-exec', name: 'Aaron Fields', email: 'aaron@example.org' };
const PRIYA = { id: 'u-con', name: 'Priya Raman', email: 'priya@ferreira-econ.example' };
const ELENA = { id: 'u-law', name: 'Elena Marsh', email: 'elena@northline-law.example' };
const TERESA = { id: 'u-coop', name: 'Teresa Nakai', email: 'teresa@riverbend-coop.example' };

const at = (person, role, kind) => ({ ...person, role, kind });

/* The organization roster: who is on staff. External collaborators never
   appear here, which is the boundary the page describes. */
const ORG_MEMBERS = [
  { ...DANA, role: 'admin' },
  { ...MARCUS, role: 'member' },
  { ...SOFIA, role: 'member' },
  { ...AARON, role: 'member' },
];
const CONSULTANCY_MEMBERS = [{ ...PRIYA, role: 'admin' }];

/* Records contributed to the project, by more than one person: the whole
   point of the project-scoped document listing. `uploader` is the join the
   listing route performs; `status` comes from the spreadsheet parser. */
const DOCUMENTS = [
  { id: 'd1', projectId: 'p-wind', originalFileName: 'FY2026-payroll-summary-audited.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSizeBytes: 184320, sourceType: 'spreadsheet', status: 'parsed',
    createdAt: '2026-03-02T15:04:00.000Z', uploader: MARCUS },
  { id: 'd2', projectId: 'p-wind', originalFileName: 'operations-headcount-by-site.csv',
    contentType: 'text/csv', fileSizeBytes: 21504, sourceType: 'spreadsheet',
    status: 'parsed', createdAt: '2026-03-03T10:50:00.000Z', uploader: SOFIA },
  { id: 'd3', projectId: 'p-wind', originalFileName: 'substation-contract-schedule.csv',
    contentType: 'text/csv', fileSizeBytes: 8192, sourceType: 'spreadsheet',
    status: 'needs_review', createdAt: '2026-03-03T11:20:00.000Z', uploader: SOFIA },
  { id: 'd4', projectId: 'p-wind', originalFileName: 'interconnection-capital-plan.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSizeBytes: 402432, sourceType: 'spreadsheet', status: 'parsed',
    createdAt: '2026-03-04T09:15:00.000Z', uploader: DANA },
  /* The second client's project, so the consultant board does not show a
     record count of zero next to copy about collecting records. */
  { id: 'd5', projectId: 'p-coop', originalFileName: 'store-payroll-2026.csv',
    contentType: 'text/csv', fileSizeBytes: 15360, sourceType: 'spreadsheet',
    status: 'parsed', createdAt: '2026-02-19T13:40:00.000Z', uploader: TERESA },
  { id: 'd6', projectId: 'p-coop', originalFileName: 'supplier-spend-by-county.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSizeBytes: 96256, sourceType: 'spreadsheet', status: 'parsed',
    createdAt: '2026-02-20T08:05:00.000Z', uploader: PRIYA },
  /* And the organization board's other two projects, so the board reads as
     three live analyses rather than one worked example beside two stubs. */
  { id: 'd7', projectId: 'p-health', originalFileName: 'clinic-staffing-plan.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSizeBytes: 71680, sourceType: 'spreadsheet', status: 'parsed',
    createdAt: '2026-02-24T11:00:00.000Z', uploader: AARON },
  { id: 'd8', projectId: 'p-rail', originalFileName: 'terminal-construction-draws.csv',
    contentType: 'text/csv', fileSizeBytes: 30720, sourceType: 'spreadsheet',
    status: 'parsed', createdAt: '2025-11-12T16:30:00.000Z', uploader: MARCUS },
  { id: 'd9', projectId: 'p-rail', originalFileName: 'corridor-employment-2025.csv',
    contentType: 'text/csv', fileSizeBytes: 12288, sourceType: 'spreadsheet',
    status: 'parsed', createdAt: '2025-11-14T09:10:00.000Z', uploader: MARCUS },
];

const documentCountFor = (id) => DOCUMENTS.filter((d) => d.projectId === id).length;

const proj = (id, name, location, businessType, year, participants, noteCount, status) => ({
  id,
  name,
  ownerId: OWNER.id,
  organizationId: CONSULTANT ? 'w-2' : 'w-1',
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
  documentCount: documentCountFor(id),
  sponsorName: null,
});

/* The consultant board. Priya owns both, each for a different client, and
   each client's contacts reach only their own project. */
const CLIENT_PROJECTS = [
  {
    ...proj('p-wind', 'Wind Ridge Energy Expansion', 'Nebraska', 'Utilities', 2026,
      [at(PRIYA, 'owner', 'internal'), at(DANA, 'collaborator', 'external'), at(MARCUS, 'viewer', 'external')],
      5, 'draft'),
    sponsorName: 'Prairie Wind Development Authority',
  },
  {
    ...proj('p-coop', 'Riverbend Grocery Cooperative', 'Iowa', 'Retail Trade', 2026,
      [at(PRIYA, 'owner', 'internal'), at(TERESA, 'collaborator', 'external')],
      3, 'complete'),
    sponsorName: 'Riverbend Food Council',
  },
];

/* The organization board. Staff hold most of the access; one consultant and
   one outside counsel hold project-scoped access at different permissions. */
const OWN_PROJECTS = [
  proj('p-wind', 'Wind Ridge Energy Expansion', 'Nebraska', 'Utilities', 2026,
    [at(DANA, 'owner', 'internal'), at(MARCUS, 'collaborator', 'internal'),
     at(SOFIA, 'collaborator', 'internal'), at(PRIYA, 'collaborator', 'external')],
    5, 'draft'),
  proj('p-health', 'Community Health Campus', 'South Dakota', 'Healthcare', 2026,
    [at(DANA, 'owner', 'internal'), at(AARON, 'viewer', 'internal'), at(ELENA, 'viewer', 'external')],
    3, 'draft'),
  proj('p-rail', 'Rail Corridor and Terminal', 'Nebraska', 'Transportation and Warehousing', 2025,
    [at(DANA, 'owner', 'internal'), at(MARCUS, 'collaborator', 'internal')],
    2, 'complete'),
];

const PROJECTS = CONSULTANT ? CLIENT_PROJECTS : OWN_PROJECTS;
const MEMBERS = CONSULTANT ? CONSULTANCY_MEMBERS : ORG_MEMBERS;

/* The drawer reads `note.author` (an object), not a flat `authorName`:
   with the wrong shape every note renders as "Someone" behind a "?" avatar,
   which is what the first pass shipped. */
/* Mirrors server/lib/organizationSeats.js countOrganizationSeats: the union
   of organization members, non-owner participants on the organization's
   projects, and the owner. One person, one seat. */
const seatsUsed = () => {
  const ids = new Set(MEMBERS.map((m) => m.id));
  ids.add(OWNER.id);
  for (const project of PROJECTS) {
    for (const p of project.participants) {
      if (p.role !== 'owner') ids.add(p.id);
    }
  }
  return ids.size;
};

const NOTES = [
  { id: 'n1', projectId: 'p-wind', author: MARCUS,
    body: 'FY2026 payroll summary is the audited one, not the draft I sent in February. Employment figure is 214, not 208.',
    createdAt: '2026-03-02T15:12:00.000Z' },
  { id: 'n2', projectId: 'p-wind', author: DANA,
    body: 'Updated. Using 214 across both operations. Sofia, does the substation contract belong in this analysis or the next one?',
    createdAt: '2026-03-03T09:40:00.000Z' },
  { id: 'n3', projectId: 'p-wind', author: SOFIA,
    body: 'Next one. It is not committed until the interconnection agreement is signed, and that is a 2027 decision.',
    createdAt: '2026-03-03T11:05:00.000Z' },
  { id: 'n4', projectId: 'p-wind', author: PRIYA,
    body: 'Then I will hold the substation out of the model and note it as a 2027 decision in the assumptions.',
    createdAt: '2026-03-03T14:30:00.000Z' },
  { id: 'n5', projectId: 'p-wind', author: DANA,
    body: 'Agreed. Scope is the two operating sites only, reporting year 2026.',
    createdAt: '2026-03-04T16:20:00.000Z' },
];

/* The widget renders `message.text` and keys the bubble off `role`. A
   `content` field (the server's own column name) renders empty bubbles,
   which is what the first pass shipped. */
const CEDAR = [
  { id: 'c1', role: 'user',
    text: 'Which figures in this project still have no source document?',
    createdAt: '2026-03-04T16:25:00.000Z' },
  { id: 'c2', role: 'assistant',
    text:
      'Two. The substation line carries a value with no document attached, and the 2026 payroll figure was entered by hand after Marcus flagged the February draft. Everything else in this project traces to a file someone uploaded here.',
    createdAt: '2026-03-04T16:25:04.000Z' },
  { id: 'c3', role: 'user', text: 'Who entered the payroll figure?',
    createdAt: '2026-03-04T16:26:10.000Z' },
  { id: 'c4', role: 'assistant',
    text:
      'Dana Whitecloud, on March 3, after Marcus Oldbear noted that the audited summary reads 214 rather than 208. The note is on this project.',
    createdAt: '2026-03-04T16:26:13.000Z' },
];

const mock = async (route) => {
  const url = new URL(route.request().url());
  const p = url.pathname;
  if (p === '/me') return route.fulfill(json(OWNER));
  if (p === '/events') return route.fulfill(json({}));
  /* The real response shape: Workspace.jsx reads `data.org`, `data.members`,
     `data.pendingInvites` and `data.isOwner`. A flat object leaves the header
     on its "Your organization" fallback, which is what the first pass shipped. */
  if (p === '/workspace')
    return route.fulfill(
      json({
        org: {
          id: CONSULTANT ? 'w-2' : 'w-1',
          name: ORG_NAME,
          tier: CONSULTANT ? 'sapling' : 'tree',
        },
        members: MEMBERS,
        pendingInvites: [],
        /* `{ used, max }`, the shape `resolveSeatMeter` reads. A bare number
           makes `fromServer` false, so the meter silently falls back to
           counting MEMBERS alone and renders "1 of 10 internal
           collaborators" beside three external ones — which is the exact
           symptom `countOrganizationSeats`' own comment records as already
           fixed in the product. The capture reproduced it, the product does
           not.

           `used` is computed the way the server computes it: memberships,
           plus every non-owner project participant across the
           organization's projects, plus the owner, each person once. */
        seats: { used: seatsUsed(), max: CONSULTANT ? 10 : null },
        isOwner: true,
      }),
    );
  if (p === '/commons/projects' || p === '/projects')
    return route.fulfill(json(url.searchParams.get('archived') === 'archived' ? [] : PROJECTS));
  if (p === '/project-drafts') return route.fulfill(json([]));
  /* Two shapes, deliberately, because the product has two. The board's
     avatar stack reads the flat `participants` on the project payload
     (id/name/email); the access drawer reads GET /projects/:id/participants,
     whose rows are `{ projectId, userId, role, kind, user }` (see
     server/repositories/projectParticipants.js toParticipant). Serving the
     flat shape here renders every row as "Someone" and hides the owner's
     invite form, which is what the first pass shipped. */
  let m = p.match(/^\/projects\/([^/]+)\/participants$/);
  if (m) {
    const found = PROJECTS.find((x) => x.id === m[1]);
    return route.fulfill(
      json({
        /* The drawer takes its authority from the response, not from the
           project payload: `isOwner` decides whether the invite form renders
           at all, and `canAddParticipants` whether the plan allows it. */
        isOwner: (found ? found.ownerId : null) === OWNER.id,
        canAddParticipants: true,
        participants: (found ? found.participants : []).map((x) => ({
          projectId: m[1],
          userId: x.id,
          role: x.role,
          kind: x.kind,
          createdAt: '2026-02-02T10:00:00.000Z',
          user: { id: x.id, name: x.name, email: x.email },
        })),
      }),
    );
  }
  m = p.match(/^\/projects\/([^/]+)\/documents$/);
  if (m) {
    const id = m[1];
    return route.fulfill(
      json({
        documents: DOCUMENTS.filter((d) => d.projectId === id),
        // Mirrors the route's viewer gate, so the add control renders.
        canContribute: true,
      }),
    );
  }
  m = p.match(/^\/projects\/([^/]+)\/notes$/);
  if (m) return route.fulfill(json({ notes: NOTES.filter((n) => n.projectId === m[1]) }));
  m = p.match(/^\/projects\/([^/]+)\/cedar\/messages$/);
  if (m) return route.fulfill(json({ messages: CEDAR }));
  m = p.match(/^\/projects\/([^/]+)$/);
  if (m) return route.fulfill(json(PROJECTS.find((x) => x.id === m[1]) || PROJECTS[0]));
  return route.fulfill(json({}));
};

/* Chromium, resolved the way the rest of this repository resolves it.
   `PW_CHROMIUM` wins (the convention in capture-cedar-page.mjs,
   capture-examples.mjs and capture-tour.mjs); otherwise Playwright's own
   managed browser, which `npm ci` installs; otherwise the managed
   container's symlink, which is the same three-step order
   playwright.config.ts uses. Hardcoding the container path meant the
   documented command failed on a normal checkout before it opened a page. */
function chromiumLaunchOptions() {
  if (process.env.PW_CHROMIUM) return { executablePath: process.env.PW_CHROMIUM };
  try {
    const pinned = chromium.executablePath();
    if (pinned && existsSync(pinned)) return {};
  } catch {
    /* fall through */
  }
  const fallback = '/opt/pw-browsers/chromium';
  return existsSync(fallback) ? { executablePath: fallback } : {};
}

const browser = await chromium.launch(chromiumLaunchOptions());
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

/* Every frame carries its variant, so the two documented commands can share
   one output directory: run separately into the same folder, the consultant
   pass used to overwrite `commons-board.png` and `commons-collaborators.png`
   from the organization pass, and neither board variant survived without an
   undocumented rename. */
const VARIANT = CONSULTANT ? 'consultant' : 'org';
const shot = async (name, clip) => {
  const file = `${name}-${VARIANT}.png`;
  await page.screenshot({ path: join(OUT, file), ...(clip ? { clip } : {}) });
  console.log('wrote', file);
};

/* A frame this script promises to produce. If its control cannot be found,
   the run fails rather than exiting 0 with the previously committed
   screenshot left stale on disk: a missing output is the failure mode a
   capture generator exists to prevent. */
const required = async (what, locator) => {
  if (!(await locator.count())) {
    await browser.close();
    throw new Error(
      `capture-commons: could not find ${what}; nothing further written.\n` +
        '  The control was renamed or the surface changed. Fix the locator\n' +
        '  rather than letting the committed frame go stale.',
    );
  }
  return locator;
};

/* Every <img> that actually decoded. A published frame must not contain a
   broken image, and the two that broke in the first pass were exactly the
   ones a reader notices: the Lumecon mark on the rail, and the sector
   photograph on each project card. Both live in the app's public/
   directory, which is NOT on every branch that carries the Commons UI, so
   this is a real failure mode and not a hypothetical one. A <img> that
   failed to load reports naturalWidth 0. */
const brokenImages = async () =>
  page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.currentSrc && img.complete && img.naturalWidth === 0)
      .map((img) => new URL(img.currentSrc).pathname),
  );

const assertClean = async (where) => {
  const broken = await brokenImages();
  if (broken.length) {
    await browser.close();
    throw new Error(
      `capture-commons: ${broken.length} broken image(s) on ${where}; nothing written.\n` +
        `  ${[...new Set(broken)].join('\n  ')}\n` +
        `  In the app repository these live under public/. If they are missing:\n` +
        `    git checkout origin/<branch-with-the-assets> -- public/`,
    );
  }
};

const closeAnyDrawer = async () => {
  /* Escape is not reliable here: the Cedar widget and the drawers listen on
     different roots, and a stray Escape that lands on the board leaves the
     next frame showing whatever was open before. Click the drawer's own
     close control, then confirm nothing is left open. */
  const close = page.locator('[aria-label="Close"], button[title="Close"], .wsnotes__close, .wsshare__close').first();
  if (await close.count()) {
    await close.click().catch(() => {});
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(800);
};

await page.goto(`${APP}/app/workspace`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

/* Refuse to write anything if the board did not load, so a retry state can
   never be published as a screenshot. */
const brokenText = await page.evaluate(() =>
  /did not load|Reconnecting|Authentication unavailable|malformed/i.test(document.body.innerText),
);
if (brokenText) {
  await browser.close();
  throw new Error('capture-commons: the board did not load; nothing written.');
}
/* And refuse if the board loaded but the sector photography did not: a
   card wearing an empty gradient is not a capture of this product. */
const sectorPhotos = await page.evaluate(
  () => Array.from(document.images).filter((i) => /\/naics\//.test(i.currentSrc)).length,
);
if (!sectorPhotos) {
  await browser.close();
  throw new Error(
    'capture-commons: no sector photograph rendered on any card; nothing written.\n' +
      '  Check that the fixture business types resolve (resolveSectorSlug) and that\n' +
      '  the app repository has public/naics/.',
  );
}
await assertClean('the board');
await shot('commons-board');

/* The Collaborators view. Two rosters, because there are two kinds of
   person: organization members, and external collaborators holding
   project-scoped access with a per-project role. */
const collab = await required(
  'the Collaborators tab',
  page.locator('button[role="tab"]', { hasText: /^Collaborators$/ }).first(),
);
await collab.click();
await page.waitForTimeout(1200);
await assertClean('the Collaborators view');

/* The seat meter has two wordings, and which one appears says where the
   number came from. "N of M seats in use" is the server's own count
   (members + non-owner participants + pending invites, each person once).
   "N of M internal collaborators" is the client's fallback, which counts
   members alone and reads "1 of 10" for an organization already at its cap
   through shared projects. Publishing the fallback would show a capability
   the product does not have, so a capped plan must reach the first wording. */
const seatLabel = (await page.locator('.ws2-seats__label').count())
  ? (await page.locator('.ws2-seats__label').first().innerText()).trim()
  : (await page.locator('.ws2-plan__seats-unlimited').first().innerText()).trim();
/* Case-insensitive: the label is uppercased in CSS and `innerText` returns
   the transformed text, so a case-sensitive pattern never matched and the
   guard passed on the very state it exists to catch. Found by mutation. */
if (/internal collaborators?$/i.test(seatLabel) && !/^unlimited/i.test(seatLabel)) {
  await browser.close();
  throw new Error(
    `capture-commons: the seat meter fell back to counting members alone ` +
      `("${seatLabel}"); nothing further written.\n` +
      '  GET /workspace must answer `seats: { used, max }`, not a bare number:\n' +
      '  resolveSeatMeter() only trusts the object form.',
  );
}
console.log('seat meter:', seatLabel);

await shot('commons-collaborators');

// Back to Projects for the per-project drawers.
const projTab = await required(
  'the Projects tab',
  page.locator('button[role="tab"]', { hasText: /^Projects$/ }).first(),
);
await projTab.click();
await page.waitForTimeout(900);

const CARD = CONSULTANT ? 'Wind Ridge Energy Expansion' : 'Wind Ridge Energy Expansion';

// Questions: Cedar answering about this project's own evidence.
const cedarBtn = await required(
  `the Cedar chip on ${CARD}`,
  page.locator(`button[aria-label^="Ask Cedar about ${CARD}"]`).first(),
);
{
  await cedarBtn.click();
  await page.waitForTimeout(1500);
  /* The card's chip scopes the widget to the project and asks it to open.
     Registering a new surface re-hydrates the transcript, which can land
     after the open request and leave the panel collapsed, so if the dock is
     still showing its launcher, click it. */
  const launcher = page.locator('button', { hasText: /^Ask Cedar/ }).last();
  const panelOpen = await page.locator('.cedarw--open, [data-cedar-open="true"]').count();
  if (!panelOpen && (await launcher.count())) {
    await launcher.click();
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(800);
  await assertClean('the Cedar panel');
  await shot('commons-cedar');
  await closeAnyDrawer();
}

// Notes: the thread that records what was decided about the numbers.
const notesBtn = await required(
  'the project-notes chip',
  page.locator('button[title="Project notes"]').first(),
);
{
  await notesBtn.click();
  await page.waitForTimeout(1400);
  await assertClean('the notes drawer');
  await shot('commons-notes');
  await closeAnyDrawer();
}

// Documents: the records the project was built from, and who contributed
// each one. Project-scoped, not per uploader.
const docsBtn = await required(
  'the project-documents chip',
  page.locator('button[title="Project documents"]').first(),
);
{
  await docsBtn.click();
  await page.waitForTimeout(1400);
  await assertClean('the documents drawer');
  await shot('commons-documents');
  await closeAnyDrawer();
}

// People: the per-project access panel, where an invitation is scoped.
const menu = await required(
  `the actions menu on ${CARD}`,
  page.locator(`button[aria-label^="Actions for ${CARD}"]`).first(),
);
await menu.click();
await page.waitForTimeout(500);
const manage = await required(
  'the "Manage collaborators" item',
  page.locator('[role="menuitem"]', { hasText: /Manage collaborators/ }).first(),
);
await manage.click();
await page.waitForTimeout(1500);
await assertClean('the access drawer');
await shot('commons-access');

console.log('--- final text sample ---');
console.log((await page.evaluate(() => document.body.innerText)).slice(0, 400));
console.log('--- page errors ---', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
