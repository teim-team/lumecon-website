/**
 * Export every page's visible copy and information architecture.
 *
 * Writes docs/site-copy-and-architecture.md: the rendered copy of each
 * page in document order with every <details> expanded, the heading
 * outline, the meta and structured-data summary, and an appendix that
 * MEASURES repetition rather than asserting it.
 *
 * It reads the built site through a real browser rather than parsing
 * src/, for two reasons. Copy lives in several places (.astro markup,
 * src/data/pricing.ts, scripts/naics/sectors.mjs) and a source-reading
 * export would miss some of it; and folded content only exists once a
 * <details> is open. Reading the render cannot drift from what ships.
 *
 * Same convention as the rest of scripts/: nothing here runs at build
 * time. Run it when copy changes and commit the output.
 *
 *   npm run docs:copy
 *
 * The editorial notes in docs/_copy-notes.md are hand-maintained and are
 * appended verbatim, so regenerating never overwrites them.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.DOCS_BASE_URL || 'http://localhost:4321';
const OUT = resolve(ROOT, 'docs/site-copy-and-architecture.md');
const NOTES = resolve(ROOT, 'docs/_copy-notes.md');

/** Same resolution order as playwright.config.ts. */
function chromiumExecutable() {
  if (process.env.PW_CHROMIUM_EXECUTABLE) return process.env.PW_CHROMIUM_EXECUTABLE;
  try {
    const pinned = chromium.executablePath();
    if (pinned && existsSync(pinned)) return undefined;
  } catch {
    /* fall through */
  }
  const fallback = '/opt/pw-browsers/chromium';
  return existsSync(fallback) ? fallback : undefined;
}

/**
 * Every public page, in the order a reader would meet them. A third
 * element is the URL to actually visit when it differs from the path we
 * file the page under: /checkout redirects to /choose-plan unless it is
 * handed a valid paid tier, so without the query it exported choose-plan
 * twice and checkout not at all.
 */
