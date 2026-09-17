import { test, expect, type Page } from '@playwright/test';

/**
 * /start, the scoping flow.
 *
 * The four cases below are the ones the flow has to handle sensibly: a
 * single-location enterprise, a multistate contractor with centralized
 * records, a group of subsidiaries whose records sit apart, and a
 * government analysis. Each asserts the same two things in different
 * shapes: that a feasible starting scope comes back, and that nothing
 * missing is treated as known.
 *
 * The flow shows one question at a time and a single-answer question
 * advances itself, so the helpers below drive it the way a person does.
 */

/**
 * Answer the screen that is on show. A screen holds one question, or the
 * few that only make sense together, so the helper takes them as a map. A
 * screen that needs no Continue button advances itself.
 */
async function step(page: Page, answers: Record<string, string | string[]>) {
  const showing = page.locator('fieldset.pf-q:visible');
  await expect(showing).toHaveCount(1);
  // Pin the screen by id: the bare ":visible" locator would resolve to
  // whichever screen comes next and never report the current one as gone.
  const id = await showing.getAttribute('data-step');
  const screen = page.locator(`[data-step="${id}"]`);
  for (const [name, value] of Object.entries(answers)) {
    for (const one of Array.isArray(value) ? value : [value]) {
      await screen.locator(`input[name="${name}"][value="${one}"]`).check();
    }
  }
  const next = page.locator('[data-pf-next]');
  if (await next.isVisible()) {
    const label = await page.locator('[data-pf-next-label]').textContent();
    if (label?.match(/continue/i)) await next.click();
  }
  await expect(screen).toBeHidden({ timeout: 3000 });
}

/** Answer the last screen and read the plan back. */
async function finish(page: Page, answers: Record<string, string | string[]>) {
  const screen = page.locator('fieldset.pf-q:visible');
  for (const [name, value] of Object.entries(answers)) {
    for (const one of Array.isArray(value) ? value : [value]) {
      await screen.locator(`input[name="${name}"][value="${one}"]`).check();
    }
  }
  await page.locator('[data-pf-next]').click();
  const panel = page.locator('#pf-plan');
  await expect(panel).toBeVisible();
  return panel;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/start', { waitUntil: 'networkidle' });
});

test('the flow opens on one question and asks for no records', async ({ page }) => {
  await expect(page).toHaveTitle(/Plan your first analysis/i);
  // Six screens and seven conditional follow-ups ship in the markup, so the
  // page still works with no JavaScript. One screen is on show.
  await expect(page.locator('fieldset.pf-q')).toHaveCount(13);
  await expect(page.locator('fieldset.pf-q:visible')).toHaveCount(1);
  await expect(page.locator('[data-step="purpose"]')).toBeVisible();
  await expect(page.locator('[data-pf-label]')).toHaveText('Question 1 of 6');
  // Every initial question offers a real "not sure".
  for (const name of ['goal', 'audience', 'boundary', 'where', 'records_held']) {
    await expect(page.locator(`input[name="${name}"][value="not_sure"]`)).toHaveCount(1);
  }
  // The reference material renders statically, with no tailored plan at all.
  await expect(page.locator('.start-matrix__row')).toHaveCount(7);
  await expect(page.locator('.start-call__outline li')).toHaveCount(5);
  // Nothing on the public flow asks for a financial record.
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText(/Records are shared inside the product/i)).toBeVisible();
});

