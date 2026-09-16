import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * Smoke suite. Catches the regressions we've actually hit (broken icon
 * renders, empty viewport, leaking skip-link, missing hero imagery and
 * demo route 404). Intentionally narrow — perf and a11y are
 * covered by Lighthouse CI, not here.
 */

test('home page loads and renders the hero product shot', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Lumecon/i);
  await expect(page).toHaveTitle(/the intelligent economic analysis platform/i);
  await expect(page.locator('.hero2 .h-kicker')).toHaveText(
    'the intelligent economic analysis platform',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /the intelligent economic analysis platform/,
  );
  // One static, readable product view is staged against the matching
  // economic-place image. Only the product view is promoted for LCP.
  const heroShot = page.locator('.hero2-screen img');
  await expect(heroShot).toBeVisible();
  await expect(heroShot).toHaveAttribute('src', '/app/ex-wind-results.webp');
  await expect(heroShot).toHaveAttribute('fetchpriority', 'high');
  await expect(page.locator('.hero2 img[fetchpriority="high"]')).toHaveCount(1);
  await expect(page.locator('.hero2-photo img')).toHaveAttribute(
    'src',
    '/naics/utilities-v2-wide.webp',
  );
  await expect(page.locator('.hero2-stage figcaption')).toContainText('Illustrative sample data');

  // The editorial photo passage uses the same licensed duotone system
  // without implying that any depicted facility is a customer.
  await expect(page.locator('.place-panel')).toHaveCount(3);
  const placeSrcs = await page
    .locator('.place-panel img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(placeSrcs).toEqual([
    '/naics/construction-v2-wide.webp',
    '/naics/tribalgov-v2-wide.webp',
    '/naics/manufacturing-v2-wide.webp',
  ]);
  await expect(page.locator('.places-note')).toContainText('does not identify Lumecon customers');
  // Three equal sector panels make this a product-facing comparison, not an
  // editorial feature article with one promoted story.
  const placeBoxes = await page.locator('.place-panel').evaluateAll((panels) =>
    panels.map((panel) => {
      const box = panel.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  );
  expect(placeBoxes).toHaveLength(3);
  for (const box of placeBoxes.slice(1)) {
    expect(Math.abs(box.width - placeBoxes[0].width)).toBeLessThan(1);
    expect(Math.abs(box.height - placeBoxes[0].height)).toBeLessThan(1);
  }
  await expect(page.locator('.place-panel__copy h3').first()).not.toHaveCSS(
    'font-family',
    /Georgia/,
  );
  // The product tour renders its screenshot rows below the hero.
  expect(await page.locator('.tour-row img').count()).toBeGreaterThan(2);

  // Core site assets are self-hosted. This stays as a guard for sandboxes that break
  // same-origin fetches through an interception proxy (bad cert) or a
  // closed egress (connection reset).
  const real = errs.filter(
    (e) => !e.includes('CERT_AUTHORITY_INVALID') && !e.includes('ERR_CONNECTION_RESET'),
  );
  expect(real).toEqual([]);
});

test('hero stays readable and motion-safe under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero2-title')).toBeVisible();
  await expect(page.locator('.hero2-screen')).toBeVisible();
  await expect(page.locator('.hero2-screen')).toHaveCSS('transition-duration', '0s');
});

test('skip-link is hidden until focused', async ({ page }) => {
  await page.goto('/');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeAttached();
  await expect(page.locator('main#top')).toHaveAttribute('tabindex', '-1');
  const box = await skip.boundingBox();
  // Either off-canvas (negative x) or 1px clipped.
  expect(box?.x ?? -1).toBeLessThan(0);
  await skip.focus();
  await expect(skip).toBeVisible();
  await skip.press('Enter');
  await expect(page.locator('main#top')).toBeFocused();
});

