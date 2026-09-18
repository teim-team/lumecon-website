import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { scrollUntilCedarVisible } from './cedar-visibility';

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
  // The header's filled button is Request access, so the hero's is too: one
  // primary action per page, not a header and a hero asking for different
  // things. Pricing stays beside it as the secondary.
  const heroCta = page.locator('.hero2 .hero2-cta a');
  await expect(heroCta).toHaveText([/Request free access/, /See plans and pricing/]);
  await expect(heroCta.first()).toHaveClass(/btn2--primary/);
  await expect(heroCta.first()).toHaveAttribute('href', '/signup?tier=free');
  await expect(heroCta.nth(1)).not.toHaveClass(/btn2--primary/);

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
  /* The five that are rendered, in order. The rest sit behind "See more
     options", so this list is the whole of what a visitor is offered
     before they ask for more — worth pinning rather than sampling. */
  expect(prompts).toEqual([
    'What is Lumecon?',
    'What is Cedar?',
    'How much does it cost?',
    'How is this different from IMPLAN?',
    'How long does an analysis take?',
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
  // The overlay is an accordion now, so a destination inside a group is
  // reached by opening its group rather than by scrolling past every other.
  await expect(menu.locator('a', { hasText: 'Methodology' })).toBeHidden();
  await menu.locator('[data-navm-tab="resources"]').click();
  await expect(menu.locator('a', { hasText: 'Methodology' })).toBeVisible();
  await expect(page.locator('#nav')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('#nav')).toHaveCSS('background-color', 'rgb(250, 252, 253)');
});

test('desktop nav groups the destinations, with no Menu button', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  // Four top-level items: three groups and Pricing on its own.
  await expect(page.locator('.nav-links > .nav-item')).toHaveCount(4);
  for (const label of ['Product', 'Why Lumecon', 'Resources']) {
    await expect(page.locator('.nav-toggle', { hasText: label })).toBeVisible();
  }
  await expect(page.locator('.nav-links > .nav-item > a[aria-current="page"]')).toHaveText(
    'Pricing',
  );
  await expect(page.locator('.nav-signup')).toBeVisible();
  await expect(page.locator('#navMenuBtn')).toBeHidden();

  // A panel opens on its button and closes on Escape, and the whole Cedar
  // family lives in one of them.
  await expect(page.locator('#navp-product')).toBeHidden();
  await page.locator('#navt-product').click();
  await expect(page.locator('#navp-product')).toBeVisible();
  await expect(page.locator('#navt-product')).toHaveAttribute('aria-expanded', 'true');
  // Match the link's own label, not its accessible name: each link also
  // carries a one-line description, and "Cedar" is a prefix of the other
  // two destinations.
  for (const label of ['Cedar Impact', 'Cedar', 'Cedar Grove']) {
    await expect(
      page.locator('#navp-product .nav-panel__text', {
        hasText: new RegExp(`^\\s*${label}\\s*$`),
      }),
    ).toBeVisible();
  }
  // Opening another closes the first: one panel at a time.
  await page.locator('#navt-resources').click();
  await expect(page.locator('#navp-product')).toBeHidden();
  await expect(page.locator('#navp-resources')).toBeVisible();
  // The starting guide leads Resources, so the newest reader meets it first.
  await expect(page.locator('#navp-resources .nav-panel__text')).toHaveText([
    'Plan your first analysis',
    'Methodology',
    'Industry sectors',
    'Glossary',
  ]);
  await expect(page.locator('#navp-resources a[href="/start"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#navp-resources')).toBeHidden();
});

test('what crawlers are told matches what the site actually serves', async ({ page }) => {
  /* Three lists used to describe this site and none of them knew about
     the others: the sitemap (from the filesystem), the copy document's own
     array, and llms.txt's prose. /why-lumecon shipped into the first and
     was missing from the other two. They read one inventory now, and this
     is what keeps them honest — a page added to the site and forgotten in
     src/data/siteMap.ts fails here rather than going quietly missing from
     what an assistant is given. */
  const { SITE_PAGES, INDEXED_PAGES, LLMS_PAGES } = await import('../src/data/siteMap');

  // 1. The sitemap and the inventory name the same indexed pages.
  const xml = await (await page.request.get('/sitemap-0.xml')).text();
  const inSitemap = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/')
    .sort();
  const declared = INDEXED_PAGES.map((p) => p.path).sort();
  expect(inSitemap, 'sitemap and inventory agree').toEqual(declared);

  // 2. Every page in the inventory is actually served, and the noindex
  //    ones really carry the robots directive that keeps them out.
  for (const entry of SITE_PAGES) {
    const url = entry.visit ?? entry.path;
    const res = await page.request.get(url);
    const ok = entry.path === '/404' ? [200, 404] : [200];
    expect(ok, `${url} is served`).toContain(res.status());
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const robots = await page
      .locator('meta[name="robots"]')
      .evaluateAll((n) => n.map((x) => x.getAttribute('content') || '').join(' '));
    if (entry.indexing === 'noindex') {
      expect(robots, `${entry.path} is noindex`).toMatch(/noindex/);
    } else {
      expect(robots, `${entry.path} is indexable`).not.toMatch(/noindex/);
    }
  }

  // 3. llms.txt lists exactly those pages, and lists nothing the site
  //    does not serve. An assistant reading a stale URL is worse than one
  //    reading a short list.
  const llms = await (await page.request.get('/llms.txt')).text();
  const listed = [...llms.matchAll(/^- https:\/\/lumecon\.ai(\/[a-z0-9-]*)? —/gm)].map(
    (m) => m[1] || '/',
  );
  expect(listed.sort(), 'llms.txt lists the indexed pages').toEqual(
    LLMS_PAGES.map((p) => p.path).sort(),
  );
  for (const entry of LLMS_PAGES) {
    expect(llms, `llms.txt states what ${entry.path} is for`).toContain(entry.question);
  }
  // Every other lumecon.ai URL named anywhere in the file resolves too.
  const referenced = [...new Set([...llms.matchAll(/https:\/\/lumecon\.ai(\/[a-z0-9-]+)/g)].map((m) => m[1]))];
  for (const path of referenced) {
    const res = await page.request.get(path);
    expect(res.status(), `llms.txt points at a real page: ${path}`).toBe(200);
  }
});

