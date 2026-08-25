import { test, expect } from '@playwright/test';

/**
 * Smoke suite. Catches the regressions we've actually hit (broken icon
 * renders, empty viewport, leaking skip-link, hero cycle failing to
 * start, demo route 404). Intentionally narrow — perf and a11y are
 * covered by Lighthouse CI, not here.
 */

test('home page loads and renders the hero product shot', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Lumecon/i);
  // The hero trio: one example locked for the visit, its three
  // archetypes (results, map, comparison) each on screen exactly once.
  await expect(page.locator('#trio .trio-pos-c img')).toBeVisible();
  const srcs = await page
    .locator('#trio [data-trio] img')
    .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).getAttribute('src') || ''));
  const parsed = srcs.map((s) => s.match(/^\/app\/ex-([a-z]+)-(results|map|compare)\.webp$/));
  expect(parsed.every(Boolean)).toBe(true);
  expect(new Set(parsed.map((m) => m![1])).size).toBe(1); // one example only
  expect(new Set(parsed.map((m) => m![2])).size).toBe(3); // all three archetypes
  await expect(page.locator('#trioCaption')).toContainText('Shown with sample data:');
  // The product tour renders its screenshot rows below the hero.
  expect(await page.locator('.tour-row img').count()).toBeGreaterThan(2);

  // Filter out known-harmless console errors from sandboxed environments,
  // where the external font fetch fails against an interception proxy
  // (bad cert) or a closed egress (connection reset). Same-origin assets
  // are served from localhost and never produce either. (The old
  // frame-ancestors meta-CSP warning and the ipapi.co geolocation call
  // were both removed, so they can no longer appear here.)
  const real = errs.filter(
    (e) => !e.includes('CERT_AUTHORITY_INVALID') && !e.includes('ERR_CONNECTION_RESET'),
  );
  expect(real).toEqual([]);
});

const readTrioState = (page: import('@playwright/test').Page) =>
  page.locator('#trio [data-trio]').evaluateAll((frames) =>
    frames.map((f) => ({
      src: f.querySelector('img')?.getAttribute('src') || '',
      center: f.classList.contains('trio-pos-c'),
    })),
  );

test('hero opens on the money shot and holds still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const before = await readTrioState(page);
  // The example's declared money shot opens the cycle: results or map,
  // never comparison. Under reduced motion nothing advances, ever.
  expect(before.find((f) => f.center)?.src).toMatch(/-(results|map)\.webp$/);
  await page.waitForTimeout(7600);
  expect(await readTrioState(page)).toEqual(before);
});

test('hero rotates archetypes but never the example during a visit', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const before = await readTrioState(page);
  const centerBefore = before.find((f) => f.center)?.src;
  // Let the timer advance at least once (6.5s interval).
  await page.waitForTimeout(7600);
  const after = await readTrioState(page);
  // Sources never change once assigned: the example is locked and each
  // frame keeps its archetype. Only the position classes move.
  expect(after.map((f) => f.src)).toEqual(before.map((f) => f.src));
  const centerAfter = after.find((f) => f.center)?.src;
  expect(centerAfter).not.toEqual(centerBefore);
  const example = (s?: string) => s?.match(/ex-([a-z]+)-/)?.[1];
  expect(example(centerAfter)).toEqual(example(centerBefore));
});

test('skip-link is hidden until focused', async ({ page }) => {
  await page.goto('/');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeAttached();
  const box = await skip.boundingBox();
  // Either off-canvas (negative x) or 1px clipped.
  expect(box?.x ?? -1).toBeLessThan(0);
});

