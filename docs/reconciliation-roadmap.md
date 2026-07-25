# Lumecon reconciliation roadmap

The working tracker for the founder's cross-repository reconciliation
brief (2026-07): treat lumecon.ai and the product as one continuous
customer experience. The public site sells and starts the
relationship; the app continues and manages it. The standard: a
customer should never be able to tell where the marketing site ends
and a formerly separate product begins.

Journey lock (implemented and enforced by smoke tests):

- New customer: Pricing -> Signup -> Choose plan -> Checkout -> Welcome -> Product
- Free: Signup -> Start free -> Welcome -> Product
- Returning: Login -> Product
- Plan change: Product -> Settings -> Plan -> Upgrade
- Existing customers never re-enter public signup or first-purchase checkout.

Statuses: **Done** (on this branch), **Partial**, **Backend** (lands
with the Stripe/billing round), **Founder** (founder or counsel
owned), **P1**, **P2**.

## P0: blockers before launch

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Real Terms and Privacy | Founder | Cornell clinic; both surfaces then point at identical versions. Until delivered, the placeholder-vs-binding-consent conflict on signup stands (brief item 14). |
| 2 | Free-tier backend reconciliation | Done (code) / Founder (deploy) | Migration 023 admits 'free'; tierCapabilities owns the capability table incl. canViewFullResults; frontend and server now agree. Migration must be deployed with 021/022. |
| 3 | Stripe first-purchase backend (POST /billing/checkout-session) | Backend | Frontend posts and fails soft today. Success URL should land on /welcome. |
| 4 | App upgrade backend (POST /billing/plan-upgrades) | Backend | Server must return the authoritative proration quote from real subscription dates; the client math is a preview only (brief item 5). |
| 5 | Correct login -> app redirect | Done | PUBLIC_APP_URL: login redirects when configured and never promises a redirect it cannot perform; Welcome's Open Lumecon points at the product origin. Set the env var at production deploy. |
| 6 | Remove email from URLs | Done | sessionStorage flow state (src/lib/flowState.ts); plan ids stay in the URL, PII does not. |
| 7 | Resolve checkout-without-account | Done | The pricing "go straight to checkout" shortcut is removed; paid acquisition is strictly pricing -> signup -> checkout. |
| 8 | Canonical billing/pricing calculations | Backend | Deterministic pricing resolver (standard price -> qualifying programs -> lowest applicable price -> display why); server-side proration; discount validation at payment (UI copy is already honest: "We will verify code X at payment."). |
| 9 | Cedar privacy/data-use claims verified against architecture | Founder | Write the internal data-flow spec (brief item 44) and derive /cedar and the Privacy Policy from it. |
| 10 | Duplicate legal documents | Partial | App footer and sign-in link to lumecon.ai; the in-app /terms and /privacy routes still render their own prose and should redirect once the canonical documents exist. |
| 11 | Whole Nation access migrations deployed | Founder | 021 + 022 + 023 together; server now re-onboards unclassified accounts before enforcing access. |
| 12 | Security claims verified | Founder | Counsel review alongside the offer, Patent pending and competitor references. |
| 13 | Referral/renewal copy only where behavior exists | Partial | UI states the policy; POST /billing/auto-renew, referral persistence (/r/:code, attribution, reward after qualifying payment, cap, fraud checks) and the 90/30-day notice scheduler are Backend. If the Stripe round slips past launch, soften the copy. Also decide the earned-months-across-upgrade policy ("at your current plan" needs one unambiguous backend rule). |

## P1: high-value polish

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Server-side draft sync | P1 | Drafts are localStorage-only; the account should own the canonical draft (marketing promises continuity). |
| 2 | Unified terminology: analysis / project / study | Partial | Vocabulary standard recorded in both AGENTS files (user-facing "analysis"; backend object "project"; "study" reserved). The app-wide copy sweep is open. |
| 3 | Broader organization onboarding | P1 | One shared organization/role taxonomy; the app's onboarding already collects organizationType, the website signup still leads with Tribal-era roles. Tribal-specific roles should appear when the organization identifies as a Tribal Nation. |
| 4 | Mobile app usability | P1 | Core tasks (login, dashboard, analyses, results, Cedar, billing, referrals, wizard progress) should work on a phone; retire the disclaimer posture. |
| 5 | Shared design tokens | P1 | Same values in both repos for color, radius, type scale, layout, motion (brief item 31). |
| 6 | Auth CSS consolidation | P1 | Website auth is one system already; the app still splits auth styling across index.css and redesign.css. |
| 7 | Settings accessibility | Done | Full ARIA tab contract with keyboard navigation. |
| 8 | Sidebar keyboard reorder | P1 | Replace drag-only ordering (and deprecated aria-grabbed) with the move-up/move-down interaction the analyses list already uses. |
| 9 | TEIM naming migration | Partial | User-visible TEIM is gone (export filename, gallery, copy). Storage keys (teim:*), session names and the .teim-rd class root remain; migrate with fallback reads. |
| 10 | Screenshot synchronization workflow | Partial | Recorded in README (release checklist: does this PR change a screen marketing uses? recapture as Wassily Leontief, light and dark, both themes). Automation is P2. |
| 11 | Canonical capability/pricing constants | Partial | Server tierCapabilities owns capability truth; each repo has one internal source for plan copy. A build-time shared policy file across repos is open. |
| 12 | Error/loading-state consistency | P1 | One error voice ("We couldn't [action] right now. [Next step].") and one loading/saving vocabulary; separate system status from analytical status (brief items 50-52). |

## P2: nice but meaningful

Scheduled downgrades at renewal; post-success referral prompts (the
results page placement is deliberately deferred: that page is also
the marketing capture source); deeper Cedar deep-linking; persisted
analyses-list filters; automated marketing screenshot capture;
richer organization memory controls with visible provenance
(brief items 43 and 54); admin visibility into billing/referral
state; end-to-end accessibility tests.

## Also done in this pass (from the brief's body)

- One example per hero visit: the homepage picks a study once per
  page load and holds it; per-study map and lineage captures are the
  follow-up that makes all three frames belong to the chosen example
  (brief item 41).
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

## Standing naming rule

"Team App" is repository shorthand only. To the customer everything
is Lumecon: the website is Lumecon, the app is Lumecon, Cedar is
inside Lumecon (brief item 58).
