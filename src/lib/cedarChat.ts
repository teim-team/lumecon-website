/**
 * Cedar chat runtime.
 *
 * Single source of truth for the conversation logic shared by both
 * Cedar surfaces: the inline chat in the homepage Cedar section
 * (FAQSection.astro) and the floating panel popped by the persistent
 * Cedar FAB (CedarFAB.astro).
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
 *   - Static <details> FAQ fallback for no-JS visitors (still
 *     rendered by FAQSection)
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

/* ----- Local keyword classifier ------------------------------------
   The same scoring rules the inline scripts used, lifted out so
   there's one implementation to debug and improve. */
function normalize(s: string): string {
  return ' ' + (s || '').toLowerCase()
    .replace(/[?!.,;:"'`()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() + ' ';
}

export function classify(rawText: string): CedarIntent | null {
  const text = normalize(rawText);
  if (text.trim() === '') return null;
  let best: CedarIntent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const trig of intent.triggers) {
      const norm = normalize(trig);
      if (norm.trim() === '') continue;
      if (text.indexOf(norm) !== -1) {
        // Longer phrases beat single-word hits.
        score += Math.max(1, norm.trim().split(' ').length);
      }
    }
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  return bestScore >= 1 ? best : null;
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

export function localAnswer(rawText: string): string {
  const intent = classify(rawText);
  if (intent) return intent.answer;
  if (isOutOfScope(rawText)) return OUT_OF_SCOPE_ANSWER;
  return FALLBACK_ANSWER;
}

/* ----- API-first / local-fallback resolver -------------------------
   When PUBLIC_API_URL is set and the Cedar endpoint responds OK, use
   its answer. Otherwise fall back to the local classifier. Either
   way the visitor gets a sensible reply — the seam is invisible. */
async function resolveAnswer(
  message: string,
  surface: CedarSurface,
  conversationId: string,
  localFallback: string,
): Promise<string> {
  if (!apiConfigured()) return localFallback;
  try {
    const result = await cedarChatApi({ message, surface, conversationId });
    if (result.ok) {
      trackEvent('cedar.api.success', { surface });
      return result.data.answer || localFallback;
    }
    trackEvent('cedar.api.fallback', { surface, reason: result.reason });
    return localFallback;
  } catch (err: unknown) {
    trackError(err, { where: 'cedarChat.resolveAnswer', surface });
    return localFallback;
  }
}

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
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 3 L8 9 L10 9 L7 14 L9.5 14 L5 20 L19 20 L14.5 14 L17 14 L14 9 L16 9 Z" fill="currentColor"/></svg>';

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

/**
 * Render inline follow-up chips beneath a bot message so the user can
 * keep the conversation moving without typing. Chips delegate via the
 * provided onSelect — typically `sendMessage(intent.chip)` — and self-
 * destruct on click so the transcript stays clean.
 */
function renderFollowUps(
  transcript: HTMLElement,
  followUpIds: string[] | undefined,
  onSelect: (intent: CedarIntent) => void,
): void {
  if (!followUpIds || followUpIds.length === 0) return;
  const items = followUpIds
    .map((id) => INTENTS.find((x) => x.id === id))
    .filter((x): x is CedarIntent => !!x && !!x.chip);
  if (items.length === 0) return;
  const row = document.createElement('div');
  row.className = 'cedar-followups';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Suggested follow-ups');
  for (const intent of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cedar-chip cedar-chip--followup';
    btn.dataset.intent = intent.id;
    btn.textContent = intent.chip!;
    btn.addEventListener('click', (e) => {
      // Stop the click from reaching any outside-click handlers
      // (e.g. CedarFAB's panel close), and defer the row removal
      // until the current event loop finishes so the click target
      // stays attached for any other listeners walking the DOM.
      e.stopPropagation();
      onSelect(intent);
      setTimeout(() => row.remove(), 0);
    });
    row.appendChild(btn);
  }
  transcript.appendChild(row);
  transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
}

function makeTypingIndicator(): HTMLElement {
  const dots = document.createElement('span');
  dots.className = 'cedar-typing';
  dots.innerHTML = '<span></span><span></span><span></span>';
  return dots;
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

  const collapseChips = () => {
    if (!chips.classList.contains('is-collapsed')) chips.classList.add('is-collapsed');
  };

  /* Per-conversation memory: tracks the last substantive topic so a
     follow-up like "tell me more" can drill into it instead of hitting
     a generic answer. Cleared when the user starts a new topic. */
  let priorIntent: CedarIntent | null = null;

  const sendMessage = async (rawText: string, echoText?: string) => {
    appendMessage(transcript, 'user', echoText ?? rawText);
    trackEvent('cedar.message.sent', { surface, length: rawText.length });
    const typing = appendMessage(transcript, 'bot', makeTypingIndicator());

    // Classify locally up-front so we can wire conversation memory
    // and follow-ups regardless of whether the API or the local
    // classifier ends up answering.
    const matched = classify(rawText);
    const isDrillDown =
      matched?.id === 'tell_me_more' &&
      priorIntent != null &&
      typeof priorIntent.expanded === 'string';

    let localFallback: string;
    let followUpSource: CedarIntent | null;
    if (isDrillDown) {
      localFallback = priorIntent!.expanded!;
      followUpSource = priorIntent;
    } else {
      localFallback = localAnswer(rawText);
      followUpSource = matched;
    }

    const answer = await resolveAnswer(rawText, surface, conversationId, localFallback);
    const bubble = typing.querySelector<HTMLElement>('.cedar-msg__bubble');
    if (bubble) bubble.textContent = answer;

    // Update conversation memory: substantive topics overwrite
    // priorIntent; fillers leave it alone so "thanks" → "tell me
    // more" still drills into the topic before the thanks.
    if (matched && !NON_TOPIC_INTENTS.has(matched.id)) {
      priorIntent = matched;
    }

    // If the responding intent has an `expanded` field (and we
    // didn't just deliver it via "tell me more"), prepend a
    // "Tell me more" chip so the visitor can drill in without
    // having to discover the trigger phrase.
    let followUpIds = followUpSource?.followUps;
    if (!isDrillDown && followUpSource?.expanded && followUpIds) {
      followUpIds = ['tell_me_more', ...followUpIds.filter((id) => id !== 'tell_me_more')];
    }
    renderFollowUps(transcript, followUpIds, (intent) => {
      void sendMessage(intent.chip!, intent.chip!);
    });
  };

  chips.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest<HTMLElement>('.cedar-chip');
    if (!btn) return;
    const id = btn.dataset.intent;
    const intent = INTENTS.find((x) => x.id === id);
    if (!intent || !intent.chip) return;
    collapseChips();
    void sendMessage(intent.chip, intent.chip);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input.value || '').trim();
    if (!q) return;
    input.value = '';
    collapseChips();
    void sendMessage(q);
  });

  return true;
}