test('pricing shows four public plans, Seed first, with Sapling recommended', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  // One platform, four plans — Seed (free) leads, no platform picker.
  await expect(page.locator('.pr-plan')).toHaveCount(4);
  await expect(page.locator('.pr-plan').first().locator('.pr-plan__name')).toHaveText('Seed');
  await expect(page.locator('.pr-plan--featured .pr-plan__name')).toHaveText('Sapling');
  await expect(page.locator('#plan-free .pr-plan__amount')).toHaveText('$0');
  await expect(page.locator('#plan-free .pr-plan__period')).toHaveText('/ year');
  await expect(page.locator('#plan-sprout .pr-plan__amount')).toHaveText('$1,000');
  await expect(page.locator('#plan-sapling .pr-plan__amount')).toHaveText('$2,500');
  await expect(page.locator('#plan-tree .pr-plan__amount')).toHaveText('$7,500');
  // Plan CTAs route into signup with the stable tier id — Seed's id
  // stays `free`, the display name is marketing only.
  await expect(page.locator('#plan-free .pr-plan__cta')).toHaveAttribute(
    'href',
    /\/signup\?tier=free/,
  );
  await expect(page.locator('#plan-sprout .pr-plan__cta')).toHaveAttribute(
    'href',
    /\/signup\?tier=sprout/,
  );
  // The detail table renders with the Seed column and the Results and
  // Exports rows that state the direct-effects preview.
  await expect(page.locator('[data-plan-table] thead th')).toContainText([
    '',
    'Seed',
    'Sprout',
    'Sapling',
    'Tree',
  ]);
  await expect(page.locator('[data-plan-table] tbody tr')).toHaveCount(11);
  await expect(page.locator('[data-plan-table]')).toContainText('Direct effects');
  await expect(page.locator('[data-plan-table]')).toContainText('Cedar Grove');
});

test('homepage uses clear free-access language and Cedar starts on demand', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.hero2 .hero2-cta a[href="/signup?tier=free"]')).toHaveText(
    /Request free access/,
  );

  await page.locator('#why').scrollIntoViewIfNeeded();
  const fab = page.locator('.cedar-fab');
  await expect(fab).toBeVisible();
  await fab.click();

  const panel = page.locator('#cedarFabPanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-cedar-booted', '1');
  const prompts = await panel
    .locator('.cedar-chip')
    .evaluateAll((chips) => chips.slice(0, 5).map((chip) => chip.textContent?.trim()));
  expect(prompts).toEqual([
    'What is Lumecon?',
    'What is Cedar?',
    'Is my data safe?',
    'How is this different from IMPLAN / RIMS / Lightcast?',
    'How much does it cost?',
  ]);
});

test('pricing leads with the free account and routes consultants to Sapling', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  // The free CTA leads, above the plans, with the no-card line beside it.
  const hero = page.locator('.pr-hero');
  await expect(hero).toContainText('Plans start at $1,000 a year');
  await expect(hero.locator('a[href="/signup?tier=free"]')).toBeVisible();
  // The free-account band sits before the paid tiers.
  const free = page.locator('.pr-free');
  await expect(free).toContainText('Request Seed access');
  await expect(free).toContainText('No credit card');
  await expect(free.locator('a[href="/signup?tier=free"]')).toBeVisible();
  // Consultants use the public plans. The signal is one line under the
  // cards, not a band and not a separate edition.
  await expect(page.locator('.pr-plans__clientnote')).toContainText('start at Sapling');
  // Cedar Grove is sold on its own, after the plans rather than as a fourth card.
  await expect(page.locator('#cedar-grove')).toBeVisible();
  // The FAQ carries the skepticism the table cannot. Each row is a details
  // element the reader opens.
  await expect(page.locator('.pr-faq__list .pr-more--faq')).toHaveCount(11);
});

test('signup reflects a plan carried over from pricing', async ({ page }) => {
  await page.goto('/signup?tier=sapling', { waitUntil: 'domcontentloaded' });
  const badge = page.locator('[data-auth-plan]');
  await expect(badge).toBeVisible();
  await expect(badge).toContainText(/Sapling tier/);
});

test('menu overlay opens full screen from the opaque nav', async ({ page }) => {
  // Regression: the overlay used to live inside <nav>, whose
  // backdrop-filter made it the containing block for position:fixed,
  // silently confining the "full screen" menu to the nav bar's box.
  // The header is now solid, but the full-viewport overlay must remain
  // independent from the bar that opens it.
  //
  // Below 1000px the bar is brand + Menu; at and above it the destinations
  // sit inline and the Menu button is hidden, so this exercises the
  // overlay at a width where it is the navigation.
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await page.locator('#navMenuBtn').click();
  const menu = page.locator('#navMenu');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('no menu box');
  expect(box.height).toBeGreaterThan(viewport.height * 0.9);
  await expect(menu.locator('a', { hasText: 'Methodology' })).toBeVisible();
  await expect(page.locator('#nav')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#nav')).toHaveCSS('background-color', 'rgb(250, 252, 253)');
});

test('desktop nav shows the destinations inline, with no Menu button', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  const links = page.locator('.nav-links a');
  await expect(links).toHaveCount(6);
  for (const label of ['Cedar Impact', 'Cedar', 'Cedar Grove', 'Pricing', 'Methodology', 'Team']) {
    // Exact text: "Cedar" is a prefix of two other destinations now.
    await expect(
      page.locator('.nav-links a', { hasText: new RegExp(`^\\s*${label}\\s*$`) }),
    ).toBeVisible();
  }
  await expect(page.locator('.nav-signup')).toBeVisible();
  await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveText('Pricing');
  await expect(page.locator('#navMenuBtn')).toBeHidden();
});