test('a single-location enterprise gets a bounded scope from records it already has', async ({
  page,
}) => {
  await step(page, { goal: 'annual_contribution', audience: 'leadership' });
  await step(page, { boundary: 'one_enterprise' });
  await step(page, { where: 'one_site' });
  await step(page, { activities: 'retail_fuel' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, { available: ['audited_financials', 'payroll', 'roster'] });

  await expect(panel.locator('.pf-scope')).toContainText('one enterprise');
  await expect(panel.locator('.pf-scope')).toContainText('one reporting year');
  // Structure and records are read separately and never merged.
  await expect(panel.locator('.pf-read__v').first()).toHaveText('One operation, one place');
  await expect(panel.locator('.pf-read__v').nth(1)).toHaveText('Enough in hand to start');

  const begin = panel.locator('.pf-block', { hasText: 'Needed to begin' });
  await expect(begin).toContainText('financial statement');
  await expect(begin).toContainText('payroll summary');
  await expect(begin).toContainText('places work is performed');
  // Nothing about entities that do not exist here.
  await expect(begin).not.toContainText('entities in scope');
  // Vendor spending is a later question, and it is not sold as an input.
  const later = panel.locator('.pf-block', { hasText: 'Optional, for later questions' });
  await expect(later).toContainText('accounts payable or vendor listing');
  await expect(later).toContainText('not a model input today');
});

test('a multistate contractor is given one state to start, and told what stays open', async ({
  page,
}) => {
  await step(page, { goal: 'defend_a_number', audience: 'funder' });
  await step(page, { boundary: 'one_enterprise' });
  await step(page, { where: 'multi_state' });
  // The follow-up that answer unlocks comes next, and gaming's does not.
  await expect(page.locator('[data-step="multi_state_anchor"]')).toBeVisible();
  await expect(page.locator('[data-step="gaming_related_ops"]')).toBeHidden();
  await step(page, { multi_state_anchor: 'concentrated' });
  await step(page, { activities: ['federal_contracting', 'construction'] });
  await step(page, { contracting_place: 'elsewhere' });
  await step(page, { contracting_subs: 'yes' });
  await step(page, { contracting_mixed_revenue: 'yes' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, { available: ['audited_financials', 'payroll', 'awards'] });

  await expect(panel.locator('.pf-scope')).toContainText('state that holds most of the activity');
  // Structure reports the parts that exist and nothing more: one entity
  // working in several states is not the same reading as a group of them.
  // Centralized records do not soften it, and it does not soften them.
  const structure = panel.locator('.pf-read').first();
  await expect(structure).toContainText('Activity in more than one state');
  await expect(structure).toContainText('Federal contracting');
  await expect(structure).not.toContainText('Several entities');
  await expect(panel.locator('.pf-read__v').nth(1)).toHaveText('Enough in hand to start');

  await expect(panel.locator('.pf-block', { hasText: 'Needed to begin' })).toContainText(
    'place of performance',
  );

  const notYet = panel.locator('.pf-block', { hasText: 'What it will not show yet' });
  await expect(notYet).toContainText('single combined figure across states');
  await expect(notYet).toContainText('Subcontracted work');

  const open = panel.locator('.pf-block', { hasText: 'To settle on the call' });
  await expect(open).toContainText('Which state the first analysis covers');
  await expect(open).toContainText('passes through to subcontractors');
});

test('subsidiaries with separate records get a boundary question and a coordinator', async ({
  page,
}) => {
  await step(page, { goal: 'annual_contribution', audience: 'leadership' });
  await step(page, { boundary: 'several_enterprises' });
  await step(page, { intercompany: 'yes' });
  await step(page, { where: 'multi_site_one_state' });
  await step(page, { activities: ['gaming', 'hospitality'] });
  await step(page, { gaming_related_ops: 'together' });
  await step(page, { gaming_separable: 'combined' });
  await step(page, { records_held: 'separate' });
  const panel = await finish(page, { available: 'internal_financials' });

  await expect(panel.locator('.pf-scope')).toContainText('a named set of enterprises');

  const begin = panel.locator('.pf-block', { hasText: 'Needed to begin' });
  await expect(begin).toContainText('list of the entities in scope');
  await expect(begin).toContainText('transactions between the entities');

  // Partial records are named as partial, not scored.
  await expect(panel.locator('.pf-read__v').nth(1)).toHaveText('Some records in hand');
  await expect(panel.locator('.pf-read').nth(1)).toContainText('separate entities or departments');

  const people = panel.locator('.pf-block', { hasText: 'Who needs to help' });
  await expect(people).toContainText('coordinator who knows which office holds what');
  await expect(people).toContainText('approve sharing records');

  // Combined gaming figures are reported as combined, not silently split.
  await expect(panel.locator('.pf-block', { hasText: 'What it will not show yet' })).toContainText(
    'reported together',
  );
});

test('a government analysis models the government as its own account', async ({ page }) => {
  await step(page, { goal: 'whole_economy', audience: 'public' });
  await step(page, { boundary: 'government_and_enterprises' });
  await step(page, { intercompany: 'no' });
  await step(page, { where: 'multi_site_one_state' });
  await step(page, { activities: 'government_admin' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, { available: ['budget', 'payroll'] });

  await expect(panel.locator('.pf-scope')).toContainText(
    'government together with its enterprises',
  );

  await expect(panel.locator('.pf-block', { hasText: 'Needed to begin' })).toContainText(
    'government annual financial report',
  );
  await expect(
    panel.locator('.pf-block', { hasText: 'What a first analysis reports' }),
  ).toContainText('its own account');
  await expect(panel.locator('.pf-block', { hasText: 'Who needs to help' })).toContainText(
    'treasurer',
  );
  await expect(panel.locator('.pf-block', { hasText: 'To settle on the call' })).toContainText(
    'transfers between the enterprises and the government',
  );
});

test('too much unanswered recommends a conversation instead of inventing a plan', async ({
  page,
}) => {
  await step(page, { goal: 'not_sure', audience: 'not_sure' });
  await step(page, { boundary: 'not_sure' });
  await step(page, { where: 'not_sure' });
  await step(page, { activities: 'not_sure' });
  await step(page, { records_held: 'not_sure' });
  const panel = await finish(page, { available: 'none_yet' });

  await expect(panel.locator('.pf-callout')).toContainText('scoping conversation');
  // No scope sentence is manufactured from answers that were not given.
  await expect(panel.locator('.pf-scope')).toHaveCount(0);
  await expect(panel.locator('.pf-block', { hasText: 'To settle on the call' })).toContainText(
    'who approves sharing them',
  );
});

test('an answer that is walked back takes its follow-up with it', async ({ page }) => {
  await step(page, { goal: 'annual_contribution', audience: 'leadership' });
  await step(page, { boundary: 'several_enterprises' });
  await expect(page.locator('[data-step="intercompany"]')).toBeVisible();
  await step(page, { intercompany: 'yes' });

  // Back twice, to the question that opened the follow-up, and change it.
  await page.locator('[data-pf-back]').click();
  await expect(page.locator('[data-step="intercompany"]')).toBeVisible();
  await page.locator('[data-pf-back]').click();
  await expect(page.locator('[data-step="boundary"]')).toBeVisible();
  await step(page, { boundary: 'one_enterprise' });

  // The follow-up is gone from the path, and so is the answer it held.
  await expect(page.locator('[data-step="where"]')).toBeVisible();
  await expect(page.locator('input[name="intercompany"]:checked')).toHaveCount(0);
  await expect(page.locator('[data-pf-label]')).toHaveText('Question 3 of 6');
});

test('a plan carries no invented confidence figure, and survives a reload', async ({ page }) => {
  await step(page, { goal: 'one_project', audience: 'funder' });
  await step(page, { boundary: 'one_project' });
  await step(page, { where: 'one_site' });
  await step(page, { activities: 'construction' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, { available: ['capital', 'audited_financials'] });

  // Coverage language is factual. Nothing claims a percentage improvement,
  // a confidence score or an error bar anywhere in a tailored plan.
  const text = (await panel.innerText()).toLowerCase();
  expect(text).not.toMatch(/\d+\s?%/);
  expect(text).not.toContain('confidence');
  expect(text).not.toContain('accuracy');

  // The answers live in the address bar, so a coordinator can share them.
  expect(page.url()).toContain('#');
  expect(page.url()).toContain('boundary=one_project');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#pf-plan .pf-scope')).toContainText('one project');

  // A shared plan can still be reopened and edited.
  await page.locator('[data-pf-back]').click();
  await expect(page.locator('[data-step="available"]')).toBeVisible();
  await expect(page.locator('#pf-plan')).toBeHidden();
});
