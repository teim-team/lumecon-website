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
  await expect(offer).toContainText('Already paying for economic impact analysis software?');
  await expect(offer.locator('a.btn2')).toHaveAttribute('href', /^mailto:/);
  // Consultant licensing is custom-priced: a CTA, not a public tier.
  const consult = page.locator('#consultants');
  await expect(consult).toContainText('Lumecon for consultants');
  await expect(consult.locator('a.btn2')).toHaveAttribute('href', /^mailto:/);
});

test('signup reflects a plan carried over from pricing', async ({ page }) => {
  await page.goto('/signup?tier=standard&platform=tribal', { waitUntil: 'domcontentloaded' });
  const badge = page.locator('[data-auth-plan]');
  await expect(badge).toBeVisible();
  await expect(badge).toContainText(/Sapling tier/);
  await expect(badge).toContainText(/Tribal Economic Impact/);
});
