import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Cedar classifier routing tests.
 *
 * Drives the real Cedar FAB (the same bootChat() runtime that ships) and
 * asserts representative questions land on the right intent, that
 * out-of-scope questions get the out-of-scope reply, that a genuinely
 * ambiguous message triggers the clarify prompt rather than a guess, and
 * that a single-typo word still routes. This guards the keyword
 * classifier (classify / localAnswer / topMatches / fuzzyMatch) end to
 * end — through the DOM, not just the pure functions — so a trigger edit
 * that silently breaks routing is caught.
 *
 * Reduced motion is emulated so replies stream instantly and the
 * thinking pause collapses, keeping the suite fast and deterministic.
 *
 * Chromium only: the chat is plain DOM/JS and works on WebKit, but
 * headless WebKit is unreliable in CI (see playwright.config.ts), and
 * routing is engine-independent — running it once on Chromium is enough.
 */

async function openCedar(page: Page): Promise<Locator> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const panel = page.locator('#cedarFabPanel');
  // bootChat() stamps this once the runtime is wired (on page load).
  await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 5000 });
  await page.locator('#cedarFab').click();
  await expect(panel.locator('[data-cedar-input]')).toBeVisible();
  return panel;
}

/** Send a free-text question and resolve once a fresh bot reply lands. */
async function ask(panel: Locator, text: string): Promise<Locator> {
  const before = await panel.locator('.cedar-msg--bot').count();
  const input = panel.locator('[data-cedar-input]');
  await input.fill(text);
  await input.press('Enter');
  // A new bot bubble (the reply) is appended for every send.
  await expect(panel.locator('.cedar-msg--bot')).toHaveCount(before + 1, { timeout: 6000 });
  return panel.locator('.cedar-msg--bot .cedar-msg__bubble').last();
}

test('cedar routes representative questions to the right intent', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Routing is engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);

  const cases: Array<{ q: string; expect: string }> = [
    { q: 'what does lumecon do', expect: 'a council memo, a grant narrative' },
    { q: 'how much does it cost', expect: 'covers unlimited studies across every geography' },
    { q: 'does this work for tribal nations', expect: 'built specifically for tribal nations' },
    { q: 'EPA grant', expect: 'one of the most common uses of Lumecon' },
    { q: 'how long does it take', expect: 'A standard study takes minutes' },
    { q: 'can I see a demo', expect: 'Happy to set one up' },
    { q: 'what is cedar', expect: 'Inside the platform I read your administrative files' },
    { q: 'how is this different from implan', expect: 'Same underlying economics' },
  ];

  for (const c of cases) {
    const bubble = await ask(panel, c.q);
    await expect(bubble, `"${c.q}" should route to its intent`).toContainText(c.expect, { timeout: 6000 });
  }
});

test('cedar sends an off-topic question to the out-of-scope reply', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Routing is engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);
  const bubble = await ask(panel, 'who is the president of mexico');
  await expect(bubble).toContainText("I'm Cedar, Lumecon's site assistant, so I'm best");
});

test('cedar asks to clarify when a message is genuinely ambiguous', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Routing is engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);
  // "implan pricing" ties competitors and pricing at the top score — two
  // distinct chip-bearing topics, so Cedar should ask rather than guess.
  const bubble = await ask(panel, 'implan pricing');
  await expect(bubble).toContainText('did you mean');
});

test('cedar tolerates a single-letter typo', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Routing is engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);
  // "pricng" is one edit from the "pricing" trigger.
  const bubble = await ask(panel, 'pricng');
  await expect(bubble).toContainText('five figures a year');
});
