import { test, expect } from '@playwright/test';

/**
 * Smoke suite. Catches the regressions we've actually hit (broken icon
 * renders, empty viewport, leaking skip-link, hero cycle failing to
 * start, demo route 404). Intentionally narrow — perf and a11y are
 * covered by Lighthouse CI, not here.
 */

test('home page loads and renders the hero map', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Lumecon/i);
  await expect(page.locator('#heroMap')).toBeVisible();
  await expect(page.locator('.hero-state').first()).toBeAttached();

  // Filter out known harmless console errors (cert + meta-CSP warnings).
  const real = errs.filter(e =>
    !e.includes('CERT_AUTHORITY_INVALID') &&
    !e.includes('frame-ancestors') &&
    !e.includes('ipapi.co')
  );
  expect(real).toEqual([]);
});

test('auto-cycle fires a study within 10s', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  // The header region gets populated with the full chip when a scene
  // starts running. Levels: STATE / COUNTY / RESERVATION / ANCSA
  // REGION / NHO. (URL hash is no longer used — /demo/<slug> pages
  // are the canonical shareable paths.)
  await expect(page.locator('#workspaceRegion'))
    .toContainText(/STATE|COUNTY|RESERVATION|ANCSA REGION|NHO/, { timeout: 10_000 });
});

test('"New study" button cycles through levels', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const observedLevels: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.locator('#workspaceAgain').click();
    await page.waitForTimeout(1200);
    const chip = await page.locator('#workspaceRegion').textContent();
    // First chip token before the bullet is the level. The reservation
    // pool now includes ANCSA REGION and NHO entries; normalize those
    // to RESERVATION so the rotating-pool assertion stays stable.
    let level = chip?.trim().split(' ·')[0] || '';
    if (level === 'ANCSA REGION' || level === 'NHO') level = 'RESERVATION';
    if (level) observedLevels.push(level);
  }
  expect(observedLevels).toEqual(['STATE', 'COUNTY', 'RESERVATION']);
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
  await page.goto('/demo/county-community-health-clinic-pierce-county-wa', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Community health clinic');
  await expect(page.locator('.demo-fig dt').first()).toHaveText('Direct');
  await expect(page.locator('.demo-fig--total dt')).toHaveText('Total impact');
  await expect(page.locator('.demo-fig dd')).toContainText([/\$5M/, /\$2\.3M/, /\$3\.6/, /\$10\.9/, /≈\s*\d/]);
});

test('aiannh polygons are not inlined in SSR HTML; populate at runtime', async ({ request, page }) => {
  // Grep the raw HTML response to confirm the polygons aren't inlined.
  const r = await request.get('/');
  const html = await r.text();
  const inlined = (html.match(/class="hero-aiannh/g) || []).length;
  expect(inlined).toBe(0);
  // Then verify they populate at runtime.
  await page.goto('/');
  await page.waitForFunction(
    () => (document.querySelectorAll('.hero-aiannh').length || 0) > 100,
    null,
    { timeout: 8000 }
  );
});

test('keyboard shortcut S triggers a new study', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const before = await page.locator('#workspaceRegion').textContent();
  await page.keyboard.press('s');
  await page.waitForTimeout(1200);
  const after = await page.locator('#workspaceRegion').textContent();
  expect(after).not.toBe(before);
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
  await expect(page.locator('.area-card__person[href="/team/elijah-moreno"]').first()).toBeAttached();
});

test('individual team-member pages render the full bio off the about page', async ({ page }) => {
  await page.goto('/team/elijah-moreno', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Elijah Moreno \| Lumecon/i);
  await expect(page.locator('h1')).toContainText('Elijah Moreno');
  await expect(page.locator('.person-page__back').first()).toBeVisible();
  // The long bio that used to live on the about card now lives here.
  await expect(page.locator('.person-page__bio p').first()).toContainText(/Cornell|Lumecon/);
  // Selected work renders for those who have publications (the databook).
  await expect(page.locator('.person-pub').first()).toBeVisible();
});

test('pricing platform pick reveals the three tier cards', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  // The tier grid is gated behind a platform pick.
  const tierSection = page.locator('[data-platform-section]').first();
  await expect(tierSection).toBeHidden();
  await page.locator('.pricing-platform-tile[data-platform-id="tribal-economic-impact"]').click();
  await expect(tierSection).toBeVisible();
  await expect(page.locator('.pricing-tier-card')).toHaveCount(3);
  // Active-tier CTA routes into the signup flow with the tier id.
  await expect(page.locator('.pricing-tier-card .btn').first()).toHaveAttribute('href', /\/signup\?tier=/);
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

