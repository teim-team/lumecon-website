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
 * One screen at a time, and every screen is confirmed with Continue, so
 * an answer can be read back before it moves.
 */

async function fill(page: Page, answers: Record<string, string | string[]>) {
  const showing = page.locator('fieldset.pf-q:visible');
  await expect(showing).toHaveCount(1);
  const id = await showing.getAttribute('data-step');
  const screen = page.locator(`[data-step="${id}"]`);
  for (const [name, value] of Object.entries(answers)) {
    for (const one of Array.isArray(value) ? value : [value]) {
      await screen.locator(`input[name="${name}"][value="${one}"]`).check();
    }
  }
  return screen;
}

/** Answer the screen on show and confirm it. */
async function step(page: Page, answers: Record<string, string | string[]>) {
  const screen = await fill(page, answers);
  await page.locator('[data-pf-next]').click();
  await expect(screen).toBeHidden({ timeout: 3000 });
}

/** Answer the last screen and read the plan back. */
async function finish(page: Page, answers: Record<string, string | string[]>) {
  await fill(page, answers);
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
  // Every screen ships in the markup, so the page still works with no
  // JavaScript. One of them is on show.
  await expect(page.locator('fieldset.pf-q')).toHaveCount(14);
  await expect(page.locator('fieldset.pf-q:visible')).toHaveCount(1);
  await expect(page.locator('[data-step="goal"]')).toBeVisible();

  // Four fixed stages, so the end cannot move while somebody works.
  await expect(page.locator('.pf-rail__item')).toHaveCount(4);
  await expect(page.locator('.pf-rail__item[aria-current="step"]')).toContainText('Goal');
  await expect(page.locator('#pf-form')).not.toContainText(/Question \d+ of \d+/);

  // Nothing on the public flow asks for a financial record.
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText(/Records are shared inside the product/i)).toBeVisible();
});

test('nothing advances until the answer is confirmed', async ({ page }) => {
  const next = page.locator('[data-pf-next]');
  await expect(next).toBeDisabled();
  await page.locator('[data-step="goal"] input[value="current_operations"]').check();
  // Still on the same question: the choice can be read back and changed.
  await expect(page.locator('[data-step="goal"]')).toBeVisible();
  await expect(next).toBeEnabled();
  await page.locator('[data-step="goal"] input[value="project"]').check();
  await expect(page.locator('[data-step="goal"]')).toBeVisible();
  await next.click();
  await expect(page.locator('[data-step="audience"]')).toBeVisible();
});