test('menu closes cleanly when the viewport crosses into desktop navigation', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await page.locator('#navMenuBtn').click();
  await expect(page.locator('#navMenu')).toBeVisible();
  await expect(page.locator('#navMenu a[href="/pricing"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('html')).toHaveClass(/navm-open/);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#navMenuBtn')).toBeFocused();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('#navMenu')).toBeHidden();
  await expect(page.locator('html')).not.toHaveClass(/navm-open/);
  await expect(page.locator('.nav-links a[aria-current="page"]')).toBeFocused();
});

test('checkout is payment-only: knows the plan, no plan picker', async ({ page }) => {
  await page.goto('/checkout?tier=tree', { waitUntil: 'domcontentloaded' });
  // The order summary reflects the already-chosen plan.
  const summary = page.locator('[data-co-summary="tree"]');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Tree');
  await expect(summary.locator('[data-co-total]')).toHaveText('$7,500');
  await expect(summary).toContainText('Taxes and fees included');
  // One job: no selectable plan cards, just a quiet change-plan link.
  await expect(page.locator('.co-plan')).toHaveCount(0);
  await expect(page.locator('h1')).toContainText('Confirm your plan details');
  await expect(page.locator('[data-co-change]')).toHaveAttribute('href', /\/choose-plan/);

  await page.fill('input[name="discountCode"]', 'welcome25');
  await page.locator('[data-co-apply]').click();
  await expect(page.locator('[data-co-code-note]')).toContainText('WELCOME25');
});

test('checkout routes non-payable states to the right step', async ({ page }) => {
  // Free never sees a payment page.
  await page.goto('/checkout?tier=free', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/signup\?tier=free/);
  // No plan chosen yet: the dedicated selection step.
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/choose-plan/);
});

test('login offers the forgot-password flow from the product', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.locator('[data-login-forgot]').click();
  await expect(page.locator('[data-login-title]')).toHaveText('Reset your password');
  await expect(page.locator('input[name="password"]')).toBeHidden();
  await expect(page.locator('[data-login-submit]')).toHaveText('Send reset link');
  await page.locator('[data-login-back]').click();
  await expect(page.locator('[data-login-title]')).toHaveText('Log in to Lumecon');
});

test('login reset links open the reset-request state on direct navigation', async ({ page }) => {
  await page.goto('/login?reset=1', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-login-title]')).toHaveText('Reset your password');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeHidden();
  await expect(page.locator('[data-login-submit]')).toHaveText('Send reset link');
});

/* This used to assert a two-step registration with a password checklist and a
   back button. /signup stopped being that when it became the private-beta
   request page: there is one panel, no password field and no step 2, so the
   test had been asserting a flow that does not exist. Rewritten against the
   page as it is. (Found while acting on Brian's note about viewport and
   timing on this test, #300.) */
test('signup collects a beta access request, with no account created', async ({ page }) => {
  // Pin the width: the split layout and the role chips wrap differently on a
  // narrow default viewport, and this asserts on their desktop arrangement.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  // The form says when its wiring is live. Waiting on that beats a sleep:
  // the chips below do nothing until the script has bound them.
  await expect(page.locator('[data-auth-form][data-auth-ready]')).toBeAttached();

  await expect(page.locator('[data-auth-form]')).toHaveAttribute('data-auth-kind', 'beta-request');
  await expect(page.locator('h1')).toHaveText('Lumecon is in private beta');

  // Everything the request needs, on one panel.
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="organization"]')).toBeVisible();
  await expect(page.locator('select[name="organizationType"]')).toBeVisible();

  // No credential is collected while the beta is closed.
  await expect(page.locator('input[name="password"]')).toHaveCount(0);

  // Tribal governance roles join the shared role list only when the
  // organization identifies as a Tribal Nation.
  await expect(page.locator('[data-tribal-role]:visible')).toHaveCount(0);
  await page.selectOption('select[name="organizationType"]', 'tribal_nation');
  await expect(page.locator('[data-tribal-role]:visible')).toHaveCount(3);
  await page.selectOption('select[name="organizationType"]', 'government');
  await expect(page.locator('[data-tribal-role]:visible')).toHaveCount(0);

  // The role chips are a single-select mirrored into a hidden field.
  await page.locator('[data-role-chip]', { hasText: 'Consultant' }).click();
  await expect(page.locator('[data-role-chip][aria-pressed="true"]')).toHaveCount(1);

  await expect(page.locator('[data-auth-submit]')).toHaveText('Request access');
});

