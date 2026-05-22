/**
 * Lumecon API client — typed front-end module for talking to the
 * backend that doesn't exist yet. The marketing site ships as static
 * HTML today (Astro `output: 'static'`, GitHub Pages); when the
 * application backend goes live on AWS (API Gateway + Lambda + a
 * Postgres or DynamoDB store), the surface below is the seam where
 * the rest of the site picks up real endpoints without component
 * rewrites.
 *
 * Conventions:
 *   - All exported functions return `ApiResult<T>` instead of
 *     throwing, so callers compose without try/catch noise.
 *   - The base URL comes from `import.meta.env.PUBLIC_API_URL`.
 *     Astro inlines `PUBLIC_*` env vars at build time; if it's
 *     unset, we treat the API as unavailable and the calls return
 *     `{ ok: false, reason: 'api-unconfigured' }`. Components must
 *     handle that case gracefully (e.g., the contact form falls
 *     back to mailto:).
 *   - No third-party HTTP library — just fetch + AbortController.
 *     Keeps the bundle small and the surface auditable.
 *
 * Wire-up checklist when the AWS backend lands:
 *   1. Set PUBLIC_API_URL in the deploy environment (e.g.,
 *      https://api.lumecon.ai or the CloudFront distribution).
 *   2. Extend the CSP `connect-src` directive in BaseLayout.astro
 *      to include that origin.
 *   3. Add real endpoint paths under each function (the comments
 *      mark the intended path).
 *   4. Replace the `mailto:` fallback in ContactSection.astro with
 *      a call to `submitContact(...)`.
 */

const API_BASE: string | undefined = import.meta.env.PUBLIC_API_URL;
const DEFAULT_TIMEOUT_MS = 8000;

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'api-unconfigured' | 'network' | 'timeout' | 'http' | 'parse'; status?: number; message?: string };

/** Inputs the marketing site can send to the future API. */
export interface ContactRequest {
  name: string;
  email: string;
  organization?: string;
  message: string;
  /** Origin of the request, e.g., 'home-cta' | 'join-page' | 'cedar-chat'. */
  source?: string;
}
export interface ContactResponse {
  id: string;
  receivedAt: string;
}

export interface StudyRequest {
  /** Geography level. Matches scenes.ts. */
  level: 'state' | 'county' | 'reservation';
  /** 2-digit FIPS for state/county. */
  state?: string;
  /** 5-digit FIPS for county studies. */
  countyFips?: string;
  /** Lookup key for reservation studies. */
  tribalKey?: string;
  /** Project descriptor. */
  projectName: string;
  /** Dollar amount in whole USD. */
  amountUsd: number;
  /** Activity profile id matching ACT in scenes.ts. */
  activityId: string;
}
export interface StudyResponse {
  studyId: string;
  direct: number;
  indirect: number;
  induced: number;
  total: number;
  jobs: number;
  /** ISO 8601. */
  computedAt: string;
}

export interface CedarChatRequest {
  /** The visitor's message. */
  message: string;
  /** Stable id for this browser session so the backend can keep
   *  per-conversation context. Generated client-side, persisted in
   *  sessionStorage. The marketing-site Cedar is anonymous; the
   *  authenticated app Cedar will swap this for a user-scoped id. */
  conversationId: string;
  /** Where the message came from — 'fab' | 'inline'. Useful for
   *  analytics and for the backend to tune answer length. */
  surface?: 'fab' | 'inline';
}
export interface CedarChatResponse {
  /** The assistant's reply, plain text or limited markdown. */
  answer: string;
  /** Optional citations / source records the answer pulled from
   *  (populated when the RAG pipeline is live). */
  sources?: Array<{ title: string; url?: string }>;
  /** Optional follow-up suggestion chips the UI can render. */
  followUps?: string[];
}

/** Authentication requests/responses. The marketing-site login and
 *  signup pages are placeholders today; when the AWS backend ships,
 *  the same forms post here and the response token is handed off to
 *  the authenticated app (a separate origin). */
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  /** Session token / JWT — opaque to the front-end. */
  token: string;
  /** ISO 8601 token expiry. */
  expiresAt: string;
  /** Authenticated user info for greeting / role-based UI. */
  user: { id: string; name: string; email: string; orgId?: string };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  organization?: string;
  /** Free text describing the role / use case; drives onboarding. */
  role?: string;
}
export interface SignupResponse {
  user: { id: string; name: string; email: string };
  /** Whether the signup flow requires email verification before the
   *  user can log in. The marketing-site form branches on this. */
  emailVerificationRequired: boolean;
}

/* ---------- internals ---------- */

const isConfigured = (): boolean => typeof API_BASE === 'string' && API_BASE.length > 0;

const request = async <T>(path: string, init: RequestInit): Promise<ApiResult<T>> => {
  if (!isConfigured()) return { ok: false, reason: 'api-unconfigured' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers ?? {}) },
    });
    if (!res.ok) return { ok: false, reason: 'http', status: res.status, message: res.statusText };
    let data: T;
    try { data = (await res.json()) as T; }
    catch { return { ok: false, reason: 'parse' }; }
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    return { ok: false, reason: isAbort ? 'timeout' : 'network', message };
  } finally {
    clearTimeout(timer);
  }
};

/* ---------- endpoints ---------- */

/** Submit a contact form. Future endpoint: `POST /v1/contact`. */
export const submitContact = (req: ContactRequest): Promise<ApiResult<ContactResponse>> =>
  request<ContactResponse>('/v1/contact', { method: 'POST', body: JSON.stringify(req) });

/** Run an impact study. Future endpoint: `POST /v1/studies`. */
export const runStudy = (req: StudyRequest): Promise<ApiResult<StudyResponse>> =>
  request<StudyResponse>('/v1/studies', { method: 'POST', body: JSON.stringify(req) });

/** Fetch a previously run study by id. Future endpoint: `GET /v1/studies/:id`. */
export const getStudy = (studyId: string): Promise<ApiResult<StudyResponse>> =>
  request<StudyResponse>(`/v1/studies/${encodeURIComponent(studyId)}`, { method: 'GET' });

/** Send a message to the Cedar chat backend. Future endpoint:
 *  `POST /v1/cedar/chat`. The marketing-site Cedar falls back to its
 *  local keyword classifier when this returns 'api-unconfigured' or
 *  any error reason. */
export const cedarChat = (req: CedarChatRequest): Promise<ApiResult<CedarChatResponse>> =>
  request<CedarChatResponse>('/v1/cedar/chat', { method: 'POST', body: JSON.stringify(req) });

/** Submit a login. Future endpoint: `POST /v1/auth/login`. The
 *  marketing-site /login page renders the friendly "auth not yet
 *  live" message when this returns 'api-unconfigured'. */
export const submitLogin = (req: LoginRequest): Promise<ApiResult<LoginResponse>> =>
  request<LoginResponse>('/v1/auth/login', { method: 'POST', body: JSON.stringify(req) });

/** Submit a signup. Future endpoint: `POST /v1/auth/signup`. Same
 *  graceful fallback as submitLogin when the backend isn't wired. */
export const submitSignup = (req: SignupRequest): Promise<ApiResult<SignupResponse>> =>
  request<SignupResponse>('/v1/auth/signup', { method: 'POST', body: JSON.stringify(req) });

/* ---------- env helpers ---------- */

/** Lets components check whether the backend is wired up without
 *  duplicating the env-var name across the codebase. */
export const apiConfigured = isConfigured;
