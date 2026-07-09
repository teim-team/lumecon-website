import { test, expect } from '@playwright/test';

/**
 * The Cedar helper nudge: a one-time-per-session bubble above the
 * launcher pill that offers help with any questions. Covers the three
 * behaviours that matter: it appears after the delay, its CTA opens
 * the chat, and dismissing it (or opening the chat) keeps it away for
 * the rest of the session.
 *
 * The show delay is 4s (NUDGE_DELAY_MS in CedarFAB.astro), so the
 * visibility waits use a 10s timeout instead of the default.
 */

test('nudge appears, CTA opens the chat, and it stays away for the session', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const nudge = page.locator('#cedarNudge');
  await expect(nudge).toBeVisible({ timeout: 10_000 });

  await page.locator('#cedarNudgeCta').click();
  await expect(page.locator('#cedarFabPanel')).toBeVisible();
  await expect(nudge).toBeHidden();

  // Close the chat, reload, and wait past the show delay: the nudge
  // must not come back within this browser session.
  await page.locator('#cedarFab').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  await expect(nudge).toBeHidden();
});

test('dismiss hides the nudge without opening the chat', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const nudge = page.locator('#cedarNudge');
  await expect(nudge).toBeVisible({ timeout: 10_000 });

  await page.locator('#cedarNudgeDismiss').click();
  await expect(nudge).toBeHidden();
  await expect(page.locator('#cedarFabPanel')).toBeHidden();
});

test('launcher pill shows the Ask Cedar label and context line', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const fab = page.locator('#cedarFab');
  await expect(fab).toBeVisible();
  await expect(fab).toContainText('Ask Cedar');
  await expect(fab).toContainText('Questions about Lumecon');

  // Open state swaps the pill for the Close control, as before.
  await fab.click();
  await expect(page.locator('#cedarFabPanel')).toBeVisible();
  await expect(fab).toContainText('Close');
});
