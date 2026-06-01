/**
 * Render the investor memo (lumecon-investor-memo.md) into a
 * branded, print-ready PDF (lumecon-investor-memo.pdf) using
 * Chromium via Playwright. Run from the repo root:
 *
 *   node docs/investor-memo/build.mjs
 *
 * Env vars:
 *   CHROME_BIN   Optional explicit Chromium binary. Useful in
 *                sandboxes where Playwright's CDN is blocked.
 *
 * The HTML template is inline below so the memo's branding lives
 * with the memo source instead of in a separate file the user
 * has to maintain. Logo + color palette pull from the brand kit
 * in /public/brand/ and the design tokens in src/styles/global.css.
 */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SRC  = path.join(HERE, 'lumecon-investor-memo.md');
const HTML = path.join(HERE, 'lumecon-investor-memo.html');
const PDF  = path.join(HERE, 'lumecon-investor-memo.pdf');

const md = await readFile(SRC, 'utf8');

/* Tiny markdown subset renderer. The memo only uses h1/h2/h3,
   paragraphs, bullet lists, bold, em, horizontal rules, and
   tables. Doing it inline keeps the PDF build with no external
   markdown dependency to install. */
function esc(s) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function inline(s) {
  // bold, italic, then escape the rest.
  let t = esc(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  return t;
}

function renderMarkdown(text) {
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.startsWith('# ')) { out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue; }
    if (line.startsWith('## ')) { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (line.startsWith('### ')) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (line.trim() === '---') { out.push('<hr/>'); i++; continue; }
    if (line.startsWith('| ')) {
      // table block
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]); i++;
      }
      const cells = rows.map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
      const head = cells[0];
      // skip the alignment row (cells[1])
      const body = cells.slice(2);
      const aligns = cells[1].map((a) => a.endsWith(':') ? (a.startsWith(':') ? 'center' : 'right') : 'left');
      let t = '<table><thead><tr>';
      head.forEach((h, idx) => { t += `<th style="text-align:${aligns[idx]}">${inline(h)}</th>`; });
      t += '</tr></thead><tbody>';
      body.forEach((r) => {
        t += '<tr>';
        r.forEach((c, idx) => { t += `<td style="text-align:${aligns[idx]}">${inline(c)}</td>`; });
        t += '</tr>';
      });
      t += '</tbody></table>';
      out.push(t);
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`); i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    // paragraph: gather until blank line
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && lines[i].trim() !== '---' && !lines[i].startsWith('|') && !lines[i].startsWith('- ') && !lines[i].startsWith('* ')) {
      para.push(lines[i]); i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

const body = renderMarkdown(md);

/* Pull the first <h1> out as the cover title; everything else is
   the memo body. The first paragraph after the h1 holds the
   confidentiality strip ("Investor Memorandum / Summer 2026 /
   Confidential and Proprietary"); we render it on the cover, not
   in the body flow. */
const h1Match  = body.match(/<h1>(.*?)<\/h1>/);
const coverTitle = h1Match ? h1Match[1] : 'Lumecon Inc.';
let rest = body.replace(/<h1>(.*?)<\/h1>/, '').trimStart();
const firstP = rest.match(/^<p>(.*?)<\/p>/);
const coverMeta = firstP ? firstP[1] : '';
if (firstP) rest = rest.slice(firstP[0].length).trimStart();

const logoPath = path.join(REPO, 'public', 'brand', 'lumecon-logo-horizontal-transparent.png');
const logoMark = path.join(REPO, 'public', 'brand', 'lumecon-logo-mark-transparent.png');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Lumecon Investor Memorandum</title>
<style>
  @page { size: Letter; margin: 0.75in 0.85in; }
  :root {
    --navy: #0A0F26;
    --navy2: #1A2046;
    --ink: #0A0F26;
    --ink-2: #353B5C;
    --ink-3: #6B6F8A;
    --gold: #F0A91A;
    --gold-light: #FFD24B;
    --goldbar: #FFE7A0;
    --accent: #0FB5A5;
    --accent-light: #5FD9CC;
    --accent-bar: #B8EDE6;
    --accent-deep: #0A8A7E;
    --rule: rgba(10, 15, 38, .12);
    --rule-strong: rgba(10, 15, 38, .22);
    --cream: #FAF6EE;
    --paper: #FFFFFF;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Spectral', Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.55;
    color: var(--ink);
    background: var(--paper);
  }
  h1, h2, h3, .mono, .eyebrow { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
  h2 {
    font-size: 17pt;
    font-weight: 600;
    color: var(--navy);
    letter-spacing: -.012em;
    margin: 1.6em 0 .55em;
    padding-bottom: .35em;
    border-bottom: 1px solid var(--rule);
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: var(--navy);
    letter-spacing: -.005em;
    margin: 1.2em 0 .35em;
  }
  p { margin: 0 0 .8em; }
  hr {
    border: 0;
    border-top: 1px solid var(--rule);
    margin: 1.4em 0;
  }
  strong { color: var(--navy); font-weight: 600; }
  em { color: var(--accent-deep); font-style: italic; }
  ul { margin: 0 0 .9em; padding-left: 1.25em; }
  ul li { margin-bottom: .25em; }

  /* ---------- cover ---------- */
  .cover {
    page-break-after: always;
    height: calc(11in - 1.5in);
    display: flex;
    flex-direction: column;
    position: relative;
    padding: .4in 0 .25in;
  }
  .cover__brand {
    display: flex;
    align-items: center;
    gap: .65rem;
  }
  .cover__brand img {
    height: 34px;
  }
  .cover__meta {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-top: .5in;
  }
  .cover__title {
    font-family: 'Spectral', Georgia, serif;
    font-weight: 600;
    font-size: 52pt;
    line-height: 1.02;
    letter-spacing: -.02em;
    color: var(--navy);
    margin: .35in 0 .25in;
    max-width: 9in;
  }
  .cover__title em { color: var(--navy); font-style: italic; font-weight: 500; }
  .cover__deck {
    font-family: 'Spectral', Georgia, serif;
    font-size: 15pt;
    line-height: 1.45;
    color: var(--ink-2);
    max-width: 6.2in;
  }
  .cover__hl {
    background: linear-gradient(180deg, transparent 56%, var(--accent-bar) 56%, var(--accent-bar) 92%, transparent 92%);
    padding: 0 .1em;
  }
  .cover__swatches {
    margin-top: auto;
    padding-top: .35in;
    border-top: 1px solid var(--rule);
    display: flex;
    flex-direction: column;
    gap: .25in;
  }
  .cover__swatch-row {
    display: flex;
    gap: .15in;
    align-items: stretch;
  }
  .swatch {
    flex: 1;
    padding: .12in .15in .14in;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
  }
  .swatch__name {
    font-size: 8pt;
    letter-spacing: .12em;
    text-transform: uppercase;
    font-weight: 600;
    margin: 0 0 .15in;
  }
  .swatch__hex {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 9pt;
    margin: 0;
  }
  .swatch--navy   { background: var(--navy);    color: #fff; }
  .swatch--navy   .swatch__hex   { color: rgba(255,255,255,.78); }
  .swatch--gold   { background: var(--gold);    color: var(--navy); }
  .swatch--accent { background: var(--accent);  color: var(--navy); }
  .swatch--cream  { background: var(--cream);   color: var(--navy); border: 1px solid var(--rule); }
  .swatch--paper  { background: var(--paper);   color: var(--navy); border: 1px solid var(--rule-strong); }
  .swatch--ink    { background: var(--ink-2);   color: #fff; }
  .swatch--ink .swatch__hex { color: rgba(255,255,255,.78); }
  .cover__foot {
    display: flex;
    justify-content: space-between;
    margin-top: .25in;
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--ink-3);
  }

  /* ---------- body ---------- */
  .body {
    padding-top: .15in;
  }
  .body h2:first-of-type { margin-top: 0; }
  .running-header {
    position: running(rh);
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  /* Tables ---------- */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: .35em 0 1.2em;
    font-family: 'Inter', sans-serif;
    font-size: 10pt;
  }
  thead th {
    background: var(--navy);
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: .35em .65em;
    letter-spacing: .005em;
  }
  tbody td {
    padding: .35em .65em;
    border-bottom: 1px solid var(--rule);
    color: var(--ink);
  }
  tbody tr:last-child td { border-bottom: 0; }
  tbody tr:nth-child(even) td { background: rgba(15, 181, 165, .045); }

  /* Mission pull-quote when the markdown wraps a paragraph in
     **bold** that ends with a period, render strong-led short
     paragraphs as a pull-out. Simple visual rhythm. */
  p > strong:only-child {
    display: block;
    font-family: 'Spectral', Georgia, serif;
    font-size: 16pt;
    line-height: 1.25;
    color: var(--navy);
    margin: .25em 0 .35em;
    letter-spacing: -.012em;
  }

  /* Closing ---------- */
  .body :last-child { margin-bottom: 0; }
</style>
</head>
<body>

  <section class="cover">
    <div class="cover__brand">
      <img src="file://${logoPath}" alt="Lumecon" />
    </div>

    <div class="cover__meta">${coverMeta}</div>

    <h1 class="cover__title">An <span class="cover__hl">investor memorandum</span> for Lumecon.</h1>

    <p class="cover__deck">
      Lumecon is building the next generation of economic impact analysis software.
      Software-first. AI-assisted. Expert-reviewed. Built for the organizations the
      legacy market leaves out.
    </p>

    <div class="cover__swatches">
      <div class="cover__swatch-row">
        <div class="swatch swatch--navy">
          <p class="swatch__name">Navy</p>
          <p class="swatch__hex">#0A0F26</p>
        </div>
        <div class="swatch swatch--accent">
          <p class="swatch__name">Accent</p>
          <p class="swatch__hex">#0FB5A5</p>
        </div>
        <div class="swatch swatch--gold">
          <p class="swatch__name">Gold</p>
          <p class="swatch__hex">#F0A91A</p>
        </div>
        <div class="swatch swatch--cream">
          <p class="swatch__name">Cream</p>
          <p class="swatch__hex">#FAF6EE</p>
        </div>
        <div class="swatch swatch--ink">
          <p class="swatch__name">Ink</p>
          <p class="swatch__hex">#353B5C</p>
        </div>
        <div class="swatch swatch--paper">
          <p class="swatch__name">Paper</p>
          <p class="swatch__hex">#FFFFFF</p>
        </div>
      </div>
    </div>

    <div class="cover__foot">
      <span>lumecon.ai</span>
      <span>${coverMeta}</span>
    </div>
  </section>

  <main class="body">
    ${rest}
  </main>

</body>
</html>`;

await writeFile(HTML, html, 'utf8');

const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const launchOpts = { args: ['--no-sandbox'] };
if (CHROME) launchOpts.executablePath = CHROME;
const browser = await chromium.launch(launchOpts);
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto('file://' + HTML, { waitUntil: 'networkidle' });
await page.pdf({
  path: PDF,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.6in', right: '0.7in', bottom: '0.7in', left: '0.7in' },
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-family: Inter, sans-serif; font-size: 7pt; letter-spacing: .14em; text-transform: uppercase; color: #6B6F8A; width: 100%; padding: 0 .7in; display: flex; justify-content: space-between;">
      <span>Lumecon Inc.</span>
      <span>Investor Memorandum</span>
    </div>`,
  footerTemplate: `
    <div style="font-family: Inter, sans-serif; font-size: 7pt; letter-spacing: .14em; text-transform: uppercase; color: #6B6F8A; width: 100%; padding: 0 .7in; display: flex; justify-content: space-between;">
      <span>Confidential and proprietary</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
});
await browser.close();
console.log('Wrote:', PDF);
