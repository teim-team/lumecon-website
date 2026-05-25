/**
 * Cedar chat runtime.
 *
 * Conversation logic for the persistent Cedar FAB (CedarFAB.astro).
 * The FAB is the only Cedar chat surface today; an earlier homepage
 * inline-chat section was removed, but bootChat() is still written
 * surface-agnostic so a second surface can be added without
 * touching this module.
 *
 * What this module owns:
 *   - Conversation state (transcript, quick-reply chip collapse)
 *   - Message classification + answer resolution
 *   - Optional Cedar API call with graceful fallback to the local
 *     keyword classifier (production-ready seam — when the backend
 *     ships, no component changes required)
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
  const c: Crypto | undefined =
    typeof crypto !== 'undefined' ? crypto : undefined;
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
  return ' ' + (s || '').toLowerCase()
    .replace(/[?!.,;:"'`()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() + ' ';
}

export interface IntentMatch {
  /** Highest trigger-match score across all intents (0 = no match). */
  score: number;
  /** All intents that tie for that top score, in declaration order.
   *  More than one means the message is ambiguous. */
  intents: CedarIntent[];
}

/* Score every intent by its trigger hits (longer phrases weigh more)
   and return the top-scoring intents. Exposing the tie set lets the
   runtime ask the visitor to clarify when confidence is low instead of
   committing to a guess. */
export function topMatches(rawText: string): IntentMatch {
  const text = normalize(rawText);
  if (text.trim() === '') return { score: 0, intents: [] };
  const scored: Array<{ intent: CedarIntent; score: number }> = [];
  let best = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const trig of intent.triggers) {
      const norm = normalize(trig);
      if (norm.trim() === '') continue;
      // Longer phrases beat single-word hits.
      if (text.indexOf(norm) !== -1) score += Math.max(1, norm.trim().split(' ').length);
    }
    if (score > 0) {
      scored.push({ intent, score });
      if (score > best) best = score;
    }
  }
  return { score: best, intents: scored.filter((s) => s.score === best).map((s) => s.intent) };
}

/* True if a and b differ by at most one insertion, deletion, or
   substitution. Bounded and cheap — used only as a typo fallback. */
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

/* When nothing matches exactly, try a conservative typo pass: a user
   word (>= 5 chars) within one edit of a single-word trigger (>= 5
   chars). Catches "pricng" / "trbal" without hurting precision. */
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

/** Substantive (chip-bearing) intents tied at the top score. Length >= 2
 *  means the message is ambiguous enough to clarify. */
function ambiguousCandidates(rawText: string): CedarIntent[] {
  const { score, intents } = topMatches(rawText);
  if (score < 1) return [];
  const substantive = intents.filter((i) => i.chip);
  return substantive.length >= 2 ? substantive : [];
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
  if (score >= 1 && candidates.length >= 2) return clarifyPrompt(candidates);
  if (score >= 1) return intents[0].answer;
  const fuzzy = fuzzyMatch(rawText);
  if (fuzzy) return fuzzy.answer;
  return FALLBACK_ANSWER;
}

/* ----- API-first / local-fallback resolver -------------------------
   When PUBLIC_API_URL is set and the Cedar endpoint responds OK, use
   its answer. Otherwise fall back to the local classifier. Either
   way the visitor gets a sensible reply — the seam is invisible.

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
    trackEvent('cedar.api.fallback', { surface, reason: result.ok ? 'empty-answer' : result.reason });
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
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function thinkingPause(answer: string): number {
  if (prefersReducedMotion()) return 200;
  return Math.min(1800, Math.max(700, 480 + answer.length * 4));
}

/* Reveal a reply word-by-word so it reads as Cedar composing rather
   than a block of text snapping in. Instant under reduced motion. */
