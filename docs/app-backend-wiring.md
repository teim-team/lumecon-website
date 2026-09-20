# Wiring this site's sign-in to the app backend

Measured 2026-09-20 against `teim-app@main` and this repository at
`64b7c7d` (deploy run 330).

There are two sign-in *pages*, but only one auth *system*, and this side of it
is already wired. `src/lib/api.ts` posts to the paths `teim-app` actually
serves, and since #344 the deploy resolves the production origins itself. No
code change and no repository variable is needed here. Everything still
outstanding is on the `teim-app` side of the boundary.

## What this site already does

| This site sends | `teim-app` serves |
| --- | --- |
| `POST /auth/login` | `POST /auth/login` |
| `POST /auth/register` | `POST /auth/register` |
| `POST /auth/password-reset-request` | `POST /auth/password-reset-request` |
| `POST /auth/password-reset` | `POST /auth/password-reset` |

The request shapes match too: `/auth/register` takes one `name` plus
email/password/organization/role/organizationType, which is the `SignupRequest`
interface in `api.ts`.

`deploy.yml` resolves `PUBLIC_API_URL` and `PUBLIC_APP_URL` once into the job
environment, falling back to the values in `check-public-origins.mjs` when the
repository variables are unset:

```js
export const PRODUCTION_APP_ORIGIN = "https://app.lumecon.ai";
export const PRODUCTION_API_ORIGIN = "https://api.lumecon.ai";
```

So the live build already posts to `https://api.lumecon.ai/auth/login` and
already sends a signed-in visitor to `https://app.lumecon.ai`. Setting the
repository variables would override those; it is not required, and a variable
that is set but malformed still fails the job — the fallback covers "unset",
never "wrong".

The CSP needs no editing either. `BaseLayout.astro` derives `connect-src` from
the same `PUBLIC_API_URL`, and `sync-headers-csp.mjs` asserts `dist` really
carries both origins rather than silently falling back.

## What is outstanding, all of it in `teim-app`

**1. `api.lumecon.ai` has to exist and serve the app.**

`teim-app`'s production deploy has run once, ever: run 1, attempt 3, on
2026-08-28, on branch `v1.0.1`, merging #143 ("Put the app on app.lumecon.ai").
It failed. `deploy-dev.yml` succeeds on pushes to `main`, so dev is current and
prod has never shipped. Until that lands, this site is posting credentials at a
host that may not answer — which the login page reports as a network error, not
as a misconfiguration.

(Whether `api.lumecon.ai` resolves today is not something this note can settle:
the sandbox it was written in has no outbound network, so every host it tried
failed identically, including ones known to be live. Check it from a real
machine.)

**2. `ALLOWED_ORIGINS` must name this site exactly.**

The CORS check is an exact string match against a `Set` built from that
environment variable:

```js
callback(null, ALLOWED_ORIGINS.has(origin));   // teim-app server/index.js
```

It must contain `https://lumecon.ai` verbatim, plus `https://www.lumecon.ai` if
the www host serves rather than redirects. No trailing slash, no wildcard —
neither will match. Without it the browser blocks every auth call at the
preflight, before `teim-app` sees a request.

This matters more than it looks, because the fetch sends
`credentials: 'include'`. The app authenticates with an HttpOnly `teim_session`
cookie, and a cross-origin response whose CORS headers do not permit
credentials has its `Set-Cookie` discarded — a login that appears to succeed and
leaves no session.

## One thing not to "fix"

`serializeSessionCookie` in `teim-app/server/auth.js` sets `SameSite=Lax`. That
is correct here and should stay. SameSite is judged on the registrable domain,
so `lumecon.ai`, `api.lumecon.ai` and `app.lumecon.ai` are all same-site even
though they are three different origins, and the cookie travels normally.

It would only break if the API moved off `lumecon.ai` — onto
`*.execute-api.us-east-1.amazonaws.com` or a bare `*.cloudfront.net`, say. Those
are cross-site, the browser drops the cookie, and sign-in fails in a way that
reads like a backend bug. If the API ever moves, the cookie needs
`SameSite=None; Secure`, which is a `teim-app` change. Keeping it on
`api.lumecon.ai` avoids the question.

## Order of operations

1. Land `teim-app`'s production deploy so `api.lumecon.ai` answers.
2. Set `ALLOWED_ORIGINS` on that server to include `https://lumecon.ai`.
3. Sign in at lumecon.ai/login. Confirm the browser keeps `teim_session` and the
   redirect to app.lumecon.ai lands signed in rather than back at the door.

Nothing in this repository is a step in that list.