test('pricing shows four public plans, Seed first, with Sapling recommended', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  // One platform, four plans — Seed (free) leads, no platform picker.
  await expect(page.locator('.pr-plan')).toHaveCount(4);
  await expect(page.locator('.pr-plan').first().locator('.pr-plan__name')).toHaveText('Seed');
  await expect(page.locator('.pr-plan--featured .pr-plan__name')).toHaveText('Sapling');
  await expect(page.locator('#plan-free .pr-plan__amount')).toHaveText('Free');
  await expect(page.locator('#plan-sprout .pr-plan__amount')).toHaveText('$1,000');
  await expect(page.locator('#plan-sapling .pr-plan__amount')).toHaveText('$2,500');
  await expect(page.locator('#plan-tree .pr-plan__amount')).toHaveText('$7,500');
  // Plan CTAs route into signup with the stable tier id — Seed's id
  // stays `free`, the display name is marketing only.
  await expect(page.locator('#plan-free .pr-plan__cta')).toHaveAttribute(
    'href',
    /\/signup\?tier=free/,
  );
  await expect(page.locator('#plan-sprout .pr-plan__cta')).toHaveAttribute(
    'href',
    /\/signup\?tier=sprout/,
  );
  // The detail table renders with the Seed column and the Results and
  // Exports rows that state the direct-effects preview.
  await expect(page.locator('[data-plan-table] thead th')).toContainText([
    '',
    'Seed',
    'Sprout',
    'Sapling',
    'Tree',
  ]);
  await expect(page.locator('[data-plan-table] tbody tr')).toHaveCount(11);
  await expect(page.locator('[data-plan-table]')).toContainText('Direct effects');
  await expect(page.locator('[data-plan-table]')).toContainText('Cedar Grove');
});

test('pricing leads with the free account and routes consultants to Sapling', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  // The free CTA leads, above the plans, with the no-card line beside it.
  const hero = page.locator('.pr-hero');
  await expect(hero).toContainText('Plans start at $1,000 a year');
  await expect(hero.locator('a[href="/signup?tier=free"]')).toBeVisible();
  // The free-account band sits before the paid tiers.
  const free = page.locator('.pr-free');
  await expect(free).toContainText('take our word for it');
  await expect(free).toContainText('No credit card');
  await expect(free.locator('a[href="/signup?tier=free"]')).toBeVisible();
  // Consultants use the public plans. The signal is one line under the
  // cards, not a band and not a separate edition.
  await expect(page.locator('.pr-plans__clientnote')).toContainText('start at Sapling');
  // Cedar Grove is sold on its own, after the plans rather than as a fourth card.
  await expect(page.locator('#cedar-grove')).toBeVisible();
  // The FAQ carries the skepticism the table cannot. Each row is a details
  // element the reader opens.
  await expect(page.locator('.pr-faq__list .pr-more--faq')).toHaveCount(12);
});

test('signup reflects a plan carried over from pricing', async ({ page }) => {
  await page.goto('/signup?tier=sapling', { waitUntil: 'domcontentloaded' });
  const badge = page.locator('[data-auth-plan]');
  await expect(badge).toBeVisible();
  await expect(badge).toContainText(/Sapling tier/);
});

test('menu overlay opens full screen on a backdrop-filtered nav', async ({ page }) => {
  // Regression: the overlay used to live inside <nav>, whose
  // backdrop-filter made it the containing block for position:fixed,
  // silently confining the "full screen" menu to the nav bar's box.
  // Inner pages (nav--static) always carry the filter, so open there.
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await page.locator('#navMenuBtn').click();
  const menu = page.locator('#navMenu');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('no menu box');
  expect(box.height).toBeGreaterThan(viewport.height * 0.9);
  await expect(menu.locator('a', { hasText: 'Methodology' })).toBeVisible();
});

