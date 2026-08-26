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

## P0: blockers before launch

| #   | Item                                                           | Status                         | Notes                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Real Terms and Privacy                                         | Founder                        | Cornell clinic; both surfaces then point at identical versions. Until delivered, the placeholder-vs-binding-consent conflict on signup stands (brief item 14).                                                                                                                                                                                                            |
| 2   | Free-tier backend reconciliation                               | Partial (app review stack)     | The tier table, server-side enforcement and migrations live on the app's review/66 stack, not on its main branch; they land when that stack merges and deploys with 021/022.                                                                                                                                                                                                 |
| 3   | Stripe first-purchase backend (POST /billing/checkout-session) | Backend                        | Frontend posts and fails soft today. Success URL should land on /welcome.                                                                                                                                                                                                                                                                                                 |
| 4   | App upgrade backend (POST /billing/plan-upgrades)              | Backend                        | Server must return the authoritative proration quote from real subscription dates; the client math is a preview only (brief item 5).                                                                                                                                                                                                                                      |
| 5   | Correct login -> app redirect                                  | Done                           | PUBLIC_APP_URL: login redirects when configured and never promises a redirect it cannot perform; Welcome's Open Lumecon points at the product origin. Set the env var at production deploy.                                                                                                                                                                               |
| 6   | Remove email from URLs                                         | Done                           | sessionStorage flow state (src/lib/flowState.ts); plan ids stay in the URL, PII does not.                                                                                                                                                                                                                                                                                 |
| 7   | Resolve checkout-without-account                               | Done                           | The pricing "go straight to checkout" shortcut is removed; paid acquisition is strictly pricing -> signup -> checkout.                                                                                                                                                                                                                                                    |
| 8   | Canonical billing/pricing calculations                         | Backend                        | Deterministic pricing resolver (standard price -> qualifying programs -> lowest applicable price -> display why); server-side proration; discount validation at payment (UI copy is already honest: "We will verify code X at payment.").                                                                                                                                 |
| 9   | Cedar privacy/data-use claims verified against architecture    | Founder                        | Write the internal data-flow spec (brief item 44) and derive /cedar and the Privacy Policy from it.                                                                                                                                                                                                                                                                       |
| 10  | Duplicate legal documents                                      | Partial                        | App footer and sign-in link to lumecon.ai; the in-app /terms and /privacy routes still render their own prose and should redirect once the canonical documents exist.                                                                                                                                                                                                     |
| 11  | Whole Nation access migrations deployed                        | Founder                        | 021 + 022 + 023 together; these migrations live on the app's review stack, not its main branch, so deployment waits on that merge. The server then re-onboards unclassified accounts before enforcing access.                                                                                                                                                                                                                                                                           |
| 12  | Security claims verified                                       | Founder                        | Counsel review alongside the offer, Patent pending and competitor references.                                                                                                                                                                                                                                                                                             |
| 13  | Referral/renewal copy only where behavior exists               | Partial                        | UI states the policy; POST /billing/auto-renew, referral persistence (/r/:code, attribution, reward after qualifying payment, cap, fraud checks) and the 90/30-day notice scheduler are Backend. If the Stripe round slips past launch, soften the copy. Also decide the earned-months-across-upgrade policy ("at your current plan" needs one unambiguous backend rule). |

## P1: high-value polish

