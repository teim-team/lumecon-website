/**
 * The rich-text renderer for a Cedar reply: bold, links, nothing else.
 *
 * Its own module so it can be tested directly. `cedarChat.ts` imports
 * `./api`, which reads `import.meta.env` when the module loads and throws
 * under plain Node — the reason `scripts/cedar-eval.ts` keeps a
 * hand-maintained copy of the scoring logic rather than importing it.
 * This function needs none of that, and it had a real bug that only a
 * direct test would have caught, so it lives where a test can reach it.
 */

/* Bare internal paths Cedar may write in prose ("see /pricing"). A short
   allowlist rather than any slash-word, so a sentence that happens to
   contain a slash does not become a link to nowhere. */
const INTERNAL_PATHS = 'pricing|about|map|cedar|signup|join|glossary|demo';

function escapeHtml(s: string): string {
  // Escape quotes too, not just &<>: a URL containing a double quote must
  // not be able to break out of the href="..." attribute we build below.
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Everything linkable, matched in ONE pass.
   -------------------------------------------------------------------
   It used to be four sequential `.replace()` calls, and each one
   re-scanned what the previous had written. With "https://lumecon.ai/cedar"
   in an answer that produced an anchor nested inside its own href
   attribute; reordering the rules only moved the nesting into the link
   text. The fault is not the order, it is re-scanning generated markup
   at all, so the rules are alternatives in a single regex and nothing
   this function emits is ever looked at again.

   Order inside the alternation is first-match-wins at each position:
     1. lumecon.ai/<path>, with or without a scheme -> same-site anchor,
        href set to the PATH so it stays an in-page navigation. A bare
        "lumecon.ai" with no path is prose, not a destination, and is
        left alone.
     2. any other http(s) URL -> external anchor.
     3. an email address -> mailto.
   An address like contact@lumecon.ai starts earlier in the string than
   the host inside it, so branch 3 claims it before branch 1 can. */
const LINKABLE =
  /(?:https?:\/\/)?lumecon\.ai(\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9-]+)*)|https?:\/\/[^\s<]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;

export function renderRich(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(LINKABLE, (match, samePath?: string) => {
    if (samePath) return `<a href="${samePath}">${match}</a>`;
    if (match.includes('@')) return `<a href="mailto:${match}">${match}</a>`;
    return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
  });
  /* Bare internal paths ("/pricing") are a separate shape: they need a
     boundary before the slash, which no href this function writes has. */
  html = html.replace(
    new RegExp(`(^|[\\s(])(/(?:${INTERNAL_PATHS}))\\b`, 'g'),
    '$1<a href="$2">$2</a>',
  );
  return html;
}
