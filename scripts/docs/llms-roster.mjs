/**
 * Regenerate the roster block in public/llms.txt from the built /team page.
 *
 * llms.txt was a second, hand-written public roster, and it drifted from
 * the first. By the time it was caught it named a person the page does not
 * show, gave Elijah roles the page does not list, and published a fact
 * about tribal membership that appears nowhere a visitor can read. Two
 * public records of the same people disagreeing is not a copy problem; it
 * is a claim problem.
 *
 * So there is only one record now. This reads the rendered /team page —
 * the same approach as export-copy.mjs, and for the same reason: what
 * ships is what gets written down — and replaces everything between the
 * roster heading and `## Origin`. Anything that should be public about a
 * person goes on the page first, and arrives here because it is there.
 *
 *   npm run llms:roster        # with the built site being served
 *
 * Same convention as the rest of scripts/: nothing runs at build time.
 * Run it when the team changes and commit the output.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.DOCS_BASE_URL || 'http://localhost:4321';
const OUT = resolve(ROOT, 'public/llms.txt');
const START = '## Team and advisors';
const END = '## Origin';

/** Same resolution order as playwright.config.ts and export-copy.mjs. */
function chromiumExecutable() {
  if (process.env.PW_CHROMIUM_EXECUTABLE) return process.env.PW_CHROMIUM_EXECUTABLE;
  try {
    const pinned = chromium.executablePath();
    if (pinned && existsSync(pinned)) return undefined;
  } catch {
    /* fall through */
  }
  for (const candidate of ['/opt/pw-browsers/chromium', '/usr/bin/chromium']) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const browser = await chromium.launch({ executablePath: chromiumExecutable() });
const page = await (await browser.newContext()).newPage();
await page.goto(`${BASE}/team`, { waitUntil: 'networkidle' });

const { groups, people } = await page.evaluate(() => {
  const text = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
  return {
    groups: Array.from(document.querySelectorAll('.roster__group')).map((group) => ({
      label: text(group.querySelector('.roster__glabel')),
      slugs: Array.from(group.querySelectorAll('[data-face]')).map((face) =>
        face.getAttribute('data-face'),
      ),
    })),
    people: Object.fromEntries(
      Array.from(document.querySelectorAll('[data-person]')).map((card) => [
        card.getAttribute('data-person'),
        {
          name: text(card.querySelector('.pcard__name')),
          role: text(card.querySelector('.pcard__role')),
          education: Array.from(card.querySelectorAll('.pcard__list li')).map(text),
          experience: Array.from(card.querySelectorAll('[data-field="experience"] p')).map(text),
          tribal: Array.from(card.querySelectorAll('[data-field="tribal"] p')).map(text),
          links: Array.from(card.querySelectorAll('.pcard__link')).map((a) => a.href),
        },
      ]),
    ),
  };
});
await browser.close();

const lines = [START, ''];
lines.push(
  'Generated from https://lumecon.ai/team by scripts/docs/llms-roster.mjs. The page is',
  'the only roster; nothing is stated here that a visitor cannot read there. Degrees',
  'are listed highest attainment first.',
  '',
);
for (const group of groups) {
  lines.push(`### ${group.label}`, '');
  for (const slug of group.slugs) {
    const person = people[slug];
    const parts = [
      `${person.name}, ${person.role}.`,
      person.education.length ? `Education: ${person.education.join('; ')}.` : '',
      ...person.experience,
      ...person.tribal,
      // The page renders the address as a mailto: link; the roster wants
      // the address.
      person.links.length ? person.links.map((l) => l.replace(/^mailto:/, '')).join(' · ') : '',
    ].filter(Boolean);
    lines.push(`- ${parts.join(' ')}`);
  }
  lines.push('');
}

const current = readFileSync(OUT, 'utf8');
const start = current.indexOf(START);
const end = current.indexOf(END);
if (start === -1 || end === -1 || end < start) {
  console.error(`Could not find "${START}" ... "${END}" in public/llms.txt`);
  process.exit(1);
}
writeFileSync(OUT, current.slice(0, start) + `${lines.join('\n')}\n` + current.slice(end));
console.log(`Wrote the roster block in public/llms.txt (${Object.keys(people).length} people).`);
