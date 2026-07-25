import { test, expect } from '@playwright/test';

/**
 * The Cedar helper nudge no longer auto-appears: unprompted popups
 * read as spam next to the v3 design, so the show timer was removed
 * (CedarFAB.astro). The bubble markup remains for future deliberate
 * surfaces. These tests pin the new behaviour: the nudge stays
 * hidden on its own, and the launcher pill still works.
 */

test('nudge does not auto-appear', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const nudge = page.locator('#cedarNudge');
  // Wait past the old 4s show delay: nothing should pop.
  await page.waitForTimeout(6000);
  await expect(nudge).toBeHidden();
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
