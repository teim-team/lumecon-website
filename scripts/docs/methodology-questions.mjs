/**
 * Build docs/methodology-open-questions.pdf.
 *
 * The questions the research team has to answer before the methodology
 * page can survive a procurement review. Every one is anchored to a
 * sentence published on the site, so the meeting argues about real copy
 * rather than an abstract checklist.
 *
 *   npm run docs:questions
 *
 * Rendered by printing HTML through Playwright, which is already a
 * devDependency for the smoke tests. The first version of this script was
 * Python on reportlab, which was wrong three ways: it was the only .py
 * file in a repo whose every other generator is .mjs, its dependency was
 * declared nowhere so a clean clone failed on import, and it wrote to a
 * hardcoded absolute path that only existed on one machine. Printing HTML
 * costs no new dependency, matches the convention, and lets the document
 * use the site's own typeface and tokens instead of Helvetica.
 *
 * Same convention as the rest of scripts/: nothing runs at build time.
 * Regenerate when the copy it quotes moves, and commit the PDF.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'docs/methodology-open-questions.pdf');
const PREPARED = '7 September 2026';

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

/* A note so nobody re-investigates this: Chromium's print path embeds any
   WEBFONT as Type3 (glyphs as vector programs) rather than as an embedded
   Type0 font program. Verified against the alternatives — a data URI, a
   file:// URL and a served URL all produce Type3; only a system-installed
   face produces Type0. It is a headless Chromium limitation, not a bug in
   this script, and there is no CSS that avoids it.
   
   Consequences, measured on the output: the PDF renders correctly, the
   ToUnicode map is intact so search, selection and copy all work (checked
   for 'Flegg', 'control totals', 'job-years' and the delta), and the file
   is a few hundred KB rather than a few tens. That is an acceptable price
   for the document being set in the company's own typeface. If a future
   requirement needs Type0 embedding, the fix is a system-installed font,
   not more CSS. */

/** Inline the site's own faces so the PDF embeds them with no network. */
function font(file) {
  const p = resolve(ROOT, 'public/fonts', file);
  if (!existsSync(p)) return null;
  return `data:font/woff2;base64,${readFileSync(p).toString('base64')}`;
}

const INTER = font('inter-latin-opsz-normal.woff2');
const MONO = font('jetbrains-mono-latin-wght-normal.woff2');

/* ------------------------------------------------------------- content */

const INTRO = [
  `Every question below is anchored to a sentence published on lumecon.ai today. The site
   states these as settled; the documentation behind them is not on the page. That gap is the
   whole agenda. A city manager will accept the screenshots. The economist or procurement
   officer asked to defend the purchase will ask these.`,
  `An answer is complete when a reviewer outside Lumecon could reproduce or challenge it.
   &ldquo;We use a standard approach&rdquo; is not an answer; the parameter, the source, the
   sample and the test are.`,
];