test('robots.txt welcomes assistants and points at the sitemap', async ({ page }) => {
  const robots = await (await page.request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://lumecon.ai/sitemap-index.xml');
  // The crawlers this site is deliberately written for.
  for (const agent of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
    expect(robots, `${agent} has a group`).toContain(`User-agent: ${agent}`);
  }
  /* robots.txt has no inheritance: a crawler matches one group and ignores
     every other, so each group has to repeat the two Disallow lines. A
     group that lost them would quietly expose what the others withhold. */
  /* Split on blank lines, not on every `User-agent:`. A group may list
     SEVERAL agents before one shared rule set — which is how this file
     keeps the repetition to three copies instead of twenty-two — so
     splitting per agent line cuts one group into pieces that each look
     like they are missing their rules. */
  const groups = robots
    .split(/\n\s*\n/)
    .map((g) => g.replace(/^\s*#.*$/gm, '').trim())
    .filter((g) => g.startsWith('User-agent:'));
  expect(groups.length).toBeGreaterThanOrEqual(3);
  for (const group of groups) {
    expect(group, 'every group withholds /_headers').toContain('Disallow: /_headers');
    expect(group, 'every group withholds /404').toContain('Disallow: /404');
  }
  const sitemapXml = await (await page.request.get('/sitemap-index.xml')).text();
  expect(sitemapXml).toContain('sitemap-0.xml');
});

test('the nav runs Product, Why Lumecon, Pricing, Resources', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  // Order is the decision, not just membership: the buyer's question sits
  // beside the product, before the price, and Resources stays last because
  // it is where a reader goes to check the work rather than be persuaded.
  const top = await page
    .locator('.nav-links > .nav-item')
    .evaluateAll((nodes) =>
      nodes.map((n) =>
        (n.querySelector('.nav-toggle, :scope > a')?.textContent || '').trim(),
      ),
    );
  expect(top).toEqual(['Product', 'Why Lumecon', 'Pricing', 'Resources']);

  await page.locator('#navt-why').click();
  await expect(page.locator('#navp-why .nav-panel__text')).toHaveText([
    'Why Lumecon',
    'Our team',
    'Security and data governance',
    'Contact',
  ]);
  // The group is led by the page that answers its own question.
  await expect(page.locator('#navp-why a').first()).toHaveAttribute('href', '/why-lumecon');
  // Methodology stays under Resources.
  await expect(page.locator('#navp-why a[href="/methodology"]')).toHaveCount(0);
  await page.locator('#navt-resources').click();
  await expect(page.locator('#navp-resources a[href="/methodology"]')).toBeVisible();
});

test('why lumecon reads its evidence from the same sources the rest of the site does', async ({
  page,
}) => {
  await page.goto('/why-lumecon', { waitUntil: 'networkidle' });

  /* The entry price is imported from src/data/pricing.ts rather than typed
     into the prose. Checked against what /pricing renders, because a price
     restated on a second page is a price that drifts. */
  const shown = (await page.locator('.why-price__amt').innerText()).trim();
  await page.goto('/pricing', { waitUntil: 'networkidle' });
  const allPlans = await page.locator('.pr-plan').allInnerTexts();
  expect(
    allPlans.some((t) => t.includes(shown)),
    `the entry price ${shown} appears on /pricing`,
  ).toBe(true);

  await page.goto('/why-lumecon', { waitUntil: 'networkidle' });
  /* The lineage is written out rather than screenshotted, so a reader can
     check it — which means it has to be checkable. Both decompositions of
     the same total have to add to that total. */
  const sums = await page.evaluate(() => {
    const num = (s: string) => Number(s.replace(/[^0-9]/g, ''));
    const total = num(document.querySelector('.why-trace__total')!.textContent || '');
    return [...document.querySelectorAll('.why-trace__col')].map((col) => ({
      total,
      sum: [...col.querySelectorAll('.why-trace__v')].reduce(
        (a, n) => a + num(n.textContent || ''),
        0,
      ),
    }));
  });
  expect(sums.length, 'two decompositions').toBe(2);
  for (const { total, sum } of sums) expect(sum, 'the parts add to the total').toBe(total);
});

test('why lumecon claims no time saving, and states the security status with its limits', async ({
  page,
}) => {
  await page.goto('/why-lumecon', { waitUntil: 'networkidle' });
  const text = await page.evaluate(() => document.body.innerText);

  // Nothing has been measured, so nothing may be claimed. These are the
  // shapes a speed claim takes.
  expect(text).not.toMatch(/\b\d+\s*(%|percent)\s*(faster|quicker|less time)/i);
  expect(text).not.toMatch(/\b(saves?|cuts?|reduces?)\s+[^.]{0,20}\b\d+\s*(%|percent|hours|weeks|days)/i);
  expect(text, 'says plainly that it does not make other people faster').toContain(
    'have not measured a time saving',
  );

  // The security line is the one /security publishes, limits intact.
  expect(text).toContain('No SOC 2 examination has been completed');
  await expect(page.locator('main a[href="/security"]')).toHaveCount(1);
  // And the methodology is linked prominently, not just from the footer.
  await expect(page.locator('main a[href^="/methodology"]')).not.toHaveCount(0);
});

test('why lumecon shows the staff with a real line each, and the portraits load', async ({
  page,
}) => {
  await page.goto('/why-lumecon', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[class*="reveal"]')) el.classList.add('is-in');
  });
  const people = page.locator('.why-person');
  await expect(people).toHaveCount(5);
  await people.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const rows = await people.evaluateAll((nodes) =>
    nodes.map((n) => ({
      href: n.getAttribute('href'),
      name: (n.querySelector('.why-person__n')?.textContent || '').trim(),
      body: (n.querySelector('.why-person__b')?.textContent || '').trim(),
      line: (n.querySelector('.why-person__b')?.textContent || '').trim().length,
      loaded: (n.querySelector('img') as HTMLImageElement).naturalWidth > 0,
    })),
  );
  /* And the line under each face is the roster's own, not a second copy
     kept in this page. A parallel map goes stale silently: the record
     moves, the buyer-facing page keeps the old sentence. */
  const { TEAM_ROSTER } = await import('../src/data/team');
  for (const person of TEAM_ROSTER) {
    const card = rows.find((r) => r.name === person.name);
    expect(card, `${person.name} has a card`).toBeTruthy();
    expect(card!.body, `${person.name}'s line comes from the roster`).toBe(
      person.experience?.[0] ?? person.title,
    );
  }
  for (const r of rows) {
    // Every portrait is a real file and every person carries a sentence:
    // an empty one would mean the record and this page had drifted apart.
    expect(r.loaded, `${r.href} portrait loaded`).toBe(true);
    expect(r.line, `${r.href} has a line`).toBeGreaterThan(20);
    /* Fetch it. The first version of this check asserted the href's SHAPE
       — `/^\/team\//` — and passed while all five links pointed at
       `/team/<slug>`, which is not a route: the build emits
       dist/team/index.html and the portraits and nothing else, so every
       card landed on the 404 page. A link test that does not follow the
       link is not a link test. */
    const res = await page.request.get(r.href!);
    expect(res.status(), `${r.href} resolves`).toBe(200);
  }
});

test('why lumecon reads its lineage from the screenshot fixture', async ({ page }) => {
  /* The figures written out under "See what supports the result" describe
     the run in the hero capture. Hard-coded, they could come to describe a
     different run the next time that fixture moved and the screenshot was
     retaken, and the sum check above would not notice — it only proves the
     numbers agree with each other. This compares them to the fixture. */
  const { RESULTS } = (await import('../scripts/screenshots/examples-data.mjs')) as {
    RESULTS: Record<string, any>;
  };
  const run = RESULTS['r-nation-b'];
  const inState = (rows: any[]) => rows.filter((r) => r.scope === 'state');
  const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

  await page.goto('/why-lumecon', { waitUntil: 'networkidle' });
  await expect(page.locator('.why-trace__total')).toHaveText(usd(run.outputs.state.output));

  const cols = page.locator('.why-trace__col');
  await expect(cols.nth(0).locator('.why-trace__v')).toHaveText(
    inState(run.tables.by_effect).map((r: any) => usd(r.output_impact)),
  );
  await expect(cols.nth(1).locator('.why-trace__v')).toHaveText(
    inState(run.tables.by_entity).map((r: any) => usd(r.output_impact)),
  );
  await expect(cols.nth(1).locator('.why-trace__n')).toHaveText(
    inState(run.tables.by_entity).map((r: any) => r.entity_name),
  );
});

test('methodology keeps the method and sends the comparison to why lumecon', async ({ page }) => {
  await page.goto('/methodology', { waitUntil: 'networkidle' });
  // Assumptions and limits are their own labeled section, findable without
  // opening four disclosures.
  const limits = page.locator('#m-limits');
  await expect(limits).toBeVisible();
  await expect(limits).toHaveText(/assumes, and where it stops/i);
  const body = await page.locator('.meth-limits__body').innerText();
  for (const topic of ['two-digit NAICS', 'counterfactual', 'nominal dollars']) {
    expect(body, `limits names ${topic}`).toContain(topic);
  }
  // The buyer-facing comparison moved, and left a route behind.
  await expect(page.locator('.meth-crosslink a[href="/why-lumecon"]')).toBeVisible();
  await expect(page.locator('#m-compare')).toHaveCount(0);
  // The equations stayed.
  await expect(page.locator('#m-core')).toBeVisible();
});

test('a page inside a group is marked on the group that holds it', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/methodology', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-toggle[data-current="true"]')).toHaveText(/Resources/);
  await page.locator('#navt-resources').click();
  await expect(page.locator('#navp-resources a[aria-current="page"]')).toHaveText(/Methodology/);
});

