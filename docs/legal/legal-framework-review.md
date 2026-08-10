# Lumecon legal framework: fact check, improvements, and website action list

Status: working review of the proposed legal stack (Terms, Privacy,
AI and Data Use, Accessibility, Referral Terms, DPA), recorded
2026-07 for the Cornell Law Entrepreneurship Law Clinic. This is
drafting support, not legal advice. Every section marked [COUNSEL]
needs attorney sign-off before production. Required reviewer:
Havala (observer on these repositories; ensure she receives this
document and the implementation diffs directly if repository
notifications do not reach her).

Implementation status of Part 5 is tracked in
docs/reconciliation-roadmap.md (Legal framework actions section).

---

## Part 1. Fact check of the legal claims in the draft

### Verified as accurate

- **C & L Enterprises v. Citizen Band Potawatomi Nation (2001).** Correctly cited. The Supreme Court found a clear waiver of tribal sovereign immunity where the contract contained an arbitration clause, a governing-law provision, and enforcement mechanisms. The "clear and unequivocal" waiver standard is correct.
- **CalOPPA.** California does require operators of commercial websites collecting personal information from California residents to conspicuously post a privacy policy describing categories collected and disclosure practices. Correct. See the addition below on Do Not Track, which the draft missed.
- **COPPA.** Correctly described as applying to collection from children under 13. The 18+ approach for a B2B platform is sound and avoids the issue entirely.
- **Auto-renewal regulation.** Delaware and New York do regulate automatic renewal, primarily in consumer contexts. Keeping clear-disclosure practices even in a B2B posture is the right call, and California's ARL is the strictest if any individual consumers ever purchase.
- **Global Privacy Control.** California treats GPC as a valid opt-out signal for sale/sharing (this was the basis of the Sephora enforcement action). Correct.
- **Clickwrap best practice.** Unchecked checkbox, versioned acceptance records, "agree to Terms / acknowledge Privacy Policy" distinction. All correct. Privacy policies are notices, not contracts, so "acknowledge" is the right verb.
- **One-year contractual claims deadline.** Generally enforceable in Delaware for contract claims when reasonable. Some states restrict this in consumer or statutory contexts. [COUNSEL] confirm against the claim types actually faced.
- **Contract-favorable posture on product changes vs. contract changes.** The distinction the draft makes (broad latitude over the product, prospective-only changes to the contract) is the right framework and matches enforceability case law on unilateral amendment.

### Corrections

**1. Delaware 6 Del. C. 2708 is cited too broadly.**
Section 2708 makes a Delaware choice of law conclusively valid only for transactions involving $100,000 or more. Sprout is $500/year and Sapling is $2,500/year, so the statute's safe harbor does not apply to most subscriptions. The choice of Delaware law still very likely holds under ordinary Restatement reasonable-relationship analysis because Lumecon is a Delaware corporation, but the memo to counsel should cite the right basis. No change to the recommendation, just to the reasoning.

**2. The class-action waiver is not as safe as presented.**
The strong federal protection for class waivers (AT&T Mobility v. Concepcion, American Express v. Italian Colors) attaches to arbitration agreements under the FAA. A standalone class waiver in litigation gets no FAA preemption and enforcement varies by jurisdiction. Choosing courts plus jury/class waivers over arbitration is still a defensible B2B decision, and class risk in this customer base is genuinely low, but present it to the clinic as a tradeoff: procurement credibility in exchange for a weaker class waiver. Do not describe it as equivalent protection.

**3. Jury waivers are unenforceable in some states.**
California holds pre-dispute jury waivers unenforceable (Grafton Partners v. Superior Court, 2005); Georgia is similar. The Delaware exclusive forum clause is what makes the jury waiver workable, so treat forum selection and jury waiver as a package. If the forum clause ever fails and the case lands in California, the jury waiver goes with it. The "to the extent permitted by law" hedge in the draft is correct; keep it.

**4. The tribal waiver section misses a jurisdictional problem.**
Federally recognized tribes are not citizens of any state for federal diversity jurisdiction. A damages suit against a tribe in Delaware federal court may fail for lack of subject-matter jurisdiction even with a valid waiver, and Delaware state court personal jurisdiction over a tribal government is its own fight. This is exactly why the standard, court-tested mechanism is the C & L pattern: **arbitration with judgment enforceable in any court of competent jurisdiction.** See the rewritten Section 25 approach below.

