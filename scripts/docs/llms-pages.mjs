/**
 * Regenerate the `## Pages` block in public/llms.txt from src/data/siteMap.ts.
 *
 * WHY
 * llms.txt is the file whose entire job is telling an assistant what this
 * site contains, and it contained no list of pages. It described the
 * product in prose and named a handful of URLs inline, so an assistant
 * asking "what is on lumecon.ai" had to infer the answer. When
 * /why-lumecon shipped, llms.txt did not mention it at all — and would
 * not have mentioned the next page either, because nothing connected the
 * file to the site's own inventory.
 *
 * Same convention as llms-roster.mjs: a marker-delimited block, rewritten
 * from a source of record, committed. Unlike that script this one needs
 * no browser and no running site — the inventory is a TypeScript module,
 * read here through Node's type stripping.
 *
 *   npm run llms:pages
 *
 * Nothing runs at build time. Run it when a page is added or its question
 * changes, and commit the output. `tests/smoke.spec.ts` fails if the
 * inventory and the sitemap disagree, so a page cannot be added to the
 * site and quietly left out of what crawlers are given.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'public/llms.txt');
const ORIGIN = 'https://lumecon.ai';

const START = '## Pages';
const END = '## Pricing (public)';

const { LLMS_PAGES } = await import(resolve(ROOT, 'src/data/siteMap.ts'));

const lines = [
  START,
  '',
  'Every page below answers one question. The question is what the page is for,',
  'not a description of its layout. Paths are stable; the list is generated from',
  "the site's own page inventory, so it does not fall behind the site.",
  '',
  ...LLMS_PAGES.map((p) => `- ${ORIGIN}${p.path === '/' ? '/' : p.path} — ${p.question}`),
  '',
  'Sign-up, log-in, plan selection, checkout and the post-purchase welcome are',
  'steps in a flow rather than destinations. They are excluded here and marked',
  'noindex on the site.',
  '',
];

const current = readFileSync(OUT, 'utf8');
const startAt = current.indexOf(START);
const endAt = current.indexOf(END);

if (endAt === -1) {
  throw new Error(`llms-pages: could not find the section after the block ("${END}")`);
}

const before = startAt === -1 ? current.slice(0, endAt) : current.slice(0, startAt);
const after = current.slice(endAt);
const next = `${before.replace(/\n+$/, '\n\n')}${lines.join('\n')}\n${after}`;

if (next === current) {
  console.log('llms.txt page list already current.');
} else {
  writeFileSync(OUT, next);
  console.log(`Wrote the ${START} block in public/llms.txt (${LLMS_PAGES.length} pages).`);
}