test('the phone menu folds, opens one group at a time, and fits one screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#navMenuBtn').click();
  const menu = page.locator('#navMenu');
  await expect(menu).toBeVisible();

  // Folded: the top level is the four groups plus Log in and the CTA, and
  // it fits without scrolling. Expanded, this was twelve-plus destinations
  // shrunk down to fit, which is what made it clunky.
  await expect(menu.locator('[data-navm-panel]:visible')).toHaveCount(0);
  const overflows = await menu.evaluate((el) => el.scrollHeight > window.innerHeight);
  expect(overflows, 'the folded menu should not need scrolling').toBe(false);

  // One at a time, and a second tap on the open group returns to the top level.
  await menu.locator('[data-navm-tab="product"]').click();
  await expect(menu.locator('[data-navm-panel]:visible')).toHaveCount(1);
  await expect(menu.locator('[data-navm-tab="product"]')).toHaveAttribute('aria-expanded', 'true');
  await menu.locator('[data-navm-tab="resources"]').click();
  await expect(menu.locator('[data-navm-panel]:visible')).toHaveCount(1);
  await expect(menu.locator('[data-navm-tab="product"]')).toHaveAttribute('aria-expanded', 'false');
  await menu.locator('[data-navm-tab="resources"]').click();
  await expect(menu.locator('[data-navm-panel]:visible')).toHaveCount(0);

  // Thumb-sized controls, and the CTA is the header's action, not a sixth
  // line in the list.
  for (const sel of ['[data-navm-tab="product"]', '.navm-list__cta']) {
    const box = await menu.locator(sel).boundingBox();
    expect(box!.height, `${sel} tap target`).toBeGreaterThanOrEqual(44);
  }

  /* The CTA takes the approved two-stop gradient and the theme-aware ink.
     An earlier version filled it with `--navy` and hardcoded white text;
     `--navy` flips to near-white in dark mode, so that was invisible there.
     Asserted as a gradient with a real stop count, not a colour literal, so
     the check survives a palette change. */
  const cta = await menu.locator('.navm-list__cta').evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      image: cs.backgroundImage,
      stops: [...cs.backgroundImage.matchAll(/rgba?\(/g)].length,
      color: cs.color,
    };
  });
  expect(cta.image).toContain('gradient');
  expect(cta.stops).toBeGreaterThanOrEqual(2);
  expect(cta.color, 'the CTA ink must come from a token, not a literal').not.toBe('');
});