/** kind: 'quote' is verbatim site copy. 'gap' and 'summary' are not, and say so. */
const SECTIONS = [
  {
    title: 'A. Parameters and procedures that are asserted but not specified',
    sub: 'The page names a method, then stops before the number a reviewer would check.',
    questions: [
      {
        q: 'How is the Flegg exponent calibrated, and against what?',
        kind: 'quote',
        said: `The exponent &delta; sets how strongly regional smallness discounts local purchasing.
               It is calibrated against observed regional data rather than fixed by assumption.`,
        where: '/methodology, Eq. 04 caption',
        needs: [
          'Which observed data: which series, which years, which geographies.',
          'What is being fit, and what the objective function minimises.',
          'The sample: how many regions, of what sizes and industry mixes.',
          'The resulting value or range of &delta;, and how it varies by region size.',
          'How it was validated out of sample, and what the error was.',
        ],
      },
      {
        q: 'Which control totals does RAS converge on?',
        kind: 'quote',
        said: `R and S are diagonal scaling matrices, updated each round until the regional table
               converges on its control totals.`,
        where: '/methodology, Eq. 05 caption',
        needs: [
          'Name the row and column totals: regional output by sector, employment, value added, final demand, or some combination.',
          'Their source and vintage.',
          'The convergence criterion and the iteration cap.',
          'What happens when it fails to converge, and whether the analysis stops.',
        ],
      },
      {
        q: 'What is the stated hierarchy for wage fallback?',
        kind: 'quote',
        said: `Where a suppressed sector clearly exists in the region, its employment is estimated
               from wider employment-per-establishment patterns, and wages fall back through a
               stated hierarchy of sources.`,
        where: '/methodology, Suppressed and small-area data',
        needs: [
          'The hierarchy itself, in order. The page calls it stated; it is not stated anywhere.',
          '&ldquo;Wider patterns&rdquo; at what level: state, division, national, same NAICS, neighbouring counties.',
          'How &ldquo;clearly exists&rdquo; is decided, and what happens when it is ambiguous.',
          'Whether estimated values carry bounds, and whether those reach the result the customer sees.',
        ],
      },
      {
        q: 'Which higher-frequency series update which model quantities?',
        kind: 'quote',
        said: `Between benchmarks, higher-frequency public series for employment, wages and prices
               update the levels the model scales against, while structural relationships remain tied
               to benchmark tables.`,
        where: '/methodology, Between benchmarks',
        needs: [
          'A mapping: series to quantity to transformation.',
          'Whether they update levels only, or also the structural coefficients.',
          'How a benchmark revision reconciles against values already updated.',
          'Whether two analyses of the same activity months apart can differ, and by how much.',
        ],
      },
      {
        q: 'What defines a credible multiplier range, and what happens outside it?',
        kind: 'quote',
        said: `Validation flags any multiplier outside the ranges credible for an economy of that
               size and composition.`,
        where: '/methodology, validation',
        needs: [
          'How the ranges were established: literature, internal estimation, or comparison against another model.',
          'Whether &ldquo;flags&rdquo; means warns, blocks, or silently adjusts.',
          'Who sees the flag: the analyst, Lumecon, or nobody.',
          'A separate claim says a run failing a critical check stops. Confirm which checks are blocking.',
        ],
      },
      {
        q: 'How is the government account closed?',
        kind: 'quote',
        said: `A government account that collects taxes and returns them as procurement and
               transfers.`,
        where: '/methodology, induced effects',
        needs: [
          'Which flows are endogenous and which are exogenous.',
          'The marginal propensities used, and their source.',
          'What prevents circular amplification between the household and government accounts.',
          'Whether this is a Type II or a SAM multiplier, and how it is labelled to the customer.',
          'Endogenising government is defensible, but it raises induced effects. A reviewer comparing against IMPLAN&rsquo;s default will ask why the number is higher.',
        ],
      },
    ],
  },
  {
    title: 'B. Definitions the site reports as headline numbers but does not define',
    sub: 'These appear on every results page. A reviewer cannot check a number whose unit is unstated.',
    questions: [
      {
        q: 'What is a job?',
        kind: 'quote',
        said: `The count of jobs supported by the activity across the direct, indirect and induced
               layers over the analysis period. It is a job count; where a conversion basis
               matters, the analysis states it.`,
        where: '/methodology and /glossary, Jobs supported',
        needs: [
          'Headcount, full-time equivalent, annual average, or job-years. The current wording avoids choosing.',
          'How part-time and seasonal work is counted.',
          'For construction, whether a two-year build reports one number or two.',
          'This is the most contested number in public economic impact work. The definition has to be on the page.',
        ],
      },
      {
        q: 'How are tax impacts estimated?',
        kind: 'gap',
        said: `Tax impacts are one of the five headline results on every analysis. There is no tax
               methodology anywhere on the site to quote.`,
        where: 'No corresponding copy exists. This is the gap.',
        needs: [
          'Which taxes, at which levels of government.',
          'Incidence assumptions.',
          'Whether rates are effective or statutory, and their source and year.',
          'How tribal government taxation is handled, given it is a named capability.',
        ],
      },
      {
        q: 'What price year do results carry?',
        kind: 'quote',
        said: 'Historical analyses run from 2015 to present where the data support it.',
        where: '/methodology, data vintages',
        needs: [
          'Whether results are in current or constant dollars, and which deflator.',
          'Which year&rsquo;s industrial structure a 2015 analysis uses: 2015&rsquo;s or today&rsquo;s.',
          'How changing county and reservation boundaries are handled across that span.',
          'A historical comparison that silently mixes a past activity year with present-day relationships is the kind of error that ends a credibility argument.',
        ],
      },
    ],
  },
];

