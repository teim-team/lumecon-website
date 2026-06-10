/**
 * Cedar chat runtime.
 *
 * Conversation logic for the persistent Cedar FAB (CedarFAB.astro).
 * The FAB is the only Cedar chat surface today, but bootChat() is
 * written surface-agnostic so a second surface can be added without
 * touching this module.
 *
 * What this module owns:
 *   - Conversation state (transcript, quick-reply chip collapse)
 *   - Message classification + answer resolution, local-first: the
 *     intent bank answers everything it confidently matches at zero
 *     backend cost; only genuine misses escalate to the Cedar API
 *     when configured (production-ready seam — when the backend
 *     ships, no component changes required)
 *   - Conversation memory: drill-downs, repeat-question awareness
 *     (deeper answer or acknowledged restatement instead of verbatim
 *     replay), compound-question follow-ups, audience bias, a
 *     cross-visit "welcome back" topic marker, and a one-shot idle
 *     nudge — all scripted locally so Cedar reads as live without
 *     spending a token
 *   - Observability hooks (trackEvent / trackError)
 *   - Idempotent boot — safe to re-run on astro:page-load
 *
 * What this module does NOT own:
 *   - Panel open/close affordance (the FAB's toggle stays in the
 *     CedarFAB component since it's surface-specific)
 *
 * Surface contract: the caller passes a root element whose subtree
 * contains the following data attributes:
 *   - [data-cedar-transcript]  the scrolling log
 *   - [data-cedar-chips]       the quick-reply chip row
 *   - [data-cedar-form]        the input form
 *   - [data-cedar-input]       the text input
 * The chips themselves must each have data-intent="<intent-id>".
 */

import Fuse from 'fuse.js';
import {
  INTENTS,
  OUT_OF_SCOPE_ANSWER,
  FALLBACK_ANSWER,
  OUT_OF_SCOPE_TRIGGERS,
  type CedarIntent,
} from '../data/cedarIntents';
import { cedarChat as cedarChatApi, apiConfigured } from './api';
import { trackEvent, trackError } from './observability';

export type CedarSurface = 'fab' | 'inline';

export interface BootOptions {
  surface: CedarSurface;
  /** Optional clock injection for tests. */
  now?: () => number;
}

/* ----- Conversation id ---------------------------------------------
   Persisted across in-tab navigations via sessionStorage so the
   backend can keep per-conversation context. New tab = new id. */
const CONVO_KEY = 'lumecon:cedar:conversation';

function getConversationId(): string {
  if (typeof sessionStorage === 'undefined') return generateId();
  try {
    const existing = sessionStorage.getItem(CONVO_KEY);
    if (existing) return existing;
    const fresh = generateId();
    sessionStorage.setItem(CONVO_KEY, fresh);
    return fresh;
  } catch {
    return generateId();
  }
}

