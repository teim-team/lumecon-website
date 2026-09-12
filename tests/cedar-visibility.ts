import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The launcher intentionally stays out of the opening composition and
 * yields to protected content. Move through the real page until its
 * visibility controller finds a clear resting place.
 */
export async function scrollUntilCedarVisible(page: Page): Promise<Locator> {
  const fab = page.locator('#cedarFab');
  // Compute positions after fonts and eager assets settle. The product's
  // collision controller reads the same layout on an animation frame.
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const positions = await page.evaluate(() => {
    const intro = document.querySelector<HTMLElement>('main > :first-child');
    const introEnd = intro ? intro.getBoundingClientRect().bottom + window.scrollY + 24 : 240;
    const last = Math.max(introEnd, document.documentElement.scrollHeight - window.innerHeight);
    const count = 72;
    return Array.from({ length: count + 1 }, (_, index) =>
      Math.round(introEnd + ((last - introEnd) * index) / count),
    );
  });

  for (const position of positions) {
    await page.evaluate(async (top) => {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }, position);
    if ((await fab.getAttribute('data-cedar-visibility')) === 'visible') {
      await expect(fab).toBeVisible();
      return fab;
    }
  }

  await expect(fab).toHaveAttribute('data-cedar-visibility', 'visible');
  return fab;
}