test.describe('the phone menu in the dark colour scheme', () => {
  test.use({ colorScheme: 'dark' });

  test('the CTA stays readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#navMenuBtn').click();
    const ratio = await page.locator('.navm-list__cta').evaluate((el) => {
      const parse = (c: string) => c.match(/\d+/g)!.slice(0, 3).map(Number);
      const lum = (rgb: number[]) => {
        const c = rgb
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      const cs = getComputedStyle(el);
      const fg = lum(parse(cs.color));
      // Every stop of the gradient, so the worst one is what is asserted.
      const stops = [...cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)].map((m) =>
        m[1].split(',').slice(0, 3).map(Number),
      );
      const ratios = stops.map((s) => {
        const b = lum(s);
        return (Math.max(fg, b) + 0.05) / (Math.min(fg, b) + 0.05);
      });
      return Math.min(...ratios);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

test('the phone menu traps focus around its toggles, not just its links', async ({ page }) => {
  /* Regression. The trap collected `menu.querySelectorAll('a')`, so when the
     overlay became an accordion the group toggles fell outside it, and
     opening the menu tried to focus the first link, which now sits inside a
     folded panel. Focusing a hidden element silently does nothing, so the
     menu opened with focus nowhere. */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#navMenuBtn').click();

  // Opening lands on the first thing a person can actually reach.
  await expect(page.locator('[data-navm-tab="product"]')).toBeFocused();

  // Backwards from there wraps to the button that opened it.
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#navMenuBtn')).toBeFocused();

  /* And nothing inside a folded panel is tabbable. Walked with real Tab
     presses rather than counted: an earlier version of this asserted
     `reachable < reachable + folded`, which is true for any positive
     `folded` no matter what the trap does, so it could not fail. */
  const foldedHrefs = await page
    .locator('#navMenu [data-navm-panel][hidden] a')
    .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href')));
  expect(foldedHrefs.length).toBeGreaterThan(0);

  const visited: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const here = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      return el.getAttribute('href') ?? el.getAttribute('data-navm-tab') ?? el.id ?? el.tagName;
    });
    if (here) visited.push(here);
  }
  // Tabbing all the way round never lands on a destination inside a folded
  // panel, which is the property the trap has to hold.
  for (const href of foldedHrefs) {
    expect(visited, `tab order reached ${href} inside a folded panel`).not.toContain(href);
  }
  // And it does reach the toggles, so the walk above was not simply stuck.
  expect(visited).toContain('product');
  expect(visited).toContain('resources');
});

test('the phone menu opens the group holding the current page', async ({ page }) => {
  // The menu should show where you are rather than making you find it.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/methodology', { waitUntil: 'networkidle' });
  await page.locator('#navMenuBtn').click();
  const open = page.locator('#navMenu [data-navm-panel]:visible');
  await expect(open).toHaveCount(1);
  await expect(open).toHaveAttribute('data-navm-panel', 'resources');
  await expect(open.locator('a[aria-current="page"]')).toHaveText(/Methodology/);
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

test('contact is a page, and every route on it goes somewhere real', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Talk to a person');

  // The navigation and the footer link the page, not a mailto. A menu
  // mailto is a dead end for anyone without a desktop mail client.
  await expect(page.locator('#navp-why a[href="/contact"]')).toHaveCount(1);
  await expect(page.locator('footer a[href="/contact"]')).toHaveCount(1);
  await expect(page.locator('#navp-why a[href^="mailto:"]')).toHaveCount(0);

  // Four routes, each pointing at the page that answers most of it.
  for (const href of ['/signup', '/start', '/security', '/accessibility']) {
    await expect(page.locator(`.contact-routes a[href="${href}"]`)).toHaveCount(1);
  }

  // The form is real and required fields are marked as such.
  for (const name of ['name', 'email', 'organization', 'message']) {
    await expect(page.locator(`.contact-form [name="${name}"]`)).toHaveCount(1);
  }
  // The honeypot is present and off-screen rather than display:none, so a
  // bot filling every field still trips it.
  const honeypot = page.locator('.contact-hp input');
  await expect(honeypot).toHaveCount(1);
  const box = await page.locator('.contact-hp').boundingBox();
  expect(box === null || box.x < 0).toBeTruthy();

  // No response time is promised, because none has been set.
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/within \d+ (hours|business days|days)/i);
  // One inbox, so no invented aliases.
  expect(text).not.toContain('security@');
  expect(text).not.toContain('press@');
});

test('the contact form reports a missing field instead of submitting', async ({ page }) => {
  // Belt and braces: this test cannot get past validation today, but a future
  // edit to the fixture must not be able to turn it into a production POST.
  await page.route('**/v1/contact', (route) => route.abort());
  await page.goto('/contact', { waitUntil: 'networkidle' });
  await page.locator('.contact-form [name="name"]').fill('Test Person');
  await page.locator('[data-contact-submit]').click();
  const status = page.locator('[data-contact-status]');
  await expect(status).toBeVisible();
  await expect(status).toContainText('email');
  // Nothing navigated away to a mailto on an incomplete form.
  expect(page.url()).toContain('/contact');
  // The error puts the cursor in the field it is about, so a keyboard user
  // is not told something is wrong and left standing on the Send button.
  await expect(page.locator('.contact-form [name="email"]')).toBeFocused();
});

test('the contact form catches an email that cannot receive a reply', async ({ page }) => {
  /* CI builds with PUBLIC_API_URL=https://api.lumecon.ai, so a submit that
     gets past validation issues a real POST to production, on both browsers,
     on every run. Today it fails and falls through to the mail link; the day
     that endpoint accepts traffic it would file a contact record from every
     CI run instead. Intercepted here so this test can never reach the
     network, and so the valid-address case asserts the handler's own
     behaviour rather than whatever production happens to answer. */
  const submitted: string[] = [];
  await page.route('**/v1/contact', async (route) => {
    submitted.push(route.request().postData() ?? '');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto('/contact', { waitUntil: 'networkidle' });
  await page.locator('.contact-form [name="name"]').fill('Test Person');
  await page.locator('.contact-form [name="message"]').fill('A question about the model.');
  const status = page.locator('[data-contact-status]');

  // A typo here is the one error the visitor cannot recover from: the message
  // sends and the reply goes nowhere, with neither side any the wiser.
  for (const bad of ['not-an-email', 'missing@domain', 'two@@at.com', 'space bar@x.com']) {
    await page.locator('.contact-form [name="email"]').fill(bad);
    await page.locator('[data-contact-submit]').click();
    await expect(status).toContainText('looks incomplete', { timeout: 2000 });
    expect(page.url()).toContain('/contact');
  }

  // Nothing reached the network while the address was malformed: validation
  // runs before the request, not after it.
  expect(submitted).toHaveLength(0);

  // A real address is not blocked by the check, and does reach the handler.
  await page.locator('.contact-form [name="email"]').fill('person@example.org');
  await page.locator('[data-contact-submit]').click();
  await expect(status).not.toContainText('looks incomplete');
  await expect.poll(() => submitted.length).toBe(1);
  expect(submitted[0]).toContain('person@example.org');
});

test.describe('contact in the dark colour scheme', () => {
  test.use({ colorScheme: 'dark' });

  test('a validation error stays readable', async ({ page }) => {
    /* --terra-dark is a light-mode ink with no dark override: measured at
       2.86:1 on the dark ground, against the 4.5:1 small-text requirement.
       A validation error was hardest to read for exactly the people most
       likely to depend on it. Measured against the real rendered
       background rather than the token, so a later change to either side
       is caught. */
    await page.route('**/v1/contact', (route) => route.abort());
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await page.locator('[data-contact-submit]').click();
    const status = page.locator('[data-contact-status]');
    await expect(status).toBeVisible();

    const ratio = await status.evaluate((el) => {
      const parse = (c: string) => c.match(/\d+/g)!.slice(0, 3).map(Number);
      const bgOf = (n: Element | null) => {
        for (let e = n; e; e = e.parentElement) {
          const c = getComputedStyle(e).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) return parse(c);
        }
        return [255, 255, 255];
      };
      const lum = (rgb: number[]) => {
        const c = rgb
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      const a = lum(parse(getComputedStyle(el).color));
      const b = lum(bgOf(el));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

test.describe('contact with no working script', () => {
  test.use({ javaScriptEnabled: false });

  test('a submit cannot put the message in the URL or the history', async ({ page }) => {
    /* With neither method nor action the browser GETs this same URL, so the
       name, email, organization and message land in the query string, the
       history and any referrer, having delivered nothing. Verified to be a
       real leak before the fix: the URL came back carrying all three. */
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="name"]', 'Ada Lovelace');
    await page.fill('input[name="email"]', 'ada@example.org');
    await page.fill('textarea[name="message"]', 'Sensitive message body');
    /* Inert without a script: POST to a static page cannot deliver anything,
       so an enabled button would take the message and discard it. */
    await expect(page.locator('[data-contact-submit]')).toBeDisabled();

    await page.locator('[data-contact-submit]').click({ force: true }).catch(() => {});
    // Enter in a text field can submit a form regardless of the button, which
    // is why method="post" stays as the second line of defence.
    await page.locator('input[name="email"]').press('Enter').catch(() => {});
    await page.waitForTimeout(500);

    const url = page.url();
    for (const secret of ['Ada', 'Lovelace', 'ada%40example.org', 'Sensitive']) {
      expect(url, `no-script submit leaked ${secret}`).not.toContain(secret);
    }
    /* And the visitor is told where to write instead of being dead-ended.
       Asserted on the markup, not the text: with scripting disabled this way
       the parser can still hold noscript content as raw text, so the element
       has no text nodes to read even though the browser renders it. */
    const fallback = await page
      .locator('noscript')
      .evaluateAll((nodes) => nodes.map((n) => n.innerHTML).join(' '));
    expect(fallback).toContain('reaches the same place');
    expect(fallback).toContain('contact@lumecon.ai');
  });
});

test('the contact handler enables the button it ships disabled', async ({ page }) => {
  // The markup ships `disabled` so a broken script cannot take a message it
  // has no way to send. That only works if the handler reliably undoes it.
  await page.goto('/contact', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-contact-submit]')).toBeEnabled();
});

test('the contact fallback address is the one in config, not a second copy', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  // The client script reads the address off the form rather than repeating
  // it as a literal, so changing config cannot leave a stale address behind.
  await expect(page.locator('[data-contact-form]')).toHaveAttribute(
    'data-contact-email',
    'contact@lumecon.ai',
  );
});

test('the readiness section is a primer, and its accents actually render', async ({ page }) => {
  await page.goto('/start', { waitUntil: 'networkidle' });
  const sec = page.locator('[aria-labelledby="s-ready"]');
  await expect(sec).toBeVisible();

  // Four essentials, and the team guide folded away so the page stays a
  // primer rather than becoming a readiness audit.
  await expect(sec.locator('.ready-four__item')).toHaveCount(4);
  // One mark per essential, decorative: the heading beside it carries the
  // meaning, so the icon must not be announced as content.
  await expect(sec.locator('.ready-four__mark')).toHaveCount(4);
  await expect(sec.locator('.ready-four__mark[aria-hidden="true"]')).toHaveCount(4);
  // And no numerals, which is what these replaced.
  await expect(sec.locator('.ready-four__n')).toHaveCount(0);
  await expect(sec.locator('.ready-more')).not.toHaveAttribute('open', /.*/);
  // The floor line has to be present: without it this reads as an entry exam.
  await expect(sec.locator('.ready-floor')).toContainText('do not need every record');
  // The review path is named as normal, not as an obstacle.
  await sec.locator('.ready-more > summary').click();
  await expect(sec.locator('.ready-gov')).toContainText('Council');
  await expect(sec.locator('.ready-team__row')).toHaveCount(6);

  // An undefined CSS custom property makes the whole declaration invalid and
  // disappears with no error, which is how this shipped at 0px the first
  // time. Assert the accents resolved to something real.
  const style = await sec.evaluate((el) => {
    const floor = getComputedStyle(el.querySelector('.ready-floor')!);
    const num = getComputedStyle(el.querySelector('.ready-four__mark')!);
    const eyebrow = getComputedStyle(el.querySelector('.ready-team__holds')!);
    return {
      border: parseFloat(floor.borderLeftWidth),
      numColor: num.color,
      accent: getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-text')
        .trim(),
      eyebrowRadius: parseFloat(eyebrow.borderTopLeftRadius) || 0,
      eyebrowBg: eyebrow.backgroundColor,
    };
  });
  expect(style.border).toBeGreaterThan(0);

  // AGENTS.md: eyebrows are plain mono typography, not pills. A radius
  // communicates one assembled object, and this is a label on a row.
  expect(style.eyebrowRadius).toBe(0);
  expect(style.eyebrowBg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

  // Teal is semantic. The four marks (which replaced "01 02 03 04", because
  // a numeral implies an order this section's own lede denies) are not
  // actions, not economic concepts and not approved brand phrases, so a
  // reader skimming only the teal must not meet them either.
  const toRgb = (hex: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };
  const accentRgb = toRgb(style.accent);
  expect(accentRgb, 'accent token should resolve to a hex colour').toBeTruthy();
  expect(style.numColor).not.toBe(accentRgb);

  // Consultant-led work is the same analysis coordinated differently, so it
  // gets one line inside the fold, not a competing section or a second CTA.
  const consultant = sec.locator('.ready-consultant');
  await expect(consultant).toContainText('Working with a consultant?');
  await expect(consultant).toContainText('begin a project together');
  await expect(sec.locator('.ready-consultant a')).toHaveCount(0);
});

test('every dark cover hero carries the corner mark', async ({ page }) => {
  // One brand mark bled off the top-right of each dark cover. Cedar Grove
  // and Security were missing it while methodology, the starting guide and
  // Cedar had it, which read as three surfaces instead of one.
  const covers: [string, string][] = [
    ['/methodology', '.meth-hero--cover'],
    ['/start', '.meth-hero--cover'],
    ['/cedar', '.cedarpg-hero'],
    ['/cedar-grove', '.grovepg-hero'],
    ['/security', '.secpg-hero'],
  ];
  for (const [path, sel] of covers) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const mark = await page.locator(sel).first().evaluate((el) => {
      const cs = getComputedStyle(el, '::after');
      const host = getComputedStyle(el);
      return {
        image: cs.backgroundImage,
        opacity: cs.opacity,
        clipped: host.overflow,
        positioned: host.position,
      };
    });
    expect(mark.image, `${path} hero mark`).toContain('lumecon-logo-mark');
    // Decoration, not a design element competing with the copy.
    expect(Number(mark.opacity), `${path} mark opacity`).toBeLessThan(0.1);
    // Without both of these the mark widens the page instead of bleeding off it.
    expect(mark.positioned, `${path} hero positioning`).not.toBe('static');
    expect(mark.clipped, `${path} hero overflow`).toContain('hidden');
  }
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
  // design; no screenshot repeats within the tour. The hero cover reuses
  // the entities frame (it used to be that frame's -dark twin, until the
  // night-mode captures were retired), so the per-capture counts are
  // scoped to the tour rows rather than the whole page.
  await expect(page.locator('.cedarpg-diagram')).toHaveCount(0);
  const shots = page.locator('.tour-row__shot img');
  await expect(shots).toHaveCount(3);
  await expect(shots.and(page.locator('[src="/app/cedar-wind-upload.webp"]'))).toHaveCount(1);
  await expect(shots.and(page.locator('[src="/app/cedar-wind-entities.webp"]'))).toHaveCount(1);
  await expect(shots.and(page.locator('[src="/app/cedar-context.webp"]'))).toHaveCount(1);
  await expect(page.locator('.cedarpg-hero__screen img')).toHaveAttribute(
    'src',
    /^\/app\/cedar-(wind-upload|wind-entities|context)\.webp$/,
  );
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

test('cedar commons claims only what the product actually does', async ({ page }) => {
  await page.goto('/cedar-commons', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('more than one person');

  /* Each of these is answerable by a real route: participants carrying BOTH
     axes (`kind` internal|external and `role` collaborator|viewer, migration
     027), documents belonging to the project rather than to their uploader
     (migration 030), Cedar inside a project, and a note thread. */
  const body = (await page.locator('main').innerText()).toLowerCase();
  for (const claim of ['internal', 'external', 'collaborator', 'viewer', 'by email']) {
    expect(body, `should describe ${claim}`).toContain(claim);
  }

  /* The note thread really is append-only, and the page really does say so —
     in plain words. "Append-only" is the implementation's name for it and
     belongs in detailed help, not in the sentence a buyer reads, so this
     asserts the guarantee rather than the jargon. */
  expect(body).toContain('a note is kept, not edited');
  expect(body, 'implementation jargon belongs in help, not here').not.toContain('append-only');

  /* A seat is one person, counted across memberships, non-owner project
     participants and pending invites (server/lib/organizationSeats.js).
     An outside collaborator therefore costs a seat, and a consultancy
     choosing Sapling needs to know that before it buys, not after. */
  expect(body, 'the seat rule is a buying fact').toContain('occupies a seat');

  /* Four captures, not nine. Each has to do a job no other frame does; an
     inventory of drawers is what this page had and was told to stop being. */
  const frames = await page
    .locator('main img[src^="/app/"]')
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLImageElement).getAttribute('src')));
  expect(frames.length, 'three to four product frames, no more').toBeLessThanOrEqual(4);
  expect(new Set(frames).size, 'no frame used twice').toBe(frames.length);

  /* Differentiation, asserted rather than hoped for. Cedar Impact, Cedar and
     Cedar Grove already argue that the material stays attached to the work;
     this page is about the people who hold material you cannot reach. It
     must not re-run their argument, and must not re-explain Cedar (AGENTS.md
     gives each page one argument and allows a one-line pointer). */
  for (const borrowed of [
    'stays connected to its source',
    'reviewable workflow',
    'evidence behind every result',
  ]) {
    expect(body, `${borrowed} belongs to another page`).not.toContain(borrowed);
  }
  const cedarSentences = (await page.locator('main').innerText())
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => /\bCedar\b(?! Commons| Impact| Grove)/.test(sentence));
  expect(cedarSentences.length, `Cedar gets one sentence here, not ${cedarSentences.length}`)
    .toBeLessThanOrEqual(2);

  /* Data requests and approval tracking are proposals with no route on the
     branch being incorporated. A product page is not where a proposal goes,
     so the page must not imply either is available. */
  for (const unbuilt of ['assign a request', 'data request', 'approval workflow', 'track approvals']) {
    expect(body, `must not claim ${unbuilt}`).not.toContain(unbuilt);
  }

  // Included with a plan, never sold separately.
  /* Read from src/data/pricing.ts rather than restated on the page, so a
     price or a seat count cannot drift from /pricing. */
  await expect(page.locator('#cm-plans')).toContainText('Sapling');
  const plans = page.locator('.cm-plans__tier');
  await expect(plans).toHaveCount(4);
  /* Price with its billing period: "$2,500" alone reads as monthly or
     one-off, and these are annual. */
  await expect(plans.nth(2)).toContainText('$2,500 / year');
  await expect(plans.nth(3)).toContainText('Unlimited users in one organization');
  await expect(page.locator('a[href="/pricing"]').first()).toBeVisible();
  // The guide prepares, this page is where the work happens. One link each.
  await expect(page.locator('main a[href="/start"]')).toHaveCount(1);
});

test('cedar commons is reachable from the footer, and declares itself', async ({ page }) => {
  await page.goto('/cedar-commons', { waitUntil: 'domcontentloaded' });

  // A sibling product page is discoverable from the bottom of any page, not
  // only from the header.
  await expect(page.locator('footer a[href="/cedar-commons"]')).toHaveCount(1);

  // Its own WebPage node, as both sibling product pages carry.
  const types = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) =>
      nodes.flatMap((n) => {
        try {
          const parsed = JSON.parse(n.textContent ?? '');
          return (Array.isArray(parsed) ? parsed : [parsed]).map((x) => x['@type']);
        } catch {
          return [];
        }
      }),
    );
  expect(types).toContain('WebPage');

  /* The capture carries named facilities and economic results. Every product
     shot on this site says it is sample data, and a visitor must not take
     these for customers. */
  await expect(page.locator('.cedarpg-hero__screen figcaption')).toContainText('sample data');
  await expect(page.locator('.cedarpg-hero__screen img')).toHaveAttribute(
    'alt',
    /sample data/,
  );

  /* The surface sections must actually have a surface: the class was first
     copied from start.css, which this page does not import, so it was inert
     and both sections rendered on the page ground. */
  const surfaces = page.locator('.cm-sec--surface');
  await expect(surfaces).toHaveCount(2);
  const bg = await surfaces.first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toMatch(/rgba\(0, 0, 0, 0\)/);
});

test('cedar commons sits between Cedar and Cedar Grove in the product menu', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto('/cedar-commons', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nav-toggle[data-current="true"]')).toHaveText(/Product/);
  await page.locator('#navt-product').click();
  await expect(page.locator('#navp-product .nav-panel__text')).toHaveText([
    'Cedar Impact',
    'Cedar',
    'Cedar Commons',
    'Cedar Grove',
  ]);
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

test('the grove collections open one at a time, by click and by keyboard', async ({ page }) => {
  await page.goto('/cedar-grove', { waitUntil: 'networkidle' });
  const tabs = page.locator('[data-atlas-tab]');
  await expect(tabs).toHaveCount(12);

  // A picker, not twelve open panels: one collection at a time, and the
  // control says which.
  await expect(page.locator('[data-atlas-panel]:visible')).toHaveCount(1);
  await expect(tabs.first()).toHaveAttribute('aria-expanded', 'true');

  // Each tile opens its own collection, and the detail is the argument the
  // page is making: what it contributes, plus coverage, sources and terms.
  await tabs.nth(4).click();
  const open = page.locator('[data-atlas-panel]:visible');
  await expect(open).toHaveCount(1);
  await expect(tabs.first()).toHaveAttribute('aria-expanded', 'false');
  await expect(tabs.nth(4)).toHaveAttribute('aria-expanded', 'true');
  await expect(open.locator('dt')).toHaveText([
    'What Lumecon resolved',
    'Coverage',
    'Sources',
    'Terms',
  ]);

  // Arrow keys walk the strip and wrap, so neither end is a dead stop.
  const nameOf = () => open.locator('h3').textContent();
  await tabs.nth(4).focus();
  const atFive = await nameOf();
  await page.keyboard.press('ArrowRight');
  expect(await nameOf()).not.toBe(atFive);
  await page.keyboard.press('ArrowLeft');
  expect(await nameOf()).toBe(atFive);
  await tabs.first().focus();
  await page.keyboard.press('ArrowLeft');
  expect(await nameOf()).not.toBe(atFive);
});

test.describe('grove collections with no working script', () => {
  test.use({ javaScriptEnabled: false });

  test('every collection is readable, and no tile is a dead control', async ({ page }) => {
    await page.goto('/cedar-grove', { waitUntil: 'domcontentloaded' });
    // The panels ship open, so the section is a complete list rather than
    // twelve unlabelled icons.
    await expect(page.locator('[data-atlas-panel]:visible')).toHaveCount(12);
    // And the tiles are inert, so a keyboard user does not tab through twelve
    // controls that cannot answer.
    await expect(page.locator('[data-atlas-tab]:not([disabled])')).toHaveCount(0);
    // All twelve are expanded and all twelve say so.
    await expect(page.locator('[data-atlas-tab][aria-expanded="true"]')).toHaveCount(12);
  });
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
    'laurel-wheeler': 'Principal Economist',
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

test('team page motion reveals content and never strands it', async ({ page }) => {
  // Scroll-reveal's failure mode is content that stays invisible, so the
  // guarantees are the ones worth pinning, not the animation itself.
  const stillFaded = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.reveal-soft, [data-reveal-group] > *')]
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99)
        .map((el) => el.className || el.tagName),
    );

  // Reduced motion: shown at once, nothing faded, nothing to wait for.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/team', { waitUntil: 'networkidle' });
  expect(await stillFaded()).toEqual([]);

  // With motion, everything lands once it has been scrolled past —
  // including the advisors row and the training shelf, both of which
  // start below the fold.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/team', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await expect.poll(stillFaded, { timeout: 5000 }).toEqual([]);

  // The record fades when the selection changes. On a wide screen the
  // change is triggered by hovering the portraits, so the reader is not
  // looking at the panel when it happens; the fade is what says it did.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('[data-face="brian-kim"]').click();
  const opacity = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.pcard:not([hidden])')!).opacity),
  );
  expect(opacity).toBeLessThan(1);
  await expect
    .poll(() =>
      page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('.pcard:not([hidden])')!).opacity),
      ),
    )
    .toBe(1);
});

test('the footer is the same footer on every page', async ({ page }) => {
  /* Reported from a phone: the footer on /contact looked unlike the
     others — labels larger and dark instead of teal, link lists indented.
     It does not reproduce, and it is not a per-page difference: /contact
     serves the same stylesheets as /glossary and renders a pixel-identical
     footer.

     What the reported screenshot actually shows is one stylesheet missing.
     `_astro/nav.*.css` carries BOTH the design tokens (`--accent-text`)
     and the universal `*{margin:0;padding:0}` reset, while the footer's own
     rules are inlined in each page's <style>. Lose that one file and you
     get exactly the three symptoms together: the inline rules still
     uppercase and letter-space the label, `--accent-text` resolves to
     nothing so the colour falls back to inherited dark, and the reset is
     gone so every `ul` takes the UA's 40px indent. A failed or truncated
     stylesheet, not a page.

     Note what this test can and cannot do. It pins parity, which catches a
     real per-page divergence — the thing that was suspected. It cannot
     catch a stylesheet that fails to arrive over a phone network.

     Measured rather than compared as strings, because the footers do
     differ legitimately — the current page's own link is accented. */
  const shapes: Record<string, unknown>[] = [];
  for (const route of ['/contact', '/security', '/glossary', '/pricing', '/team']) {
    await page.goto(route, { waitUntil: 'networkidle' });
    shapes.push(
      await page.evaluate(() => {
        const label = document.querySelector('.footer-group__label')!;
        const link = document.querySelector('.footer-group__list a')!;
        const cs = getComputedStyle(label);
        return {
          labelSize: cs.fontSize,
          labelColor: cs.color,
          labelTransform: cs.textTransform,
          listIndent: Math.round(link.getBoundingClientRect().x - label.getBoundingClientRect().x),
          groups: document.querySelectorAll('.footer-group').length,
          links: document.querySelectorAll('.footer-group__list a').length,
        };
      }),
    );
  }
  for (const shape of shapes) expect(shape).toEqual(shapes[0]);
  // And the indent specifically, which is what the report described.
  expect(shapes[0]).toMatchObject({ listIndent: 0, groups: 4, labelTransform: 'uppercase' });
});

test('contact shows the people it promises, and only the staff', async ({ page }) => {
  await page.goto('/contact', { waitUntil: 'networkidle' });
  // The headline says "Talk to a person" and the page showed none, which
  // also left the house hero band mostly empty under two lines of text.
  const faces = page.locator('.contact-faces img');
  await expect(faces).toHaveCount(5);
  const names = await faces.evaluateAll((nodes) =>
    nodes.map((n) => (n as HTMLImageElement).alt),
  );
  expect(names).toContain('Elijah Moreno');
  // An advisor does not read this inbox, so no advisor appears beside a
  // form. They are on /team, where the distinction is made.
  for (const advisor of ['Brian Kim', 'Vod Vilfort', 'Havala Hanson']) {
    expect(names, 'advisors are not staff').not.toContain(advisor);
  }
  // The portraits are real files, not a broken row of alt text.
  const decoded = await faces.evaluateAll((nodes) =>
    nodes.every((n) => (n as HTMLImageElement).naturalWidth > 0),
  );
  expect(decoded, 'every portrait loaded').toBe(true);
  await expect(page.locator('.contact-who__a')).toHaveAttribute('href', '/team');
});

test('the contact form pairs its two short fields, and stacks them on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/contact', { waitUntil: 'networkidle' });
  const rowTops = async () =>
    page
      .locator('.contact-row .contact-field input')
      .evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().top)));
  // Four full-width controls in a column read as a longer form than this is.
  expect(new Set(await rowTops()).size, 'name and email share a row').toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  expect(new Set(await rowTops()).size, 'and stack on a phone').toBe(2);
});