function generateId(): string {
  // crypto.randomUUID is available in all modern browsers; fall back
  // to a quick rand+time hex for older runtimes.
  const c: Crypto | undefined = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ----- Transcript persistence --------------------------------------
   Save the dynamic turns (the static welcome is excluded) per
   conversation id so reopening the FAB or moving between pages keeps
   the thread. Capped to the last 40 messages; sessionStorage = cleared
   on tab close. */
const LOG_KEY = 'lumecon:cedar:log';
interface LoggedMsg {
  role: 'user' | 'bot';
  text: string;
}

function loadHistory(id: string): LoggedMsg[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`${LOG_KEY}:${id}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-40) : [];
  } catch {
    return [];
  }
}

function saveHistory(id: string, msgs: LoggedMsg[]): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(`${LOG_KEY}:${id}`, JSON.stringify(msgs.slice(-40)));
  } catch {
    /* quota or disabled storage — degrade silently */
  }
}

/* ----- Conversation memory persistence -----------------------------
   The transcript text alone isn't enough to resume a thread: the
   drill-down ("tell me more"), the audience-biased follow-ups, and the
   two-strike handoff counter all depend on in-memory state that would
   otherwise reset on every in-tab navigation (re-running bootChat).
   Persist that small state alongside the transcript so reopening the
   panel or changing pages keeps the conversation's memory, not just its
   text — e.g. "tell me more" still drills into the last topic, and a
   visitor who already saw the handoff doesn't get a second one. */
const STATE_KEY = 'lumecon:cedar:state';
interface ConvoState {
  priorIntentId?: string | null;
  misses?: number;
  audience?: string | null;
  /** Intent ids already answered this conversation (repeat detection). */
  answered?: string[];
  /** Intent ids whose expanded answer has been shown (so a repeat
   *  doesn't serve the same deep dive twice). */
  expandedShown?: string[];
  /** Whether the one-per-conversation idle nudge has fired. */
  nudged?: boolean;
}
function loadState(id: string): ConvoState {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(`${STATE_KEY}:${id}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
function saveState(id: string, state: ConvoState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(`${STATE_KEY}:${id}`, JSON.stringify(state));
  } catch {
    /* quota or disabled storage — degrade silently */
  }
}

/* ----- Local keyword classifier ------------------------------------
   The same scoring rules the inline scripts used, lifted out so
   there's one implementation to debug and improve. */
function normalize(s: string): string {
  return (
    ' ' +
    (s || '')
      .toLowerCase()
      // Strip apostrophes/backticks so contractions collapse the way people
      // type them: "i'm" / "i’m" / "im" all normalize to "im", and a trigger
      // stored as "i'm five" becomes "im five" instead of the broken "i m five".
      .replace(/['’`]/g, '')
      .replace(/[?!.,;:"()\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() +
    ' '
  );
}

export interface IntentMatch {
  /** Highest trigger-match score across all intents (0 = no match). */
  score: number;
  /** All intents that tie for that top score, in declaration order.
   *  More than one means the message is ambiguous. */
  intents: CedarIntent[];
}

/* Score every intent by its trigger hits (longer phrases weigh more). */
function scoreIntents(rawText: string): Array<{ intent: CedarIntent; score: number }> {
  const text = normalize(rawText);
  if (text.trim() === '') return [];
  const scored: Array<{ intent: CedarIntent; score: number }> = [];
  for (const intent of INTENTS) {
    let score = 0;
    for (const trig of intent.triggers) {
      const norm = normalize(trig);
      if (norm.trim() === '') continue;
      // Longer phrases beat single-word hits.
      if (text.indexOf(norm) !== -1) score += Math.max(1, norm.trim().split(' ').length);
    }
    if (score > 0) scored.push({ intent, score });
  }
  return scored;
}

/* Return the top-scoring intents. Exposing the tie set lets the
   runtime ask the visitor to clarify when confidence is low instead of
   committing to a guess. */
export function topMatches(rawText: string): IntentMatch {
  const scored = scoreIntents(rawText);
  let best = 0;
  for (const s of scored) if (s.score > best) best = s.score;
  return { score: best, intents: scored.filter((s) => s.score === best).map((s) => s.intent) };
}

/* Compound-question detection: a strong runner-up topic distinct from
   the primary match (e.g. "how much does it cost and is my data safe"
   scores pricing first, security second). The runtime answers the
   primary and surfaces the runner-up as the first follow-up chip, so
   both halves of the question get acknowledged. Requires a multi-word
   trigger hit (score >= 2) so a stray single keyword can't hijack a
   chip slot. */
export function secondaryMatch(rawText: string, primaryId: string): CedarIntent | null {
  const scored = scoreIntents(rawText)
    .filter(
      (s) => s.intent.id !== primaryId && s.intent.chip && !NON_TOPIC_INTENTS.has(s.intent.id),
    )
    .sort((a, b) => b.score - a.score);
  return scored.length && scored[0].score >= 2 ? scored[0].intent : null;
}

/* Fuzzy typo fallback (Fuse.js). Runs only when nothing matched exactly
   (topMatches score < 1). The old hand-rolled matcher tolerated a single
   edit; Fuse adds transposition and multi-edit tolerance, so "tiff
   abatemnt", "reservaton", and "casnio" route instead of dropping to the
   fallback. The index holds single-word triggers only (built below); a
   tight threshold plus a length guard keep it from hijacking genuinely
   out-of-scope input (which is also gated behind the OOS check that runs
   before this). */
interface TriggerToken {
  w: string;
  idx: number;
}
const FUZZY_TOKENS: TriggerToken[] = (() => {
  const seen = new Set<string>();
  const out: TriggerToken[] = [];
  INTENTS.forEach((intent, idx) => {
    for (const trig of intent.triggers) {
      // Only index single-word triggers (>= 5 chars). Tokenizing
      // multi-word triggers would index common words ("place", "work",
      // "model") and let Fuse hijack off-topic input ("taco place").
      // This mirrors the old matcher's candidate set; Fuse only upgrades
      // the edit tolerance over it.
      const t = trig.toLowerCase().trim();
      if (t.length < 5 || /[\s-]/.test(t)) continue;
      const key = `${t}|${idx}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ w: t, idx });
    }
  });
  return out;
})();
const FUZZY_THRESHOLD = 0.25;
const fuzzyFuse = new Fuse(FUZZY_TOKENS, {
  keys: ['w'],
  includeScore: true,
  threshold: FUZZY_THRESHOLD,
  ignoreLocation: true,
  minMatchCharLength: 4,
});

function fuzzyMatch(rawText: string): CedarIntent | null {
  const tokens = normalize(rawText)
    .trim()
    .split(' ')
    .filter((t) => t.length >= 5);
  if (!tokens.length) return null;
  let best: { idx: number; score: number } | null = null;
  for (const tok of tokens) {
    const hit = fuzzyFuse.search(tok, { limit: 1 })[0];
    // Tight gates so a random 5-letter token can't find a neighbour: low
    // Fuse score AND a similar word length (a real typo barely changes
    // length). Keeps it a strict superset of the old one-edit matcher.
    if (
      hit &&
      typeof hit.score === 'number' &&
      hit.score <= FUZZY_THRESHOLD &&
      Math.abs(hit.item.w.length - tok.length) <= 2
    ) {
      if (!best || hit.score < best.score) best = { idx: hit.item.idx, score: hit.score };
    }
  }
  return best ? INTENTS[best.idx] : null;
}

export function classify(rawText: string): CedarIntent | null {
  const { score, intents } = topMatches(rawText);
  return score >= 1 ? intents[0] : null;
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

/* When the top match is a tie between distinct, substantive topics,
   Cedar asks which one the visitor means rather than guessing wrong or
   dumping the generic fallback. */
function clarifyPrompt(candidates: CedarIntent[]): string {
  const labels = candidates.slice(0, 3).map((c) => `"${c.chip}"`);
  const list =
    labels.length <= 1
      ? labels[0]
      : labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];
  return `I can read that a couple of ways, and I'd rather get it right than guess. Did you mean ${list}? Tell me which one (or add a few words) and I'll go deep.`;
}

/* Only clarify when the ambiguity is real. A two-way tie on a single bare
   word (score 1) is usually a compound question Cedar can just answer with
   the declaration-order winner, so interrogating the visitor there is
   annoying. Clarify when either the tie is "strong" (two distinct
   multi-word topics, score >= 2) or genuinely scattered (three or more
   chip-bearing topics share the top score). */
function shouldClarify(score: number, candidateCount: number): boolean {
  return candidateCount >= 3 || (score >= 2 && candidateCount >= 2);
}

/** Substantive (chip-bearing) intents tied at the top score, returned only
 *  when the tie is ambiguous enough to be worth a clarify prompt. */
function ambiguousCandidates(rawText: string): CedarIntent[] {
  const { score, intents } = topMatches(rawText);
  if (score < 1) return [];
  const substantive = intents.filter((i) => i.chip);
  return shouldClarify(score, substantive.length) ? substantive : [];
}

export function localAnswer(rawText: string): string {
  const oos = isOutOfScope(rawText);
  const { score, intents } = topMatches(rawText);
  // An out-of-scope signal beats a *weak* single-keyword match: e.g.
  // "who is the president of mexico" should hit the out-of-scope reply,
  // not the Global-platform answer it would otherwise match on the bare
  // word "mexico". A strong, multi-word product match still wins.
  if (oos && score <= 1) return OUT_OF_SCOPE_ANSWER;
  const candidates = intents.filter((i) => i.chip);
  if (shouldClarify(score, candidates.length)) return clarifyPrompt(candidates);
  if (score >= 1) return intents[0].answer;
  const fuzzy = fuzzyMatch(rawText);
  if (fuzzy) return fuzzy.answer;
  return FALLBACK_ANSWER;
}

/* ----- Local-first resolver with API escalation --------------------
   The local classifier answers everything it confidently matches —
   zero backend tokens spent on the ~95% of traffic the intent bank
   already covers. Only a genuine local miss (no exact match, no fuzzy
   rescue, not out-of-scope) escalates to the Cedar API when
   PUBLIC_API_URL is set; if the backend can't answer either, the
   visitor gets the local fallback. Either way the seam is invisible.

   `fromApi` reports whether the text came from a successful backend
   response (vs. the local fallback). The caller needs this so it
   doesn't mislabel an API-answered question as a local "miss" — that
   would corrupt the unmatched-query analytics and could trip the
   two-strike human handoff even though the bot answered correctly. */
interface ResolvedAnswer {
  text: string;
  fromApi: boolean;
}
async function resolveAnswer(
  message: string,
  surface: CedarSurface,
  conversationId: string,
  localFallback: string,
): Promise<ResolvedAnswer> {
  if (!apiConfigured()) return { text: localFallback, fromApi: false };
  try {
    const result = await cedarChatApi({ message, surface, conversationId });
    if (result.ok && result.data.answer) {
      trackEvent('cedar.api.success', { surface });
      return { text: result.data.answer, fromApi: true };
    }
    trackEvent('cedar.api.fallback', {
      surface,
      reason: result.ok ? 'empty-answer' : result.reason,
    });
    return { text: localFallback, fromApi: false };
  } catch (err: unknown) {
    trackError(err, { where: 'cedarChat.resolveAnswer', surface });
    return { text: localFallback, fromApi: false };
  }
}

/* ----- Thinking pause ----------------------------------------------
   Keep the typing indicator up briefly so a reply reads as composed
   rather than precomputed. Scales with answer length and collapses to
   near-instant when the visitor prefers reduced motion. */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// "Cedar is thinking" pause before the reply streams in. Scales with
// answer length so longer answers feel considered, clamped to 0.7–1.8s
// so short answers don't feel instant and long ones don't stall. A
// ±15% jitter keeps the rhythm from feeling metronomic across turns.
function thinkingPause(answer: string): number {
  if (prefersReducedMotion()) return 200;
  const base = Math.min(1800, Math.max(700, 480 + answer.length * 4));
  return Math.round(base * (0.85 + Math.random() * 0.3));
}

/* Render a *bot* answer with light, safe formatting: clickable email +
   internal links and **bold**. HTML is escaped first, then only our own
   anchors/strong tags are injected, so this can't introduce XSS — and it
   only ever runs on author-controlled answer strings (or the future API
   reply), never on raw user input (user bubbles stay textContent). The
   clickable contact email and /pricing, /demo links make the reply feel
   like a finished product and double as conversion paths. */
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
function renderRich(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(
    /\bhttps?:\/\/[^\s<]+/g,
    (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`,
  );
  html = html.replace(
    /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
    '<a href="mailto:$1">$1</a>',
  );
  html = html.replace(
    new RegExp(`(^|[\\s(])(/(?:${INTERNAL_PATHS}))\\b`, 'g'),
    '$1<a href="$2">$2</a>',
  );
  return html;
}

/* Reveal a reply word-by-word so it reads as Cedar composing rather
   than a block of text snapping in, then finalize to the rich (linked)
   markup. Instant under reduced motion. */
async function streamText(
  transcript: HTMLElement,
  bubble: HTMLElement,
  text: string,
): Promise<void> {
  if (prefersReducedMotion()) {
    bubble.innerHTML = renderRich(text);
    return;
  }
  const tokens = text.split(/(\s+)/);
  // Streaming cadence: long answers stream faster so the total wait
  // stays comfortable; short answers stream slower so they read as typed.
  const perWord = tokens.length > 90 ? 8 : 15;
  // Composed-prose rhythm: a beat after each sentence, a smaller one
  // after clause punctuation, and per-word jitter so the cadence never
  // reads as a metronome. These are the cues people subconsciously use
  // to judge "is something actually composing this?"
  const pauseAfter = (tok: string): number => {
    const jittered = perWord * (0.6 + Math.random() * 0.8);
    if (/[.!?]['")]?$/.test(tok)) return jittered + 110;
    if (/[,;:]['")]?$/.test(tok)) return jittered + 40;
    return jittered;
  };
  bubble.textContent = '';
  // The transcript is an aria-live log; mark it busy while we append
  // word-by-word so a screen reader announces the finished answer once
  // (on busy → false) instead of reading every partial token (#64).
  transcript.setAttribute('aria-busy', 'true');
  try {
    for (const tok of tokens) {
      bubble.textContent += tok;
      transcript.scrollTo({ top: transcript.scrollHeight });
      if (tok.trim()) await sleep(pauseAfter(tok));
    }
    // Swap the streamed plain text for the linked/bolded markup once the
    // full answer has landed (keeps the composing animation, adds polish).
    bubble.innerHTML = renderRich(text);
  } finally {
    transcript.setAttribute('aria-busy', 'false');
  }
}

/* Example prompts the input placeholder cycles through while idle, so
   first-time visitors see the kinds of things Cedar can field. */
const PLACEHOLDER_EXAMPLES = [
  'Ask Cedar a question…',
  'Try "how much does it cost?"',
  'Try "does this work for tribal nations?"',
  'Try "EPA grant"',
  'Try "how long does a study take?"',
  'Try "see a demo"',
];

/* ----- Conversation memory -----------------------------------------
   IDs of the conversational-filler intents that shouldn't be tracked
   as the "last topic" — drilling into "tell me more" right after
   "thanks" is meaningless. Skipping these keeps priorIntent pointing
   at the most recent substantive topic. */
const NON_TOPIC_INTENTS = new Set([
  'tell_me_more',
  'thanks',
  'goodbye',
  'affirmative',
  'negative',
  'confused',
  'rude',
  'greeting',
]);

/* ----- Repeat-question handling -------------------------------------
   Replaying the identical paragraph when a visitor asks the same thing
   twice is the loudest "this is canned" tell. Instead:
     - first repeat with an unseen `expanded` answer → bridge into the
       deeper version (the repeat reads as intent to know more);
     - otherwise → acknowledge the repeat with a rotating bridge line,
       then restate the answer.
   Conversational filler (greeting / thanks / "ok") rotates through its
   authored `variants` instead, so back-to-back pleasantries never
   render verbatim-identical. All of this is local — zero tokens. */
const REPEAT_DEEPEN_BRIDGE = 'We touched on this earlier, so let me go a level deeper. ';
const REPEAT_BRIDGES = [
  'Coming back around to this one — here it is again. ',
  'Happy to run this one back. ',
  'Same ground as before, in case a second pass helps. ',
];

function repeatAnswer(intent: CedarIntent, timesAnswered: number, expandedSeen: boolean): string {
  if (intent.variants?.length) {
    // Filler intents: rotate variants; deterministic by repeat count so
    // the rotation is stable within a conversation.
    return intent.variants[(timesAnswered - 1) % intent.variants.length];
  }
  if (typeof intent.expanded === 'string' && !expandedSeen) {
    return REPEAT_DEEPEN_BRIDGE + intent.expanded;
  }
  return REPEAT_BRIDGES[(timesAnswered - 1) % REPEAT_BRIDGES.length] + intent.answer;
}

/* ----- Cross-visit topic memory --------------------------------------
   sessionStorage scopes the transcript to a tab; this one localStorage
   marker (a topic id + timestamp, nothing else) lets a NEW visit open
   with "welcome back — we were on X" instead of the cold greeting.
   The marker is consumed when shown so it stays a moment, not a nag. */
const LAST_TOPIC_KEY = 'lumecon:cedar:lastTopic';
const LAST_TOPIC_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function saveLastTopic(intentId: string): void {
  try {
    localStorage.setItem(LAST_TOPIC_KEY, JSON.stringify({ id: intentId, ts: Date.now() }));
  } catch {
    /* storage disabled — fine */
  }
}

function takeLastTopic(): CedarIntent | null {
  try {
    const raw = localStorage.getItem(LAST_TOPIC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; ts?: number };
    localStorage.removeItem(LAST_TOPIC_KEY);
    if (!parsed?.id || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > LAST_TOPIC_TTL_MS) return null;
    const intent = INTENTS.find((i) => i.id === parsed.id);
    return intent?.chip ? intent : null;
  } catch {
    return null;
  }
}

/* ----- DOM bootstrapping -------------------------------------------
   bootChat() finds the four required descendants under `root` and
   wires up chip click, form submit, transcript rendering. Re-running
   it on the same root is a no-op — guarded by data-cedar-booted. */

const BOTAVATAR_SVG =
  '<img src="/brand/lumecon-logo-mark-transparent.png" alt="" width="30" height="30" />';

function appendMessage(
  transcript: HTMLElement,
  variant: 'user' | 'bot',
  body: string | HTMLElement,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'cedar-msg cedar-msg--' + variant;
  if (variant === 'bot') {
    const av = document.createElement('span');
    av.className = 'cedar-msg__avatar';
    av.setAttribute('aria-hidden', 'true');
    av.innerHTML = BOTAVATAR_SVG;
    wrap.appendChild(av);
  }
  const bubble = document.createElement('div');
  bubble.className = 'cedar-msg__bubble';
  if (typeof body === 'string') {
    // Bot strings (restored history, handoff message) get the same safe
    // rich rendering as streamed replies; user strings stay textContent.
    if (variant === 'bot') bubble.innerHTML = renderRich(body);
    else bubble.textContent = body;
  } else bubble.appendChild(body);
  wrap.appendChild(bubble);
  transcript.appendChild(wrap);
  transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
  return wrap;
}

function makeTypingIndicator(): HTMLElement {
  const dots = document.createElement('span');
  dots.className = 'cedar-typing';
  dots.innerHTML = '<span></span><span></span><span></span>';
  return dots;
}

/* ----- Audience memory (#6) ----------------------------------------
   Note who the visitor says they are so follow-up suggestions can lean
   into their use case. */
const AUDIENCE_INTENT: Record<string, string> = {
  tribal: 'tribal_platform',
  city: 'county_city_use',
  state: 'state_agency_use',
  foundation: 'foundation_use',
  university: 'university_use',
  nonprofit: 'nonprofit_use',
};
const AUDIENCE_PATTERNS: Array<{ key: string; words: string[] }> = [
  { key: 'tribal', words: ['tribe', 'tribal', 'native', 'reservation', 'casino'] },
  { key: 'city', words: ['city', 'cities', 'county', 'counties', 'municipal', 'mayor', 'town'] },
  {
    key: 'state',
    words: ['state agency', 'state dot', 'legislature', 'department of', 'state of'],
  },
  {
    key: 'foundation',
    words: ['foundation', 'grantmaker', 'grantmaking', 'philanthropy', 'donor'],
  },
  { key: 'university', words: ['university', 'college', 'campus', 'higher ed'] },
  { key: 'nonprofit', words: ['nonprofit', 'non profit', 'non-profit', ' ngo', 'cdfi', 'charity'] },
];
function detectAudience(rawText: string): string | null {
  const text = ' ' + rawText.toLowerCase() + ' ';
  for (const a of AUDIENCE_PATTERNS) {
    if (a.words.some((w) => text.includes(w))) return a.key;
  }
  return null;
}

/* ----- Per-reply feedback (#7) -------------------------------------- */
const THUMB_UP_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="M7 21V9l5-6a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 17.7 21H7Zm0 0H4V9h3"/></svg>';
const THUMB_DOWN_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" style="transform:rotate(180deg)"><path d="M7 21V9l5-6a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.3 6A2 2 0 0 1 17.7 21H7Zm0 0H4V9h3"/></svg>';

function attachFeedback(bubble: HTMLElement, surface: CedarSurface): void {
  const row = document.createElement('div');
  row.className = 'cedar-feedback';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Was this answer helpful?');
  (['up', 'down'] as const).forEach((v) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cedar-feedback__btn';
    btn.setAttribute('aria-label', v === 'up' ? 'Helpful' : 'Not helpful');
    btn.innerHTML = v === 'up' ? THUMB_UP_SVG : THUMB_DOWN_SVG;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      trackEvent('cedar.feedback', { value: v, surface });
      row.querySelectorAll('button').forEach((b) => {
        (b as HTMLButtonElement).disabled = true;
      });
      btn.classList.add('is-selected');
    });
    row.appendChild(btn);
  });
  bubble.appendChild(row);
}

/* ----- Context follow-up chips (#10) -------------------------------- */
interface FollowUp {
  label: string;
  text: string;
  intent?: CedarIntent;
}
function followUpsFor(
  matched: CedarIntent | null,
  isDrillDown: boolean,
  audience: string | null,
  second: CedarIntent | null = null,
): FollowUp[] {
  const out: FollowUp[] = [];
  const push = (id: string) => {
    if (out.length >= 3) return;
    if (matched && matched.id === id) return;
    const it = INTENTS.find((x) => x.id === id);
    // Carry the intent so the click routes straight to it (its chip
    // label may not contain its own trigger phrases).
    if (it?.chip && !out.some((o) => o.text === it.chip))
      out.push({ label: it.chip, text: it.chip, intent: it });
  };
  // The other half of a compound question comes first: the visitor
  // literally just asked it.
  if (second) push(second.id);
  if (!isDrillDown && matched && typeof matched.expanded === 'string') {
    // No intent: "tell me more" routes through the drill-down path.
    out.push({ label: 'Tell me more', text: 'tell me more' });
  }
  // Bias one slot toward the visitor's stated audience (#6).
  if (audience && AUDIENCE_INTENT[audience]) push(AUDIENCE_INTENT[audience]);
  // Deepen the CURRENT topic with its own curated related questions, so the
  // next step follows what was just discussed instead of showing the same
  // demo/pricing/contact rail on every answer (which reads redundant). Only
  // fall back to the generic next steps when an intent has no related set.
  if (matched?.followUps?.length) {
    for (const id of matched.followUps) push(id);
  } else {
    for (const id of ['demo', 'pricing', 'contact']) push(id);
  }
  return out.slice(0, 3);
}

function renderFollowUps(
  transcript: HTMLElement,
  items: FollowUp[],
  onSelect: (text: string, intent?: CedarIntent) => void,
): void {
  if (!items.length) return;
  const row = document.createElement('div');
  row.className = 'cedar-followups';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Suggested next questions');
  for (const it of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cedar-followup';
    btn.textContent = it.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      row.remove();
      onSelect(it.text, it.intent);
    });
    row.appendChild(btn);
  }
  transcript.appendChild(row);
  transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
}

interface BootedElements {
  transcript: HTMLElement;
  chips: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
}

function queryEls(root: HTMLElement): BootedElements | null {
  const transcript = root.querySelector<HTMLElement>('[data-cedar-transcript]');
  const chips = root.querySelector<HTMLElement>('[data-cedar-chips]');
  const form = root.querySelector<HTMLFormElement>('[data-cedar-form]');
  const input = root.querySelector<HTMLInputElement>('[data-cedar-input]');
  if (!transcript || !chips || !form || !input) return null;
  return { transcript, chips, form, input };
}

/**
 * Wire up a Cedar chat instance rooted at `root`. Returns true if a
 * fresh boot happened, false if the root was already booted (in
 * which case the existing handlers stay live).
 */
export function bootChat(root: HTMLElement | null, opts: BootOptions): boolean {
  if (!root) return false;
  if (root.dataset.cedarBooted === '1') return false;
  const els = queryEls(root);
  if (!els) return false;
  root.dataset.cedarBooted = '1';
  // Non-null alias so closures (the idle nudge's visibility check) can
  // use it without re-narrowing.
  const panelRoot: HTMLElement = root;

  const { transcript, chips, form, input } = els;
  const conversationId = getConversationId();
  const surface = opts.surface;
  const nowMs = opts.now ?? (() => Date.now());

  const collapseChips = () => {
    if (!chips.classList.contains('is-collapsed')) chips.classList.add('is-collapsed');
  };

  /* Per-conversation memory, restored from sessionStorage so it
     survives in-tab navigation alongside the transcript:
       - priorIntent: the last substantive topic, so "tell me more"
         drills into it instead of hitting a generic answer.
       - misses: consecutive unmatched messages; after two in a row
         Cedar nudges toward a human. Persisted so a visitor who already
         saw the handoff doesn't get a second one after navigating.
       - audience: remembered use case, biasing follow-ups (#6). */
  const savedState = loadState(conversationId);
  let priorIntent: CedarIntent | null = savedState.priorIntentId
    ? (INTENTS.find((i) => i.id === savedState.priorIntentId) ?? null)
    : null;
  let misses = typeof savedState.misses === 'number' ? savedState.misses : 0;
  let audience: string | null = savedState.audience ?? null;
  const answered: string[] = Array.isArray(savedState.answered) ? savedState.answered : [];
  const expandedShown: string[] = Array.isArray(savedState.expandedShown)
    ? savedState.expandedShown
    : [];
  let nudged = savedState.nudged === true;
  const persistState = () => {
    saveState(conversationId, {
      priorIntentId: priorIntent?.id ?? null,
      misses,
      audience,
      answered: answered.slice(-60),
      expandedShown: expandedShown.slice(-60),
      nudged,
    });
  };
  const timesAnswered = (id: string) => answered.filter((a) => a === id).length;

  /* Restore the conversation: replay saved turns after the static
     welcome so reopening the panel or changing pages keeps the thread. */
  const history = loadHistory(conversationId);
  const record = (role: 'user' | 'bot', text: string) => {
    history.push({ role, text });
    saveHistory(conversationId, history);
  };
  if (history.length) {
    for (const m of history) appendMessage(transcript, m.role, m.text);
    collapseChips();
  }

  const sendMessage = async (rawText: string, echoText?: string, forcedIntent?: CedarIntent) => {
    clearIdleNudge();
    appendMessage(transcript, 'user', echoText ?? rawText);
    record('user', echoText ?? rawText);
    trackEvent('cedar.message.sent', { surface, length: rawText.length });
    const typing = appendMessage(transcript, 'bot', makeTypingIndicator());
    const startedAt = nowMs();

    // A chip (or follow-up) click is an explicit choice of intent, so
    // route straight to that intent's answer. Re-classifying the chip's
    // label is wrong: some labels (e.g. "How long does a study take?")
    // don't contain their own trigger phrases and would fall through to
    // the generic reply. Otherwise classify the free-text up-front so
    // conversation memory and the "tell me more" drill-down still work.
    const matched = forcedIntent ?? classify(rawText);
    // "Tell me more", or a plain "yes / sure" right after Cedar offered
    // to go deeper, drills into the prior topic's expanded answer so the
    // thread continues instead of replying with a generic acknowledgement.
    const isDrillDown =
      !forcedIntent &&
      (matched?.id === 'tell_me_more' || matched?.id === 'affirmative') &&
      priorIntent != null &&
      typeof priorIntent.expanded === 'string';
    let localText = forcedIntent
      ? forcedIntent.answer
      : isDrillDown
        ? priorIntent!.expanded!
        : localAnswer(rawText);
    // When the message was ambiguous, localAnswer asked the visitor to
    // clarify instead of committing, so we shouldn't record a guessed
    // topic as the conversation's "last topic". A forced intent is never
    // ambiguous and never a miss.
    const clarified = !forcedIntent && !isDrillDown && ambiguousCandidates(rawText).length >= 2;
    // Whether the *local* classifier failed to find anything. This only
    // becomes a real "miss" if the backend didn't answer either (below).
    const localMiss =
      !forcedIntent &&
      !isDrillDown &&
      !clarified &&
      topMatches(rawText).score < 1 &&
      !isOutOfScope(rawText) &&
      !fuzzyMatch(rawText);
    const aud = detectAudience(rawText);
    if (aud) audience = aud;

    // Repeat awareness: when we're about to replay an answer the visitor
    // has already seen, swap in the deeper version or an acknowledged
    // restatement instead of the verbatim paragraph.
    if (matched && localText === matched.answer) {
      const seen = timesAnswered(matched.id);
      if (seen > 0) {
        localText = repeatAnswer(matched, seen, expandedShown.includes(matched.id));
        if (
          !matched.variants?.length &&
          typeof matched.expanded === 'string' &&
          !expandedShown.includes(matched.id)
        ) {
          expandedShown.push(matched.id);
        }
      }
      answered.push(matched.id);
    }
    if (isDrillDown && priorIntent && !expandedShown.includes(priorIntent.id)) {
      expandedShown.push(priorIntent.id);
    }

    // Compound question: a strong second topic in the same message gets
    // acknowledged via the follow-up rail below.
    const second =
      !forcedIntent && !isDrillDown && !clarified && matched
        ? secondaryMatch(rawText, matched.id)
        : null;

    // Local-first: only a genuine local miss spends backend tokens. The
    // intent bank confidently covers everything else at zero cost.
    const resolved = localMiss
      ? await resolveAnswer(rawText, surface, conversationId, localText)
      : { text: localText, fromApi: false };
    const answer = resolved.text;
    // A genuine miss is when neither the backend nor the local classifier
    // produced an answer. If the API answered, it's not a miss, so we
    // don't emit cedar.unmatched or count it toward the human handoff.
    const missed = localMiss && !resolved.fromApi;

    // Let the typing indicator breathe before the reply lands. Subtract
    // any time a real API call already spent so we don't stack a second
    // pause on top of a slow backend.
    const remaining = thinkingPause(answer) - (nowMs() - startedAt);
    if (remaining > 0) await sleep(remaining);

    const bubble = typing.querySelector<HTMLElement>('.cedar-msg__bubble');
    if (bubble) await streamText(transcript, bubble, answer);
    record('bot', answer);

    // Update conversation memory: substantive topics overwrite
    // priorIntent; fillers leave it alone so "thanks" then "tell me
    // more" still drills into the topic before the thanks. Stays gated on
    // `clarified` (not the API result): when the message was locally
    // ambiguous, `matched` is only a declaration-order tie-break guess,
    // so we must not remember it as the topic even if the backend
    // answered, or a later "tell me more" drills into the wrong thing.
    if (!clarified && matched && !NON_TOPIC_INTENTS.has(matched.id)) {
      priorIntent = matched;
      // Cross-visit memory: a future visit can open with "welcome back —
      // we were on X" (see takeLastTopic at boot).
      saveLastTopic(matched.id);
    }

    const isFiller = !!(matched && NON_TOPIC_INTENTS.has(matched.id));
    // Per-reply 👍/👎 feedback on substantive answers (#7). Not gated on
    // `clarified`, so an API answer to an ambiguous question still earns
    // feedback — that's topic-independent.
    if (bubble && !isFiller && !missed) attachFeedback(bubble, surface);
    // Context-aware next-step chips on a real topic answer (#10), biased
    // toward the remembered audience (#6). Gated on `clarified` because
    // the chips are built from the local `matched` guess; rendering them
    // for a locally-ambiguous query would show off-topic chips.
    if (!clarified && !missed && (isDrillDown || (matched != null && !isFiller))) {
      renderFollowUps(transcript, followUpsFor(matched, isDrillDown, audience, second), (t, it) => {
        collapseChips();
        void sendMessage(t, t, it);
      });
    }

    // Log true misses (so the intent bank can grow from real queries)
    // and, after two in a row, hand off to a human.
    if (missed) {
      trackEvent('cedar.unmatched', { surface, text: rawText.slice(0, 120) });
      misses += 1;
      if (misses === 2) {
        const handoff =
          'I might be missing what you need, and the team can help directly. Email contact@lumecon.ai or use the contact form and a person will pick it up.';
        appendMessage(transcript, 'bot', handoff);
        record('bot', handoff);
      }
    } else {
      misses = 0;
    }

    // Persist the conversation memory (priorIntent / misses / audience)
    // so it survives navigation, matching the transcript's durability.
    persistState();

    // Re-arm the one-shot idle nudge after a clean answer (a miss
    // already triggers its own handoff path — don't pile on).
    if (!missed) armIdleNudge();
  };

  /* ----- One-shot idle nudge ----------------------------------------
     If the visitor leaves the thread hanging with the panel open,
     Cedar offers a direction — once per conversation. Armed after each
     reply, cleared on the next send. Fires only when the tab and panel
     are actually visible and the visitor isn't mid-typing; otherwise
     it retries a few times and then gives up quietly. */
  const IDLE_NUDGE_MS = 50_000;
  const IDLE_RETRY_MS = 30_000;
  const IDLE_MAX_RETRIES = 4;
  let idleTimer: number | undefined;
  let idleRetries = 0;
  function clearIdleNudge(): void {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  }
  function fireIdleNudge(): void {
    idleTimer = undefined;
    if (nudged || misses > 0) return;
    // Panel visibility: the FAB panel is position: fixed, and fixed
    // elements report offsetParent === null even when shown — so check
    // the hidden state and rendered boxes instead. Works for both the
    // FAB (hidden attribute toggled on close) and the inline surface.
    const panelShown = !panelRoot.hidden && panelRoot.getClientRects().length > 0;
    const visible = document.visibilityState === 'visible' && panelShown;
    if (!visible || input.value) {
      if (idleRetries < IDLE_MAX_RETRIES) {
        idleRetries += 1;
        idleTimer = window.setTimeout(fireIdleNudge, IDLE_RETRY_MS);
      }
      return;
    }
    nudged = true;
    persistState();
    const nudge =
      audience && AUDIENCE_INTENT[audience]
        ? 'Still here if you need me. Given your use case I can go deeper on the platform fit, pricing, or set up a demo — or just ask me anything.'
        : "Still here if you need me. The quickest next steps are usually pricing or a live demo — or describe what you're working on and I'll point you somewhere useful.";
    appendMessage(transcript, 'bot', nudge);
    record('bot', nudge);
    trackEvent('cedar.idle_nudge', { surface });
    renderFollowUps(transcript, followUpsFor(null, false, audience), (t, it) => {
      collapseChips();
      void sendMessage(t, t, it);
    });
  }
  function armIdleNudge(): void {
    clearIdleNudge();
    if (nudged) return;
    idleRetries = 0;
    idleTimer = window.setTimeout(fireIdleNudge, IDLE_NUDGE_MS);
  }

  chips.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest<HTMLElement>('.cedar-chip');
    if (!btn) return;
    const id = btn.dataset.intent;
    const intent = INTENTS.find((x) => x.id === id);
    if (!intent || !intent.chip) return;
    trackEvent('cedar.chip', { surface, intent: intent.id });
    collapseChips();
    void sendMessage(intent.chip!, intent.chip!, intent);
  });

  // "See more options": reveal the held-back starter prompts, then
  // retire the link. Keeps the opening set short while the full bank
  // stays one tap away.
  const moreBtn = root.querySelector<HTMLButtonElement>('[data-cedar-more]');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      root.querySelectorAll<HTMLElement>('.cedar-chip--extra').forEach((el) => {
        el.hidden = false;
      });
      moreBtn.hidden = true;
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input.value || '').trim();
    if (!q) return;
    input.value = '';
    collapseChips();
    void sendMessage(q);
  });

  /* Welcome back (cross-visit): a fresh conversation in a browser that
     has chatted before opens with a thread-aware line under the static
     welcome instead of a cold start. The localStorage marker is
     consumed on read, so it greets once — a moment, not a nag. */
  if (!history.length) {
    const lastTopic = takeLastTopic();
    if (lastTopic) {
      const wb = `Welcome back — last time you were asking about "${lastTopic.chip}". Want to pick that back up, or start somewhere new?`;
      appendMessage(transcript, 'bot', wb);
      record('bot', wb);
      trackEvent('cedar.welcome_back', { surface, intent: lastTopic.id });
      renderFollowUps(transcript, followUpsFor(null, false, audience, lastTopic), (t, it) => {
        collapseChips();
        void sendMessage(t, t, it);
      });
    }
  }

  // Cycle the placeholder through example prompts while the field is
  // idle and empty (skipped under reduced motion).
  if (!prefersReducedMotion()) {
    let phIdx = 0;
    window.setInterval(() => {
      if (document.activeElement === input || input.value) return;
      phIdx = (phIdx + 1) % PLACEHOLDER_EXAMPLES.length;
      input.setAttribute('placeholder', PLACEHOLDER_EXAMPLES[phIdx]);
    }, 4200);
  }

  return true;
}
