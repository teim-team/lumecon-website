// Capture cedar-wind-partner.webp: a results page with the Cedar panel open,
// drafting a summary from the results. Served by the /cedar page.
//
// This script exists because the shipped image had no reproducible source and
// carried the ProtectedSurface watermark: the tiled stamp of a fake account's
// address and a "Watermarked, access is recorded" flag, both of which belong in
// a real session and never in marketing imagery. Setting
// window.__LUMECON_CAPTURE__ before the app boots turns that overlay off, which
// is the whole reason the flag exists.
//
// It used to build cedar.webp too, for the homepage Cedar teaser. That section
// is gone: /cedar owns the Cedar story and the why-card links to it from higher
// up the page, so the teaser was a third telling of it.
//
// Usage:
//   1. Run the app dev server (teim-app): npm run dev  (port 5173)
//   2. node scripts/screenshots/capture-cedar.mjs
//   3. node scripts/screenshots/optimize-cedar.mjs
//
// The API is mocked from examples-data.mjs exactly as capture-examples.mjs does
// it, with one addition: a seeded Cedar thread, so the panel shows a real
// exchange instead of an empty state. The figures in that exchange are read off
// the same RESULTS the page renders, so the summary cannot drift from the
// numbers beside it.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { USER, PROJECTS, RUNS, RESULTS, CAPTURE_TARGETS } from './examples-data.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'raw-cedar');
mkdirSync(OUT, { recursive: true });
const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const json = (body) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const usd = (n) => `$${(n / 1_000_000).toFixed(1)} million`;

// Each frame: which example it uses, the file it becomes, and the exchange the
// panel shows. Every figure in the exchange is read off the same RESULTS the
// page renders beside it, so the summary cannot drift from the numbers.
const FRAMES = [
  {
    name: 'cedar-wind-partner',
    exampleId: 'wind',
    ask: 'Draft a summary of these results for the county board, using the documents I gave you.',
    reply: (head, direct, place) => [
      'Here is a summary drawn from the results and the three documents you provided.',
      '',
      `The buildout is estimated to support **${head.jobs_supported.toLocaleString('en-US')} jobs** across ${place} and **${usd(head.output)}** in economic output. The capital plan puts **${usd(direct.amount)}** of that on ${direct.name.toLowerCase()}, with the procurement workbook and the road-use agreements setting the split between local and out-of-area spend.`,
      '',
      `- **${usd(head.gdp_contribution)}** added to state GDP`,
      `- **${usd(head.labor_income)}** in labor income`,
    ],
  },
];

function buildFrame(frame) {
  const target = CAPTURE_TARGETS.find((t) => t.id === frame.exampleId);
  if (!target) throw new Error(`capture-cedar: example ${frame.exampleId} is missing`);
  const res = RESULTS[target.b.runId];
  const head = res.outputs.state;
  // The largest operation by output, named as the data names it. Writing the
  // operation into the prose by hand is how the wind frame first shipped
  // "the capital plan's construction phase drives $498.0 million" against a
  // row actually called "Turbine and storage installation".
  const top = res.tables.by_entity.filter((r) => r.scope === 'state')[0];
  const direct = { amount: top.output_impact, name: top.entity_name };
  // The state, which is what the page's own geography caption shows. Not
  // `target.label`: that is "Wind energy developer, Iowa", an organization
  // description, and reading "2,600 jobs across Wind energy developer, Iowa"
  // is how the first pass of this shipped.
  const place = target.example.location;
  if (!place) throw new Error(`capture-cedar: example ${frame.exampleId} has no location`);
  const thread = {
    threadId: `t-${frame.name}`,
    messages: [
      { id: 'm1', role: 'user', text: frame.ask },
      { id: 'm2', role: 'assistant', text: frame.reply(head, direct, place).join('\n') },
    ],
  };
  // A renamed field in examples-data.mjs turns `usd(head.gdp)` into "$NaN
  // million" and the capture still succeeds, so the frame ships a broken
  // figure. Refuse to capture instead. (This caught exactly that: `gdp` for
  // `gdp_contribution`.)
  for (const m of thread.messages) {
    if (/NaN|undefined/.test(m.text)) {
      throw new Error(`capture-cedar: ${frame.name}/${m.id} has an unresolved figure:\n${m.text}`);
    }
  }
  return { ...frame, target, thread };
}

const BUILT = FRAMES.map(buildFrame);

const browser = await chromium.launch(
  process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
);

async function settleFonts(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

for (const theme of ['light', 'dark']) {
  const suffix = theme === 'dark' ? '-dark' : '';
  for (const frame of BUILT) {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      colorScheme: theme,
    });
    // Turns off the ProtectedSurface watermark. See the header comment.
    await ctx.addInitScript(() => {
      window.__LUMECON_CAPTURE__ = true;
    });
    await ctx.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      const p = url.pathname;
      if (p === '/me') return route.fulfill(json(USER));
      if (p === '/events') return route.fulfill(json({}));
      if (p === '/projects')
        return route.fulfill(json(url.searchParams.get('archived') === 'archived' ? [] : PROJECTS));
      if (p === '/project-drafts') return route.fulfill(json([]));
      let m = p.match(/^\/projects\/([^/]+)\/runs\/([^/]+)\/results$/);
      if (m) return route.fulfill(json(RESULTS[m[2]]));
      m = p.match(/^\/projects\/([^/]+)\/runs\/([^/]+)$/);
      if (m) return route.fulfill(json(RUNS[m[2]]));
      m = p.match(/^\/projects\/([^/]+)\/cedar\/messages/);
      if (m) return route.fulfill(json(frame.thread));
      m = p.match(/^\/projects\/([^/]+)$/);
      if (m) {
        const proj = PROJECTS.find((x) => x.id === m[1]);
        return route.fulfill(
          proj ? json(proj) : { status: 404, contentType: 'application/json', body: '{}' },
        );
      }
      return route.continue();
    });

    const page = await ctx.newPage();
    const { projectId, runId } = frame.target.b;
    await page.goto(`${APP}/app/projects/${projectId}/runs/${runId}/results`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(2600);
    await settleFonts(page);

    // Open the docked Cedar launcher. Unlike the other capture scripts, which
    // strip it, these frames are about the panel, so it gets clicked instead.
    const opened = await page.evaluate(() => {
      for (const el of document.querySelectorAll('button, [role="button"]')) {
        if (/ask cedar/i.test(el.textContent || '')) {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (!opened) throw new Error(`capture-cedar: ${frame.name}: no Cedar launcher`);
    await page.waitForTimeout(1400);

    await page.screenshot({ path: `${OUT}/${frame.name}${suffix}.png` });
    await page.close();
    await ctx.close();
    console.log(`${frame.name}${suffix}`);
  }
}
await browser.close();
console.log('cedar capture done');
