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

**4. Google OAuth needs its origin configured, or the button is dead.**
`/login` links "Continue with Google" to `${PUBLIC_API_URL}/auth/google`, and
that button is now unconditionally visible. `README.md` still lists "Google
OAuth origin for the website signup" among the founder-owned launch blockers.
Verify `GET /auth/google` answers and the OAuth origin includes
`https://lumecon.ai` — otherwise the most prominent control on the sign-in
page leads nowhere.

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

**To make sign-in work** (no website change needed):

1. Land `teim-app`'s production deploy so `api.lumecon.ai` answers.
2. Set `ALLOWED_ORIGINS` on that server to include `https://lumecon.ai`.
3. Configure the Google OAuth origin, or the SSO button is a dead path.
4. Sign in at lumecon.ai/login and confirm the browser keeps `teim_session`
   and the redirect to app.lumecon.ai lands signed in.

**To make sign-up work** (this *does* need a website change):

5. Clear `AUTH_ALLOWLIST_EMAILS` on the app server.
6. Rewire `/signup` to `submitSignup`, or replace both pages with teim-app's
   `AuthGate`. The fields here already mirror the product's registration
   profile, so it is a swap rather than a rewrite.

## What could not be verified

Whether `api.lumecon.ai` resolves today. The sandbox this was written in has
no outbound network and failed identically against hosts known to be live.
Check it from a real machine.
