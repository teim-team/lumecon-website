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

**2. `ALLOWED_ORIGINS` must name every calling origin exactly.** The CORS
check is an exact string match:

```js
callback(null, ALLOWED_ORIGINS.has(origin));   // teim-app server/index.js
```

It needs `https://lumecon.ai` verbatim, plus `https://www.lumecon.ai` if the
www host serves rather than redirects. No trailing slash, no wildcard.

**And it needs `https://app.lumecon.ai`.** The set has no defaults, and the
whole expression matters:

```js
// teim-app server/index.js:152
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
);
```

It contains exactly what is configured and nothing else — but it **does** trim,
so `https://lumecon.ai, https://app.lumecon.ai` with a space after the comma is
fine. (An earlier draft of this note quoted only the `.split(",")` and a review
reasonably read that as "no trimming", which would have made the spaced value
look broken. The abbreviation was the fault, not the guidance.) After the redirect, the browser sitting on
`app.lumecon.ai` makes its own credentialed requests to `api.lumecon.ai`, under
its own `Origin`, through the same exact-match check. An allowlist naming only
this site lets the marketing-site login succeed and then blocks the product's
first request, and the visitor arrives *signed out* — which reads as a broken
session and sends troubleshooting to the cookie, not the allowlist. Harmless to
include if the app turns out to be same-origin with the API: teim-app's client
defaults `VITE_API_URL` to `""`, and a same-origin request sends no `Origin` at
all.

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
2. Set `ALLOWED_ORIGINS` on that server to **every browser origin that will
   call it** — `https://lumecon.ai` *and* `https://app.lumecon.ai`, per the
   section above. Not just this site.
3. Register the Google callback URI (outstanding item 4) — the API's
   `/auth/google/callback`, not this site's origin. **And restrict it to
   existing accounts until the sign-up cutover.** A new Google identity going
   through that callback *creates an account*, and it creates one that never
   passed the attestation checkbox or the acceptance record in step 6 — which
   does not exist yet at this point in the sequence. `README.md:633-636`
   classifies Google OAuth as a website-signup launch blocker for this reason.
   So either the callback refuses unknown identities until step 10, or new
   Google users are routed through the same acceptance flow before it is
   enabled. Enabling it here as a convenience for sign-in quietly opens
   account creation without the record.
4. **Provision mail here, not in the sign-up checklist.** "Forgot password?" is
   part of signing in, and it runs on the delivery path that step 8 describes.
   `/auth/password-reset-request` calls `mailer.sendPasswordResetEmail` and then
   returns

   ```js
   { ok: true, message: "If that email has an account, a reset link is on its way." }
   ```

   **unconditionally** — the response is identical whether or not the address
   exists, deliberately, so the endpoint cannot be used to probe for accounts.
   The mailer no-ops when `EMAIL_DELIVERY` is unset. So `/login` tells the
   visitor a link is on its way the moment that 200 lands, and steps 1-3 can all
   pass while password recovery is dead for every locked-out subscriber, with
   nothing anywhere reporting it. Needs `EMAIL_DELIVERY=ses`,
   `PASSWORD_RESET_BASE_URL`, a sender verified in SES, and `ses:SendEmail` on
   the task role.
5. Sign in at lumecon.ai/login and confirm the browser keeps `teim_session` and
   the redirect to app.lumecon.ai lands signed in — **then run one real
   forgot-password round trip to an inbox you control.** A 200 from the endpoint
   is not evidence; the endpoint returns 200 when nothing was sent.

**To make sign-up work.** This is *not* a form swap, and the sequence matters.

`AUTH_ALLOWLIST_EMAILS` is the only thing currently stopping public account
creation, and CORS does not help here — CORS constrains browsers, not a direct
API client. So clearing it opens `/auth/register` to the whole internet the
moment it is cleared, whatever this website is showing. **Clear it last, at
cutover, coordinated with the website deploy — never as a preparatory step.**

Before that cutover, three things have to exist:

