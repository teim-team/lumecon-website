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
  // The chip text gets populated when a scene starts running.
  await expect(page.locator('#workspaceActivity'))
    .toContainText(/STATE|COUNTY|RESERVATION/, { timeout: 10_000 });
  // The URL hash should also reflect the scene.
  await page.waitForTimeout(1500);
  const hash = await page.evaluate(() => location.hash);
  expect(hash).toMatch(/^#study=/);
});

test('"New study" button cycles through levels', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const observedLevels: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.locator('#workspaceAgain').click();
    await page.waitForTimeout(1200);
    const chip = await page.locator('#workspaceActivity').textContent();
    const level = chip?.trim().split(' ·')[0];
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
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => location.hash);
  await page.keyboard.press('s');
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => location.hash);
  expect(after).not.toBe(before);
  expect(after).toMatch(/^#study=/);
});
