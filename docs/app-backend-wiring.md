# Wiring this site's sign-in to the app backend

Measured 2026-09-20 against `teim-app@main` and this repository at
`ffb6196`. Four claims in the first draft of this note were wrong; Codex
caught them on #345 and they are corrected below. The corrections matter,
because they change what "deploy `teim-app` and you're done" actually means.

## Sign-in is wired. Sign-*up* is not.

| Page | What it posts | Wired to `teim-app`? |
| --- | --- | --- |
| `/login` | `POST /auth/login` | **Yes** |
| `/login` (forgot) | `POST /auth/password-reset-request` | **Yes** |
| `/login` (reset) | `POST /auth/password-reset` | **Yes** |
| `/login` (Google) | `GET /auth/google` | Yes, but see below |
| `/signup` | `POST /v1/contact` | **No — and deliberately so** |

`src/lib/api.ts` does export `submitSignup`, pointed at `/auth/register` with
a request shape matching the product's contract. **Nothing calls it.**
`/signup` is the private-beta request page: it collects no password, and its
submit handler calls `submitContact`. Its own header says why —

> Lumecon is in closed beta, so this page deliberately creates no account and
> sets no password: a visitor cannot enter the app from here yet. What it does
> is capture who is asking and what they want to measure, so the team can
> reach out with access.

So **deploying `teim-app` cannot by itself turn on public account creation.**
That takes a change to this site: point the form at `submitSignup`, add a
password field, and honour the reconciliation the page already queues —
hand off to (or embed) teim-app's `AuthGate` so there is one account surface,
one password policy and one session.

## The origins resolve themselves

Since #344 the deploy resolves the production origins rather than waiting on a
repository variable:

```js
export const PRODUCTION_APP_ORIGIN = "https://app.lumecon.ai";
export const PRODUCTION_API_ORIGIN = "https://api.lumecon.ai";
```

So the live build already posts to `https://api.lumecon.ai/auth/login`, and no
repository variable needs setting. The CSP follows automatically:
`BaseLayout.astro` derives `connect-src` from the same `PUBLIC_API_URL`, and
`sync-headers-csp.mjs` asserts `dist` really carries both origins.

One consequence worth noticing: because `PUBLIC_API_URL` is now *always*
present, the Google button on `/login` is now *always* shown.

## What is outstanding

**1. `api.lumecon.ai` has to answer.** `teim-app`'s production deploy has run
once, ever — run 1, attempt 3, 2026-08-28, branch `v1.0.1`, merging #143
("Put the app on app.lumecon.ai") — and it failed. `deploy-dev.yml` succeeds
on every push to main, so dev is current and prod has never shipped.

**2. `ALLOWED_ORIGINS` must name this site exactly.** The CORS check is an
exact string match:

```js
callback(null, ALLOWED_ORIGINS.has(origin));   // teim-app server/index.js
```

It needs `https://lumecon.ai` verbatim, plus `https://www.lumecon.ai` if the
www host serves rather than redirects. No trailing slash, no wildcard.

*How this fails, precisely:* the fetch sends `credentials: 'include'`, so a
rejected preflight — or a credentialed response without
`Access-Control-Allow-Credentials` — makes `fetch` **reject**. `api.ts`
returns `{ ok: false, reason: 'network' }` and `/login` renders a sign-in
failure. It does **not** produce a login that appears to succeed. Troubleshoot
this as a failed request, not as a cookie that went missing.

**3. `AUTH_ALLOWLIST_EMAILS` must be empty before public signup works.** If
production keeps the pilot lockdown, `/auth/register` returns **403** to
public registrants even with everything above in place. `AGENTS.md` states
this as a standing prerequisite. (This only bites once signup is actually
wired — see the first section — but it is the kind of thing found at the worst
possible moment.)

**4. Google OAuth needs its *callback* registered, or the button is dead.**
`/login` links "Continue with Google" to `${PUBLIC_API_URL}/auth/google`, and
that button is now unconditionally visible.

