/**
 * Cedar routing eval harness (dev tool, not shipped to the browser).
 *
 * Runs free-text questions through a faithful copy of the marketing
 * Cedar local classifier (src/lib/cedarChat.ts) so we can see exactly
 * which intent a question routes to, what answer the visitor would get,
 * and whether it lands as a clean match, a clarify prompt, a typo-fuzzy
 * match, an out-of-scope reply, or the generic fallback.
 *
 * Why a copy and not a direct import: cedarChat.ts imports ./api and
 * ./observability at module load, and api.ts reads import.meta.env at
 * top level, which throws under plain Node. The scoring logic below is
 * a line-faithful mirror of cedarChat.ts; the *data* (INTENTS, triggers,
 * answers, out-of-scope + fallback copy) is imported live from
 * src/data/cedarIntents.ts, so this harness always reflects the current
 * intent bank.
 *
 * Usage:
 *   node --experimental-strip-types scripts/cedar-eval.ts "how much does it cost"
 *   node --experimental-strip-types scripts/cedar-eval.ts "q1" "q2" "q3"
 *   node --experimental-strip-types scripts/cedar-eval.ts --json "q1" "q2"
 *   printf 'q1\nq2\n' | node --experimental-strip-types scripts/cedar-eval.ts --stdin
 *   node --experimental-strip-types scripts/cedar-eval.ts --full "q"   # print full answer text
 */

import {
  INTENTS,
  OUT_OF_SCOPE_ANSWER,
  FALLBACK_ANSWER,
  OUT_OF_SCOPE_TRIGGERS,
  type CedarIntent,
} from '../src/data/cedarIntents.ts';

/* ---- mirror of cedarChat.ts classifier (keep in sync) ---- */

function normalize(s: string): string {
  return ' ' + (s || '').toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[?!.,;:"()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() + ' ';
}

interface IntentMatch { score: number; intents: CedarIntent[]; }

function topMatches(rawText: string): IntentMatch {
  const text = normalize(rawText);
  if (text.trim() === '') return { score: 0, intents: [] };
  const scored: Array<{ intent: CedarIntent; score: number }> = [];
  let best = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const trig of intent.triggers) {
      const norm = normalize(trig);
      if (norm.trim() === '') continue;
      if (text.indexOf(norm) !== -1) score += Math.max(1, norm.trim().split(' ').length);
    }
    if (score > 0) {
      scored.push({ intent, score });
      if (score > best) best = score;
    }
  }
  return { score: best, intents: scored.filter((s) => s.score === best).map((s) => s.intent) };
}

function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length > b.length) return withinOneEdit(b, a);
  if (b.length - a.length > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length === b.length) { i++; j++; } else { j++; }
  }
  return edits + (b.length - j) <= 1;
}

function fuzzyMatch(rawText: string): CedarIntent | null {
  const tokens = normalize(rawText).trim().split(' ').filter((t) => t.length >= 5);
  if (!tokens.length) return null;
  for (const intent of INTENTS) {
    for (const trig of intent.triggers) {
      const t = trig.toLowerCase().trim();
      if (t.length < 5 || t.indexOf(' ') !== -1) continue;
      if (tokens.some((u) => withinOneEdit(u, t))) return intent;
    }
  }
  return null;
}

function isOutOfScope(rawText: string): boolean {
  const text = normalize(rawText);
  for (const trig of OUT_OF_SCOPE_TRIGGERS) {
    const norm = normalize(trig);
    if (norm.trim() === '') continue;
    if (text.indexOf(norm) !== -1) return true;
  }
  return false;
}

function clarifyPrompt(candidates: CedarIntent[]): string {
  const labels = candidates.slice(0, 3).map((c) => `"${c.chip}"`);
  const list =
    labels.length <= 1
      ? labels[0]
      : labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];
  return `I can read that a couple of ways, and I'd rather get it right than guess. Did you mean ${list}? Tell me which one (or add a few words) and I'll go deep.`;
}

interface Routed {
  query: string;
  route: 'out-of-scope' | 'clarify' | 'match' | 'fuzzy' | 'fallback';
  intentId: string | null;
  score: number;
  tiedIds: string[];
  answer: string;
}

function route(rawText: string): Routed {
  const oos = isOutOfScope(rawText);
  const { score, intents } = topMatches(rawText);
  const tiedIds = intents.map((i) => i.id);
  if (oos && score <= 1) {
    return { query: rawText, route: 'out-of-scope', intentId: null, score, tiedIds, answer: OUT_OF_SCOPE_ANSWER };
  }
  const candidates = intents.filter((i) => i.chip);
  if (candidates.length >= 3 || (score >= 2 && candidates.length >= 2)) {
    return { query: rawText, route: 'clarify', intentId: null, score, tiedIds, answer: clarifyPrompt(candidates) };
  }
  if (score >= 1) {
    return { query: rawText, route: 'match', intentId: intents[0].id, score, tiedIds, answer: intents[0].answer };
  }
  const fuzzy = fuzzyMatch(rawText);
  if (fuzzy) {
    return { query: rawText, route: 'fuzzy', intentId: fuzzy.id, score: 0, tiedIds, answer: fuzzy.answer };
  }
  return { query: rawText, route: 'fallback', intentId: null, score: 0, tiedIds, answer: FALLBACK_ANSWER };
}

/* ---- CLI ---- */

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

const ICON: Record<Routed['route'], string> = {
  'match': 'OK   ',
  'fuzzy': 'FUZZY',
  'clarify': 'CLARIFY',
  'out-of-scope': 'OOS  ',
  'fallback': 'MISS ',
};

function printHuman(r: Routed, full: boolean): void {
  const head = `[${ICON[r.route]}] (${r.route}${r.intentId ? ` → ${r.intentId}` : ''}, score ${r.score}${r.tiedIds.length > 1 ? `, tied: ${r.tiedIds.join('/')}` : ''})`;
  const ans = full ? r.answer : (r.answer.length > 220 ? r.answer.slice(0, 220) + '…' : r.answer);
  console.log(`Q: ${r.query}`);
  console.log(`   ${head}`);
  console.log(`   A: ${ans}`);
  console.log('');
}

async function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const full = argv.includes('--full');
  const useStdin = argv.includes('--stdin');
  let questions = argv.filter((a) => !a.startsWith('--'));
  if (useStdin || questions.length === 0) {
    const raw = await readStdin();
    questions = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  }
  const results = questions.map(route);
  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const counts: Record<string, number> = {};
    for (const r of results) counts[r.route] = (counts[r.route] ?? 0) + 1;
    for (const r of results) printHuman(r, full);
    console.log('— summary —');
    console.log(Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join('  |  '));
  }
}

main();
