# Seed tier: free-account results preview — implementation spec

**For:** the Claude Code session working in `teim-team/teim-app`
**From:** the lumecon-website session, on the founder's direction (Elijah Moreno, 2026-08-25)
**Status:** The marketing site is live-copy committed to this behavior — lumecon.ai already describes the Seed results preview as how the product works today, with no hedging. Implement this contract in teim-app now and verify it with the acceptance checklist below; until the checklist passes on the deployed app, the site's promise is ahead of the product, and any lasting mismatch is an app bug to fix, not a copy bug to soften.

## The decision

The free account is now a named plan: **Seed**, first of four (Seed, Sprout, Sapling, Tree — the botanical ladder now starts at its beginning). Seed users get further into the product than before: they reach the **real results page** and see their **direct effects**, while **indirect, induced and total impact are locked** behind an in-context upgrade, and **exports are unavailable**. The rationale: direct impact is essentially the customer's own spending restated — the thing they brought. The ripple (indirect, induced, total) is the thing Lumecon computes. The gating maps exactly onto the value proposition, and the locked layers sit directly under a number the user already believes, on their own data.

## Naming and identity

- Display name: **Seed**. Machine identity: tier id **`free`** — unchanged everywhere (DB, `tierCapabilities`, signup handoff `/signup?tier=free`, analytics). Do not rename the id.
- Canonical one-liner (verbatim, matches the site's protected vocabulary): *"Seed, the free account: build a full analysis and see your direct effects; full results unlock on any plan."*
- Seed never passes through checkout. Upgrade paths lead to plan selection.

## Capability contract (server-side, non-negotiable)

`server/lib/tierCapabilities.js` (or wherever capability truth lives — the server owns it, per the reconciliation principle) gains/adjusts the `free` tier:

| Capability | `free` (Seed) | Paid tiers |
| --- | --- | --- |
| Build analyses end to end (intake, Cedar, model run) | Yes (unchanged) | Yes |
| Results page access | Yes | Yes |
| Direct-effect figures (jobs, labor income, GDP contribution, economic output at the direct layer) | Yes | Yes |
| Indirect, induced, total impact | **No — withheld by the server** | Yes |
| Tax impacts | **No — withheld** (computed across layers; a direct-only tax figure would mislead) | Yes |
| Exports (XLSX workbook, CSV tables, printable summary) | **No** | Yes |

**The withholding must be server-side.** The API response for a free-tier account must not contain the locked figures at all. A CSS/JS blur over real numbers in the payload is a suggestion, not a paywall — anyone opens dev tools and reads them. The frontend renders placeholder shapes because it has nothing else to render. Export endpoints must also enforce tier server-side (403/upgrade response), not just hide buttons.

## Results page UX for Seed

1. **Direct effects render normally** — real results page, real figures, same lineage/trace affordances for the direct layer. This is the "the free account is the real product" promise kept.
2. **Locked layers render as flat placeholders with visible labels.** Show the row/section names (Indirect, Induced, Total impact, Tax impacts) with a blurred/neutral placeholder shape where the figure would be. **Flat placeholders, not proportional ones**: a blurred bar scaled to the real value leaks the magnitude (a big blurred bar says "your multiplier is large"). The labels do the tempting; the data stays paid. Decision from this thread — do not make blurred shapes proportional.
3. **Upgrade CTA sits on the locked rows, in context** — not (only) a banner. Copy direction: "Unlock indirect, induced and total impact — plans from $1,000 a year," one click to plan selection. Contextual is the point: it's right there, under their own number.
4. **Label the preview loudly, protect the credibility brand.** The Seed results page must state: **"Direct effects only — not total impact."** Direct-only figures quoted in a grant memo as "our economic impact" is the misuse case; the platform's whole positioning is defensible, labeled, traceable. Watermark the preview view (e.g. "Preview — direct effects only, not for citation") since screenshots can't be prevented. The Terms' acceptable-use clause (not misstating outputs) backs this.
5. **No exports on Seed**, including print-to-PDF affordances the product controls. The export UI should show the locked state with the same upgrade path, and the endpoints enforce it regardless.

## Consistency notes

- The in-app plan/upgrade surfaces should say **Seed** wherever they previously said "Free" as a display name (billing, plan badges, upgrade dialogs), with id `free` untouched.
- Cedar (in-product) should answer "what do I get free?" with the canonical Seed one-liner above.
- Per the shared vocabulary standard (both repos' AGENTS files): results vocabulary is Jobs supported, Labor income, GDP contribution, Economic output, Tax impacts, Direct, Indirect, Induced — verbatim.
- Telemetry worth adding while in here: an event when a Seed user views the locked rows and when they click the in-context upgrade CTA, so conversion of this surface is measurable.

## What the site says

So the app knows exactly what promise it must keep meeting:

- Pricing card (Seed, first of four): "The real platform, free: bring your documents, work with Cedar, build a full analysis and see your direct effects. Full results unlock on any plan."
- Comparison table, Results row (Seed column): "Direct effects, on the real results page. Indirect, induced and total unlock on any plan."
- Comparison table, Exports row (Seed column): "Not included."
- FAQ/chat variants of: "build an analysis end to end and see your direct effects on the results page; indirect, induced and total impact — and exports — unlock when you choose a paid plan."

The site states this behavior as current. Reconciliation-roadmap item 15 in lumecon-website tracks verifying the deployed app against the acceptance checklist below.

## Acceptance checklist

- [ ] API responses for `free`-tier accounts contain no indirect/induced/total/tax figures (verify the payload, not the UI).
- [ ] Export endpoints return an upgrade response for `free` tier even when called directly.
- [ ] Results page renders direct effects + labeled flat placeholders + in-context upgrade CTA for a Seed account.
- [ ] "Direct effects only — not total impact" labeling and preview watermark present.
- [ ] Paid-tier accounts see no change whatsoever.
- [ ] Display name Seed appears in-app where "Free" was user-facing; tier id remains `free` in every machine-read surface.
- [ ] Upgrade CTA routes into the existing plan-selection flow (never a new checkout path for Seed).