test('the founding investor is in structured data only, never in what a visitor reads', async ({
  page,
}) => {
  // Founder's decision (2026-09): Michael Moreno stays in the homepage
  // Organization.founder JSON-LD and appears on no surface a visitor
  // reads. Cedar's answers live in a JS bundle rather than in page
  // markup, so checking rendered text alone would have missed the two
  // that named him — grep dist/, not just src/.
  /* /contact renders the same roster record as a row of portraits, so it
     is in this loop too — and checked as markup rather than as visible
     text, because a name in an `alt` attribute never reaches innerText. */
  for (const route of ['/', '/team', '/contact']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const visible = await page.evaluate(() => document.body.innerText);
    expect(visible, route).not.toContain('Michael Moreno');
    /* Markup minus the structured data, which is exactly where he is
       allowed to be — on `/` he is a JSON-LD Organization.founder. */
    const rendered = await page.evaluate(() => {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      for (const n of clone.querySelectorAll('script[type="application/ld+json"]')) n.remove();
      return clone.outerHTML;
    });
    expect(rendered, `${route} markup`).not.toContain('Michael Moreno');
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

test('the commons team shapes open one at a time, by click and by keyboard', async ({ page }) => {
  await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
  const tabs = page.locator('[data-surf-tab]');
  await expect(tabs).toHaveCount(2);
  await expect(tabs).toHaveText(['An organization', 'A consultancy']);

  // `:visible`, never the `hidden` PROPERTY. The UA sheet's
  // `[hidden] { display: none }` loses to any author `display` rule, so a
  // panel can report hidden === true and still be fully on screen. An
  // earlier version of this section shipped exactly that: every panel
  // rendered, the picker inert, and a probe that read the property called
  // it working.
  await expect(page.locator('[data-surf-panel]:visible')).toHaveCount(1);
  await expect(tabs.first()).toHaveAttribute('aria-expanded', 'true');

  await tabs.nth(1).click();
  const open = page.locator('[data-surf-panel]:visible');
  await expect(open).toHaveCount(1);
  await expect(open).toHaveAttribute('id', 'surf-consultancy');
  await expect(tabs.first()).toHaveAttribute('aria-expanded', 'false');
  await expect(tabs.nth(1)).toHaveAttribute('aria-expanded', 'true');

  // Arrow keys walk the strip and wrap, so neither end is a dead stop.
  await tabs.nth(1).focus();
  await page.keyboard.press('ArrowRight');
  await expect(open).toHaveAttribute('id', 'surf-organization');
  await page.keyboard.press('ArrowLeft');
  await expect(open).toHaveAttribute('id', 'surf-consultancy');

  // The two states are two real captures of the same screen. The same image
  // twice would make the comparison the section exists for into a caption.
  const shots = await page
    .locator('[data-surf-panel] img')
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLImageElement).getAttribute('src')));
  expect(shots).toHaveLength(2);
  expect(new Set(shots).size).toBe(2);

  /* The copy and the screenshot live in different parents — the copy inside
     the overlapping panel, the screenshot in the bleeding figure beside it —
     so a state is a pair. Both halves have to switch together, or the page
     describes one team shape beside a picture of the other. */
  const visibleCopy = page.locator('[data-surf-copy]:visible');
  await expect(visibleCopy).toHaveCount(1);
  await expect(visibleCopy).toHaveAttribute('data-surf-copy', 'consultancy');
});