| #   | Item                                            | Status  | Notes                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Server-side draft sync                          | P1      | Drafts are localStorage-only; the account should own the canonical draft (marketing promises continuity).                                                                                                                                     |
| 2   | Unified terminology: analysis / project / study | Partial | Vocabulary standard recorded in this repository's AGENTS.md (user-facing "analysis"; backend object "project"; "study" reserved); the app's AGENTS.md does not carry it yet and the app-wide copy sweep is open.                                                                                      |
| 3   | Broader organization onboarding                 | P1      | One shared organization/role taxonomy; the app's onboarding already collects organizationType, the website signup still leads with Tribal-era roles. Tribal-specific roles should appear when the organization identifies as a Tribal Nation. |
| 4   | Mobile app usability                            | P1      | Core tasks (login, dashboard, analyses, results, Cedar, billing, referrals, wizard progress) should work on a phone; retire the disclaimer posture.                                                                                           |
| 5   | Shared design tokens                            | P1      | Same values in both repos for color, radius, type scale, layout, motion (brief item 31).                                                                                                                                                      |
| 6   | Auth CSS consolidation                          | P1      | Website auth is one system already; the app still splits auth styling across index.css and redesign.css.                                                                                                                                      |
| 7   | Settings accessibility                          | Done    | Full ARIA tab contract with keyboard navigation.                                                                                                                                                                                              |
| 8   | Sidebar keyboard reorder                        | P1      | Replace drag-only ordering (and deprecated aria-grabbed) with the move-up/move-down interaction the analyses list already uses.                                                                                                               |
| 9   | TEIM naming migration                           | Partial | User-visible TEIM is gone on the app's review stack (export filename, gallery, copy), not yet on its main branch. Storage keys (teim:*), session names and the .teim-rd class root remain; migrate with fallback reads.                                                                             |
| 10  | Screenshot synchronization workflow             | Partial | Recorded in README (release checklist: does this PR change a screen marketing uses? recapture as Wassily Leontief, light and dark, both themes). Automation is P2.                                                                            |
| 11  | Canonical capability/pricing constants          | Partial | Server tierCapabilities owns capability truth on the app's review stack. This repository has one plan-copy source; the app still carries more than one, and a build-time shared policy file across repos is open.                                                                                         |
| 12  | Error/loading-state consistency                 | P1      | One error voice ("We couldn't [action] right now. [Next step].") and one loading/saving vocabulary; separate system status from analytical status (brief items 50-52).                                                                        |

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
  60 captures, light and dark at one uniform 1600x1000 frame.
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
- Dev gallery excluded from production and rebranded (item 39);
  account export downloads as lumecon-account-export.json (item 38).

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

| Item                                                                                                          | Status     | Notes                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Kill the agree-to-placeholder contradiction                                                                | Partial    | Signup and app login no longer assert agreement; signup says the documents are being finalized and will be presented for acceptance. The new Terms draft reintroduces acceptance-by-use, so counsel must resolve that before the documents ship.                                                        |
| 2. Real acceptance mechanics                                                                                  | Open       | The signup form carries no attestation checkbox today (it is a beta-access request); the checkbox (18+, authority), the agree/acknowledge clause and the server-side version/timestamp/method records all activate when counsel delivers the documents and the register endpoint stores them. |
| 3. Checkout disclosure block                                                                                  | Done       | Plan, amount due, billed annually, automatic renewal with 90/30-day notice, and how to cancel, immediately above Complete purchase.                                                                                                              |
| 4. Tax statement decision                                                                                     | Founder    | One decision with accounting (Stripe Tax, nexus); then pricing page, checkout, Terms Section 6 and invoices align. Site currently says taxes and fees included per founder policy.                                                               |
| 5. Renewal notices system                                                                                     | Backend    | Scheduler must exist or the copy comes out; Terms reference as courtesy only.                                                                                                                                                                    |
| 6. Canonical legal pages                                                                                      | Partial    | App links point at lumecon.ai; the in-app /terms and /privacy routes still render their own text and should redirect when the canonical documents exist.                                                                                         |
| 7. Marketing claims audit                                                                                     | Founder    | Line-by-line counsel sign-off; list enumerated in the review.                                                                                                                                                                                    |
| 8. Analytics claim vs implementation                                                                          | Partial    | No analytics run pre-consent by design; Google Fonts still loads from a CDN pre-consent, so either self-host the fonts or scope the claim to tracking/analytics precisely. DNT/GPC disclosure goes in the Privacy Policy with the real document. |
| 9. 18+ representation                                                                                         | Open       | Rides the attestation checkbox in item 2, which the current beta-request form does not carry; no DOB collected either way.                                                                                                                                                                                            |
| 10. Close-account copy                                                                                        | Done       | App copy distinguishes closing from deletion and links the Privacy Policy; Terms 33 and the Privacy retention section must tell the same story when drafted.                                                                                     |
| 11. Tribal authority acknowledgment                                                                           | P1         | Requires the shared organization-type taxonomy at signup; never pre-checked; Order Form path for higher-value tribal accounts.                                                                                                                   |
| 12-16. Legal hub, Cedar disclosure link, GPC, terms-change infrastructure, server-quoted upgrade confirmation | P1/Backend | Sequenced after the documents exist.                                                                                                                                                                                                             |
| 17-21. /security, /subprocessors, DPA, VPAT/ACR, retention schedule, enterprise template, insurance           | P2/Founder | Quarter-scale build-out.                                                                                                                                                                                                                         |

Referral terms deltas from Part 4 are live in the product rules
text (verification, expiry at account closure, void where
prohibited); the plan-mismatch rule for earned months awaits the
billing decision.
