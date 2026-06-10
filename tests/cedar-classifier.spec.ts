import { test, expect, type Page, type Locator } from '@playwright/test';
import { INTENTS, CHIP_IDS, FALLBACK_ANSWER } from '../src/data/cedarIntents';

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
  test.skip(
    browserName !== 'chromium',
    'Routing is engine-independent; headless WebKit is unreliable in CI.',
  );
  const panel = await openCedar(page);

  const cases: Array<{ q: string; expect: string }> = [
    { q: 'what does lumecon do', expect: 'a council memo, a grant narrative' },
    { q: 'how much does it cost', expect: 'per-study or per-geography' },
    { q: 'does this work for tribal nations', expect: 'built specifically for tribal nations' },
    { q: 'EPA grant', expect: 'one of the most common uses of Lumecon' },
    { q: 'how long does it take', expect: 'A standard study takes minutes' },
    { q: 'can I see a demo', expect: 'Happy to set one up' },
    { q: 'what is cedar', expect: 'I handle the data wrangling and the polish' },
    { q: 'how is this different from implan', expect: 'Same underlying economics' },
    { q: 'what is indian country', expect: '18 U.S.C.' },
    { q: 'what does federally recognized mean', expect: 'currently 574' },
    { q: 'tell me about the dawes act', expect: 'patchwork of ownership' },
    { q: 'how do alaska native corporations work', expect: 'Alaska Native Claims Settlement Act' },
    { q: 'what is a CEDS', expect: 'Comprehensive Economic Development Strategy' },
  ];

  for (const c of cases) {
    const bubble = await ask(panel, c.q);
    await expect(bubble, `"${c.q}" should route to its intent`).toContainText(c.expect, {
      timeout: 6000,
    });
  }
});

test('cedar sends an off-topic question to the out-of-scope reply', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Routing is engine-independent; headless WebKit is unreliable in CI.',
  );
  const panel = await openCedar(page);
  const bubble = await ask(panel, 'who is the president of mexico');
  await expect(bubble).toContainText("I'm Cedar, Lumecon's site assistant, so I'm best");
});

test('cedar asks to clarify when a message is genuinely ambiguous', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Routing is engine-independent; headless WebKit is unreliable in CI.',
  );
  const panel = await openCedar(page);
  // Cedar only clarifies on genuine ambiguity now: a weak two-way tie on a
  // single bare word just answers the declaration-order winner. "tribal
  // pricing demo" names three distinct chip-bearing topics tied at the top
  // score, so Cedar should ask which one rather than guess.
  const bubble = await ask(panel, 'tribal pricing demo');
  await expect(bubble).toContainText('Did you mean');
});

test('cedar tolerates a single-letter typo', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Routing is engine-independent; headless WebKit is unreliable in CI.',
  );
  const panel = await openCedar(page);
  // "pricng" is one edit from the "pricing" trigger.
  const bubble = await ask(panel, 'pricng');
  await expect(bubble).toContainText('per-study or per-geography');
});

test('every starter chip routes to its own intent, never the fallback', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Routing is engine-independent; headless WebKit is unreliable in CI.',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // A chip is an explicit intent choice. Some labels (e.g. "How long
  // does a study take?") don't contain their own trigger phrases, so
  // re-classifying the label used to drop them to the generic fallback.
  // Fire each chip's click handler and confirm it answers with its own
  // intent. We dispatch the click directly (rather than driving the
  // cramped floating panel) because the bug lived in the chip handler's
  // routing, which the delegated listener runs regardless of layout.
  // Reload per chip because the first click collapses the chip rail.
  for (const id of CHIP_IDS) {
    const intent = INTENTS.find((i) => i.id === id)!;
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const panel = page.locator('#cedarFabPanel');
    await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 5000 });
    await page.evaluate((cid) => {
      const el = document.querySelector(`#cedarFabPanel .cedar-chip[data-intent="${cid}"]`);
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, id);
    const reply = panel.locator('.cedar-msg--bot .cedar-msg__bubble').last();
    await expect(reply, `chip "${id}" should answer with its own intent`).toContainText(
      intent.answer.slice(0, 30),
      { timeout: 6000 },
    );
    await expect(reply, `chip "${id}" must not fall back`).not.toContainText(
      FALLBACK_ANSWER.slice(0, 30),
    );
  }
});

test('cedar handles rapid back-to-back submits without breaking', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Engine-independent; headless WebKit is unreliable in CI.');
  // Intentionally NOT reduced motion: this exercises the word-by-word
  // streaming + the transcript aria-busy toggle under concurrency.
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const panel = page.locator('#cedarFabPanel');
  await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 5000 });
  await page.locator('#cedarFab').click();
  const input = panel.locator('[data-cedar-input]');

  // Fire two messages back-to-back, the second while the first is still
  // composing.
  await input.fill('what is lumecon');
  await input.press('Enter');
  await input.fill('how much does it cost');
  await input.press('Enter');

  // Both user turns and both replies (plus the welcome bubble) render.
  await expect(panel.locator('.cedar-msg--user')).toHaveCount(2, { timeout: 8000 });
  await expect(panel.locator('.cedar-msg--bot')).toHaveCount(3, { timeout: 12000 });
  // The aria-busy flag is released once streaming settles (never stuck).
  await expect(panel.locator('[data-cedar-transcript]')).toHaveAttribute('aria-busy', 'false', {
    timeout: 12000,
  });
  expect(errs).toEqual([]);
});

test('asking the same question twice goes deeper instead of repeating verbatim', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);
  const first = await ask(panel, 'how much does it cost');
  await expect(first).toContainText('per-study or per-geography');
  // The repeat should acknowledge the earlier answer and bridge into the
  // deeper (expanded) version rather than replaying the same paragraph.
  const second = await ask(panel, 'how much does it cost');
  await expect(second).toContainText('We touched on this earlier');
});

test('conversational filler rotates phrasing instead of replying identically', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);
  const g1 = await ask(panel, 'hello');
  // Wait out the typing indicator: the bubble exists before its text lands.
  await expect(g1).toContainText(/\S/);
  const g1Text = (await g1.textContent()) ?? '';
  const g2 = await ask(panel, 'hello');
  await expect(g2).toContainText(/\S/);
  const g2Text = (await g2.textContent()) ?? '';
  expect(g2Text.length).toBeGreaterThan(0);
  expect(g2Text).not.toBe(g1Text);
});

test('a compound question answers the primary topic and chips the second', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Engine-independent; headless WebKit is unreliable in CI.');
  const panel = await openCedar(page);
  const bubble = await ask(panel, 'how much does it cost and also is my data safe');
  // Primary: pricing.
  await expect(bubble).toContainText('per-study or per-geography');
  // The second half of the question surfaces as the first follow-up chip.
  const firstChip = panel.locator('.cedar-followups').last().locator('button').first();
  await expect(firstChip).toHaveText('Is my data safe?');
});

test('a returning visitor gets a welcome-back line tied to their last topic', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Engine-independent; headless WebKit is unreliable in CI.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Simulate a previous visit (topic marker) + a fresh session (new tab).
  await page.evaluate(() => {
    localStorage.setItem(
      'lumecon:cedar:lastTopic',
      JSON.stringify({ id: 'pricing', ts: Date.now() }),
    );
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const panel = page.locator('#cedarFabPanel');
  await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 5000 });
  await expect(panel.locator('.cedar-msg--bot').last()).toContainText('Welcome back', {
    timeout: 5000,
  });
});