test('methodology page renders equations with spoken readings', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.meth-hero__title')).toContainText('better inputs');
  const equations = page.locator('.eq[role="math"]');
  await expect(equations).toHaveCount(6);
  // Every equation block must carry a plain-language reading for
  // assistive technology.
  for (const eq of await equations.all()) {
    expect(await eq.getAttribute('aria-label')).toBeTruthy();
  }
  await expect(equations.nth(1)).toContainText('x = (I − A)−1 f');
  // Sequence is conveyed by the named layers, not generic 01–06 badges or
  // arrows. Equation references stay intact elsewhere on the page.
  await expect(page.locator('.meth-flow')).not.toContainText(/^0[1-6]$/);
  await expect(page.locator('.meth-flow li').first()).toHaveCSS('counter-increment', 'none');
});

test('every page exposes the canonical product record for people and crawlers', async ({
  page,
}) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('link[rel="describedby"][href="/llms.txt"]')).toHaveCount(1);
  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(structuredData.join('\n')).toContain('SoftwareApplication');
  await expect(page.locator('.meth-hero__lede')).toContainText(
    'intelligent economic analysis platform',
  );
  await expect(page.locator('.meth-hero__lede')).toContainText('economic impact analysis software');
});

test('the production build preserves the app handoff and API CSP', async ({ page }) => {
  await page.goto('/welcome', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.welc-btn')).toHaveAttribute('href', 'https://app.lumecon.ai');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("connect-src 'self' https://api.lumecon.ai");
});

test('naics page lists all 20 sectors plus tribal government', async ({ page }) => {
  await page.goto('/naics', { waitUntil: 'domcontentloaded' });
  const tiles = page.locator('.naics-tile');
  await expect(tiles).toHaveCount(21);
  // The methodology's why-two-digits section is the page's companion.
  await expect(page.locator('.meth-hero__lede a[href="/methodology#m-naics"]')).toBeVisible();
  // Hover text exists in the DOM for every tile, manufacturing included.
  await expect(page.locator('#naics-manufacturing .naics-tile__desc')).toContainText('materials');
  await expect(page.locator('#naics-tribalgov .naics-tile__desc')).toContainText(
    'Lumecon category',
  );
});

test('methodology explains the two-digit NAICS choice', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  // The methodology sections are disclosure cards now: the hook is on the
  // face, the argument is behind it. The /naics browser is no longer linked
  // from here by design.
  const card = page.locator('details#m-naics');
  await expect(card.locator('.mcard__title')).toHaveText('Industries at the two-digit NAICS level');
  await expect(card).toContainText('administrative data coverage is strongest');
  await card.locator('.mcard__face').click();
  await expect(card.locator('.mcard__body')).toContainText(
    'North American Industry Classification System',
  );
});

test('accessibility statement is published and linked from the footer', async ({ page }) => {
  await page.goto('/accessibility', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText('Accessibility');
  await expect(page.locator('main')).toContainText('WCAG');
  await expect(page.locator('footer a[href="/accessibility"]')).toHaveText('Accessibility');
});

test('skip link targets real content on subpages', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main#top')).toHaveCount(1);
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main#top')).toHaveCount(1);
});

test('cedar page tells the AI story with three real captures, no diagrams', async ({ page }) => {
  await page.goto('/cedar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('reviewable economic inputs');
  await expect(page.locator('.meth-hero__lede')).toContainText('Lumecon’s AI economic analyst');
  // Exactly the three-shot story, told through the shared product tour:
  // upload, entities in the loop, partner context. Diagrams were removed by
  // design; no screenshot repeats.
  await expect(page.locator('.cedarpg-diagram')).toHaveCount(0);
  await expect(page.locator('.tour-row__shot img')).toHaveCount(3);
  await expect(page.locator('img[src="/app/cedar-wind-upload.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/app/cedar-wind-entities.webp"]')).toHaveCount(1);
  await expect(page.locator('img[src="/app/cedar-context.webp"]')).toHaveCount(1);
  await expect(page.locator('#navMenu a[href="/cedar"]')).toHaveCount(1);
  await expect(page.locator('footer a[href="/cedar"]')).toHaveCount(1);
});

test('homepage keeps Cedar to a teaser and drops the AI-tile block', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Cedar gets one card in the why band and a link out. The old dedicated
  // #cedar section and the AI tile block are both gone.
  const card = page.locator('#why .whyw-card', { hasText: 'Review inputs before they run' });
  await expect(card).toHaveCount(1);
  await expect(card.locator('a[href="/cedar"]')).toHaveCount(1);
  await expect(page.locator('.askai')).toHaveCount(0);
});

