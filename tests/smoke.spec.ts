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

/* Map tests run on both engines now (#100). They previously skipped
   WebKit because fixed-timeout waits were flaky on the d3-geo map under
   headless Safari; the waits below key off real conditions (the map
   actually rendering, the chip text actually changing) instead, which
   is robust on both engines. WebKit is the informational CI lane, so if
   a render genuinely can't complete headless it surfaces there without
   blocking the merge gate. */
test('map page renders the interactive hero map', async ({ page }) => {
  await page.goto('/map', { waitUntil: 'networkidle' });
  await expect(page.locator('#heroMap')).toBeVisible();
  // The state paths are server-rendered, so their presence confirms the
  // SVG shipped. The genuine runtime-boot check (the script actually
  // running a study) is the auto-cycle test below, which waits for the
  // chip to populate — a signal that only appears once hero.ts runs.
  await expect(page.locator('.hero-state').first()).toBeAttached();
  expect(await page.locator('.hero-state').count()).toBeGreaterThan(40); // ~50 states + DC
});

test('auto-cycle fires a study within 10s', async ({ page }) => {
  await page.goto('/map', { waitUntil: 'networkidle' });
  // The header region gets populated with the full chip when a scene
  // starts running. Levels: STATE / COUNTY / RESERVATION / ANCSA
  // REGION / NHO. (URL hash is no longer used — /demo/<slug> pages
  // are the canonical shareable paths.)
  await expect(page.locator('#workspaceRegion')).toContainText(
    /STATE|COUNTY|RESERVATION|ANCSA REGION|NHO/,
    { timeout: 10_000 },
  );
});

test('"New study" button cycles through levels', async ({ page }) => {
  await page.goto('/map', { waitUntil: 'networkidle' });
  const region = page.locator('#workspaceRegion');
  // Wait for the first auto-study to land before driving the button.
  await expect(region).toContainText(/STATE|COUNTY|RESERVATION|ANCSA REGION|NHO/, {
    timeout: 10_000,
  });
  const observedLevels: string[] = [];
  for (let i = 0; i < 3; i++) {
    const prev = await region.textContent();
    await page.locator('#workspaceAgain').click();
    // Wait until the chip text actually changes (the study re-ran)
    // instead of a fixed delay — robust across engines and CI load.
    await expect.poll(async () => await region.textContent(), { timeout: 8000 }).not.toBe(prev);
    const chip = await region.textContent();
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

test('aiannh polygons are not inlined in SSR HTML; populate at runtime', async ({
  request,
  page,
}) => {
  // Grep the raw HTML response to confirm the polygons aren't inlined.
  const r = await request.get('/map');
  const html = await r.text();
  const inlined = (html.match(/class="hero-aiannh/g) || []).length;
  expect(inlined).toBe(0);
  // Then verify they populate at runtime.
  await page.goto('/map');
  await page.waitForFunction(
    () => (document.querySelectorAll('.hero-aiannh').length || 0) > 100,
    null,
    { timeout: 8000 },
  );
});

test('keyboard shortcut S triggers a new study', async ({ page }) => {
  await page.goto('/map', { waitUntil: 'networkidle' });
  const region = page.locator('#workspaceRegion');
  // Wait for the first auto-study so there's a baseline chip to change.
  await expect(region).toContainText(/STATE|COUNTY|RESERVATION|ANCSA REGION|NHO/, {
    timeout: 10_000,
  });
  const before = await region.textContent();
  await page.keyboard.press('s');
  await expect.poll(async () => await region.textContent(), { timeout: 8000 }).not.toBe(before);
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
