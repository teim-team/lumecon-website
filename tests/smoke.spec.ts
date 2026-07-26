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

  // Filter out a known-harmless console error (TLS cert on the preview host).
  // (The old frame-ancestors meta-CSP warning and the ipapi.co geolocation
  // call were both removed, so they can no longer appear here.)
  const real = errs.filter((e) => !e.includes('CERT_AUTHORITY_INVALID'));
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

test('pricing shows three public plans with Sapling recommended', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  // One platform, three plans — no platform picker, no gating.
  await expect(page.locator('.pr-plan')).toHaveCount(3);
  await expect(page.locator('.pr-plan--featured .pr-plan__name')).toHaveText('Sapling');
  await expect(page.locator('#plan-starter .pr-plan__amount')).toHaveText('$500');
  await expect(page.locator('#plan-standard .pr-plan__amount')).toHaveText('$2,500');
  await expect(page.locator('#plan-leader .pr-plan__amount')).toHaveText('$7,500');
  // Plan CTAs route into signup with the stable tier id.
  await expect(page.locator('#plan-starter .pr-plan__cta')).toHaveAttribute(
    'href',
    /\/signup\?tier=starter/,
  );
  // The nine-row detail table renders (Cedar, Team Workspace, Cedar Grove rows included).
  await expect(page.locator('[data-plan-table] tbody tr')).toHaveCount(9);
  await expect(page.locator('[data-plan-table]')).toContainText('Cedar Grove');
});

test('pricing carries the competitive transition offer and consultant CTA', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  const offer = page.locator('#switch');
  await expect(offer).toContainText('Switching economic impact software?');
  await expect(offer).toContainText('whichever is lower');
  await expect(offer.locator('a.btn2')).toHaveAttribute('href', /^mailto:/);
  // Consultant licensing is custom-priced: a CTA, not a public tier.
  const consult = page.locator('#consultants');
  await expect(consult).toContainText('Lumecon for consultants');
  await expect(consult.locator('a.btn2')).toHaveAttribute('href', /^mailto:/);
});

test('signup reflects a plan carried over from pricing', async ({ page }) => {
  await page.goto('/signup?tier=standard', { waitUntil: 'domcontentloaded' });
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
  await page.goto('/checkout?tier=leader', { waitUntil: 'domcontentloaded' });
  // The order summary reflects the already-chosen plan.
  const summary = page.locator('[data-co-summary="leader"]');
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

test('signup walks the two-step registration flow from the product', async ({ page }) => {
  await page.goto('/signup', { waitUntil: 'domcontentloaded' });

  // Step 1: who you are. Email/password are not shown yet.
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeHidden();
  await page.fill('input[name="name"]', 'Test Person');
  await page.fill('input[name="organization"]', 'Test Nation');
  await page.locator('[data-role-chip]', { hasText: 'Consultant' }).click();
  await page.locator('[data-auth-submit]').click();

  // Step 2: account credentials, with the live password rule checklist.
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await page.fill('input[name="password"]', 'Correct-Horse-42');
  await expect(page.locator('[data-pwrule="length"]')).toHaveClass(/pwrules--met/);
  await expect(page.locator('[data-auth-back]')).toBeVisible();
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
  const sec = page.locator('section[aria-labelledby="m-naics"]');
  await expect(sec.locator('h2')).toHaveText('Industries at the two-digit NAICS level');
  await expect(sec).toContainText('administrative data coverage is strongest');
  await expect(sec.locator('a[href="/naics"]')).toBeVisible();
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
  // Exactly the three-shot story: upload, operations with Cedar's ask,
  // board notes. Diagrams were removed by design; no screenshot repeats.
  await expect(page.locator('.cedarpg-diagram')).toHaveCount(0);
  const shots = page.locator('.cedarpg-shot img');
  await expect(shots).toHaveCount(3);
  await expect(page.locator('img[src="/app/cedar-wind-upload.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/app/cedar-wind-entities.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/app/cedar-wind-partner.webp"]')).toHaveCount(1);
  await expect(page.locator('#navMenu a[href="/cedar"]')).toHaveCount(1);
  await expect(page.locator('footer a[href="/cedar"]')).toHaveCount(1);
});

test('homepage keeps Cedar to a teaser and drops the AI-tile block', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#cedar a[href="/cedar"]')).toHaveCount(1);
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
  await expect(page.locator('[data-plan-link="standard"]')).toContainText('Sapling');
  // Without a signup handoff, Start free routes through account creation.
  await expect(page.locator('[data-free-link]')).toHaveAttribute('href', /\/signup\?tier=free/);
  // The transactional flow keeps one obvious action: no Cedar launcher.
  await expect(page.locator('.cedar-fab')).toHaveCount(0);
});

test('welcome closes the flow in full teal with one action', async ({ page }) => {
  await page.goto('/welcome?plan=free', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText(/You.re in\./);
  await expect(page.locator('[data-welcome-kicker]')).toHaveText('Free trial ready');
  await expect(page.locator('a.welc-btn')).toHaveAttribute('href', '/login');
  await expect(page.locator('.cedar-fab')).toHaveCount(0);
});