6. **Acceptance mechanics. This is a launch blocker, not a detail.**
   `docs/reconciliation-roadmap.md` records real Terms and Privacy as a P0
   blocked on counsel, and item 2 of its legal list spells out what activates
   with registration: an attestation checkbox (18+, authority to bind the
   organization), the agree/acknowledge clause, and **server-side version,
   timestamp and method records** stored by the register endpoint. The signup
   form carries none of these today, because it is a beta-access request.
   Rewiring to `/auth/register` without them creates customer accounts with no
   acceptance record. Item 9 of the same list (the 18+ representation) rides on
   the same checkbox.
7. **The post-registration flow, not just the API call.** The current handler,
   on success, shows *"Thanks, you are on the list. Someone from the team will
   reach out with your access."*, calls `form.reset()` and `resetConditionalUi()`,
   and returns. Swap only the call and a real account gets created while the
   visitor is told to wait for outreach and left on a blank `/signup`. The
   success copy has to be replaced and the visitor routed by tier — signup →
   checkout → welcome, per `AGENTS.md`. (Note that signup does not transmit the
   tier to the server: every self-serve account starts Free and paid tiers land
   with billing. The tier only routes the visitor.)

   **Replace the failure path, not only the success one.** The handler
   special-cases success and lets *everything else* fall through to the
   beta-request `mailto:` at `signup.astro:463-469`. Point it at
   `/auth/register` and an ordinary rejection — email already registered, a
   password that fails policy — opens the visitor's email client and tells them
   a beta-access request is on its way. They would be left believing they had
   applied for something while no account was created and no error was shown.
   The step has to include parsing the API response well enough to tell a
   registration error from an outage, and saying which.

   **And record the completed signup before navigating.** `choose-plan.astro:95-102`
   only rewrites "Start free" to `/welcome?plan=free` when `hasSignedUp()` is
   true; otherwise it sends the visitor to `/signup?tier=free`. A bare `/signup`
   registrant has no tier yet, so the next page *is* `/choose-plan` — and
   without `flowState.markSignedUp()` they land there, click the free option,
   and are handed a second registration form for the account they just created.
   Call it on success, before routing.

   **The destination needs the same treatment as the origin.** `welcome.astro`
   closes with *"Use the account credentials provided with your access
   invitation."* — written for an invited pilot user. A self-serve registrant
   chose their own password thirty seconds earlier and has no invitation, so
   fixing only the signup handler's wait-list message leaves the last screen of
   the flow telling every new customer to go looking for credentials that do not
   exist. Replace both, in the same change.

   **And the middle of that route does not exist yet.**
   `docs/reconciliation-roadmap.md` carries `POST /billing/checkout-session` as
   an unimplemented backend P0 — *"Frontend posts and fails soft today. Success
   URL should land on /welcome."* Today `checkout.astro` renders
   *"Could not open secure payment. Try again in a moment."* on that failure.
   So a registrant who picked Sprout, Sapling or Tree would get a real account
   and then dead-end one screen later. **The Stripe checkout endpoint and its
   webhook are a pre-cutover prerequisite, not a follow-up**, unless the
   cutover ships Free-only and routes every paid tier somewhere honest.

   **And the endpoint alone is still not enough to take money.** Three more
   items in the same roadmap are the difference between a charge that works and
   a charge that is defensible, and each one is already promised in live copy:

   - **Canonical server-side pricing** (roadmap item 8). The deterministic
     resolver — standard price → qualifying programs → lowest applicable price,
     plus server-side proration and **discount validation at payment** — is
     unimplemented backend work. `checkout.astro` already tells the buyer
     *"We will verify code X at payment."* A session created without that
     resolver can charge the wrong amount, or take a code and silently ignore
     it. The price has to be settled on the server, never from what the page
     posted.
   - **The tax decision** (roadmap item 4, *Founder*). The pricing page and
     checkout both state the amount includes taxes and fees; the roadmap still
     carries Stripe Tax and nexus as an unresolved accounting decision. Enabling
     Stripe without settling it either adds tax on top of an advertised
     "Due today" or absorbs tax nobody accounted for. This one is not
     engineering work and cannot be unblocked by engineering.
   - **Plan upgrades** (roadmap item 3). `/choose-plan` tells buyers they can
     change plans later, and `POST /billing/plan-upgrades` is an unimplemented
     backend P0. Selling on that promise means a customer who wants to move
     from Sprout to Sapling has no path and a page that said there would be
     one. Build it or take the promise off the page before the cutover, the
     same choice as the renewal controls below.
   - **Auto-renew control and the notice scheduler** (roadmap items 13 and 5).
     Checkout promises the customer can disable auto-renew in Settings and will
     be told 90 and 30 days before a renewal. `POST /billing/auto-renew` and the
     scheduler are both Backend and both unbuilt. Selling on that promise means
     renewing cards with neither the control nor the warning. The roadmap names
     the alternative itself — *"If the Stripe round slips past launch, soften
     the copy."* Ship the services, or remove the promises and turn automatic
     renewal off. Not the third option.