Register the **callback URI the API generates**, not this site's origin. The
button performs a top-level navigation away to the API, so Google never sees
`lumecon.ai` — it sees whatever `teim-app` sends as `redirect_uri`. That value
comes from `GOOGLE_REDIRECT_URI` (`teim-app/server/auth.js`) and the route that
receives it is `/auth/google/callback` (`teim-app/server/index.js`). So the
authorized redirect URI in the Google console must be that exact callback, e.g.
`https://api.lumecon.ai/auth/google/callback`.

Read the deployed `GOOGLE_REDIRECT_URI` and register precisely that string.
Registering `https://lumecon.ai` instead leaves the button dead while looking
configured. `README.md` still lists the Google OAuth origin among the
founder-owned launch blockers.

## One thing not to "fix"

`serializeSessionCookie` in `teim-app/server/auth.js` sets `SameSite=Lax`.
**That is correct and should stay.** SameSite is judged on the registrable
domain, so `lumecon.ai`, `api.lumecon.ai` and `app.lumecon.ai` are all
same-site despite being three different origins.

This *is* where a silently-missing session would come from, if it came from
anywhere: were the API moved off `lumecon.ai` — onto
`*.execute-api.us-east-1.amazonaws.com` or a bare `*.cloudfront.net` — those
are cross-site, the browser would drop the cookie, and the sign-in would look
like it worked. Keeping the API on `api.lumecon.ai` avoids the question. If it
ever moves, the cookie needs `SameSite=None; Secure`.

## Order of operations

**To make sign-in work.** Needs no website change, and none of it exposes
account creation:

1. Land `teim-app`'s production deploy so `api.lumecon.ai` answers.
2. Set `ALLOWED_ORIGINS` on that server to include `https://lumecon.ai`.
3. Register the Google callback URI (item 4 above) — the API's
   `/auth/google/callback`, not this site's origin.
4. Sign in at lumecon.ai/login and confirm the browser keeps `teim_session` and
   the redirect to app.lumecon.ai lands signed in.

**To make sign-up work.** This is *not* a form swap, and the sequence matters.

`AUTH_ALLOWLIST_EMAILS` is the only thing currently stopping public account
creation, and CORS does not help here — CORS constrains browsers, not a direct
API client. So clearing it opens `/auth/register` to the whole internet the
moment it is cleared, whatever this website is showing. **Clear it last, at
cutover, coordinated with the website deploy — never as a preparatory step.**

Before that cutover, three things have to exist:

5. **Acceptance mechanics. This is a launch blocker, not a detail.**
   `docs/reconciliation-roadmap.md` records real Terms and Privacy as a P0
   blocked on counsel, and item 2 of its legal list spells out what activates
   with registration: an attestation checkbox (18+, authority to bind the
   organization), the agree/acknowledge clause, and **server-side version,
   timestamp and method records** stored by the register endpoint. The signup
   form carries none of these today, because it is a beta-access request.
   Rewiring to `/auth/register` without them creates customer accounts with no
   acceptance record. Item 9 of the same list (the 18+ representation) rides on
   the same checkbox.
6. **The post-registration flow, not just the API call.** The current handler,
   on success, shows *"Thanks, you are on the list. Someone from the team will
   reach out with your access."*, calls `form.reset()` and `resetConditionalUi()`,
   and returns. Swap only the call and a real account gets created while the
   visitor is told to wait for outreach and left on a blank `/signup`. The
   success copy has to be replaced and the visitor routed by tier — signup →
   checkout → welcome, per `AGENTS.md`. (Note that signup does not transmit the
   tier to the server: every self-serve account starts Free and paid tiers land
   with billing. The tier only routes the visitor.)
7. **Then** the form itself: point it at `submitSignup`, add the password field,
   or take the hand-off the page already queues and embed teim-app's `AuthGate`
   so there is one account surface, one password policy and one session.
8. **Only now** clear `AUTH_ALLOWLIST_EMAILS`, released together with the
   website deploy that ships 5–7.

## What could not be verified

Whether `api.lumecon.ai` resolves today. The sandbox this was written in has
no outbound network and failed identically against hosts known to be live.
Check it from a real machine.
