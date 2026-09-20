import { test, expect } from '@playwright/test';
import { renderRich } from '../src/lib/richText';

/**
 * The linkifier, tested directly.
 *
 * It used to be four sequential `.replace()` passes inside cedarChat.ts,
 * each one re-scanning what the previous had written. On a bare
 * `lumecon.ai/path` — the form the intent bank uses — that was fine, and
 * every test that drove Cedar through the DOM passed. On a fully
 * qualified `https://lumecon.ai/path` — the form the API writes — it
 * produced an anchor nested inside its own `href` attribute.
 *
 * The chat tests could not have caught it, because the shape that breaks
 * does not appear in the intent bank. Hence this file, and hence
 * richText.ts existing at all.
 */

/** No anchor inside an attribute, and no anchor inside an anchor. */
function wellFormed(html: string): string[] {
  const faults: string[] = [];
  if (/href="[^"]*<a /.test(html)) faults.push('anchor inside an href');
  if (/<a [^>]*>(?:(?!<\/a>)[\s\S])*<a /.test(html)) faults.push('anchor inside an anchor');
  const opens = (html.match(/<a\b/g) || []).length;
  const closes = (html.match(/<\/a>/g) || []).length;
  if (opens !== closes) faults.push(`${opens} <a> against ${closes} </a>`);
  return faults;
}

const CASES: Array<{ input: string; expect: RegExp | string; note: string }> = [
  {
    input: 'Details at lumecon.ai/cedar-commons.',
    expect: '<a href="/cedar-commons">lumecon.ai/cedar-commons</a>',
    note: 'bare host, the form the intent bank writes',
  },
  {
    input: 'Full detail is at https://lumecon.ai/cedar.',
    expect: '<a href="/cedar">https://lumecon.ai/cedar</a>',
    note: 'qualified same-site URL, the form that used to nest',
  },
  {
    input: 'Both https://lumecon.ai/cedar-grove and lumecon.ai/why-lumecon.',
    expect: /href="\/cedar-grove"[\s\S]*href="\/why-lumecon"/,
    note: 'both forms in one sentence',
  },
  {
    input: 'See https://example.com/x for more.',
    expect: 'target="_blank"',
    note: 'an outside URL opens in a new tab',
  },
  {
    input: 'Write to contact@lumecon.ai about it.',
    expect: '<a href="mailto:contact@lumecon.ai">contact@lumecon.ai</a>',
    note: 'an address wins over the host inside it',
  },
  {
    input: 'Try /pricing for the plans.',
    expect: '<a href="/pricing">/pricing</a>',
    note: 'a bare internal path',
  },
];

test('every shape of link renders as exactly one anchor', () => {
  for (const { input, expect: wanted, note } of CASES) {
    const html = renderRich(input);
    expect(wellFormed(html), `${note}: ${html}`).toEqual([]);
    if (typeof wanted === 'string') expect(html, note).toContain(wanted);
    else expect(html, note).toMatch(wanted);
  }
});

test('a same-site link points at the path, so it does not reload the site', () => {
  // The href is the path even when the answer wrote the absolute URL: an
  // in-page navigation rather than a fresh document.
  expect(renderRich('at https://lumecon.ai/methodology.')).toContain('href="/methodology"');
  expect(renderRich('at https://lumecon.ai/methodology.')).not.toContain(
    'href="https://lumecon.ai/methodology"',
  );
});

test('a bare hostname with no path is prose, not a destination', () => {
  const html = renderRich('Verify claims against lumecon.ai and cite it.');
  expect(html).not.toContain('<a ');
});

test('markup in an answer cannot escape the attribute it lands in', () => {
  /* The reason escaping happens before any of this: an answer is data,
     and a quote in it must not close the href we are building. */
  const html = renderRich('Try lumecon.ai/cedar"><script>alert(1)</script> now.');
  expect(html).not.toContain('<script>');
  expect(wellFormed(html), html).toEqual([]);
});
