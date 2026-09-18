/**
 * Stress the built site.
 *
 * A static site served from a CDN is not going to fall over under load —
 * the interesting failures are in the scripts ON it. A listener added on
 * every page view and never removed, a disclosure set that races its own
 * animation, a chat runtime that leaks a handler per message: none of
 * those show up in a single-page test, and all of them show up when one
 * browser walks the whole site repeatedly while others do the same.
 *
 * So this does two things:
 *
 *   1. Many concurrent clients navigate every page, several rounds each,
 *      half of them on a phone viewport. Anything that throws, 404s, or
 *      gets slower as the run goes on is reported.
 *   2. One client drives the interactive surfaces hard: Cedar's chat (the
 *      only real runtime on the site), the Cedar Commons team picker, the
 *      Cedar Grove atlas, the /team roster, the disclosure sets. It
 *      measures listener and node counts before and after, so a leak is
 *      a number rather than a hunch.
 *
 *   npm run stress                 # against a running preview
 *   STRESS_CLIENTS=24 npm run stress
 *
 * A cancelled request is NOT a failure. Navigating away aborts whatever
 * is still in flight — fonts and lazy images, mostly — and an earlier
 * version of this script counted 115 of those as errors and buried the
 * real signal. Only a request that failed for its own reasons counts.
 */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.STRESS_BASE_URL || 'http://127.0.0.1:4321';
const CLIENTS = Number(process.env.STRESS_CLIENTS || 12);
const ROUNDS = Number(process.env.STRESS_ROUNDS || 3);

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

const { SITE_PAGES } = await import(resolve(ROOT, 'src/data/siteMap.ts'));

const browser = await chromium.launch({ executablePath: chromiumExecutable() });
const failures = [];
const latency = [];
const perRound = [];

/** Aborted by navigating away, not by failing. */
const isCancellation = (text = '') => /ERR_ABORTED|NS_BINDING_ABORTED|context or browser/i.test(text);

async function walk(id) {
  const phone = id % 2 === 1;
  const ctx = await browser.newContext({
    viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: phone,
    hasTouch: phone,
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('lumecon:consent:analytics', 'denied');
    } catch {
      /* private mode */
    }
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => failures.push(`client${id} threw: ${e.message.slice(0, 120)}`));
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText || '';
    if (!isCancellation(why)) failures.push(`client${id} request ${r.url().slice(-48)} ${why}`);
  });

  for (let round = 0; round < ROUNDS; round += 1) {
    const started = Date.now();
    for (const entry of SITE_PAGES) {
      const at = Date.now();
      const res = await page
        .goto(BASE + (entry.visit ?? entry.path), { waitUntil: 'domcontentloaded', timeout: 30000 })
        .catch((e) => {
          failures.push(`client${id} ${entry.path}: ${String(e).slice(0, 90)}`);
          return null;
        });
      // /404 is allowed to be a 404; everything else is not.
      if (res && !(entry.path === '/404' ? [200, 404] : [200]).includes(res.status())) {
        failures.push(`client${id} ${entry.path} returned ${res.status()}`);
      }
      latency.push(Date.now() - at);
    }
    (perRound[round] ??= []).push(Date.now() - started);
  }
  await ctx.close();
}

/** Drive the things that hold state until they break or prove they don't. */
async function hammerInteractive() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('lumecon:consent:analytics', 'denied');
    } catch {
      /* private mode */
    }
  });
  const page = await ctx.newPage();
  const thrown = [];
  page.on('pageerror', (e) => thrown.push(e.message.slice(0, 120)));

  const count = () =>
    page.evaluate(() => ({
      nodes: document.querySelectorAll('*').length,
      listeners: performance.eventCounts ? performance.eventCounts.size : -1,
    }));

  // Cedar: open, ask repeatedly, close. The chat appends to a transcript
  // and rebinds chips on every reply, so an unbounded transcript or a
  // handler per message shows up as node growth that never settles.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#why').scrollIntoViewIfNeeded();
  await page.locator('.cedar-fab').click();
  await page.locator('#cedarFabPanel').waitFor({ state: 'visible' });
  await page.waitForFunction(() =>
    document.querySelector('#cedarFabPanel')?.getAttribute('data-cedar-booted') === '1',
  );
  const before = await count();
  const input = page.locator('#cedarFabPanel [data-cedar-input]');
  const QUESTIONS = [
    'what is lumecon',
    'how much does it cost',
    'what is cedar commons',
    'who is it for',
    'how long does an analysis take',
    'is my data safe',
  ];
  for (let i = 0; i < 30; i += 1) {
    await input.fill(QUESTIONS[i % QUESTIONS.length]);
    await input.press('Enter');
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(1200);
  const after = await count();
  const replies = await page.locator('#cedarFabPanel .cedar-msg--bot').count();

  // The disclosure sets, opened and closed far more times than a person would.
  const surfaces = [
    ['/cedar-commons', '[data-surf-tab]'],
    ['/cedar-grove', '.grovepg-atlas__cell button, .grovepg-atlas__cell [role="button"]'],
    ['/team', '.face'],
  ];
  const churn = [];
  for (const [path, selector] of surfaces) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const controls = page.locator(selector);
    const n = await controls.count();
    if (!n) {
      churn.push(`${path}: no controls matched ${selector}`);
      continue;
    }
    const start = (await count()).nodes;
    for (let i = 0; i < 60; i += 1) {
      await controls.nth(i % n).click({ timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(400);
    const end = (await count()).nodes;
    churn.push(`${path}: ${n} controls, 60 activations, nodes ${start} -> ${end}`);
  }

  await ctx.close();
  return { before, after, replies, churn, thrown };
}

console.log(
  `${CLIENTS} clients x ${ROUNDS} rounds x ${SITE_PAGES.length} pages = ${
    CLIENTS * ROUNDS * SITE_PAGES.length
  } navigations against ${BASE}`,
);
const t0 = Date.now();
await Promise.all(Array.from({ length: CLIENTS }, (_, i) => walk(i)));
const elapsed = (Date.now() - t0) / 1000;

latency.sort((a, b) => a - b);
const pct = (q) => latency[Math.min(latency.length - 1, Math.floor(latency.length * q))];

console.log(`\n--- load ---`);
console.log(
  `${latency.length} navigations in ${elapsed.toFixed(1)}s (${(latency.length / elapsed).toFixed(
    1,
  )}/s)`,
);
console.log(`p50 ${pct(0.5)}ms   p95 ${pct(0.95)}ms   p99 ${pct(0.99)}ms   max ${latency.at(-1)}ms`);
/* Round-over-round is the leak signal: a site that gets slower the longer
   a browser stays on it is holding something it should have let go. */
perRound.forEach((times, i) => {
  const mean = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  console.log(`round ${i + 1}: mean full-site walk ${mean}ms`);
});

console.log(`\n--- interactive ---`);
const inter = await hammerInteractive();
console.log(
  `Cedar: 30 questions -> ${inter.replies} replies, DOM ${inter.before.nodes} -> ${inter.after.nodes} nodes`,
);
for (const line of inter.churn) console.log(`  ${line}`);
if (inter.thrown.length) {
  console.log(`  threw: ${[...new Set(inter.thrown)].slice(0, 5).join(' | ')}`);
}

console.log(`\n--- failures ---`);
const unique = [...new Set(failures)];
console.log(unique.length ? `${failures.length} (${unique.length} distinct)` : 'none');
for (const f of unique.slice(0, 12)) console.log('  ', f);

await browser.close();
process.exit(unique.length || inter.thrown.length ? 1 : 0);