test('methodology shows the public-data foundation', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.askai')).toHaveCount(0);
  await expect(page.locator('#m-data')).toContainText('Public data foundation');
  await expect(page.locator('.meth-manifest')).toContainText('BEA Input-Output Accounts');
});

test('print view excludes the dark evidence band', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#edge')).toBeHidden();
});

test('choose-plan offers the three plans and a free start', async ({ page }) => {
  await page.goto('/choose-plan', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('How will you use Lumecon?');
  await expect(page.locator('[data-plan-link]')).toHaveCount(3);
  await expect(page.locator('[data-plan-link="sapling"]')).toContainText('Sapling');
  // Without a signup handoff, Start free routes through account creation.
  await expect(page.locator('[data-free-link]')).toHaveAttribute('href', /\/signup\?tier=free/);
  // The transactional flow keeps one obvious action: no Cedar launcher.
  await expect(page.locator('.cedar-fab')).toHaveCount(0);
});

test('welcome closes the flow in full teal with one action', async ({ page }) => {
  await page.goto('/welcome?plan=free', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Your Lumecon workspace is ready');
  await expect(page.locator('[data-welcome-kicker]')).toHaveText('Seed account ready');
  await expect(page.locator('a.welc-btn')).toHaveAttribute('href', 'https://app.lumecon.ai');
  await expect(page.locator('.cedar-fab')).toHaveCount(0);
});

test('security.txt stays valid and does not silently lapse', async ({ page }) => {
  // RFC 9116 requires Contact and Expires. An expired security.txt is
  // treated as invalid by scanners and by researchers, and nothing else
  // in the repo watches the date, so this is the thing that notices.
  const res = await page.goto('/.well-known/security.txt');
  expect(res?.status()).toBe(200);
  const body = (await res!.text()) ?? '';

  expect(body).toMatch(/^Contact:\s*\S+/m);
  const expires = body.match(/^Expires:\s*(\S+)/m);
  expect(expires, 'security.txt must carry an Expires field (RFC 9116 §2.5.5)').toBeTruthy();

  const when = new Date(expires![1]);
  expect(Number.isNaN(when.getTime()), `Expires is not a valid date: ${expires![1]}`).toBe(false);

  const daysLeft = Math.round((when.getTime() - Date.now()) / 86_400_000);
  // Fails while there is still time to renew, rather than after it lapses.
  expect(daysLeft, `security.txt expires in ${daysLeft} days — renew it`).toBeGreaterThan(30);
  // RFC 9116 §2.5.5: SHOULD be less than a year out.
  expect(daysLeft, `Expires is ${daysLeft} days out; RFC 9116 asks for under a year`).toBeLessThan(
    366,
  );
});

test('security keeps one dark surface and preserves readable print text', async ({ page }) => {
  await page.goto('/security', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.secpg .section--dark')).toHaveCount(1);
  await expect(page.locator('.secpg-flow')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Cedar Impact calculates');

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.secpg-hero h1')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('.secpg-status dd').first()).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('.secpg-hero .btn2')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(page.locator('.secpg-hero .btn2')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
});

test('privacy policy discloses Cedar topic memory', async ({ page }) => {
  await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toContainText('topic identifier and timestamp');
  await expect(page.locator('main')).toContainText('local storage for up to 30 days');
});

test('cedar grove shows three captures of the product, in one frame, per theme', async ({
  page,
}) => {
  await page.goto('/cedar-grove', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('defensible case');

  // Three compositions: the Home carousel in the hero, then two tour rows.
  // Four would mean the page had drifted back into being a tour of the
  // navigation, which is what it was cut down from.
  await expect(page.locator('.grovepg-hero__shot img')).toHaveCount(1);
  await expect(page.locator('.grovetour .tour-row__shot img')).toHaveCount(2);

  // Every capture is offered in both themes. The capture step shoots each
  // surface twice; the dark halves used to ship in public/app unreferenced,
  // which left a sheet of white product on a page that had gone dark.
  const sources = page.locator('.grovepg-hero__shot source, .grovetour .tour-row__shot source');
  await expect(sources).toHaveCount(3);
  for (const attr of await sources.evaluateAll((nodes) =>
    nodes.map((node) => ({
      media: node.getAttribute('media'),
      srcset: node.getAttribute('srcset'),
    })),
  )) {
    expect(attr.media).toBe('(prefers-color-scheme: dark)');
    expect(attr.srcset).toMatch(/-dark\.webp$/);
  }

  // One frame, stated by the file rather than typed into the page: every
  // capture declares the same intrinsic box, so no row shifts as it lands.
  const boxes = await page
    .locator(
      '.grovepg-hero__shot img, .grovetour .tour-row__shot img, .grovepg-hero__shot source, .grovetour .tour-row__shot source',
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => `${node.getAttribute('width')}x${node.getAttribute('height')}`),
    );
  expect(new Set(boxes)).toEqual(new Set(['1920x1080']));
});

test('cedar grove never names a real place beside a fixture', async ({ page }) => {
  // The captures on this page are of a demonstration workspace that does not
  // exist, and the numbers in them are fixtures. An earlier pass photographed
  // the Ponca OTSA and the three Oklahoma counties it sits across, which put
  // real nations and real places under invented figures on a public marketing
  // page. The capture step guards this at source; this guards the published
  // HTML, including the alt text, which no capture-time check can see.
  await page.goto('/cedar-grove', { waitUntil: 'domcontentloaded' });
  const text = [
    await page.locator('main').innerText(),
    ...(await page
      .locator('main img')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt') ?? ''))),
  ].join('\n');
  for (const place of ['Ponca', 'Noble', 'Kay County', 'Osage', 'Oklahoma', 'Navajo']) {
    expect(text, `${place} appears beside demonstration figures`).not.toContain(place);
  }
});

for (const route of ['/methodology', '/cedar', '/cedar-grove']) {
  test(`${route} dark sections retain readable text when printing without backgrounds`, async ({
    page,
  }) => {
    await page.emulateMedia({ media: 'print', colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator('#consentBanner')).toBeHidden();
    const section = page.locator('.section--dark').first();
    await expect(section).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(section).toHaveCSS('background-image', 'none');
    const heading = section.locator('h1').first();
    await expect(heading).toBeVisible();
    const colors = await section
      .locator('h1, h1 span, p, a, figcaption')
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => node.textContent?.trim())
          .map((node) => getComputedStyle(node).color),
      );
    for (const color of colors) {
      const channels = color
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      expect(channels, color).toHaveLength(3);
      const linear = channels!.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      expect(1.05 / (luminance + 0.05), `${route}: ${color} on white`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('team page picks a person and shows that person', async ({ page }) => {
  await page.goto('/team', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Team \| Lumecon/);
  await expect(page.locator('#nav a[href="/team"]')).toHaveCount(1);

  // The portraits are generated by scripts/team/headshots.mjs from the
  // deck masters and committed; a 404 would leave an empty circle rather
  // than an error, so check they actually decoded. They are lazy, so the
  // page has to be scrolled before they are asked for.
  const faces = page.locator('[data-face]');
  await expect(faces).toHaveCount(8);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      page
        .locator('.face__photo')
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth === 480),
        ),
    )
    .toBe(true);

  // Exactly one person is shown at a time, and it is the one pressed.
  const shown = () =>
    page
      .locator('[data-person]')
      .evaluateAll((cards) =>
        cards
          .filter((card) => !(card as HTMLElement).hidden)
          .map((c) => c.getAttribute('data-person')),
      );
  expect(await shown()).toEqual(['elijah-moreno']);
  await page.locator('[data-face="havala-hanson"]').click();
  expect(await shown()).toEqual(['havala-hanson']);
  await expect(page.locator('[data-face="havala-hanson"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-face="elijah-moreno"]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  // Every person carries both blocks. An empty one is a data gap.
  // Education is a list and experience is prose, so they are counted
  // from different elements on purpose.
  const counts = await page.locator('[data-person]').evaluateAll((cards) =>
    cards.map((card) => ({
      edu: card.querySelectorAll('.pcard__list li').length,
      exp: card.querySelectorAll('[data-field="experience"] p').length,
    })),
  );
  for (const c of counts) {
    expect(c.edu).toBeGreaterThan(0);
    expect(c.exp).toBeGreaterThan(0);
  }

  // A credential belongs under Education, not appended to a name: with
  // suffixes on three of eight, the roster looked like it ranked itself.
  const names = await page
    .locator('.pcard__name')
    .evaluateAll((nodes) => nodes.map((n) => (n.textContent || '').trim()));
  for (const name of names) expect(name, name).not.toMatch(/,\s*(PhD|MPP|MA|MSc|BA|BS)\b/);

  // One role vocabulary. The label under a portrait is the same string as
  // the role in the record, except where a title is too long to sit under
  // a portrait — which is exactly what `discipline` is for.
  const roles = await page
    .locator('[data-face]')
    .evaluateAll((faces) =>
      faces.map((face) => [
        face.getAttribute('data-face'),
        (face.querySelector('.face__role')?.textContent || '').trim(),
      ]),
    );
  expect(Object.fromEntries(roles)).toEqual({
    'elijah-moreno': 'Founder and CEO',
    'laurel-wheeler': 'Economics Lead',
    'isabella-agnes': 'Input-Output Modeling Lead',
    'francesca-agnes': 'Cedar Systems Lead',
    'kaylyn-lee': 'Platform Lead',
    'brian-kim': 'Engineering Advisor',
    'vod-vilfort': 'Methodology Advisor',
    'havala-hanson': 'Data Governance Advisor',
  });
  // Founder rule (AGENTS.md): "and", never "&", anywhere a visitor reads.
  for (const [, role] of roles) expect(role).not.toContain('&');

  // Degrees run highest-attainment first, so no entry may open on a
  // bachelor's while carrying a higher degree further down.
  const eduLists = await page
    .locator('[data-person]')
    .evaluateAll((cards) =>
      cards.map((card) =>
        Array.from(card.querySelectorAll('.pcard__list li')).map((li) =>
          (li.textContent || '').trim(),
        ),
      ),
    );
  const rank = (line: string) =>
    /^(PhD|Doctoral)/.test(line) ? 3 : /^(MPP|MSc|MA|MS)\b/.test(line) ? 2 : 1;
  for (const list of eduLists) {
    const ranks = list.map(rank);
    expect(ranks, list.join(' | ')).toEqual([...ranks].sort((a, b) => b - a));
  }

  // Tribal enrollment is its own block, never folded into Experience,
  // and it reaches the structured data as Person.memberOf.
  await page.locator('[data-face="elijah-moreno"]').click();
  await expect(page.locator('[data-person="elijah-moreno"] [data-field="tribal"] p')).toHaveText(
    /Coastal Band of the Chumash Nation, a non-federally recognized tribe in California/,
  );
  await expect(page.locator('[data-person="laurel-wheeler"] [data-field="tribal"]')).toHaveCount(0);
  const memberOf = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => {
    const blocks: Record<string, any>[] = nodes.flatMap((n) => {
      const parsed = JSON.parse(n.textContent || '{}');
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    return blocks
      .filter((block) => block['@type'] === 'AboutPage')
      .flatMap((block) =>
        (block.mainEntity.itemListElement as Record<string, any>[]).map((entry) => entry.item),
      )
      .filter((person) => person.memberOf)
      .map((person) => person.memberOf.name);
  });
  expect(memberOf).toEqual(['Coastal Band of the Chumash Nation']);

  // The surface is as tall as the longest record, always: sized to the
  // current one the band jumped 276px at 1440 and 478px at 1100 the
  // moment a reader clicked away from the default.
  const bandHeights: number[] = [];
  for (const slug of ['elijah-moreno', 'kaylyn-lee', 'brian-kim', 'laurel-wheeler']) {
    await page.locator(`[data-face="${slug}"]`).click();
    bandHeights.push(Math.round((await page.locator('.team-band').boundingBox())?.height ?? 0));
  }
  expect(new Set(bandHeights).size, bandHeights.join(', ')).toBe(1);

  // That works by stacking the records and hiding all but one with
  // `visibility`, which keeps them out of the accessibility tree and out
  // of the tab order exactly as display:none would. Prove the second
  // part rather than trusting it: no link in a hidden record may take
  // focus.
  await page.locator('[data-face="elijah-moreno"]').click();
  const hiddenLinkStyles = await page
    .locator('[data-person][hidden] a')
    .evaluateAll((links) => links.map((a) => getComputedStyle(a).visibility));
  expect(hiddenLinkStyles.length).toBeGreaterThan(0);
  expect(hiddenLinkStyles.every((v) => v === 'hidden')).toBe(true);
  await page.locator('[data-face="havala-hanson"]').focus();
  const reached: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    reached.push(
      await page.evaluate(() => {
        const card = (document.activeElement as HTMLElement)?.closest('[data-person]');
        return card
          ? `${card.getAttribute('data-person')}:${card.hasAttribute('hidden')}`
          : 'other';
      }),
    );
  }
  for (const stop of reached) expect(stop, reached.join(' ')).not.toContain(':true');

  // Michigan State hosts the AEA Summer Training Program Elijah attended;
  // it granted him no degree, so it must not reach the training shelf.
  const shelf = await page
    .locator('.schools li')
    .evaluateAll((nodes) => nodes.map((n) => (n.textContent || '').trim()));
  expect(shelf).not.toContain('Michigan State University');
  expect(shelf).toContain('Cornell University');

  // The shelf is alphabetical on the distinctive word, because nine of
  // thirteen start "University of" and a literal sort would file most of
  // it under U.
  const key = (school: string) => school.replace(/^(The |University of )/, '');
  expect(shelf).toEqual([...shelf].sort((a, b) => key(a).localeCompare(key(b))));

  // The core team is reachable; advisors are not given a work address.
  await page.locator('[data-face="laurel-wheeler"]').click();
  await expect(
    page.locator('[data-person="laurel-wheeler"] a[href="mailto:laurel.wheeler@lumecon.ai"]'),
  ).toHaveCount(1);
  await page.locator('[data-face="brian-kim"]').click();
  await expect(page.locator('[data-person="brian-kim"] a[href^="mailto:"]')).toHaveCount(0);

  // Profile links are the founder-supplied addresses. Seven people have
  // LinkedIn and Vod Vilfort has none, which is a fact about him rather
  // than a gap to be filled from a search result.
  const linkedin = await page
    .locator('[data-person]')
    .evaluateAll((cards) =>
      cards.map((card) => [
        card.getAttribute('data-person'),
        card.querySelector('a[href*="linkedin.com"]')?.getAttribute('href') ?? null,
      ]),
    );
  expect(Object.fromEntries(linkedin)).toEqual({
    'elijah-moreno': 'https://www.linkedin.com/in/elijahmoreno',
    'laurel-wheeler': 'https://www.linkedin.com/in/laurel-wheeler',
    'isabella-agnes': 'https://www.linkedin.com/in/maria-isabella-agnes-741569b7',
    'francesca-agnes': 'https://www.linkedin.com/in/francesca-agnes-a8106722b',
    'kaylyn-lee': 'https://www.linkedin.com/in/kaylynlee',
    'brian-kim': 'https://www.linkedin.com/in/brian-kim-1a543466',
    'vod-vilfort': null,
    'havala-hanson': 'https://www.linkedin.com/in/havala-hanson',
  });
  // A shared LinkedIn URL carries utm_source=share_via; the canonical
  // address does not, and that is what gets emitted as Person.sameAs.
  for (const [, href] of linkedin) expect(href ?? '').not.toContain('utm_');
  await expect(page.locator('[data-person="vod-vilfort"] a[href*="scholar.google"]')).toHaveCount(
    1,
  );
});

test('the founding investor is in structured data only, never in what a visitor reads', async ({
  page,
}) => {
  // Founder's decision (2026-09): Michael Moreno stays in the homepage
  // Organization.founder JSON-LD and appears on no surface a visitor
  // reads. Cedar's answers live in a JS bundle rather than in page
  // markup, so checking rendered text alone would have missed the two
  // that named him — grep dist/, not just src/.
  for (const route of ['/', '/team']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const visible = await page.evaluate(() => document.body.innerText);
    expect(visible, route).not.toContain('Michael Moreno');
  }
  const assets = join(process.cwd(), 'dist', '_astro');
  const bundles = readdirSync(assets).filter((f) => f.endsWith('.js'));
  expect(bundles.length).toBeGreaterThan(0);
  for (const file of bundles) {
    expect(readFileSync(join(assets, file), 'utf8'), file).not.toContain('Michael Moreno');
  }
  // He is still the founding investor where machines read it.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const founders = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => {
    const blocks: Record<string, any>[] = nodes.flatMap((n) => {
      const parsed = JSON.parse(n.textContent || '{}');
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    return blocks.filter((b) => b.founder).flatMap((b) => b.founder);
  });
  expect(founders).toEqual([
    { '@type': 'Person', name: 'Elijah Moreno', jobTitle: 'Founder and CEO' },
    { '@type': 'Person', name: 'Michael Moreno', jobTitle: 'Founding Investor' },
  ]);
});