test('every mobile crop declares its own size, not the fallback\'s', async ({ page }) => {
  await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
  /* A <source> without width/height leaves the browser reserving the box
     the fallback <img> declares — 1920x1200 — and then jumping to the
     crop's taller ratio when it decodes, which on a lazy image happens
     under the reader's thumb. Checked against the files themselves, so a
     re-crop that changes a dimension fails here rather than shipping a
     wrong reservation. */
  const declared = await page.locator('picture source[media]').evaluateAll((nodes) =>
    nodes.map((n) => ({
      src: n.getAttribute('srcset') || '',
      w: Number(n.getAttribute('width')),
      h: Number(n.getAttribute('height')),
    })),
  );
  expect(declared.length).toBeGreaterThan(0);
  for (const { src, w, h } of declared) {
    expect(w, `${src} declares a width`).toBeGreaterThan(0);
    expect(h, `${src} declares a height`).toBeGreaterThan(0);
    const real = await page.evaluate(
      (url) =>
        new Promise<{ w: number; h: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => reject(new Error(`could not load ${url}`));
          img.src = url;
        }),
      src,
    );
    expect(real, `${src} declares its real size`).toEqual({ w, h });
  }
});

test.describe('commons team shapes with no working script', () => {
  test.use({ javaScriptEnabled: false });

  test('both shapes are readable, and no tab is a dead control', async ({ page }) => {
    await page.goto('/cedar-commons', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-surf-panel]:visible')).toHaveCount(2);
    await expect(page.locator('[data-surf-copy]:visible')).toHaveCount(2);
    await expect(page.locator('[data-surf-tab]:not([disabled])')).toHaveCount(0);
    /* And every control says so. Both states ARE expanded here, so marking
       one `false` tells a screen reader that visible content is collapsed,
       behind a disabled control that offers no way to reconcile it. */
    await expect(page.locator('[data-surf-tab][aria-expanded="true"]')).toHaveCount(2);
  });

  test('each case sits with its own screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/cedar-commons', { waitUntil: 'domcontentloaded' });
    /* Visible is not the same as placed. The row is a two-column grid with
       three children, so the second figure auto-flowed into row 2 column 1
       — the 335px copy column — and sat away from the copy it belongs to.
       Measured: panel one at x=383 w=849, panel two at x=48 w=335. */
    const box = async (sel: string, i: number) =>
      (await page.locator(sel).nth(i).boundingBox())!;
    const copies = [await box('[data-surf-copy]', 0), await box('[data-surf-copy]', 1)];
    const panels = [await box('[data-surf-panel]', 0), await box('[data-surf-panel]', 1)];
    // Each figure follows its own copy, and the second copy follows the
    // first figure: one column, interleaved, rather than three blocks.
    expect(panels[0].y).toBeGreaterThan(copies[0].y);
    expect(copies[1].y).toBeGreaterThan(panels[0].y);
    expect(panels[1].y).toBeGreaterThan(copies[1].y);
    // And neither figure is squeezed into the narrow copy column.
    expect(Math.round(panels[0].width)).toBe(Math.round(panels[1].width));
    expect(panels[1].width).toBeGreaterThan(copies[1].width);
  });
});

