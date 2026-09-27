import { test, expect } from '@playwright/test';

/**
 * Ask Cedar on lumecon.ai (owner, 2026-09-27).
 *
 * The launcher is the same pill as Cedar Press: the teal status dot,
 * "Ask Cedar" and whose Cedar it is, with no logo. It is on every page but
 * the acquisition flow and /cedar, visible from the first frame, and it no
 * longer steps aside over tables, prices or the footer.
 *
 * The greeting note rises once the visitor scrolls into the page, at every
 * width, and stays until it is dismissed or Cedar is opened. Dismissing it
 * holds for the rest of the visit.
 */

test('the launcher is visible from the first frame, with the dot and no logo', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const fab = page.locator('#cedarFab');
  await expect(fab).toBeVisible();
  await expect(fab).toHaveAttribute('data-cedar-visibility', 'visible');
  await expect(fab).toContainText('Ask Cedar');
  await expect(fab).toContainText('Lumecon');
  await expect(fab.locator('img')).toHaveCount(0);
  await expect(fab.locator('.cedar-fab__dot')).toBeVisible();

  // Open state swaps the pill for the Close control, as before.
  await fab.click();
  await expect(page.locator('#cedarFabPanel')).toBeVisible();
  await expect(fab).toContainText('Close');
});

test('the launcher stays visible to the bottom of a long page', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  const fab = page.locator('#cedarFab');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top <= height; top += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await expect(fab).toBeVisible();
  }
});

for (const path of ['/cedar-grove', '/security', '/terms', '/privacy', '/this-page-does-not-exist']) {
  test(`Ask Cedar is on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#cedarFab')).toBeVisible();
  });
}

test('the greeting rises on scroll at desktop width and persists until dismissed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const nudge = page.locator('#cedarNudge');
  await expect(nudge).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await expect(nudge).toBeVisible({ timeout: 5000 });
  await expect(nudge).toContainText("Hi, I'm Cedar.");
  await expect(nudge).not.toContainText(/\p{Extended_Pictographic}/u);

  // It stays over whatever passes under it, down to the footer.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  await expect(nudge).toBeVisible();

  // It greets again on the next page until it is answered...
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await expect(nudge).toBeVisible({ timeout: 5000 });

  // ...and dismissing it holds for the rest of the visit.
  await page.locator('#cedarNudgeDismiss').click();
  await expect(nudge).toBeHidden();
  await expect(page.locator('#cedarFabPanel')).toBeHidden();
  await page.goto('/team', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForTimeout(2500);
  await expect(nudge).toBeHidden();
});

test('clicking the greeting opens Cedar', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  const nudge = page.locator('#cedarNudge');
  await expect(nudge).toBeVisible({ timeout: 5000 });
  await nudge.locator('.cedar-nudge__text').click();
  await expect(page.locator('#cedarFabPanel')).toBeVisible();
  await expect(nudge).toBeHidden();
});

test('Cedar page uses its dedicated editorial surface without a duplicate launcher', async ({
  page,
}) => {
  await page.goto('/cedar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#cedarFab')).toHaveCount(0);
  await expect(page.locator('.cedarpg .cedarpg-hero')).toHaveCount(1);
  await expect(page.locator('.cedarpg [data-zoom]')).toHaveCount(4);
});