const PAGES = [
  ['/', 'Homepage'],
  ['/pricing', 'Pricing'],
  ['/methodology', 'Methodology'],
  ['/cedar', 'Cedar'],
  ['/glossary', 'Glossary'],
  ['/naics', 'NAICS sectors'],
  ['/signup', 'Sign up'],
  ['/login', 'Log in'],
  ['/choose-plan', 'Choose plan'],
  ['/checkout', 'Checkout', '/checkout?tier=sprout'],
  ['/welcome', 'Welcome'],
  ['/accessibility', 'Accessibility'],
  ['/ai-and-data-use', 'AI and data use'],
  ['/security', 'Security'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/404', 'Not found'],
];

const CANONICAL_ORIGIN = 'https://lumecon.ai';
const NOINDEX_PATHS = new Set([
  '/signup',
  '/login',
  '/choose-plan',
  '/checkout',
  '/welcome',
  '/404',
]);

/** The one-line job each page is supposed to do (AGENTS.md, "Page ownership"). */
const OWNERSHIP = {
  '/': 'Why Lumecon matters.',
  '/pricing': 'What it costs and why the pricing is different.',
  '/methodology': 'Why the economics are credible.',
  '/cedar': "Why Lumecon's use of AI is different.",
  '/security': 'Current product controls and security-program status.',
  '/glossary': 'Defines terms and nothing more.',
  '/naics': 'What the sector classification covers.',
};

/** Claims worth counting because they are the ones that recur. */
const CLAIMS = {
  'Audience list (governments / universities / nonprofits / businesses / Tribal Nations)':
    /governments?[^.]{0,80}(tribal nations|universities)|universities[^.]{0,80}tribal nations/i,
  'Geography coverage (counties / states / nation / reservations)':
    /counties?,? states?,? (and )?the nation|every supported u\.s\. geography/i,
  'Unlimited analyses / no per-analysis fees':
    /unlimited (analysis|analyses|projects)|per-analysis fee/i,
  'Cedar included in every plan':
    /cedar[^.]{0,40}(in every plan|included)|included[^.]{0,30}cedar/i,
  'Traceability / lineage': /traceab|lineage|trace (this|a|any) number/i,
  'Same model / same data foundation': /same (underlying )?(economic )?model|same data foundation/i,
};

/* ---------------------------------------------------------------- read */

async function readPages() {
  const browser = await chromium.launch({ executablePath: chromiumExecutable() });
  const page = await browser
    .newContext({ viewport: { width: 1440, height: 900 } })
    .then((c) => c.newPage());
  const out = [];

  for (const [path, label, visit = path] of PAGES) {
    const res = await page.goto(BASE + visit, { waitUntil: 'networkidle' }).catch(() => null);
    // Every page must answer 200, except the not-found page: asked for by
    // its own URL it is a real route, but a host that wires it up as the
    // fallback (GitHub Pages does) answers 404. Both are correct.
    const ok = path === '/404' ? [200, 404] : [200];
    if (!res || !ok.includes(res.status())) {
      out.push({
        path,
        label,
        error: `expected ${ok.join(' or ')}, got ${res ? res.status() : 'unreachable'}`,
      });
      continue;
    }
    // A client-side redirect would otherwise be exported under the wrong
    // heading: /checkout without a valid tier sends the reader to
    // /choose-plan, and the export recorded that page's copy twice.
    await page.waitForTimeout(200);
    const landed = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
    const wanted = new URL(BASE + visit).pathname.replace(/\/$/, '') || '/';
    if (landed !== wanted) {
      out.push({ path, label, error: `redirected to ${landed}` });
      continue;
    }
    // Folded copy is still copy: open every disclosure before reading.
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
    await page.waitForTimeout(200);
    out.push({ path, label, ...(await page.evaluate(scrape)) });
    process.stdout.write(`  ${path}\n`);
  }

  await browser.close();
  return out;
}

/** Runs in the page. Walks the rendered document and emits a flat, ordered block list. */
function scrape() {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.content || '';
  const prop = (n) => document.querySelector(`meta[property="${n}"]`)?.content || '';
  const root = document.body;
  const blocks = [];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'TEMPLATE']);
  /** Tags the walker below emits itself; seeing one means keep descending. */
  const HANDLED =
    'h1,h2,h3,h4,h5,h6,p,li,dt,dd,summary,figcaption,blockquote,a,button,img,section,article,aside,header,footer,nav,select,th,td';

  // Content that is hidden by default must be LABELLED, not silently
  // flattened into the copy. The first version of this export read the
  // signup page's conditional plan badge — hidden until a ?tier= is
  // present — and rendered its two spans as the string "PlanChange plan",
  // which a reviewer then reported as a visible layout defect. It is not
  // one. Conditional copy is still copy worth reviewing, so it stays in,
  // marked for what it is.
  const isConditional = (el) => el.hasAttribute('hidden') || el.closest('[hidden]') !== null;

  const walk = (node, conditional = false) => {
    for (const el of node.children) {
      const tag = el.tagName;
      if (SKIP.has(tag)) continue;
      const cond = conditional || isConditional(el);
      if (/^H[1-6]$/.test(tag)) {
        blocks.push({ kind: 'h' + tag[1], text: clean(el.innerText), cond });
      } else if (['P', 'LI', 'DT', 'DD', 'SUMMARY', 'FIGCAPTION', 'BLOCKQUOTE'].includes(tag)) {
        const t = clean(el.innerText);
        if (t) blocks.push({ kind: tag.toLowerCase(), text: t, cond });
      } else if (tag === 'A' && !el.querySelector('p,h1,h2,h3,h4,li')) {
        const t = clean(el.innerText);
        if (t) blocks.push({ kind: 'link', text: t, href: el.getAttribute('href'), cond });
      } else if (tag === 'BUTTON') {
        const t = clean(el.innerText);
        if (t) blocks.push({ kind: 'button', text: t, cond });
      } else if (tag === 'IMG') {
        blocks.push({ kind: 'img', text: el.getAttribute('alt') || '(no alt)', cond });
      } else if (['NAV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER'].includes(tag)) {
        const name =
          el.getAttribute('aria-label') ||
          el.getAttribute('id') ||
          el.className.split(' ')[0] ||
          tag.toLowerCase();
        blocks.push({ kind: 'section', text: name, cond });
        walk(el, cond);
      } else if (tag === 'SELECT' || el.querySelector(HANDLED)) {
        walk(el, cond);
      } else {
        // Nothing below this element is copy the walker has a case for,
        // so it is a text container: take its text whole rather than
        // recursing past it. The signup fields are
        // `label > span` holding a text node beside a `*` marker, and
        // descending emitted the marker and dropped every field name, so
        // the export listed the form's inputs with no idea what any of
        // them asked for. SELECT is excluded so its options stay separate
        // lines instead of collapsing into one run-on string.
        const t = clean(el.innerText);
        if (t) blocks.push({ kind: 'text', text: t, cond });
      }
    }
  };
  walk(root);

  const jsonld = [];
  const jsonldErrors = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s, index) => {
    try {
      const parsed = JSON.parse(s.textContent);
      (Array.isArray(parsed) ? parsed : [parsed]).forEach((item) => jsonld.push(item['@type']));
    } catch {
      jsonldErrors.push(`JSON-LD block ${index + 1} is not valid JSON`);
    }
  });

  return {
    title: document.title,
    description: meta('description'),
    keywordsLen: (meta('keywords') || '').length,
    robots: meta('robots'),
    canonical: document.querySelector('link[rel=canonical]')?.href || '',
    ogTitle: prop('og:title'),
    ogDescription: prop('og:description'),
    ogImage: prop('og:image'),
    ogImageAlt: prop('og:image:alt'),
    twitterCard: meta('twitter:card'),
    twitterTitle: meta('twitter:title'),
    twitterDescription: meta('twitter:description'),
    twitterImage: meta('twitter:image'),
    twitterImageAlt: meta('twitter:image:alt'),
    jsonld: [...new Set(jsonld.flat())],
    jsonldErrors,
    wordCount: clean(root.innerText).split(/\s+/).filter(Boolean).length,
    blocks,
  };
}