test('every cedar commons capture actually loads', async ({ page }) => {
  // The first pass of this page shipped frames with a missing brand mark and
  // blank sector art, because the app repository's public/ directory is not
  // on every branch that carries the Commons UI. The capture script now
  // refuses to write a frame containing a broken image; this is the same
  // check on the published side, where a mis-named or un-copied asset would
  // show up instead.
  await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    for (const img of document.images) img.loading = 'eager';
  });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          // The lightbox ships an empty <img> it fills on open; it is not a
          // page asset and has nothing to fail at.
          .filter((i) => i.getAttribute('src'))
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => new URL(i.currentSrc).pathname),
      ),
    )
    .toEqual([]);
});

test.describe('the product pages on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('cedar commons serves a cropped capture, not a shrunken one', async ({ page }) => {
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    // A 1920px desktop capture scaled into a 358px column renders every
    // label in the product under four pixels: the thing the section exists
    // to show becomes the thing you cannot see. Each content frame has a
    // `-narrow` crop, and `<picture>` is what picks it.
    /* The rows are below the fold and their images are lazy, and the
       reveal script holds them until they are scrolled to, so walk the page
       first. */
    await page.evaluate(async () => {
      for (const el of document.querySelectorAll('[class*="reveal"]')) el.classList.add('is-in');
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });

    /* Let the lazy images that DID start loading finish before reading
       them. Without this the test raced the decode: chromium happened to
       have them decoded by the time the scroll walk returned and WebKit
       did not, so CI went red on WebKit alone with `naturalWidth === 0`
       against a crop that was perfectly fine. Waiting on `complete`
       keeps the assertion's teeth — a 404 also completes, with
       naturalWidth 0, which is exactly what the check below catches. */
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.cm-acts img')]
          .filter((n) => (n as HTMLImageElement).currentSrc)
          .every((n) => (n as HTMLImageElement).complete),
      null,
      { timeout: 15000 },
    );

    /* Only the frames that actually loaded: the unselected team shape is
       `display: none`, so its lazy image never fetches and reports an empty
       `currentSrc`. That is correct behaviour, not a missing crop — the
       declared-source check below is what covers it. */
    const chosen = await page.locator('.cm-acts img').evaluateAll((nodes) =>
      nodes
        .map((n) => ({
          src: (n as HTMLImageElement).currentSrc,
          width: (n as HTMLImageElement).naturalWidth,
        }))
        .filter((x) => x.src),
    );
    expect(chosen.length).toBeGreaterThan(0);
    for (const { src, width } of chosen) {
      expect(src, 'a phone must get the cropped variant').toContain('-narrow.webp');
      /* And the crop has to be a real file. A `<source>` pointing at
         something that does not exist falls back silently to the full
         frame, which is the state this test exists to prevent, so check
         the image decoded at the crop's own width rather than at 1920. */
      expect(width, 'the crop decoded').toBeGreaterThan(0);
      expect(width, 'the narrow crops are under 1000px wide').toBeLessThan(1000);
    }

    /* Every declared narrow source, including the one behind the
       unselected state, has to resolve. Checked over the wire rather than
       through the renderer, which would let a 404 pass as a fallback. */
    const declared = await page
      .locator('.cm-acts source[media]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('srcset') || ''));
    expect(declared.length).toBeGreaterThan(0);
    for (const href of declared) {
      expect(href).toContain('-narrow.webp');
      const res = await page.request.get(href);
      expect(res.status(), `${href} should exist`).toBe(200);
    }
  });

  test('cedar commons keeps both team tabs on one line', async ({ page }) => {
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    const boxes = await page
      .locator('[data-surf-tab]')
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
    // A tab clipped at the panel's edge reads as broken rather than as
    // scrollable, and two rows of tabs above the copy they label is worse.
    expect(new Set(boxes.map(Math.round)).size, 'both tabs on one row').toBe(1);
    const strip = page.locator('.cm-surf__tabs');
    const fits = await strip.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fits, 'both tabs fit without scrolling at 390px').toBe(true);
  });

  test('the grove atlas is a swipeable strip, not a wall of tiles', async ({ page }) => {
    await page.goto('/cedar-grove', { waitUntil: 'networkidle' });
    const grid = page.locator('.grovepg-atlas__grid');
    await grid.scrollIntoViewIfNeeded();
    // Twelve tiles as a two-column grid is roughly 770px of picker between
    // the section's question and the panel that answers it.
    const height = (await grid.boundingBox())!.height;
    expect(height, 'one row, not six').toBeLessThan(200);
    // And it actually scrolls, rather than clipping eleven tiles away.
    const [scrollWidth, clientWidth] = await grid.evaluate((el) => [el.scrollWidth, el.clientWidth]);
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    await expect(page.locator('.grovepg-atlas__cell')).toHaveCount(12);
  });

  /* ---- Cedar on a phone ----
     A phone is where the launcher has the least to work with: no label
     beside it, the least room to read an answer, and a corner it shares
     with the consent banner. These four cover the shape that was agreed
     for it, and each one has a real failure behind it. */

  test('the launcher is a round mark on a phone, not a text pill', async ({ page }) => {
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    const fab = page.locator('#cedarFab');
    const box = (await fab.boundingBox())!;
    // 44px is the accessible minimum; a tap target carrying no label
    // beside it should be comfortably past it.
    expect(Math.round(box.width), 'square').toBe(Math.round(box.height));
    expect(box.width, 'a real thumb target').toBeGreaterThanOrEqual(56);
  });

  test('the welcome bubble greets once the launcher settles', async ({ page }) => {
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    // A first-time visitor answers the consent banner, which owns this
    // same corner and holds the bubble back until it is gone.
    await page.locator('[data-consent="denied"]').click();
    await scrollUntilCedarVisible(page);
    const nudge = page.locator('#cedarNudge');
    await expect(nudge).toBeVisible({ timeout: 25000 });
    // The bubble is the only thing on the screen that says what the
    // circle beside it is, so it has to say it.
    await expect(nudge).toContainText('Cedar');
  });

  test('tapping the welcome bubble opens Cedar and leaves it open', async ({ page }) => {
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    await page.locator('[data-consent="denied"]').click();
    await scrollUntilCedarVisible(page);
    const nudge = page.locator('#cedarNudge');
    await expect(nudge).toBeVisible({ timeout: 25000 });
    await nudge.locator('.cedar-nudge__text').click();
    const panel = page.locator('#cedarFabPanel');
    // "Leaves it open" is the assertion that matters: the same click used
    // to bubble to the document-level close-on-outside-click handler,
    // which saw it land outside the panel it had just opened and shut it
    // again, so the bubble looked inert.
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 6000 });
    await page.waitForTimeout(400);
    await expect(panel).toBeVisible();
  });

  test('the welcome bubble steps aside from protected content, not only the launcher', async ({
    page,
  }) => {
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    await page.locator('[data-consent="denied"]').click();
    await scrollUntilCedarVisible(page);
    const nudge = page.locator('#cedarNudge');
    await expect(nudge).toBeVisible({ timeout: 25000 });

    /* Walking the real pages does not produce this collision — checked on
       eight of them with the guard removed, and the bubble never lands on
       a protected zone the 60px launcher has not already stepped around.
       So the collision is built here rather than hunted for: put a zone
       from the avoid list exactly where the bubble is and let the
       launcher's own controller run.

       The reveal already tested the bubble's rectangle. What this pins is
       that it keeps being tested AFTER the bubble is up, which is what
       polling stopping had quietly ended. */
    const box = (await nudge.boundingBox())!;
    await page.evaluate(({ x, y, width, height }) => {
      const zone = document.createElement('div');
      // `.naics-tile` is on the launcher's avoid list; any of them works.
      zone.className = 'naics-tile';
      Object.assign(zone.style, {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: '1',
      });
      document.body.append(zone);
      window.dispatchEvent(new Event('scroll'));
    }, box);

    await expect(nudge, 'the bubble yields to what it would have covered').toBeHidden({
      timeout: 4000,
    });
  });

  test('Cedar fills the screen on a phone', async ({ page }) => {
    /* The panel scales in. Measuring the box mid-animation reports a
       frame of the transform rather than the layout, so settle it. */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/cedar-commons', { waitUntil: 'networkidle' });
    await page.locator('[data-consent="denied"]').click();
    await (await scrollUntilCedarVisible(page)).click();
    const panel = page.locator('#cedarFabPanel');
    await expect(panel).toHaveAttribute('data-cedar-booted', '1', { timeout: 6000 });
    const box = (await panel.boundingBox())!;
    /* The layout viewport, not the configured one: a classic scrollbar
       takes a few pixels off the width, and a panel that correctly fills
       what is left is not a failure. */
    const view = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
    }));
    // A docked sheet on a 390px screen left the prompt rail clipped
    // mid-word. Reading an answer is the whole point of the surface.
    expect(Math.round(box.width), 'full width').toBe(view.width);
    expect(box.height, 'full height').toBeGreaterThanOrEqual(view.height - 1);
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.y)).toBe(0);
    // And the starter prompts are whole, not cut off at the edge.
    const overflow = await panel
      .locator('.cedar-chip:not([hidden])')
      .evaluateAll(
        (nodes, w) => nodes.some((n) => n.getBoundingClientRect().right > (w as number)),
        view.width,
      );
    expect(overflow, 'no prompt runs off the screen').toBe(false);

    /* And the nav does not paint over it. Both are fixed and they
       overlap at the top of the screen, so the one with the higher
       z-index wins: underneath, the dialog loses its own title bar and
       its close button — the only way back to the page — while still
       reporting a full-viewport box. Compared as numbers rather than
       by hit-testing, because `open()` makes the nav inert and
       `elementFromPoint` then looks straight through it, which would
       make a hit test pass while the nav is still visibly on top. */
    const close = page.locator('.cedar-fab-panel__close');
    await expect(close).toBeVisible();
    const layers = await page.evaluate(() => {
      const z = (sel: string) => Number(getComputedStyle(document.querySelector(sel)!).zIndex);
      return { panel: z('#cedarFabPanel'), nav: z('body > nav') };
    });
    expect(layers.nav, 'the nav is a fixed, stacked header').toBeGreaterThan(0);
    expect(layers.panel, 'the dialog sits above the nav').toBeGreaterThan(layers.nav);
    await expect(page.locator('.cedar-fab-panel .cedar-chat__header')).toBeVisible();
  });

  test('the grove atlas labels stay inside their tiles, and the last one clears the fade', async ({
    page,
  }) => {
    await page.goto('/cedar-grove', { waitUntil: 'networkidle' });
    const grid = page.locator('.grovepg-atlas__grid');
    await grid.scrollIntoViewIfNeeded();
    // "Native-Owned Businesses" is 170px against a 132px tile, and with
    // `white-space: nowrap` it spilled 19px into its neighbour. The tile's
    // width is held by `flex: 0 0 auto`, so nothing needed the nowrap.
    const spills = await page.locator('.grovepg-atlas__cell').evaluateAll((cells) =>
      cells
        .map((c) => {
          const n = c.querySelector('.grovepg-atlas__name');
          if (!n) return null;
          const over = Math.round(n.getBoundingClientRect().right - c.getBoundingClientRect().right);
          return over > 0 ? `${n.textContent?.trim()} +${over}px` : null;
        })
        .filter(Boolean),
    );
    expect(spills, 'no label spills its tile').toEqual([]);

    // At the end of the scroll the fade used to still cover the last tile,
    // so the row went on claiming there was more to the right.
    const clear = await grid.evaluate((g) => {
      g.scrollLeft = g.scrollWidth;
      const cells = g.querySelectorAll('.grovepg-atlas__cell');
      const last = cells[cells.length - 1].getBoundingClientRect();
      const box = g.getBoundingClientRect();
      return last.right <= box.left + box.width * 0.88;
    });
    expect(clear, 'the last tile clears the fade at full scroll').toBe(true);
  });

  test('the grove price puts its period under the numeral', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/cedar-grove', { waitUntil: 'networkidle' });
    // The ≤560px override sat above the base rule in the same file, and at
    // equal specificity source order won: the override did nothing, and
    // "per organization, per year" kept wrapping halfway up a 2.6rem
    // numeral. Measured, not asserted on the declaration.
    const rows = await page.locator('.grovepg-price').first().evaluate((el) => {
      const amt = el.querySelector('.grovepg-price__amount')!.getBoundingClientRect();
      const per = el.querySelector('.grovepg-price__period')!.getBoundingClientRect();
      return { amtBottom: amt.bottom, perTop: per.top };
    });
    expect(rows.perTop, 'the period sits below the numeral').toBeGreaterThanOrEqual(
      rows.amtBottom - 2,
    );
  });

  test('the grove hero buttons are one column at one width', async ({ page }) => {
    await page.goto('/cedar-grove', { waitUntil: 'networkidle' });
    const widths = await page
      .locator('.grovepg-cta .btn2')
      .evaluateAll((nodes) => nodes.map((n) => Math.round(n.getBoundingClientRect().width)));
    expect(widths).toHaveLength(2);
    // Two buttons sized to their own labels sit at two different widths in a
    // full-bleed column, which reads as a mistake rather than a hierarchy.
    expect(new Set(widths).size, 'both buttons the same width').toBe(1);
  });
});