test('checkout is payment-only: knows the plan, no plan picker', async ({ page }) => {
  await page.goto('/checkout?tier=tree', { waitUntil: 'domcontentloaded' });
  // The order summary reflects the already-chosen plan.
  const summary = page.locator('[data-co-summary="tree"]');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Tree');
  await expect(summary.locator('[data-co-total]')).toHaveText('$7,500');
  await expect(summary).toContainText('Taxes and fees included');
  // One job: no selectable plan cards, just a quiet change-plan link.
  await expect(page.locator('.co-plan')).toHaveCount(0);
  await expect(page.locator('h1')).toContainText('Complete your subscription');
  await expect(page.locator('[data-co-change]')).toHaveAttribute('href', /\/choose-plan/);

  await page.fill('input[name="discountCode"]', 'welcome25');
  await page.locator('[data-co-apply]').click();
  await expect(page.locator('[data-co-code-note]')).toContainText('WELCOME25');
});

test('checkout routes non-payable states to the right step', async ({ page }) => {
  // Free never sees a payment page.
  await page.goto('/checkout?tier=free', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/signup\?tier=free/);
  // No plan chosen yet: the dedicated selection step.
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/choose-plan/);
});

test('login offers the forgot-password flow from the product', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.locator('[data-login-forgot]').click();
  await expect(page.locator('[data-login-title]')).toHaveText('Reset your password');
  await expect(page.locator('input[name="password"]')).toBeHidden();
  await expect(page.locator('[data-login-submit]')).toHaveText('Send reset link');
  await page.locator('[data-login-back]').click();
  await expect(page.locator('[data-login-title]')).toHaveText('Log in to Lumecon');
});

/* This used to assert a two-step registration with a password checklist and a
   back button. /signup stopped being that when it became the private-beta
   request page: there is one panel, no password field and no step 2, so the
   test had been asserting a flow that does not exist. Rewritten against the
   page as it is. (Found while acting on Brian's note about viewport and
   timing on this test, #300.) */
test('signup collects a beta access request, with no account created', async ({ page }) => {
  // Pin the width: the split layout and the role chips wrap differently on a
  // narrow default viewport, and this asserts on their desktop arrangement.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  // The form says when its wiring is live. Waiting on that beats a sleep:
  // the chips below do nothing until the script has bound them.
  await expect(page.locator('[data-auth-form][data-auth-ready]')).toBeAttached();

  await expect(page.locator('[data-auth-form]')).toHaveAttribute('data-auth-kind', 'beta-request');
  await expect(page.locator('h1')).toHaveText('Lumecon is in private beta');

  // Everything the request needs, on one panel.
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="organization"]')).toBeVisible();
  await expect(page.locator('select[name="organizationType"]')).toBeVisible();

  // No credential is collected while the beta is closed.
  await expect(page.locator('input[name="password"]')).toHaveCount(0);

  // Tribal governance roles join the shared role list only when the
  // organization identifies as a Tribal Nation.
  await expect(page.locator('[data-tribal-role]:visible')).toHaveCount(0);
  await page.selectOption('select[name="organizationType"]', 'tribal_nation');
  await expect(page.locator('[data-tribal-role]:visible')).toHaveCount(3);
  await page.selectOption('select[name="organizationType"]', 'government');
  await expect(page.locator('[data-tribal-role]:visible')).toHaveCount(0);

  // The role chips are a single-select mirrored into a hidden field.
  await page.locator('[data-role-chip]', { hasText: 'Consultant' }).click();
  await expect(page.locator('[data-role-chip][aria-pressed="true"]')).toHaveCount(1);

  await expect(page.locator('[data-auth-submit]')).toHaveText('Request access');
});

test('methodology page renders equations with spoken readings', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  const equations = page.locator('.eq[role="math"]');
  await expect(equations).toHaveCount(6);
  // Every equation block must carry a plain-language reading for
  // assistive technology.
  for (const eq of await equations.all()) {
    expect(await eq.getAttribute('aria-label')).toBeTruthy();
  }
  await expect(equations.nth(1)).toContainText('x = (I − A)−1 f');
});