**5. IMPLAN comparisons are unverified.**
The draft cites IMPLAN's public terms three times (sole-discretion site changes, feedback ownership, warranty disclaimers). These are plausible and the recommendations stand on their own, but pull IMPLAN's current terms and confirm before repeating the comparisons to the clinic or anyone else.

**6. "Continued use constitutes acceptance" is the weakest available option for material changes.**
For prepaid B2B customers, the more enforceable and more procurement-friendly rule is: material changes to the Terms take effect for existing paid customers at the start of their next renewal term, with notice before renewal. Non-material and legally required changes can take effect on posting. This costs Lumecon almost nothing (the prepaid term is at most a year) and removes the most commonly challenged clause in the stack.

---

## Part 2. Substantive improvements to the Terms

### Section 25 rewrite: tribal sovereign immunity

Replace the Delaware-courts approach for tribal customers with the arbitration pattern, and add recourse limitations that tribal counsel can actually accept. Working draft for the clinic:

> **Tribal Customers.** If Customer is a federally recognized Indian Tribe, Tribal Nation, tribal government, tribal instrumentality, tribal enterprise, or other entity possessing or claiming sovereign immunity, then solely with respect to claims arising out of or relating to these Terms, any Order, or the Services:
>
> (a) Customer expressly and irrevocably waives its sovereign immunity from suit, arbitration, and enforcement, limited as provided in this Section;
> (b) any such dispute will be resolved by binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules, seated in [CITY, STATE], and judgment on the award may be entered and enforced in any court of competent jurisdiction, as to which Customer likewise waives immunity;
> (c) recourse against Customer is limited to money damages not exceeding amounts due under these Terms and the applicable Order, plus injunctive relief protecting Lumecon's intellectual property and confidential information, and expressly excludes attachment or execution against trust assets, trust income, or governmental property or funds not identified in the applicable Order;
> (d) Customer represents that the individual accepting these Terms is authorized to grant this limited waiver and that Customer has adopted any resolution, ordinance, or other action required under applicable tribal law to make it effective;
> (e) this waiver is limited to the commercial relationship described in these Terms and is not a general waiver for any other purpose.

Rationale: (b) reproduces the mechanism C & L Enterprises held sufficient; (c) is the concession that converts a clause tribal counsel must reject into one they routinely sign; (d) addresses the authority problem the draft correctly identified. Keep the draft's operational rule: checkbox acknowledgment for self-serve, but a signed Order Form identifying the waiving entity, and ideally referencing the authorizing resolution, for higher-value tribal accounts. [COUNSEL] on all of it, and be aware some Nations will still negotiate; have a fallback posture ready (for example, tribal-court forum with reciprocal terms for large deals).

Also note the tension worth surfacing internally: Lumecon's identity is built on partnership with Indian Country, and dissertation-adjacent credibility matters. The waiver should be the professional, limited, standard-practice version above, prominently disclosed, never buried. A hidden aggressive waiver discovered later would cost more than any lawsuit it prevents.

### Add: Lumecon IP indemnification (enterprise-facing)

The draft has customer-indemnifies-Lumecon only. Every sophisticated enterprise, university, and government buyer will demand the reverse for IP infringement. Standard SaaS solution:

> Lumecon will defend Customer against third-party claims that the Services, as provided by Lumecon and used as authorized, infringe a U.S. patent, copyright, or trademark or misappropriate a trade secret, and will pay resulting damages finally awarded or agreed in settlement. Lumecon may modify or replace the Services to make them non-infringing, procure the right to continue use, or terminate the affected Services and refund prepaid unused fees. This Section states Customer's exclusive remedy for infringement claims. Exclusions: claims arising from Customer Data, combinations not provided by Lumecon, or use in violation of these Terms.

Decide whether this lives in the clickwrap Terms or only in the negotiated enterprise template. Either is defensible; having no answer is not.

### Limitation of liability: anticipate the standard redlines