test('a single-location enterprise gets a bounded scope from records it already has', async ({
  page,
}) => {
  await step(page, { goal: 'current_operations' });
  await step(page, { audience: 'leadership' });
  await step(page, { boundary: 'one_enterprise' });
  await step(page, { where: 'one_site' });
  await step(page, { activities: 'retail_fuel' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, {
    available: ['audited_financials', 'payroll', 'roster'],
  });

  // The recommendation leads, with the scope as facts rather than prose.
  await expect(panel.locator('.pf-lead__title')).toContainText('one enterprise');
  await expect(panel.locator('.pf-facts')).toContainText('One reporting year');
  await expect(panel.locator('.pf-facts')).toContainText('One location');

  // One concrete next action, drawn from what they already hold.
  const act = panel.locator('.pf-lead__act');
  await expect(act).toContainText('financial statement');
  await expect(act).toContainText('A first read is a review');
  await expect(act.getByRole('link', { name: /onboarding call/i })).toBeVisible();

  // Records they said they can reach are shown as in hand, not re-requested.
  const have = panel.locator('.pf-block', { hasText: 'Already available' });
  await expect(have).toContainText('financial statement');
  await expect(have.locator('.pf-check__have').first()).toHaveText('In hand');
  // A roster carries the work locations and the headcount, so nothing in
  // this scope is outstanding: the block for what is missing is absent
  // rather than repeating what they just said they hold.
  await expect(have).toContainText('Work locations');
  await expect(
    panel.locator('.pf-block', { hasText: 'Needed to complete this analysis' }),
  ).toHaveCount(0);
  await expect(have).not.toContainText('Entities and their main activities');

  // Vendor spending is a later question, and it is not sold as an input.
  const later = panel.locator('.pf-block', { hasText: 'For later questions' });
  await expect(later).toContainText('Vendor or accounts payable listing');
  await expect(later).toContainText('not a model input today');
});

test('a multistate contractor is given one state to start, and told what stays open', async ({
  page,
}) => {
  await step(page, { goal: 'current_operations' });
  await step(page, { audience: ['funder', 'leadership'] });
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

  await expect(panel.locator('.pf-facts')).toContainText('state holding most of the activity');
  // The award listing they hold is what carries place of performance, so it
  // reads as in hand; what is left is what they did not mention.
  await expect(panel.locator('.pf-block', { hasText: 'Already available' })).toContainText(
    'place of performance',
  );
  const begin = panel.locator('.pf-block', { hasText: 'Needed to complete this analysis' });
  await expect(begin).toContainText('Work locations');
  // Starting a conversation is distinguished from running the analysis.
  await expect(begin).toContainText('A first conversation needs none of these');

  // Limitations are available, not buried: they sit in the detail fold.
  const more = panel.locator('.pf-more');
  await more.locator('summary').click();
  await expect(more).toContainText('single combined figure across states');
  await expect(more).toContainText('Subcontracted work');
  await expect(more).toContainText('Which state the first analysis covers');
  await expect(more).toContainText('passes through to subcontractors');
  // Structure reports the parts that exist: one entity working in several
  // states is not the same reading as a group of them.
  await expect(more).toContainText('Activity in more than one state');
  await expect(more).not.toContainText('Several entities');
});

test('subsidiaries with separate records get a boundary question and a coordinator', async ({
  page,
}) => {
  await step(page, { goal: 'current_operations' });
  await step(page, { audience: 'leadership' });
  await step(page, { boundary: 'several_enterprises' });
  await step(page, { intercompany: 'yes' });
  await step(page, { where: 'multi_site_one_state' });
  await step(page, { activities: ['gaming', 'hospitality'] });
  await step(page, { gaming_related_ops: 'together' });
  await step(page, { gaming_separable: 'combined' });
  await step(page, { records_held: 'separate' });
  const panel = await finish(page, { available: 'internal_financials' });

  await expect(panel.locator('.pf-lead__title')).toContainText('a named set of enterprises');
  const begin = panel.locator('.pf-block', { hasText: 'Needed to complete this analysis' });
  await expect(begin).toContainText('Entities and their main activities');
  await expect(begin).toContainText('Transactions between the selected entities');

  await panel.locator('.pf-more summary').click();
  await expect(panel.locator('.pf-more')).toContainText('Some records in hand');
  await expect(panel.locator('.pf-more')).toContainText('coordinator who knows which office holds what');
  // Roles are named as roles, not as a required meeting.
  await expect(panel.locator('.pf-more')).toContainText('One person often covers');
  await expect(panel.locator('.pf-more')).toContainText('reported together');
});

test('a government analysis models the government as its own account', async ({ page }) => {
  await step(page, { goal: 'enterprises_and_government' });
  await step(page, { audience: 'public' });
  await step(page, { boundary: 'government_and_enterprises' });
  await step(page, { intercompany: 'no' });
  await step(page, { where: 'multi_site_one_state' });
  await step(page, { activities: 'government_admin' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, { available: ['budget', 'payroll'] });

  await expect(panel.locator('.pf-lead__title')).toContainText(
    'government together with its enterprises',
  );
  await expect(panel.locator('.pf-block', { hasText: 'Already available' })).toContainText(
    'Government annual financial report',
  );
  await panel.locator('.pf-more summary').click();
  await expect(panel.locator('.pf-more')).toContainText('its own account');
  await expect(panel.locator('.pf-more')).toContainText('treasurer');
  await expect(panel.locator('.pf-more')).toContainText(
    'transfers between the enterprises and the government',
  );
});

test('too much unanswered recommends a conversation instead of inventing a plan', async ({
  page,
}) => {
  await step(page, { goal: 'not_sure' });
  await step(page, { audience: 'not_sure' });
  await step(page, { boundary: 'not_sure' });
  await step(page, { where: 'not_sure' });
  await step(page, { activities: 'not_sure' });
  await step(page, { records_held: 'not_sure' });
  const panel = await finish(page, { available: 'none_yet' });

  await expect(panel.locator('.pf-callout')).toContainText('scoping conversation');
  // No scope facts are manufactured from answers that were not given.
  await expect(panel.locator('.pf-facts')).toHaveCount(0);
  await expect(panel.locator('.pf-lead__act')).toContainText('Arrange an onboarding call');
  await expect(panel.locator('.pf-lead__act')).toContainText('Nothing has to be gathered first');
});

test('"not sure" cannot sit beside a substantive answer', async ({ page }) => {
  await step(page, { goal: 'current_operations' });
  const screen = page.locator('[data-step="audience"]');
  await screen.locator('input[value="leadership"]').check();
  await screen.locator('input[value="funder"]').check();
  await screen.locator('input[value="not_sure"]').check();
  await expect(screen.locator('input[value="leadership"]')).not.toBeChecked();
  await expect(screen.locator('input[value="funder"]')).not.toBeChecked();
  // And the reverse: a real answer clears "not sure".
  await screen.locator('input[value="public"]').check();
  await expect(screen.locator('input[value="not_sure"]')).not.toBeChecked();
  await expect(screen.locator('input[value="public"]')).toBeChecked();
});

test('back preserves answers, and dropping a follow-up clears only that', async ({ page }) => {
  await step(page, { goal: 'current_operations' });
  await step(page, { audience: 'leadership' });
  await step(page, { boundary: 'several_enterprises' });
  await expect(page.locator('[data-step="intercompany"]')).toBeVisible();
  await step(page, { intercompany: 'yes' });

  await page.locator('[data-pf-back]').click();
  await expect(page.locator('[data-step="intercompany"]')).toBeVisible();
  // The answer is still there on the way back.
  await expect(page.locator('input[name="intercompany"][value="yes"]')).toBeChecked();
  await page.locator('[data-pf-back]').click();
  await expect(page.locator('[data-step="boundary"]')).toBeVisible();
  await expect(page.locator('input[name="boundary"][value="several_enterprises"]')).toBeChecked();

  // Changing it drops the follow-up, and the follow-up's answer with it.
  await page.locator('[data-step="boundary"] input[value="one_enterprise"]').check();
  await page.locator('[data-pf-next]').click();
  await expect(page.locator('[data-step="where"]')).toBeVisible();
  await expect(page.locator('input[name="intercompany"]:checked')).toHaveCount(0);
  // Earlier answers survive.
  await expect(page.locator('input[name="goal"][value="current_operations"]')).toBeChecked();
});

test('the summary fills in as answers accumulate, and goes back to a question', async ({ page }) => {
  await expect(page.locator('[data-sum]')).toBeHidden();
  await step(page, { goal: 'current_operations' });
  const sum = page.locator('[data-sum]');
  await expect(sum).toBeVisible();
  await expect(sum).toContainText('Our current operations');
  await step(page, { audience: 'leadership' });
  await expect(sum).toContainText('council, board or executive leadership');
  // A line in the summary goes back to the question that set it.
  await sum.locator('[data-sum-jump="goal"]').click();
  await expect(page.locator('[data-step="goal"]')).toBeVisible();
});

test('a plan carries no invented confidence figure, and survives a reload', async ({ page }) => {
  await step(page, { goal: 'project' });
  await step(page, { audience: 'funder' });
  await step(page, { boundary: 'one_project' });
  await step(page, { where: 'one_site' });
  await step(page, { activities: 'construction' });
  await step(page, { records_held: 'centralized' });
  const panel = await finish(page, { available: ['capital', 'audited_financials'] });

  // Coverage language is factual. Nothing claims a percentage improvement,
  // a confidence score, an assigned economist or a time estimate.
  const text = (await panel.innerText()).toLowerCase();
  expect(text).not.toMatch(/\d+\s?%/);
  expect(text).not.toContain('confidence');
  expect(text).not.toContain('accuracy');
  expect(text).not.toMatch(/\bminutes\b/);

  // The answers live in the address bar, so a coordinator can share them.
  expect(page.url()).toContain('#');
  expect(page.url()).toContain('boundary=one_project');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#pf-plan .pf-lead__title')).toContainText('one project');

  // A shared plan can still be reopened and edited.
  await page.locator('[data-pf-back]').click();
  await expect(page.locator('[data-step="available"]')).toBeVisible();
  await expect(page.locator('#pf-plan')).toBeHidden();
});

test('the reference sections stand on their own, and can be skipped', async ({ page }) => {
  // Six capability questions, each leading with what it lets you ask.
  await expect(page.locator('.start-cap__tab')).toHaveCount(6);
  await expect(page.locator('.start-cap__tab').first()).toContainText('?');
  await expect(page.locator('.start-cap__panel:visible')).toHaveCount(1);
  await page.locator('.start-cap__tab', { hasText: 'bought locally' }).click();
  const panel = page.locator('.start-cap__panel:visible');
  // Work that is not available is labeled as future work, not as a status code.
  await expect(panel).toContainText('Future work');
  await expect(panel).toContainText('not a model input');

  // The call is an invitation with three outcomes, not a facilitator agenda.
  await expect(page.locator('.start-call__out li')).toHaveCount(3);
  await expect(page.locator('.start-call')).not.toContainText('min');
  await expect(page.locator('.start-call')).toContainText('Goes to a short form');

  // Coverage is one labeled example, with its denominator named.
  await expect(page.locator('.start-cov__eg')).toContainText('illustrative');
  await expect(page.locator('.start-cov__eg')).toContainText('8 of 10');
  await expect(page.locator('.start-cov__eg')).toContainText('denominator');
});