test('naics page lists all 20 sectors plus tribal government', async ({ page }) => {
  await page.goto('/naics', { waitUntil: 'domcontentloaded' });
  const tiles = page.locator('.naics-tile');
  await expect(tiles).toHaveCount(21);
  // The methodology's why-two-digits section is the page's companion.
  await expect(page.locator('.meth-hero__lede a[href="/methodology#m-naics"]')).toBeVisible();
  // Hover text exists in the DOM for every tile, manufacturing included.
  await expect(page.locator('#naics-manufacturing .naics-tile__desc')).toContainText('materials');
  await expect(page.locator('#naics-tribalgov .naics-tile__desc')).toContainText('Lumecon category');
});

test('methodology explains the two-digit NAICS choice', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  // The methodology sections are disclosure cards now: the hook is on the
  // face, the argument is behind it. The /naics browser is no longer linked
  // from here by design.
  const card = page.locator('details#m-naics');
  await expect(card.locator('.mcard__title')).toHaveText('Industries at the two-digit NAICS level');
  await expect(card).toContainText('administrative data coverage is strongest');
  await card.locator('.mcard__face').click();
  await expect(card.locator('.mcard__body')).toContainText(
    'North American Industry Classification System',
  );
});

test('accessibility statement is published and linked from the footer', async ({ page }) => {
  await page.goto('/accessibility', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText('Accessibility');
  await expect(page.locator('main')).toContainText('WCAG');
  await expect(page.locator('footer a[href="/accessibility"]')).toHaveText('Accessibility');
});

test('skip link targets real content on subpages', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main#top')).toHaveCount(1);
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main#top')).toHaveCount(1);
});

test('cedar page tells the AI story with three real captures, no diagrams', async ({ page }) => {
  await page.goto('/cedar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('AI built for economic analysis');
  // Exactly the three-shot story, told through the shared product tour:
  // upload, entities in the loop, partner context. Diagrams were removed by
  // design; no screenshot repeats.
  await expect(page.locator('.cedarpg-diagram')).toHaveCount(0);
  await expect(page.locator('.tour-row__shot img')).toHaveCount(3);
  await expect(page.locator('img[src="/app/cedar-wind-upload.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/app/cedar-wind-entities.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/app/cedar-context.webp"]')).toHaveCount(1);
  await expect(page.locator('#navMenu a[href="/cedar"]')).toHaveCount(1);
  await expect(page.locator('footer a[href="/cedar"]')).toHaveCount(1);
});

test('homepage keeps Cedar to a teaser and drops the AI-tile block', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Cedar gets one card in the why band and a link out. The old dedicated
  // #cedar section and the AI tile block are both gone.
  const card = page.locator('#why .whyw-card', { hasText: 'Cedar included' });
  await expect(card).toHaveCount(1);
  await expect(card.locator('a[href="/cedar"]')).toHaveCount(1);
  await expect(page.locator('.askai')).toHaveCount(0);
});

test('methodology hosts the AI-research verification block', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.askai')).toHaveCount(1);
  await expect(page.locator('.askai-tile')).toHaveCount(6);
});

test('choose-plan offers the three plans and a free start', async ({ page }) => {
  await page.goto('/choose-plan', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('How will you use Lumecon?');
  await expect(page.locator('[data-plan-link]')).toHaveCount(3);
  await expect(page.locator('[data-plan-link="sapling"]')).toContainText('Sapling');
  // Without a signup handoff, Start free routes through account creation.
  await expect(page.locator('[data-free-link]')).toHaveAttribute('href', /\/signup\?tier=free/);
  // The transactional flow keeps one obvious action: no Cedar launcher.
  await expect(page.locator('.cedar-fab')).toHaveCount(0);
});

test('welcome closes the flow in full teal with one action', async ({ page }) => {
  await page.goto('/welcome?plan=free', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText(/You.re in\./);
  await expect(page.locator('[data-welcome-kicker]')).toHaveText('Seed account ready');
  await expect(page.locator('a.welc-btn')).toHaveAttribute('href', '/login');
  await expect(page.locator('.cedar-fab')).toHaveCount(0);
});