8. **Decide what email verification does, and wire it before the cutover.**
   `teim-app` currently runs with verification **off**, and the code says why:

   ```js
   // Mailer not configured for pilot — re-enable when EMAIL_* secrets are set.
   const requireEmailVerification = options.requireEmailVerification === true;
   ```

   That is a strict `=== true`, so unset means off. Both ways of leaving it are
   wrong for a public cutover:

   - **Left off**, anyone can register under an address they do not control, and
     every account is unverified.
   - **Turned on without working delivery**, registration completes and the
     visitor waits for mail that was never sent. Both ways that fails are
     silent: an unset `EMAIL_DELIVERY` makes the mailer build the link and do
     nothing, and a missing `ses:SendEmail` on the task role throws, is caught,
     and **still returns 200**.

   So the SES provisioning is a *signup* prerequisite, not an email nicety, and
   one real send to a real inbox is the only acceptable proof — a green deploy
   is not evidence that mail left the building. (Step 4 already required it for
   password reset; this is the same delivery path, and turning verification on
   without it fails the same silent way.)

   **Provisioning SES does not finish this item, because verification needs a
   front end.** Turn it on and registration can complete *before* the visitor
   clicks the link — while step 7 sends every successful signup straight to
   checkout or welcome, and the form work in step 9 has nowhere to handle a
   verification-required response. That leaves two outcomes and no third: the
   registrant proceeds to checkout unverified, or lands on a screen that does
   not explain what it is waiting for. Before the cutover, specify the
   pending-verification state — what the visitor sees, what the tier routing
   does while the account is unverified, and how the verification callback
   resumes the tier they selected rather than dropping them at a bare signed-in
   page.

9. **Then** the form itself: point it at `submitSignup`, add the password field,
   or take the hand-off the page already queues and embed teim-app's `AuthGate`
   so there is one account surface, one password policy and one session.

   **Grove is not a tier, and tier routing drops it.** The standalone Cedar
   Grove CTA arrives as `/signup?product=cedar-grove`, and the signup script
   already reads it into a hidden field. But `submitSignup` carries no product
   selection, and `checkout.astro` accepts only `sprout`, `sapling` or `tree` —
   so "route by tier" either loses the Grove request or sends it to
   `/checkout?tier=cedar-grove`, which bounces to the plan picker the visitor
   did not ask for. Decide the Grove path before replacing the contact
   submission: either keep Grove as a sales request (it is the one product
   sold on its own, so this is defensible) or add standalone Grove checkout.
   Whichever, it is a separate branch from the three tiers.

   **Carry the referral code through, or take the referral surface down.**
   `404.astro` already resolves `/r/<code>` and redirects to
   `/signup?ref=<code>`, so the codes are live and being handed out. The signup
   script reads `interest`, `tier` and `product` from the query — and not `ref`
   — and `SignupRequest` has no referral field, so `/auth/register` never sees
   it. Rewiring the form as written therefore creates the account and drops the
   attribution on the floor: the referrer cannot be credited afterwards, because
   nothing recorded who they were. The roadmap has this as item 13 — referral
   persistence, attribution, reward after a qualifying payment, cap and fraud
   checks are all Backend and unbuilt. Either carry the code from query to form
   to endpoint as part of this step, or stop serving `/r/:code` until the
   backend exists. A referral link that quietly forgets is worse than no link.
10. **Only now** clear `AUTH_ALLOWLIST_EMAILS`, released together with the
    website deploy that ships 6-9.

## What could not be verified

Whether `api.lumecon.ai` resolves today. The sandbox this was written in has
no outbound network and failed identically against hosts known to be live.
Check it from a real machine.