async function crawlAudit(pages) {
  const issues = [];
  const index = await fetch(`${BASE}/sitemap-index.xml`).catch(() => null);
  if (!index?.ok) {
    return { issues: [`Could not read ${BASE}/sitemap-index.xml`] };
  }

  const indexXml = await index.text();
  const sitemapUrls = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const indexedCanonicals = new Set();
  for (const sitemapUrl of sitemapUrls) {
    const path = new URL(sitemapUrl).pathname;
    const response = await fetch(`${BASE}${path}`).catch(() => null);
    if (!response?.ok) {
      issues.push(`Could not read sitemap member ${sitemapUrl}`);
      continue;
    }
    const xml = await response.text();
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) indexedCanonicals.add(match[1]);
  }

  for (const page of pages) {
    if (page.error) continue;
    const expectedCanonical = `${CANONICAL_ORIGIN}${page.path === '/' ? '' : page.path}`;
    const expectsNoindex = NOINDEX_PATHS.has(page.path);
    const hasNoindex = /\bnoindex\b/i.test(page.robots || '');

    if (page.canonical !== expectedCanonical) {
      issues.push(
        `${page.path}: canonical is ${page.canonical || '(missing)'}, expected ${expectedCanonical}`,
      );
    }
    if (hasNoindex !== expectsNoindex) {
      issues.push(`${page.path}: robots should ${expectsNoindex ? '' : 'not '}include noindex`);
    }
    if (expectsNoindex && indexedCanonicals.has(expectedCanonical)) {
      issues.push(`${page.path}: noindex route appears in sitemap`);
    }
    if (!expectsNoindex && !indexedCanonicals.has(expectedCanonical)) {
      issues.push(`${page.path}: indexable route is missing from sitemap`);
    }
    if (!page.description) issues.push(`${page.path}: missing meta description`);
    if (!page.ogTitle || !page.ogDescription || !page.ogImage || !page.ogImageAlt) {
      issues.push(`${page.path}: incomplete Open Graph metadata`);
    }
    if (
      page.twitterCard !== 'summary_large_image' ||
      !page.twitterTitle ||
      !page.twitterDescription ||
      !page.twitterImage ||
      !page.twitterImageAlt
    ) {
      issues.push(`${page.path}: incomplete Twitter card metadata`);
    }
    issues.push(...page.jsonldErrors.map((error) => `${page.path}: ${error}`));
  }
  return { issues, sitemapCount: indexedCanonicals.size };
}

/* --------------------------------------------------------------- write */

/** Conditional copy is flagged so a reviewer does not read it as visible. */
const mark = (b) => (b.cond ? '**[conditional]** ' : '');

