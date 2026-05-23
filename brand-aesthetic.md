# Lumecon — Brand & Aesthetic Guide

A reference for the look, feel, and voice of the Lumecon website. Values are pulled from the live design system so anything built from this brief will match the site.

---

## 1. What Lumecon is

- **Name:** Lumecon (legal: Lumecon Inc.)
- **Tagline:** *We luminate economies.*
- **One-line pitch:** Economic impact analysis software for governments, enterprises, and mission-driven organizations.
- **Audiences:** governments, tribal nations, foundations, councils and boards, universities, and community-serving / mission-driven organizations.
- **Built at:** Cornell University. **Contact:** contact@lumecon.ai
- **Cedar** is the in-product AI analyst (its mark is a green cedar tree; it lives in a floating green "Ask Cedar" button).

**Personality:** credible, modern, plain-spoken, evidence-first. Government-grade trust without the stuffiness. The recurring rhetorical anchor is *"prove it"* — Lumecon hands organizations the defensible numbers each room respects.

---

## 2. Color

Pure, saturated palette on **white** surfaces. No muddy mid-tones. Sections are separated by **hairline rules, not background tints**.

### Surfaces & ink
| Token | Hex | Use |
|---|---|---|
| White | `#FFFFFF` | Primary surface (and "cream" — identical; separation comes from hairlines) |
| Paper | `#F7F7F8` | Rare softer surface: forms, panels |
| Navy / Ink | `#0A0F26` | Primary text; deep near-black navy |
| Navy 2 | `#1A2046` | Darker navy accents, CTA hover |
| Ink-2 | `#353B5C` | Body / secondary text |
| Ink-3 | `#6B6F8A` | Muted text, captions, author lines |
| Ink-4 | `#9DA1B5` | Faintest text, dots |
| Rule | `rgba(10,15,38,.12)` | Hairline dividers / card borders |
| Rule-strong | `rgba(10,15,38,.24)` | Stronger borders, ghost-button outlines |

### Accent — **Teal** (the working UI accent)
| Token | Hex | Use |
|---|---|---|
| Accent | `#0FB5A5` | Eyebrows/kickers, numbers, focus rings, hovers, dividers, icon highlights, links |
| Accent light | `#5FD9CC` | Hover/light fills |
| Accent bar | `#B8EDE6` | Soft highlight fill |
| Accent deep | `#0A8A7E` | Button hover / deeper teal |
| Accent 8% | `rgba(15,181,165,.08)` | Faint tint (hover backgrounds, avatar rings) |

### Brand gold — **reserved**, not a UI accent
| Token | Hex | Use |
|---|---|---|
| Gold | `#F0A91A` | The wordmark and the word **"luminate"** only — deliberate brand DNA |
| Gold light | `#FFD24B` | Glow / emphasis |

> Rule: **gold is brand-only.** Don't use it for buttons, links, or generic UI — that job belongs to teal.

### Green / Cedar (product + nature cue)
| Token | Hex | Use |
|---|---|---|
| Cedar / Green | `#0E8B4F` | Cedar AI, the "Ask Cedar" button, green highlights |
| Cedar light | `#1BB66A` | Brighter green highlight |
| Green deep | `#0B5E36` | — |

### Supporting / map
- **Terra (coral)** `#E04A2A` — used sparingly.
- **Map palette:** source region = gold (focal point); tribal/reservation layer = amber-gold `#C77A18` (deep `#7A4708`); spillover = teal. Warm focal point, cool spillover.

### Dark mode
Automatic via `prefers-color-scheme` (no toggle). Tokens flip to navy surfaces (`#0F1530`) with light text (`#F1F3FA`); gold and teal are punched up slightly so highlights still read.

---

## 3. Typography

**One typeface does almost everything: Inter.** Weight and scale carry the hierarchy — no serif/sans pairing.

- **Sans / Display:** `Inter` (system-ui fallback). Headlines use Inter 600 with tight negative letter-spacing (~ -0.018em to -0.022em) and large fluid sizes.
- **Mono ("marginalia"):** `JetBrains Mono` — for eyebrows/kickers, small labels, tags, email addresses. Typically ~0.7rem, **UPPERCASE**, letter-spacing ~0.14em, in teal.
- **Serif:** `Spectral` — fallback only, for brand wordmark fragments. Not used in body copy.
- **Body:** 18px base, line-height 1.6, `tabular-nums`.