The 12-month fees cap and consequential-damages exclusion are normal and should stay. But sophisticated buyers will ask for carve-outs (indemnification obligations, confidentiality breaches, data breaches caused by Lumecon, IP infringement). Decide the fallback positions now, for example a 2x or 3x super-cap for data-protection breaches in negotiated deals, rather than improvising per deal. Also align the cap with actual insurance: Lumecon should carry tech E&O and cyber coverage at least equal to the plausible cap exposure. [COUNSEL/BROKER]

### Missing clauses to add

- **Notices.** How legal notices are given to each party (email to account address for Customer, designated legal address/email for Lumecon), when deemed received.
- **Export controls and sanctions.** Customer represents it is not on restricted-party lists and will comply with U.S. export and sanctions laws. Short, standard, and expected.
- **Publicity.** Lumecon may identify Customer by name and logo as a customer, with an opt-out. Get this now; retrofitting logo rights is painful. Expect governments and Tribal Nations to opt out; honor it instantly.
- **Beta and preview features.** Provided as-is, may change or be discontinued, excluded from any support or availability commitments, feedback rules apply.
- **Force majeure carve-out.** Add "except for payment obligations" so force majeure never excuses nonpayment.
- **Federal/state procurement note.** The Section 26 approach (separate signed agreement for public entities that cannot accept clickwrap) is right. Add internally: expect anti-indemnification, anti-auto-renewal (anti-deficiency), and governing-law objections from state entities, and FAR-based paper for any federal deal. Do not try to solve this in the clickwrap.
- **DMCA agent (optional, cheap).** If any user-provided content is ever displayed to others (Cedar Grove, shared workspaces), register a designated agent with the Copyright Office and add a short notice-and-takedown paragraph. Low cost, closes a door.

### Smaller fixes within existing sections

