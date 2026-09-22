# Lumecon reconciliation roadmap

The working tracker for the founder's cross-repository reconciliation
brief (2026-07): treat lumecon.ai and the product as one continuous
customer experience. The public site sells and starts the
relationship; the app continues and manages it. The standard: a
customer should never be able to tell where the marketing site ends
and a formerly separate product begins.

Corrections pass 2026-08-26: statuses below re-checked against the code.
"Done (on this branch)" means this repository's current branch; items that
depend on the app repository land only when its review stack merges, and
several earlier Dones were ahead of the code and are corrected below.

Corrections pass 2026-09-18 (cross-repository consistency audit): statuses
re-checked against every sibling repository's **main** branch, not against the
branches they were written from. Three kinds of correction came out of it.

- **Things that landed and were still recorded as pending.** The app's
  `review/66` stack is merged to its main branch (PRs #96, #98, #100, #149,
  #150), so `server/lib/tierCapabilities.js`, `server/lib/entitlement.js`,
  `server/lib/resultsPreview.js` and migrations 021, 022 and 023 are all on
  main. Items P0 2, P0 11 and P0 15 said otherwise.
- **Things recorded as done that were not.** The dev gallery was neither
  excluded from production nor rebranded: `/dev/gallery` shipped in the
  production bundle, unauthenticated, with a kicker reading "TEIM DESIGN
  SYSTEM". It is now genuinely excluded, verified by building. User-visible
  TEIM was not gone from the app's main branch either. Both are corrected
  below.
- **Repositories this tracker never covered.** `cedar` and `teim-engine` are
  named in this repository's README as part of one continuous customer
  experience, and neither appeared here. `cedar` in particular is where the
  product's own voice lives, and it was the furthest out of step. A new
  section at the end covers both.

The standard this pass applied: **a status is a claim about code, so it was
read in the code.** Where a claim could not be verified from a checkout, it
says so rather than guessing.

Journey lock (implemented in the page flow; the smoke tests cover these
pages, not the product handoff, and the free path opens only when the
register endpoint ships):

- New customer: Pricing -> Signup -> Choose plan -> Checkout -> Welcome -> Product
- Free: Signup -> Start free -> Welcome -> Product
- Returning: Login -> Product
- Plan change: Product -> Settings -> Plan -> Upgrade
- Existing customers never re-enter public signup or first-purchase checkout.

Statuses: **Done** (on this branch), **Partial**, **Backend** (lands
with the Stripe/billing round), **Founder** (founder or counsel
owned), **P1**, **P2**.

Corrections pass 2026-09-22 (issue sweep, statuses re-read against the
code): one row had gone stale rather than wrong. Legal item 8 said Google
Fonts still loaded from a CDN pre-consent; the type has been self-hosted since
2026-09-07, so that half of the item is closed below with the commit. The rest
were re-verified and still hold: the app's in-app `/terms` and `/privacy`
still render their own prose (`src/appRoutes.js:5-6` on the app's main; P0 10
and Legal 6), the sidebar still uses `aria-grabbed` drag ordering
(`src/components/redesign/RedesignLayout.jsx`; P1 8), `ROLE_OPTIONS` in
`src/pages/accountModel.js` still mirrors nothing (P1 3), and the app's PR
#170 for the two ampersand tab labels is still open. Nothing else moved.

## P0: blockers before launch

| #   | Item                                                           | Status                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Real Terms and Privacy                                         | Founder                    | Cornell clinic; both surfaces then point at identical versions. Until delivered, the placeholder-vs-binding-consent conflict on signup stands (brief item 14).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2   | Free-tier backend reconciliation                               | Done in code, awaiting deploy | **Corrected 2026-09-18.** The review/66 stack is merged to the app's main branch. `server/lib/tierCapabilities.js` (the capability table, with `resultsAccess: "direct"` for `free`), `server/lib/entitlement.js`, `server/lib/resultsPreview.js` and migrations `021`, `022` and `023_free_tier.sql` are all on main. What remains is deploying and confirming it on the running app, not merging it.                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3   | Stripe first-purchase backend (POST /billing/checkout-session) | Backend                    | Frontend posts and fails soft today. Success URL should land on /welcome.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 4   | App upgrade backend (POST /billing/plan-upgrades)              | Backend                    | Server must return the authoritative proration quote from real subscription dates; the client math is a preview only (brief item 5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5   | Correct login -> app redirect                                  | Done                       | PUBLIC_APP_URL: login redirects when configured and never promises a redirect it cannot perform; Welcome's Open Lumecon points at the product origin. Set the env var at production deploy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 6   | Remove email from URLs                                         | Done                       | sessionStorage flow state (src/lib/flowState.ts); plan ids stay in the URL, PII does not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 7   | Resolve checkout-without-account                               | Done                       | The pricing "go straight to checkout" shortcut is removed; paid acquisition is strictly pricing -> signup -> checkout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 8   | Canonical billing/pricing calculations                         | Backend                    | Deterministic pricing resolver (standard price -> qualifying programs -> lowest applicable price -> display why); server-side proration; discount validation at payment (UI copy is already honest: "We will verify code X at payment.").                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9   | Cedar privacy/data-use claims verified against architecture    | Founder                    | Write the internal data-flow spec (brief item 44) and derive /cedar and the Privacy Policy from it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10  | Duplicate legal documents                                      | Partial                    | App footer and sign-in link to lumecon.ai; the in-app /terms and /privacy routes still render their own prose and should redirect once the canonical documents exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 11  | Whole Nation access migrations deployed                        | Founder                    | **Corrected 2026-09-18.** 021, 022 and 023 are on the app's main branch; the merge this row was waiting on has happened, so only the deploy is outstanding. The server then re-onboards unclassified accounts before enforcing access. The app's migration high-water mark is now `029`, and there is deliberately no `028`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 12  | Security claims verified                                       | Founder                    | Counsel review alongside the offer, Patent pending (confirmed on file, Aug 2026) and competitor references.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 15  | Seed results preview                                           | Done (verify in app)       | The free account is Seed, and its results behavior is the product contract: direct effects visible on the real results page, indirect/induced/total and exports locked behind an in-context upgrade, withheld server-side (tier `free` in tierCapabilities — never CSS-only blur). Implemented in teim-app per docs/seed-tier-spec.md: the results route serves the 200 direct-only preview shaped server-side, exports 403, and the side doors that carry result data (Cedar chat context, the account export, project-list headline outputs) are shaped by the same entitlement, with serialized-payload leak tests pinning the absence of locked figures. **Corrected 2026-09-18:** that stack has merged, so this is on the app's main branch, not on a review branch. The remaining step is confirming it on the deployed app. |
| 14  | Retired entry-point trademark claims                           | Counsel                    | Terms §9 still claims Local Economic Impact, Tribal Economic Impact and Global Economic Impact as marks. The entry-point taxonomy is retired site-wide in favor of the Cedar family (Cedar, Cedar Impact, Cedar Commons, Cedar Grove); counsel to decide whether to keep claiming the retired names and whether to add the Cedar product names to the marks list.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 13  | Referral/renewal copy only where behavior exists               | Partial                    | UI states the policy; POST /billing/auto-renew, referral persistence (/r/:code, attribution, reward after qualifying payment, cap, fraud checks) and the 90/30-day notice scheduler are Backend. If the Stripe round slips past launch, soften the copy. Also decide the earned-months-across-upgrade policy ("at your current plan" needs one unambiguous backend rule).                                                                                                                                                                                                                                                                                                                                                                                                                                               |

## P1: high-value polish

| #   | Item                                            | Status  | Notes                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Server-side draft sync                          | P1      | Drafts are localStorage-only; the account should own the canonical draft (marketing promises continuity).                                                                                                                                                                                                                                                                                             |
| 2   | Unified terminology: analysis / project / study | **Done 2026-09-18** | Vocabulary standard recorded in this repository's AGENTS.md and now carried by every sibling. The app-wide sweep shipped with item 9, since they were one migration: 156 lines across 30 files, display strings only. `Analyses.jsx` renders `<h1>Analyses</h1>` and the nav label matches the route it points at. Identifiers, icon ids, the glyph hash seed, storage keys and the analytics event kept the old word by design, and so did "feasibility study costs", which is an accounting term. Two traps worth reusing: the article moves ("a study" becomes "**an** analysis"), and a word-boundary grep misses `study${name}` in a template literal. |
| 3   | Broader organization onboarding                 | Partial | One shared organization/role taxonomy. The website signup now offers a shared role list with Tribal governance roles appearing only when the organization identifies as a Tribal Nation; mirroring the same taxonomy in the app's ROLE_OPTIONS (accountModel.js) is open. The signup API payload still carries servesTribalClients — retire or rename it together with the backend, not unilaterally. |
| 4   | Mobile app usability                            | P1      | Core tasks (login, dashboard, analyses, results, Cedar, billing, referrals, wizard progress) should work on a phone; retire the disclaimer posture.                                                                                                                                                                                                                                                   |
| 5   | Shared design tokens                            | P1      | Same values in both repos for color, radius, type scale, layout, motion (brief item 31).                                                                                                                                                                                                                                                                                                              |
| 6   | Auth CSS consolidation                          | P1      | Website auth is one system already; the app still splits auth styling across index.css and redesign.css.                                                                                                                                                                                                                                                                                              |
| 7   | Settings accessibility                          | Done    | Full ARIA tab contract with keyboard navigation.                                                                                                                                                                                                                                                                                                                                                      |
| 8   | Sidebar keyboard reorder                        | P1      | Replace drag-only ordering (and deprecated aria-grabbed) with the move-up/move-down interaction the analyses list already uses.                                                                                                                                                                                                                                                                       |
| 9   | TEIM naming migration                           | **Done 2026-09-18** | **The owner settled it: the product is Cedar Impact.** Renamed across the app and shipped. Cedar Impact on the product surfaces (side rail and its aria-label, wizard cover, mobile note, footer, Cedar's canned intake answers, the Methodology title, `index.html` title/description/OG/Twitter/JSON-LD, and `public/site.webmanifest`, which is what an installed home-screen icon shows). Lumecon on the platform surfaces (the pre-auth shell, the mail sender and the verification and password-reset subjects, Terms and Privacy, and `og:site_name`). The export filename prefix moved too, with four backend assertions; files customers downloaded before today keep the old prefix, and nothing parses it back. Contracts deliberately untouched: the repo, database and resource names, `TEIM_ENGINE_*` and `CEDAR_*` env vars, the `.teim-rd` CSS root, the `teim:*` storage keys and the `tribalVersion` export field. Inventory in `teim-app/AGENTS.md` §9. **This was recorded as blocked on counsel and should not have been**: Terms §9 is a question about which names to keep claiming as marks (item 14), not a blocker on what the product is called. |
| 10  | Screenshot synchronization workflow             | Partial | Recorded in README (release checklist: does this PR change a screen marketing uses? recapture as Wassily Leontief, light and dark, both themes). Automation is P2.                                                                                                                                                                                                                                    |
| 11  | Canonical capability/pricing constants          | Partial | Server tierCapabilities owns capability truth on the app's review stack. This repository has one plan-copy source; the app still carries more than one, and a build-time shared policy file across repos is open.                                                                                                                                                                                     |
| 12  | Error/loading-state consistency                 | P1      | One error voice ("We couldn't [action] right now. [Next step].") and one loading/saving vocabulary; separate system status from analytical status (brief items 50-52).                                                                                                                                                                                                                                |

## P2: nice but meaningful

Scheduled downgrades at renewal; post-success referral prompts (the
results page placement is deliberately deferred: that page is also
the marketing capture source); deeper Cedar deep-linking; persisted
analyses-list filters; automated marketing screenshot capture;
richer organization memory controls with visible provenance
(brief items 43 and 54); admin visibility into billing/referral
state; end-to-end accessibility tests.

## Also done in this pass (from the brief's body)

- One example per hero visit, completed (brief item 41): the
  screenshot system is hierarchical. An example (one organization,
  one geography) owns three archetypes: results, map, comparison
  over time. The homepage locks one example per visit and rotates
  only its archetypes, opening on the example's declared money shot;
  all three frames always belong to the locked example. The library
  holds ten examples (Tribal Nations, governments, education,
  nonprofits, private investment, infrastructure) across ten states,
  each an internally coherent fictional case study whose comparison
  pairs two related analyses over time, never the same event with
  the year changed. Numbers are generated and audited by
  scripts/screenshots/examples-data.mjs (cross-footing effects,
  plausible multipliers, wages and tax shares; the module throws if
  an edit breaks plausibility); scripts/screenshots/ regenerates all
  30 captures (ten examples as results, map and compare), 1920px wide; only `ex-wind-results.webp` is referenced since the hero moved to a single screen.
- Cedar is never "our site assistant": FAQ schema and the site
  chat's self-descriptions present Cedar as Lumecon's AI economic
  analyst, with the site chat as a lightweight version (item 15).
- Shared password rules module on the website, matching AuthGate
  exactly (item 8).
- "Log in" and "Continue with Google" everywhere, both surfaces
  (item 49's biggest visible tell).
- Geography vs analysis-type distinction on pricing: every geography
  ships in every plan; some analysis types depend on organizational
  context (item 23).
- Whole Nation recommended by goal, not identity (item 55).
- Tier-gate messages stopped naming Sapling/Tree as a Cedar
  requirement (Cedar ships in every tier).
- In-app methodology points to the canonical lumecon.ai narrative
  instead of forking it (item 26).
- Dev gallery excluded from production and rebranded (item 39).
  **Corrected 2026-09-18: this was recorded as done and was not.** The
  `/dev/gallery` route was unconditional, so it shipped in the production
  bundle, unauthenticated, with a kicker reading "TEIM DESIGN SYSTEM". It is
  now gated at the lazy import as well as the route, so Rollup drops the
  chunk rather than emitting it unreachable, and verified by building: no
  Gallery chunk and no "dev/gallery" string in `dist`.
- Account export downloads as lumecon-account-export.json (item 38).

## Sector thumbnails (2026-07, awaiting founder photographs)

The /naics page ships with duotone placeholder fields; the founder is
supplying real photographs for study thumbnails. When they arrive, run
`node scripts/naics/duotone.mjs <dir-of-photos>` (filenames start with
the sector slug from scripts/naics/sectors.mjs, e.g.
`construction-crane.jpg`). The pipeline smart-crops every image to the
same 3:2 frame, grayscales it and applies the sector's brand wash
(teal, ink, amber, cedar in NAICS order), then writes webps into
public/naics/ that the page picks up automatically on the next build.
Visually inspect each `.gray.png` crop and the washed webps before
committing; confirm rights to every photograph first (the NACA
proposal photographs belong to CICD and member companies and must not
be reused here).

## Standing naming rule

"Team App" is repository shorthand only. To the customer everything
is Lumecon: the website is Lumecon, the app is Lumecon, Cedar is
inside Lumecon (brief item 58).

## Legal framework actions (2026-07)

Source: docs/legal/legal-framework-review.md (Part 5). Required
reviewer: Havala, in addition to the Cornell clinic. Statuses as
above.

| Item                                                                                                          | Status     | Notes                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Kill the agree-to-placeholder contradiction                                                                | Partial    | Signup and app login no longer assert agreement; signup says the documents are being finalized and will be presented for acceptance. The new Terms draft reintroduces acceptance-by-use, so counsel must resolve that before the documents ship.                                              |
| 2. Real acceptance mechanics                                                                                  | Open       | The signup form carries no attestation checkbox today (it is a beta-access request); the checkbox (18+, authority), the agree/acknowledge clause and the server-side version/timestamp/method records all activate when counsel delivers the documents and the register endpoint stores them. |
| 3. Checkout disclosure block                                                                                  | Done       | Plan, amount due, billed annually, automatic renewal with 90/30-day notice, and how to cancel, immediately above Complete purchase.                                                                                                                                                           |
| 4. Tax statement decision                                                                                     | Founder    | One decision with accounting (Stripe Tax, nexus); then pricing page, checkout, Terms Section 6 and invoices align. Site currently says taxes and fees included per founder policy.                                                                                                            |
| 5. Renewal notices system                                                                                     | Backend    | Scheduler must exist or the copy comes out; Terms reference as courtesy only.                                                                                                                                                                                                                 |
| 6. Canonical legal pages                                                                                      | Partial    | App links point at lumecon.ai; the in-app /terms and /privacy routes still render their own text and should redirect when the canonical documents exist.                                                                                                                                      |
| 7. Marketing claims audit                                                                                     | Founder    | Line-by-line counsel sign-off; list enumerated in the review.                                                                                                                                                                                                                                 |
| 8. Analytics claim vs implementation                                                                          | Partial    | No analytics run pre-consent by design. **Corrected 2026-09-22:** the fonts half is done — type has been self-hosted since `4750696` (2026-09-07): `public/fonts/*.woff2`, the `@font-face` block in `src/styles/global.css`, and `public/_headers` no longer allows `fonts.googleapis.com` or `fonts.gstatic.com`, so nothing loads from a third-party CDN pre-consent. What remains: DNT/GPC disclosure goes in the Privacy Policy with the real document.                                              |
| 9. 18+ representation                                                                                         | Open       | Rides the attestation checkbox in item 2, which the current beta-request form does not carry; no DOB collected either way.                                                                                                                                                                    |
| 10. Close-account copy                                                                                        | Done       | App copy distinguishes closing from deletion and links the Privacy Policy; Terms 33 and the Privacy retention section must tell the same story when drafted.                                                                                                                                  |
| 11. Tribal authority acknowledgment                                                                           | P1         | Requires the shared organization-type taxonomy at signup; never pre-checked; Order Form path for higher-value tribal accounts.                                                                                                                                                                |
| 12-16. Legal hub, Cedar disclosure link, GPC, terms-change infrastructure, server-quoted upgrade confirmation | P1/Backend | Sequenced after the documents exist.                                                                                                                                                                                                                                                          |
| 17-21. /security, /subprocessors, DPA, VPAT/ACR, retention schedule, enterprise template, insurance           | P2/Founder | Quarter-scale build-out.                                                                                                                                                                                                                                                                      |

Referral terms deltas from Part 4 are live in the product rules
text (verification, expiry at account closure, void where
prohibited); the plan-mismatch rule for earned months awaits the
billing decision.

## The services this tracker did not cover (added 2026-09-18)

This repository's README describes five sibling repositories as one continuous
customer experience, and this tracker covered two of them. `cedar` and
`teim-engine` were never listed, so nothing checked them against the standard
in the first paragraph of this file. Both were out of step, and `cedar` was the
worst case, because it is the only sibling whose product copy is written in
Markdown rather than in components and therefore reads as configuration.

| Repo | What was wrong | Status |
| --- | --- | --- |
| `cedar` | The main agent prompt instructed Cedar to describe itself as "an AI assistant", the one phrase the vocabulary standard rules out, and to answer an IMPLAN comparison by promoting "TEIM's strengths" **by name**. The OpenAPI description served at `/docs` said the same. The prompts carried no brand or copy lock at all, although the app's AGENTS.md has always stated that the Lumecon voice rules apply to "Cedar prompt text". | Fixed 2026-09-18. The prompt now carries the copy lock, the product names and the accounting identities. |
| `cedar` | The output-formatting section told the model to write "plain text for the CLI to style". On a real turn Cedar renders in the docked chat panel inside the product. | Fixed 2026-09-18. |
| `cedar` | The README advertised "reports, executive summaries, slide decks" while Rule 10 of the prompt forbids producing any of them and the storyteller specialist declines full drafts by design. A positioning commitment and its documentation said opposite things. | Fixed 2026-09-18, in favour of the prompt, which is the shipped behaviour. |
| `cedar`, `teim-engine` | Neither published a `SECURITY.md`, while the app's policy put both out of its own scope and told researchers to report issues there "to their owners". The pointer led nowhere. | Fixed 2026-09-18. Both now publish a policy on the canonical terms in this repository's `SECURITY.md`, and the app's and Cedar Press's policies link them. |
| `teim-engine` | The README's first line said the engine takes "a project description and a tribal location". `--geo-level` has taken `tribal_region`, `county` or `state` since August, and the MRIO path runs several regions at once. This site advertises "counties, states, the nation, reservations and trust lands", so the engine's own README was the document understating what ships. | Fixed 2026-09-18. |
| `teim-engine` | The Quickstart listed the two upstream data keys and stopped, but `ENGINE_API_KEY` has been required to serve HTTP since the fail-closed change of 2026-09-13. Anyone following it got `503` on every call with nothing to explain why. | Fixed 2026-09-18. |

### Second pass, same day

The first pass wrote rules into four repositories and then missed their
loudest violations, which is worth recording as a pattern rather than as six
separate corrections: **a rule is not enforced until something runs it.**

| Repo | Found on the second pass | Status |
| --- | --- | --- |
| `cedar` | The copy lock added in the morning forbids ampersands, and the results templates it governs printed `State & Local`, `Notes & Assumptions` and an em dash. Worse, the results table renamed three of its four columns: `Employment`, `Labor Income` and `Value Added` against the product's `Jobs supported`, `Labor income` and `GDP contribution`. Cedar exists to explain numbers the customer is reading on that page, so it was making them translate between two surfaces of one product. | Fixed, and made mechanical: `tests/test_prompt_copy_lock.py` pins the ampersand rule, the naming rules and the results headers, mutation-checked. |
| `teim-engine` | **§7b Tier 2 is built** (`tier2.py` plus tests) while two decision-log rows still say it is not, and it appeared in no document at all. It also had no `AGENTS.md`, alone among the five. | Corrected. The open half is narrower than "build Tier 2": the metrics exist, and what is missing is a runner, because `validation/` is gitignored so no committed script can reach the IMPLAN reference figures. |
| `teim-app` | The README's first paragraph said Lumecon's platforms "also include Local Economic Impact and Global Economic Impact" — two products this site retired. It also called Cedar and the engine externally owned, contradicting the correction made to its own `SECURITY.md` hours earlier. | Fixed. |
| `cedar-press` | `docs/TERMINAL_HANDOFF.md`, the one file its README says to read after every pull, still pointed at `r7-audit-integration` as the branch going to review. That branch merged as PR #84 and is deleted. | Corrected, with the trap named: a stale local `main` ref still corroborates the old text, so compare against `origin/main`. |
| all | The ampersand guidance written in the morning said to grep the HTML entity. A plain `&` in a string literal does not match that, which is how teim-app's `Settings.jsx` tabs survived the sweep. | Guidance corrected everywhere, with a regex that catches both forms. |

**Third pass, same day: the naming deferral was wrong.** I recorded the product
rename as blocked on counsel, and the owner corrected it: the product is **Cedar
Impact**. Terms §9 is a question about which names to keep claiming as marks
(item 14), not a blocker on what the product is called, and treating it as one
held the whole rename, and the vocabulary sweep behind it, for no reason. Both
shipped together; see items 2 and 9 above. The lesson worth keeping is narrow:
a legal question *adjacent* to a decision is not the same as the decision being
the lawyers' to make.

Two ampersands are deliberately **not** fixed, each for a different reason, and
both have a named closing action rather than a note. Cedar Press's collection
`Native Federal Advocacy & Engagement` is embedded verbatim in the citation
written into every downloaded CSV, so it waits for a version bump on that
collection (item 11 in that repository's handoff). teim-app's two Settings tab
labels are already fixed by its **open PR #170**, which rescued the change from
a branch that had carried it since July; a second branch editing the same two
lines would conflict for no gain.

Two things were found and deliberately **not** fixed, because they are not
mine to decide:

1. **The app's product name** (item 9 above). Counsel owns part of it and a data
   contract owns another part.
2. **Cedar Press's visibility boundary.** The vocabulary standard says Cedar
   Press "must not appear anywhere a visitor or a crawler can reach", and names
   HTML and CSS comments and `dist/` as the places it has leaked. Public GitHub
   repositories are also crawler-reachable, and `cedar-press`'s own public
   README names the product and links this site. Either the rule means "nothing
   in the built site", in which case it should say so, or it means what it says,
   in which case the repository README is out of bounds. Today the rule is
   ambiguous and the two are inconsistent. **Founder call.** Nothing was changed
   in either direction, and no reference to Cedar Press was added to this
   repository's public files.

## What a reviewer should check, by repository (added 2026-09-18)

Each repository now carries its own reviewer checklist, so this is the index
rather than the content. The checklists are ordered by how much damage a miss
does, not by how likely it is.

| Repo | Where the checklist lives | The thing most likely to be missed |
| --- | --- | --- |
| `lumecon-website` | `AGENTS.md` (the AI-frontend-tell audit, teal is semantic, page ownership, the copy document as a CI gate) | Changing visible copy without regenerating `docs/site-copy-and-architecture.md`, which fails the smoke job after every test has passed. |
| `teim-app` | `AGENTS.md` §10 | The accounting identities. A results surface that lets labor income exceed value added publishes a wrong number about a real nation's economy. |
| `cedar` | `AGENTS.md` §7 | That a prompt change is a product-copy change. It reads as configuration and ships as voice. |
| `teim-engine` | `AGENTS.md` §4 for the modelling half, `SECURITY.md` for the security half | A plausible-looking input that silently shrinks the reported impact and raises nothing. It has happened three times, each unnoticed for months. |
| `cedar-press` | `AGENTS.md` (the data workspace gates) and `README.md` for the client's copy rules | A gate failure stepped around rather than fixed. |

Two checks belong to whoever reviews across repositories, because no single
repository's checklist can catch them:

- **A contract changed on one side only.** Plan ids (`free | sprout | sapling |
  tree`) span this site, the app's `tierCapabilities.js` and the signup handoff.
  The Cedar request and response shape spans `cedar` and the app's
  `server/cedar/`. The run contract spans the app's `server/engine/` and
  `teim-engine`. Each needs both sides in the same review.
- **A claim that has gone stale rather than wrong.** Every correction in the
  2026-09-18 pass above was a sentence that was true when it was written. The
  cheapest guard is the one this pass used: read the claim in the code before
  believing it, and date the correction.