Type scale (rem): `0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3`, plus display `clamp(2.8rem, 7.5vw, 6rem)`. Weights: 400 / 500 / 600 / 700 / 800.

**Signature text pattern:** a small mono uppercase **kicker** in teal sitting above a large Inter **headline**.

---

## 4. The signature device — highlight "marker" blocks

The most recognizable visual element. Standalone section headlines sit on a **hand-drawn-marker rectangle**:

- **Sharp edges** (border-radius 0) — deliberately not rounded.
- A **gradient smear** that fades out at both ends, in teal, gold, or green.
- A **slight rotation** (±0.5°–2.6°) so it reads as drawn, not boxed.
- **Asymmetric viewport bleed:** one side runs off-screen (negative `vw` insets, clipped by `overflow-x: hidden`), and which side bleeds varies per variant.
- **Wipes in on scroll** (`scaleX` 0 → 1) from the left or right, triggered by an IntersectionObserver.

**Rules of use:**
- Only on **standalone section headers** (hero h1s, section h2s, legal page titles). **Never** on headers that live inside a card or panel.
- **No repeating color on the same page**, and vary the wipe direction / which side bleeds so adjacent highlights feel distinct (teal / gold / green rotate).

---

## 5. Shape & layout language

- **White surfaces, hairline separation.** Sections divide with 1px rules, not color blocks.
- **Container:** max-width `1240px`; horizontal padding `clamp(1.5rem, 4vw, 3rem)`.
- **Cards:** white, 1px hairline border, soft radius **12–14px**, generous padding. Hover = lift (`translateY(-2px)`) + soft shadow + teal border. A teal **accent ring** sometimes echoes around avatars.
- **Sharp vs soft contrast:** the highlight rectangles and small icon "chips" are sharp-edged (radius 0); content cards are softly rounded. This tension is intentional.
- **Left accent bars:** gold or teal 3px left border to flag research/notable blocks.
- **Disclosures:** native `<details>` collapsibles (closed by default, chevron that fills teal when open) keep pages scannable — long copy is opt-in.
- **Desktop uses its width:** wider layouts, larger type and icons on big screens (mobile stays compact). Avoid tall narrow text columns.

---

## 6. Motion

- Subtle and purposeful. Easing: `cubic-bezier(.22, 1, .36, 1)`.
- On load: content **rises and fades in**, staggered (headline → supporting → CTAs).
- On scroll: highlight rectangles **wipe in**; sections reveal via `.reveal` / `.reveal-soft`.
- Hover: small lifts, grey→teal icon fills.
- All motion respects `prefers-reduced-motion`.

---

## 7. Iconography

- **Line icons**, often **filled on hover** (grey → teal) so the whole shape — not just a stroke — reacts.
- Custom inline SVGs, lightweight and geometric.
- Social/profile links render as small **sharp-edged square chips** (LinkedIn, Google Scholar) that pick up the teal accent on hover.

---

## 8. Logo & wordmark

- Wordmark **LUMECON** (Inter, bold, tracked-out) paired with a **cedar tree mark**.
- The word **"luminate"** (in the tagline) gets the gold treatment / glow — the one place gold leads.
- OG / link-preview image uses a **pure white** background to match the logo's white square.

---

## 9. Voice & tone

- **Plain, confident, evidence-first.** Short declarative sentences. Lead with the promise, prove it with specifics.
- **Credibility forward** — names real institutions, methods, and data sources; cites the rooms the numbers go into (councils, boards, funders, press).
- **No hype, honest hedging** — illustrative/demo figures are labeled as such; claims match what the product actually does.
- **Mono labels as marginalia** — short uppercase tags ("WHY IT MATTERS", "HOW WE WORK", "TRY IT") frame sections.
- Inclusive and community-centered, especially toward tribal nations and mission-driven organizations.

---

## 10. Quick "do / don't"

**Do**
- White surfaces; separate with hairlines.
- Teal for all interactive/accent UI; gold only for the brand wordmark + "luminate".
- One mono kicker + one big Inter headline per section.
- Sharp marker-highlights on standalone headers; soft-rounded cards.
- Subtle rise/fade and wipe-in motion.

**Don't**
- Don't use gold as a generic accent.
- Don't put a highlight rectangle on a header inside a card.
- Don't repeat a highlight color within a page.
- Don't add muddy mid-tone backgrounds or heavy drop shadows.
- Don't pair a serif body with the sans — Inter carries the hierarchy by weight/scale.