- **Section 3/4 (product latitude).** Keep as drafted. The "commercially reasonable efforts not to eliminate fundamental purchased functionality during a prepaid term" clause is the right balance and will survive procurement review.
- **Section 6 (taxes).** The draft correctly flags the conflict: the site says taxes and fees are included while the Terms say prices exclude government-imposed amounts. This is one decision, made once, with accounting (see website list, item 4). Whichever way it goes, Terms, pricing page, checkout, and Stripe Tax configuration must all match.
- **Section 9 (upgrades).** "The amount calculated by Lumecon's billing system at confirmation controls" should say the amount is calculated from the actual subscription state (in practice, Stripe's proration/invoice preview), matching the reconciliation brief. Keeps the contract and the architecture aligned.
- **Section 12/13 (aggregated data and AI training).** The structure is genuinely good: customer owns data, Lumecon owns models and derived improvements, raw proprietary documents never train shared foundation models, aggregated/de-identified/derived information may improve the system. Two requirements before this ships: (a) engineering confirms the architecture actually enforces it, and (b) Lumecon's contracts with its AI providers permit it and prohibit provider-side training on Lumecon's API traffic. If the provider terms do not guarantee no-training on submitted data, the promise cannot be made. [COUNSEL + ENGINEERING]
- **Section 24 (security).** Correct as drafted. Add internally: do not let the marketing site claim SOC 2, encryption specifics, or isolation guarantees that the Terms and the architecture do not support. One source of truth for security claims (a /security page, eventually), everything else links to it.
- **Section 33 (data after termination).** The 30-day export window is fine; make the app's "close account" copy and the Privacy Policy's retention section say the same thing (see website list, item 10).

---

## Part 3. Privacy Policy improvements

- **Add the Do Not Track disclosure.** CalOPPA affirmatively requires stating how the site responds to DNT signals. One sentence ("We respond to Global Privacy Control signals; we do not currently respond to other DNT signals" or as accurate). The draft omitted this and it is a required disclosure, not optional.
- **State applicability honestly.** CCPA/CPRA applies to businesses meeting thresholds (roughly $25M+ revenue, or data on 100,000+ consumers, or majority revenue from selling/sharing). Lumecon likely is not yet subject. The right move is what the draft gestures at: "Depending on where you reside, applicable law may provide rights to access, correct, delete..." plus an actual request channel (email is fine). Grant the rights operationally without claiming statutory coverage that does not exist. When CCPA does apply, note that B2B contact data is now covered too.
- **Structure the collection section as categories, purposes, sources, and disclosures.** The draft's lists are good raw material; organizing them into that four-part structure satisfies CalOPPA-style requirements and reads well to procurement reviewers. Consider a simple table.
- **Retention.** The draft's flexible language is right for launch. Add the internal action item: build a real retention schedule within the first year, because enterprise DPAs will ask for one.
- **Account closure.** The draft correctly catches that the app says closed-account records are retained. The Privacy Policy retention section, the Terms Section 33, and the app's close-account copy must tell one consistent story.
- **Breach notification.** Do not promise notification timelines in the policy beyond what law requires; state breach laws apply regardless and over-promising creates contract claims on top of statutory duties.
- **International.** The U.S.-operated framing is fine. Flag internally: if Lumecon ever markets to First Nations in Canada or other non-U.S. governments, PIPEDA/GDPR-style analysis is triggered by targeting, not by intent. Revisit before any such outreach.

---

## Part 4. AI and Data Use, Accessibility, Referral Terms

**AI and Data Use page.** The draft is strong. Two additions: (1) a plain-language line on provider relationships ("We use leading AI providers under contracts that prohibit them from training their models on your data", only if the provider contracts actually say so); (2) a link to the subprocessor list once it exists. This page is a sales asset for government and Tribal customers; treat it as such and keep it derived from the internal data-flow specification, never ahead of it.

**Accessibility.** The "goal of substantially conforming to WCAG 2.2 AA" reframe is correct and safer than the current "designed to conform" plus enumerated capabilities. Additions: (1) prepare a VPAT/ACR when pursuing government and university customers, since Section 508 and state equivalents make procurement teams ask for one; (2) make the statement cover both the site and the application, as the draft suggests, which matches the one-product reconciliation strategy; (3) the accommodation contact and response commitment are good, keep them.

**Referral Terms.** The draft covers the essentials. Add: "void where prohibited"; rewards have no cash value and expire with account closure; Lumecon may require verification before issuing rewards; and resolve the plan-mismatch question (what a Sprout-earned month is worth after upgrading to Tree) with one rule stated in the terms, matching whatever the billing backend implements. The "prospective changes except fraud corrections" discretion clause is well drafted, keep it.

---

## Part 5. Website and product changes

Consolidated action list; implementation status is tracked in
docs/reconciliation-roadmap.md.

### Launch blockers

1. **Kill the contradiction.** No signup flow may state that users agree to Terms while the Terms page says the documents are being prepared. Until counsel delivers real documents, either disable account creation or remove the agreement language and gate paid features. This is the single most urgent item.
2. **Real acceptance mechanics.** Unchecked required checkbox at signup: "I am at least 18 years old, I have authority to act for the organization identified above, and I agree to the Terms of Service and acknowledge the Privacy Policy." Store terms version, privacy version, timestamp, user ID, acceptance method (and IP if counsel wants it). This record is the evidence of assent.
3. **Checkout disclosure block.** Immediately above the purchase button: plan, amount due, billing frequency, next renewal date if determinable, automatic renewal statement, and how to cancel. Auto-renew disclosed at point of sale, never only in the Terms.
4. **Resolve the tax statement.** "Taxes and fees included" on the pricing page conflicts with the Terms' price-exclusive language. One decision with accounting (Stripe Tax, nexus), then align pricing page, checkout, Terms Section 6, and invoices.
5. **Renewal notices.** The app promises 90-day and 30-day notices. Build the scheduled email system or remove the copy. If built, reference it in the Terms as a courtesy, not an obligation ("Lumecon may provide renewal reminders").
6. **Canonical legal pages.** App /terms and /privacy redirect to lumecon.ai or render the identical externally sourced content. One legal source, permanently.
7. **Marketing claims audit.** Counsel confirms every site claim before launch: encrypted at rest, encrypted in transit, AWS, account-level isolation, never train on raw data, every result traceable, data sources, patent pending, AI review, economists reviewing methodology, cancellation terms, lowest applicable price, referral rewards, renewal notices. Marketing must not create promises the backend or the AI-provider contracts do not fulfill.
8. **Analytics claim must match implementation.** The site commits to no tracking scripts or analytics cookies before consent. Verify the deployed site actually loads nothing pre-consent (including tag managers and font/CDN beacons where feasible), or soften the claim. Add the DNT/GPC response disclosure to the Privacy Policy.
9. **18+ representation.** In the signup checkbox (item 2). No DOB collection.
10. **Close-account copy.** Distinguish closing an account from deleting information; link "Learn about data retention and deletion"; make app copy, Terms Section 33, and Privacy retention consistent.

### Before accepting paid Tribal organizational customers

11. **Tribal authority acknowledgment.** For organization type Tribal Nation / tribal government / instrumentality / enterprise, an additional pre-purchase acknowledgment of authority and the limited waiver, displayed plainly, never pre-checked. For higher-value tribal accounts, route to a signed Order Form identifying the waiving entity and referencing the authorizing resolution instead of relying on the checkbox. Wire the organization-type taxonomy from the reconciliation brief to trigger this flow.

### High priority after launch

12. **Footer and legal hub.** Terms, Privacy, Accessibility, AI and Data Use in the footer; Referral Terms linked contextually from the referral UI; a single /legal hub page listing everything with effective dates.
13. **Cedar disclosure link.** "AI and Data Use" in Cedar's info/menu panel, not on every message.
14. **GPC support.** Honor Global Privacy Control in the consent implementation; state it in the policy.
15. **Terms change infrastructure.** Effective-date display, a change-log or archived-versions page, in-product notice mechanism for material changes, and the applies-at-renewal rule for existing paid customers.
16. **Upgrade confirmation.** Shows current plan, unused credit, prorated cost, exact amount due, next renewal date and amount; the displayed amount comes from the server's Stripe-derived quote (already specified in the reconciliation brief; the Terms now depend on it).

### Build over the following quarters

17. **/security page** as the single source of security claims; **/subprocessors** list; **DPA on request** path for enterprise and government.
18. **VPAT/ACR** for public-sector procurement.
19. **Retention schedule** (internal) backing the Privacy Policy's flexible language.
20. **Enterprise agreement template** with the negotiated-deal fallbacks decided in advance: IP indemnity, liability carve-outs and super-cap, subprocessor notice, security exhibit, tribal-forum alternatives.
21. **Insurance alignment.** Tech E&O and cyber coverage sized against the liability cap and the data-protection promises. [BROKER]

---

## Part 6. Questions to bring to the Cornell clinic

1. Tribal waiver: arbitration-based Section 25 as rewritten above; authority mechanics for self-serve vs. Order Form; fallback posture when a Nation refuses any waiver.
2. Class waiver without arbitration: acceptable residual risk for this customer base, or add an arbitration option selectable in enterprise deals?
3. Delaware choice of law for sub-$100k contracts: confirm the reasonable-relationship basis suffices.
4. One-year claims deadline: any claim types or jurisdictions where it fails that matter here.
5. Material-changes-at-renewal mechanism: confirm drafting.
6. Tax-inclusive vs. tax-exclusive pricing: coordinate with accounting on Stripe Tax and nexus before the copy decision.
7. AI-provider contracts: confirm no-training terms support the public "raw documents are not training data" promise, and whether the promise needs qualifiers.
8. IP indemnity: clickwrap or enterprise-only.
9. Marketing claims list (item 7 above): line-by-line sign-off.
10. Whether the registered business address must appear in the public Terms/Privacy contact blocks.

---

## The one-paragraph posture (revised)

Customer owns its data and its work. Lumecon owns the platform, models, systems, and generalized improvements, and has broad rights to operate, modify, and improve the product, change vendors, AI models, data sources, and functionality, and use non-identifying derived information to improve its models. Economic results are estimates; customers remain responsible for consequential decisions. Liability is capped at twelve months of fees with indirect damages excluded; Delaware law applies with Delaware courts as the general forum; material contract changes apply prospectively at renewal; and Tribal customers provide an express, limited, arbitration-backed sovereign-immunity waiver supported by actual authority, with recourse limited to contract amounts and never trust assets. Favorable to Lumecon, credible to a procurement office, and signable by a Nation's general counsel.