const LIMITATIONS = [
  [
    'Gross versus net',
    'Whether results are gross activity or net of what would have happened anyway.',
  ],
  [
    'Displacement and substitution',
    'Whether the analysis accounts for activity displaced from elsewhere in the region.',
  ],
  ['Opportunity cost', 'Whether the alternative use of public funds is considered.'],
  [
    'Construction versus operations',
    'How one-time construction is separated from recurring operations, and over what period.',
  ],
  ['Capital and margins', 'How capital purchases and retail margins are treated.'],
  [
    'Commuting and residence',
    'Whether induced effects account for workers living outside the region.',
  ],
  ['Imports and leakage', 'How leakage is imposed beyond the purchase coefficient.'],
  [
    'Double counting',
    'How overlapping projects or nested geographies are handled, particularly the state and homelands scopes shown side by side.',
  ],
  [
    'Uncertainty',
    'Whether any sensitivity or confidence range is available, and if not, what a reviewer should say instead.',
  ],
  [
    'Appropriate use',
    'What this model should not be used for: cost-benefit, fiscal impact, distributional analysis, causal evaluation.',
  ],
];

const NOT_MODEL = [
  {
    q: 'Who has reviewed the methodology, and can we say so?',
    kind: 'quote',
    said: `Built by economists, engineers and researchers with experience at the Federal Reserve
           and leading universities.`,
    where: 'Homepage, The Lumecon edge',
    needs: [
      'Named people and institutions, or the claim should come off the site. Anonymous prestige reads as marketing.',
      'Whether any outside economist has reviewed the model, and whether they will be cited.',
      'Whether a technical appendix or working paper can be published. It is the strongest single thing available for winning a sceptical reviewer, and it does not exist yet.',
    ],
  },
  {
    q: 'What can the model actually analyse today?',
    kind: 'summary',
    said: `The homepage says &ldquo;Economic analysis that holds up.&rdquo; The pricing page promises
           &ldquo;every supported U.S. geography&rdquo;. Neither identifies which analyses or
           geographies are currently supported.`,
    where: 'Homepage hero and pricing page. Quoted fragments inside a summary.',
    needs: [
      'Which analysis types are live rather than planned.',
      'Which geographies are genuinely supported, including whether every reservation and trust land is covered or only those with sufficient data.',
      'What happens when a region is too small or too suppressed to model, and what the customer is told.',
      'This is the boundary between current capability and roadmap, and it runs through most of the site&rsquo;s overclaiming.',
    ],
  },
];

const OUTCOMES = [
  [
    'Own each question.',
    'A name against each of the eleven, and a date. Several are a paragraph of writing, not new research.',
  ],
  [
    'Decide what is publishable.',
    'Some answers belong on the page, some in a downloadable technical appendix, some only in an RFP response. Sort them now rather than per-question later.',
  ],
  [
    'Agree the limitations section in principle.',
    'Section C is the highest-value and lowest-cost item on this list. It needs a decision that Lumecon will publish its boundaries, and one person to draft it.',
  ],
];

/* -------------------------------------------------------------- render */

const tidy = (s) => s.replace(/\s+/g, ' ').trim();

const KIND_NOTE = {
  quote: '',
  gap: ' <span class="tag">not a quotation</span>',
  summary: ' <span class="tag">summary, not a quotation</span>',
};

