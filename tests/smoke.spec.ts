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

test('demo page renders with real figures', async ({ page }) => {
  // Use a stable county-level scene whose chip / slug isn't likely to
  // change in copy-tightening passes.
  await page.goto('/demo/county-community-health-clinic-pierce-county-wa', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('h1')).toContainText('Community health clinic');
  await expect(page.locator('.demo-fig dt').first()).toHaveText('Direct');
  await expect(page.locator('.demo-fig--total dt')).toHaveText('Total impact');
  await expect(page.locator('.demo-fig dd')).toContainText([
    /\$5M/,
    /\$2\.3M/,
    /\$3\.6/,
    /\$10\.9/,
    /≈\s*\d/,
  ]);
});

/* Coverage for the pages built out after the homepage map: the
 * about/team page, the pricing platform-pick reveal, and the inline
 * Cedar chat. These are newer surfaces and therefore the most
 * regression-prone in copy-tightening and refactor passes. */

test('about page is just the About and How-we-work sections', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/About \| Lumecon/i);
  // The roster card grids are gone; the page leans on How We Work.
  await expect(page.locator('.person-card')).toHaveCount(0);
  // Six working-area cards, each naming clickable people.
  await expect(page.locator('.area-card')).toHaveCount(6);
  // Names in the working areas link to each person's /team/<slug> page.
  await expect(
    page.locator('.area-card__person[href="/team/elijah-moreno"]').first(),
  ).toBeAttached();
});

test('individual team-member pages render the full bio off the about page', async ({ page }) => {
  await page.goto('/team/elijah-moreno', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Elijah Moreno.*\| Lumecon/i);
  await expect(page.locator('h1')).toContainText('Elijah Moreno');
  await expect(page.locator('.person-page__back').first()).toBeVisible();
  // The long bio that used to live on the about card now lives here.
  await expect(page.locator('.person-page__bio p').first()).toContainText(/Cornell|Lumecon/);
  // Selected work renders for those who have publications (the databook).
  await expect(page.locator('.person-pub').first()).toBeVisible();
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
  await expect(offer).toContainText('Already paying for economic impact analysis software?');
  await expect(offer.locator('a.btn2')).toHaveAttribute('href', /^mailto:/);
  // Consultant licensing is custom-priced: a CTA, not a public tier.
  const consult = page.locator('#consultants');
  await expect(consult).toContainText('Lumecon for consultants');
  await expect(consult.locator('a.btn2')).toHaveAttribute('href', /^mailto:/);
});

test('cedar page boots the inline chat panel', async ({ page }) => {
  await page.goto('/cedar', { waitUntil: 'networkidle' });
  const panel = page.locator('#cedarInlinePanel');
  await expect(panel).toBeVisible();
  // bootChat() stamps data-cedar-booted on the root once wired.
  await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 5000 });
  await expect(panel.locator('.cedar-chip').first()).toBeVisible();
});

test('signup reflects a plan carried over from pricing', async ({ page }) => {
  await page.goto('/signup?tier=standard&platform=tribal', { waitUntil: 'domcontentloaded' });
  const badge = page.locator('[data-auth-plan]');
  await expect(badge).toBeVisible();
  await expect(badge).toContainText(/Sapling tier/);
  await expect(badge).toContainText(/Tribal Economic Impact/);
});
