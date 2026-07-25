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
  // The homepage hero leads with the trio money shot (results front,
  // dashboard and lineage behind); the interactive map lives on /map
  // (exercised by the tests below).
  await expect(page.locator('#heroRotator img')).toBeVisible();
  // The product tour renders its screenshot rows below the hero.
  expect(await page.locator('.tour-row img').count()).toBeGreaterThan(2);

  // Filter out a known-harmless console error (TLS cert on the preview host).
  // (The old frame-ancestors meta-CSP warning and the ipapi.co geolocation
  // call were both removed, so they can no longer appear here.)
  const real = errs.filter((e) => !e.includes('CERT_AUTHORITY_INVALID'));
  expect(real).toEqual([]);
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

test('checkout preselects the plan from the query and takes a discount code', async ({ page }) => {
  await page.goto('/checkout?tier=leader', { waitUntil: 'domcontentloaded' });
  const selected = page.locator('.co-plan--on');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText('Tree');
  await expect(page.locator('[data-co-total]')).toHaveText('$7,500');

  await page.locator('[data-co-plan="starter"]').click();
  await expect(page.locator('[data-co-total]')).toHaveText('$500');

  await page.fill('input[name="discountCode"]', 'welcome25');
  await page.locator('[data-co-apply]').click();
  await expect(page.locator('[data-co-code-note]')).toContainText('WELCOME25');
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

test('cedar page tells the AI story with diagrams and real captures', async ({ page }) => {
  await page.goto('/cedar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('AI built for economic analysis');
  await expect(page.locator('.cedarpg-diagram')).toHaveCount(3);
  await expect(page.locator('img[src="/app/cedar-wind-intake.webp"]')).toBeVisible();
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

test('checkout offers the free trial with no payment step', async ({ page }) => {
  await page.goto('/checkout?tier=free', { waitUntil: 'domcontentloaded' });
  const selected = page.locator('.co-plan--on');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText('Free trial');
  await expect(page.locator('[data-co-total]')).toHaveText('$0');
  await expect(page.locator('[data-co-submit]')).toHaveText('Start your free trial');
  await expect(page.locator('input[name="discountCode"]')).toBeHidden();
});