let n = 0;
const renderQuestion = (item) => {
  n += 1;
  const body = item.kind === 'quote' ? `&ldquo;${tidy(item.said)}&rdquo;` : tidy(item.said);
  return `
    <section class="q">
      <h3>${n}. ${item.q}</h3>
      <figure class="said">
        <blockquote>${body}</blockquote>
        <figcaption>${item.where}${KIND_NOTE[item.kind]}</figcaption>
      </figure>
      <ul>${item.needs.map((x) => `<li>${x}</li>`).join('')}</ul>
    </section>`;
};

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Lumecon methodology: open questions</title>
<style>
  ${INTER ? `@font-face{font-family:Inter;src:url("${INTER}")format("woff2");font-weight:100 900;font-display:block}` : ''}
  ${MONO ? `@font-face{font-family:"JetBrains Mono";src:url("${MONO}")format("woff2");font-weight:100 800;font-display:block}` : ''}
  :root{--ink:#1a2036;--muted:#5b6178;--rule:#d8dbe4;--accent:#0a7f74;--wash:#f5f7f8}
  @page{size:Letter;margin:19mm 20mm 17mm}
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,system-ui,sans-serif;font-optical-sizing:auto;
       font-size:9.6pt;line-height:1.5;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h1{font-size:20pt;line-height:1.15;letter-spacing:-.022em;font-weight:600;margin:0 0 4pt}
  .deck{color:var(--muted);font-size:10.5pt;line-height:1.45;margin:0 0 16pt;max-width:46em}
  h2{font-size:12.5pt;line-height:1.25;letter-spacing:-.015em;font-weight:600;
     margin:20pt 0 2pt;padding-top:8pt;border-top:1px solid var(--rule);break-after:avoid}
  .sub{color:var(--muted);font-size:9pt;margin:0 0 10pt;break-after:avoid}
  h3{font-size:10.2pt;line-height:1.3;font-weight:600;margin:13pt 0 4pt;break-after:avoid}
  p{margin:0 0 7pt;max-width:48em}
  .q{break-inside:avoid;page-break-inside:avoid}
  .said{margin:0 0 6pt;background:var(--wash);border-left:2.5pt solid var(--accent);
        padding:7pt 10pt;break-inside:avoid}
  blockquote{margin:0;font-style:italic;color:var(--muted);font-size:9.2pt;line-height:1.45}
  .said figcaption{margin-top:3pt;font-family:"JetBrains Mono",ui-monospace,monospace;
                   font-size:7.4pt;letter-spacing:.04em;color:var(--muted)}
  .tag{color:var(--accent);font-weight:700}
  ul{margin:0 0 4pt;padding-left:13pt}
  li{margin:0 0 2.5pt;max-width:47em}
  table{width:100%;border-collapse:collapse;margin:2pt 0 8pt;font-size:9pt}
  th{text-align:left;font-weight:600;border-bottom:1px solid var(--ink);padding:0 10pt 4pt 0}
  td{vertical-align:top;border-bottom:1px solid var(--rule);padding:4.5pt 10pt 4.5pt 0}
  td:first-child{font-weight:600;width:30%}
  tr{break-inside:avoid}
  .outcome{margin:0 0 6pt}
  .outcome b{font-weight:600}
  .colophon{margin-top:14pt;padding-top:7pt;border-top:1px solid var(--rule);
            color:var(--muted);font-size:8.2pt;line-height:1.45}
</style></head><body>
  <h1>Methodology: open questions</h1>
  <p class="deck">Questions the research team needs to answer before the methodology page can
     support a procurement review. Prepared ${PREPARED}.</p>
  ${INTRO.map((p) => `<p>${tidy(p)}</p>`).join('')}

  ${SECTIONS.map(
    (s) =>
      `<h2>${s.title}</h2><p class="sub">${s.sub}</p>${s.questions.map(renderQuestion).join('')}`,
  ).join('')}

  <h2>C. Limitations the page does not state</h2>
  <p class="sub">A defensible methodology makes its boundaries easy to find. These are the
     standard objections in public economic impact work, and the page answers none of them.</p>
  <table>
    <thead><tr><th>Limitation</th><th>What the page must say</th></tr></thead>
    <tbody>${LIMITATIONS.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody>
  </table>
  <p>The ask is not to solve these. It is to decide, for each, whether Lumecon handles it, does
     not handle it, or handles it partially, and to write the sentence that says so.</p>

  <h2>D. Two questions that are not about the model</h2>
  <p class="sub">Both come up in procurement. Neither is a research question, but the research
     team owns the answer.</p>
  ${NOT_MODEL.map(renderQuestion).join('')}

  <h2>What a good outcome from tomorrow looks like</h2>
  <p class="sub">Not all eleven answered. Three decisions made.</p>
  ${OUTCOMES.map(([a, b]) => `<p class="outcome"><b>${a}</b> ${b}</p>`).join('')}

  <p class="colophon">Prepared from the methodology, NAICS and homepage copy live on lumecon.ai
     on ${PREPARED}, and from an external review of the full site copy. Blocks in quotation marks
     are verbatim from the site; the two that are not are labelled.</p>
</body></html>`;

/* ----------------------------------------------------------------- run */

const browser = await chromium.launch({ executablePath: chromiumExecutable() });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const pdf = await page.pdf({
  format: 'Letter',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="width:100%;margin:0 20mm;font-family:sans-serif;font-size:7.5pt;color:#5b6178;
                display:flex;justify-content:space-between;border-top:.5px solid #d8dbe4;padding-top:4pt">
      <span>Lumecon &middot; Methodology open questions &middot; internal</span>
      <span class="pageNumber"></span>
    </div>`,
  margin: { top: '19mm', bottom: '17mm', left: '20mm', right: '20mm' },
});
await browser.close();

writeFileSync(OUT, pdf);
console.log(`Wrote ${OUT.replace(ROOT + '/', '')} (${(pdf.length / 1024).toFixed(0)} KB).`);
if (!INTER) console.warn('public/fonts not found; the PDF fell back to a system face.');
