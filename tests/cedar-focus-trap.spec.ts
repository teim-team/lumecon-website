import { test, expect } from '@playwright/test';

/**
 * Cedar FAB focus-trap (#9).
 *
 * While the chat panel is open it behaves like a modal dialog: keyboard
 * focus must stay between the FAB (the Close control in this state) and
 * the panel's own controls, and Escape must close it and return focus to
 * the FAB. Guards keyboard accessibility for the floating chat.
 *
 * Chromium only — focus semantics are engine-independent and headless
 * WebKit is unreliable in CI (see playwright.config.ts).
 */

test('open Cedar panel traps Tab focus and Escape returns focus to the FAB', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Focus semantics are engine-independent; headless WebKit is unreliable in CI.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const fab = page.locator('#cedarFab');
  const panel = page.locator('#cedarFabPanel');
  await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 5000 });

  await fab.click();
  await expect(panel.locator('[data-cedar-input]')).toBeFocused();

  // Tab through the dialog repeatedly; focus must never escape to the
  // page behind it — it stays on the FAB or inside the panel.
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const contained = await page.evaluate(() => {
      const a = document.activeElement;
      const fabEl = document.getElementById('cedarFab');
      const panelEl = document.getElementById('cedarFabPanel');
      return !!a && !!fabEl && !!panelEl && (a === fabEl || panelEl.contains(a));
    });
    expect(contained, `focus escaped the dialog after ${i + 1} Tab(s)`).toBe(true);
  }

  // Shift+Tab from the FAB wraps back into the panel rather than leaving.
  await fab.focus();
  await page.keyboard.press('Shift+Tab');
  const wrappedIntoPanel = await page.evaluate(() => {
    const a = document.activeElement;
    const panelEl = document.getElementById('cedarFabPanel');
    return !!a && !!panelEl && panelEl.contains(a);
  });
  expect(wrappedIntoPanel).toBe(true);

  // Escape closes the panel and returns focus to the FAB.
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(fab).toBeFocused();
});