const normalise = (s) =>
  s
    .toLowerCase()
    .replace(/[‘’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function repetition(pages) {
  const sentences = new Map();
  for (const p of pages) {
    for (const b of p.blocks || []) {
      if (b.cond) continue; // conditional copy is not what the page says by default
      if (
        !['p', 'li', 'dd', 'dt', 'summary', 'figcaption', 'h1', 'h2', 'h3', 'h4'].includes(b.kind)
      )
        continue;
      for (const raw of b.text.split(/(?<=[.?!])\s+/)) {
        const n = normalise(raw);
        if (n.split(' ').length < 6) continue; // fragments are not repetition
        if (!sentences.has(n)) sentences.set(n, []);
        sentences.get(n).push({ page: p.path, text: raw.trim() });
      }
    }
  }
  const duplicated = [...sentences.values()]
    .filter((v) => new Set(v.map((x) => x.page)).size > 1)
    .sort((a, b) => b.length - a.length);

  const claims = {};
  for (const [label, re] of Object.entries(CLAIMS)) {
    claims[label] = [];
    for (const p of pages) {
      const n = (p.blocks || []).filter(
        (b) =>
          ['p', 'li', 'dd', 'dt', 'summary', 'h1', 'h2', 'h3'].includes(b.kind) && re.test(b.text),
      ).length;
      if (n) claims[label].push(`\`${p.path}\` ×${n}`);
    }
  }
  return { duplicated, claims };
}

function render(pages, crawl) {
  const L = [];
  const put = (...lines) => L.push(...lines);

  put('# Lumecon website: full copy and information architecture');
  put('');
  put(
    '_Generated by `npm run docs:copy` from the built site, every disclosure expanded, in document order. Nothing is paraphrased: the copy below is exactly what renders._',
  );
  put('');
  put('## What this document is for');
  put('');
  put(
    'Lumecon is an economic impact analysis platform for governments, tribal nations, universities, nonprofits and businesses. It is pre-launch, in private beta. Buyers are institutional and sceptical: city managers, tribal economic development directors, university and foundation staff, and consultants who currently use IMPLAN, RIMS II or REMI.',
  );
  put('');
  put('I want a hard critique of the writing and the information architecture. Specifically:');
  put('');
  put(
    '1. **Does each page make one argument, and is it the right one?** The intended job is listed per page below.',
  );
  put(
    '2. **Where is the copy vague, hedged, or making a claim it does not support?** This is sold to people who will be asked to defend the numbers in a public meeting.',
  );
  put('3. **Where does it repeat itself**, within a page or across pages?');
  put(
    '4. **Is anything overwritten?** Name the sentences that could go entirely without losing meaning.',
  );
  put(
    '5. **Does the architecture match how a buyer actually decides?** Is anything in the wrong place, missing, or on a page nobody will reach.',
  );
  put(
    '6. **Tone.** It should read as credible and plain-spoken. Flag anything that reads as vendor language.',
  );
  put('');
  put(
    'House rules the copy must keep: no ampersands in visible copy; "analysis" not "study"; "organization" not "client"; "economic output" not "sales"; "Cedar" is the AI economic analyst and is never an "AI assistant"; the product family is Cedar Impact, Cedar Commons and Cedar Grove, with Seed as the free plan.',
  );
  put('', '---', '');
  put('## Site map and page weights', '');
  put('| Page | Words | Title | Meta description length |');
  put('|---|---:|---|---:|');
  for (const p of pages) {
    if (p.error) {
      put(`| \`${p.path}\` | — | (${p.error}) | — |`);
      continue;
    }
    put(
      `| \`${p.path}\` | ${p.wordCount} | ${p.title.replace(/\|/g, '\\|')} | ${p.description.length} |`,
    );
  }
  put(`| **Total** | **${pages.reduce((a, p) => a + (p.wordCount || 0), 0)}** | | |`, '');

  put('## Crawler metadata audit', '');
  put(
    'This checks canonical consistency, sitemap membership, robots directives, Open Graph, Twitter cards and JSON-LD parsing against the built site.',
    '',
  );
  put(`- **Sitemap URLs:** ${crawl.sitemapCount || 0}`);
  if (crawl.issues.length) {
    for (const issue of crawl.issues) put(`- **Issue:** ${issue}`);
  } else {
    put('- **Status:** All checked crawler metadata is complete and consistent.');
  }
  put('');

  for (const p of pages) {
    put('---', '', `## \`${p.path}\` — ${p.label}`, '');
    if (p.error) {
      put(`_Could not render: ${p.error}_`, '');
      continue;
    }
    if (OWNERSHIP[p.path]) put(`**Intended job of this page:** ${OWNERSHIP[p.path]}`, '');
    put(`- **Title:** ${p.title}`);
    put(`- **Meta description** (${p.description.length} chars): ${p.description}`);
    if (p.ogTitle && p.ogTitle !== p.title) put(`- **og:title:** ${p.ogTitle}`);
    put(`- **og:description:** ${p.ogDescription}`);
    put(`- **og:image:** ${p.ogImage}`);
    put(`- **og:image alt:** ${p.ogImageAlt}`);
    put(`- **Twitter card:** ${p.twitterCard}`);
    put(`- **Canonical:** ${p.canonical}`);
    if (p.robots) put(`- **Robots:** ${p.robots}`);
    if (p.jsonld.length) put(`- **Structured data:** ${p.jsonld.join(', ')}`);
    if (p.keywordsLen) put(`- **Meta keywords:** ${p.keywordsLen} characters`);
    put(`- **Visible words:** ${p.wordCount}`, '');

    const heads = p.blocks.filter((b) => /^h[1-6]$/.test(b.kind));
    if (heads.length) {
      put('### Architecture (heading outline)', '');
      for (const h of heads)
        put(
          '  '.repeat(Math.max(0, Number(h.kind[1]) - 1)) +
            `- **${h.kind.toUpperCase()}** ${h.text}`,
        );
      put('');
    }

    put('### Copy, in document order', '');
    put(
      '_Lines marked **[conditional]** are hidden by default and appear only in some states, e.g. a plan badge that needs a `?tier=` parameter. They are not what a default visitor sees._',
      '',
    );
    let lastSection = null;
    for (const b of p.blocks) {
      if (b.kind === 'section') {
        if (b.text !== lastSection) {
          put('', `> _section: \`${b.text}\`_`, '');
          lastSection = b.text;
        }
      } else if (/^h[1-6]$/.test(b.kind)) put('', `**${b.kind.toUpperCase()}: ${b.text}**`, '');
      else if (b.kind === 'img') put(`- _image alt:_ ${b.text}`);
      else if (b.kind === 'link') put(`- _link:_ [${b.text}](${b.href})`);
      else if (b.kind === 'button') put(`- _button:_ ${b.text}`);
      else if (b.kind === 'summary') put(`- _disclosure:_ ${b.text}`);
      else if (['li', 'dt', 'dd'].includes(b.kind)) put(`- ${mark(b)}${b.text}`);
      else if (b.kind === 'figcaption') put(`_caption:_ ${b.text}`);
      else if (b.kind === 'text') put(`- _label:_ ${mark(b)}${b.text}`);
      else put(mark(b) + b.text, '');
    }
    put('');
  }

  const { duplicated, claims } = repetition(pages.filter((p) => !p.error));
  put('---', '', '## Appendix A: repetition, measured', '');
  put('_Computed from the copy above, not from memory. A sentence here is six words or more._', '');
  put('### Sentences that appear verbatim on more than one page', '');
  if (!duplicated.length) put('_None._');
  for (const hits of duplicated) {
    const where = [...new Set(hits.map((h) => '`' + h.page + '`'))].join(' and ');
    put(`- **On ${where}:** "${hits[0].text}"`);
  }
  put('', '### How often each recurring claim is made, by page', '');
  put('| Claim | Where it appears |', '|---|---|');
  for (const [label, hits] of Object.entries(claims))
    put(`| ${label} | ${hits.length ? hits.join(', ') : '—'} |`);
  put('');

  if (existsSync(NOTES)) put(readFileSync(NOTES, 'utf8').trimEnd(), '');
  return L.join('\n') + '\n';
}

/* ----------------------------------------------------------------- run */

console.log(`Reading ${BASE} …`);
const pages = await readPages();
const unreachable = pages.filter((p) => p.error);
// A partial export is worse than none: it is committed and then reviewed
// as if it were the whole site, and the missing pages are invisible in a
// document whose whole claim is completeness. Any gap fails the run.
if (unreachable.length) {
  console.error(`\nCould not export ${unreachable.length} of ${pages.length} page(s):`);
  for (const p of unreachable) console.error(`  ${p.path} — ${p.error}`);
  console.error(`\nIs \`npm run build && npm run preview\` serving ${BASE}?`);
  process.exit(1);
}
const crawl = await crawlAudit(pages);
if (crawl.issues.length) {
  console.error(`\nCrawler metadata audit found ${crawl.issues.length} issue(s):`);
  for (const issue of crawl.issues) console.error(`  ${issue}`);
  process.exit(1);
}
writeFileSync(OUT, render(pages, crawl));
console.log(`\nWrote docs/site-copy-and-architecture.md (${pages.length} pages).`);