async function streamText(transcript: HTMLElement, bubble: HTMLElement, text: string): Promise<void> {
  if (prefersReducedMotion()) { bubble.textContent = text; return; }
  const tokens = text.split(/(\s+)/);
  const perWord = tokens.length > 90 ? 8 : 15;
  bubble.textContent = '';
  // The transcript is an aria-live log; mark it busy while we append
  // word-by-word so a screen reader announces the finished answer once
  // (on busy → false) instead of reading every partial token (#64).
  transcript.setAttribute('aria-busy', 'true');
  try {
    for (const tok of tokens) {
      bubble.textContent += tok;
      transcript.scrollTo({ top: transcript.scrollHeight });
      if (tok.trim()) await sleep(perWord);
    }
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

/* ----- DOM bootstrapping -------------------------------------------
   bootChat() finds the four required descendants under `root` and
   wires up chip click, form submit, transcript rendering. Re-running
   it on the same root is a no-op — guarded by data-cedar-booted. */

const BOTAVATAR_SVG =
  '<img src="/brand/lumecon-logo-mark-transparent.png" alt="" width="18" height="18" />';

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
  if (typeof body === 'string') bubble.textContent = body;
  else bubble.appendChild(body);
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
  { key: 'state', words: ['state agency', 'state dot', 'legislature', 'department of', 'state of'] },
  { key: 'foundation', words: ['foundation', 'grantmaker', 'grantmaking', 'philanthropy', 'donor'] },
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
      row.querySelectorAll('button').forEach((b) => { (b as HTMLButtonElement).disabled = true; });
      btn.classList.add('is-selected');
    });
    row.appendChild(btn);
  });
  bubble.appendChild(row);
}

/* ----- Context follow-up chips (#10) -------------------------------- */
interface FollowUp { label: string; text: string; intent?: CedarIntent }
function followUpsFor(
  matched: CedarIntent | null,
  isDrillDown: boolean,
  audience: string | null,
): FollowUp[] {
  const out: FollowUp[] = [];
  const push = (id: string) => {
    if (out.length >= 3) return;
    if (matched && matched.id === id) return;
    const it = INTENTS.find((x) => x.id === id);
    // Carry the intent so the click routes straight to it (its chip
    // label may not contain its own trigger phrases).
    if (it?.chip && !out.some((o) => o.text === it.chip)) out.push({ label: it.chip, text: it.chip, intent: it });
  };
  if (!isDrillDown && matched && typeof matched.expanded === 'string') {
    // No intent: "tell me more" routes through the drill-down path.
    out.push({ label: 'Tell me more', text: 'tell me more' });
  }
  if (audience && AUDIENCE_INTENT[audience]) push(AUDIENCE_INTENT[audience]);
  for (const id of ['demo', 'pricing', 'contact']) push(id);
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
  let priorIntent: CedarIntent | null =
    savedState.priorIntentId ? (INTENTS.find((i) => i.id === savedState.priorIntentId) ?? null) : null;
  let misses = typeof savedState.misses === 'number' ? savedState.misses : 0;
  let audience: string | null = savedState.audience ?? null;
  const persistState = () => {
    saveState(conversationId, { priorIntentId: priorIntent?.id ?? null, misses, audience });
  };

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
    const localFallback = forcedIntent
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
    const localMiss = !forcedIntent && !isDrillDown && !clarified && topMatches(rawText).score < 1 && !isOutOfScope(rawText) && !fuzzyMatch(rawText);
    const aud = detectAudience(rawText);
    if (aud) audience = aud;

    const resolved = await resolveAnswer(rawText, surface, conversationId, localFallback);
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
      renderFollowUps(transcript, followUpsFor(matched, isDrillDown, audience), (t, it) => {
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
        const handoff = 'I might be missing what you need, and the team can help directly. Email contact@lumecon.ai or use the contact form and a person will pick it up.';
        appendMessage(transcript, 'bot', handoff);
        record('bot', handoff);
      }
    } else {
      misses = 0;
    }

    // Persist the conversation memory (priorIntent / misses / audience)
    // so it survives navigation, matching the transcript's durability.
    persistState();
  };

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
