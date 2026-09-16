# Lumecon — Brand & Aesthetic Guide

A reference for the look, feel, and voice of the Lumecon surfaces.

> **This file is a summary, not the source of truth.** Every value here is
> transcribed from a stylesheet that ships. When the two disagree, the
> stylesheet is right and this file is stale. Fix it here rather than working
> around it.
>
> | Surface                      | Source of truth                                  |
> | ---------------------------- | ------------------------------------------------ |
> | Marketing site (lumecon.ai)  | `src/styles/global.css` `:root`                  |
> | Product app                  | `teim-app` `src/styles/redesign.css` `.teim-rd`  |
> | Product design system        | `teim-app` `docs/design/DESIGN-SYSTEM.md`        |
> | Investor documents           | the investor-document stylesheet (private)       |
>
> The marketing site leads on the ink and surface scale; the app leads on
> component primitives (radii, focus rings, section bands) and on the data
> palette. Where they differ today, §11 says so.

---

## 1. What Lumecon is

- **Name:** Lumecon (legal: Lumecon Inc.)
- **Tagline:** _We luminate economies._
- **One-line pitch:** Economic impact analysis software for governments, enterprises, and mission-driven organizations.
- **Audiences:** governments, tribal nations, foundations, councils and boards, universities, and community-serving / mission-driven organizations.
- **Built at:** Cornell University. **Contact:** contact@lumecon.ai
- **Cedar** is the in-product AI analyst (its mark is a green cedar tree; it lives in a floating green "Ask Cedar" button).

**Personality:** credible, modern, plain-spoken, evidence-first. Government-grade trust without the stuffiness. The recurring rhetorical anchor is _"prove it"_ — Lumecon hands organizations the defensible numbers each room respects.

---

## 2. Color

Saturated brand accents on near-white surfaces. No muddy mid-tones. Sections
separate with **hairline rules, not background tints**.

### Surfaces

The site does not paint on pure white. The page ground sits two cool steps off
white so a genuinely white surface can rise off it without every card having to
prove its depth with a heavy shadow.

| Token             | Hex       | Use                                                   |
| ----------------- | --------- | ----------------------------------------------------- |
| `--ground`        | `#F3F6F8` | The page ground                                       |
| `--ground-bright` | `#FAFCFD` | Lifted ground                                         |
| `--surface`       | `#FFFFFF` | Raised white: product frames, plans, forms, overlays  |
| `--surface-2`     | `#EDF2F4` | Filled panels, callouts                               |
| `--surface-inset` | `#E5EBEE` | Inset wells, chart tracks                             |

`--white`, `--cream` and `--paper` still resolve as legacy aliases of the three
above. New work names the material it needs instead.

### Ink

| Token    | Hex       | Use                            |
| -------- | --------- | ------------------------------ |
| `--ink`  | `#071824` | Primary text; deep near-black  |
| `--ink-2`| `#33434A` | Body / secondary text          |
| `--ink-3`| `#647279` | Muted text, captions           |
| `--ink-4`| `#93A0A5` | Faintest text, dots, ticks     |

`--navy` is the same value as `--ink` (`#071824`); `--navy2` is `#18364A`.

| Token           | Value                   | Use                              |
| --------------- | ----------------------- | -------------------------------- |
| `--rule`        | `rgba(10, 28, 52, 0.1)` | Hairline dividers, card borders   |
| `--rule-strong` | `rgba(10, 28, 52, 0.2)` | Stronger borders, ghost outlines  |

### Accent: **teal**

Teal is the working UI accent: eyebrows, numbers, focus rings, hovers,
dividers, icon highlights, links.

| Token           | Hex       | Use                                                  |
| --------------- | --------- | ---------------------------------------------------- |
| `--accent`      | `#0FB5A5` | The bright brand step. Fills and rules, not text      |
| `--accent-light`| `#5FD9CC` | Hover / light fills; teal text in dark mode           |
| `--accent-bar`  | `#B8EDE6` | Soft highlight fill, link underline                   |
| `--accent-deep` | `#0A8A7E` | Button hover                                          |
| `--accent-chip` | `#0A7F74` | Backgrounds that carry **white** text                 |
| `--accent-text` | `#0A7F74` | **Teal text, links and focus rings**                  |

> **Contrast rule.** `--accent` gives only ~2.6:1 with white, below AA. Anything
> a reader has to read is `--accent-text` (4.88:1 on white); anything carrying
> white text on top is `--accent-chip`. In dark mode `--accent-text` flips to
> `--accent-light`.

### Brand gold: **reserved, and not a data color either**

| Token          | Hex       | Use                                  |
| -------------- | --------- | ------------------------------------ |
| `--gold`       | `#F0A91A` | The wordmark and the word _luminate_ |
| `--gold-light` | `#FFD24B` | Glow / emphasis                      |

> **Gold is brand-only.** Not buttons, not links, not generic UI, and **not
> charts**. `teim-app`'s token file is explicit: _"Gold is brand-only (the
> wordmark + the italic word *luminate*); it must never appear in UI chrome.
> Amber is the AA-safe DATA color (charts, deltas), never gold."_ The two were
> once conflated under a single `--amber: #F0A91A`; they are now separate and
> must stay separate.

### Amber: the data color

| Token     | Hex       | Use                                          |
| --------- | --------- | -------------------------------------------- |
| `--amber` | `#C77A18` | **Data visualization only.** Chart series, deltas  |

The marketing site carries the same hue as `--map-tribal` (`#C77A18`, deep
`#7A4708`) in the map palette. It is one color with one job: the warm
counterpart to teal in anything that encodes data.

### Green / Cedar

| Token         | Hex       | Use                                             |
| ------------- | --------- | ----------------------------------------------- |
| `--cedar`     | `#0E8B4F` | Cedar AI, the "Ask Cedar" button, decorative fills |
| `--cedar-light` | `#1BB66A` | Brighter highlight; cedar text in dark mode    |
| `--cedar-text`| `#0B5E36` | **Cedar-green text** (7.89:1 on white)          |
| `--cedar-mist`| `#E0F2E7` | Pale green fill                                 |

Same contrast rule as teal: `--cedar` is 4.35:1 on white and fails AA for body
text, so text uses `--cedar-text`.

### Supporting

- **Terra (coral)** `--terra` `#E04A2A`, used sparingly. Kept out of the map
  palette, where it fights both the gold source and the teal spillover.
- **Map palette:** source region = gold; tribal / reservation layer = amber-gold
  `#C77A18` (deep `#7A4708`); spillover = teal. Warm focal point, cool spillover.

### Dark mode

Automatic via `prefers-color-scheme`, no toggle. Surfaces invert to navy
(`--ground` `#0F1530`, `--surface` `#161C3C`) and the ink scale flips
(`--ink` `#F1F3FA`, `--ink-2` `#C9CEDF`, `--ink-3` `#8C92AB`, `--ink-4`
`#5F647B`). Teal and cedar text tokens move to their **lighter** steps, since
the deep steps fail AA on a dark surface. Gold punches up to `#FFC83D`.

Dark steps are **selected, not flipped**. A palette that simply inverts is not
a dark palette.

---

## 3. Typography

**One typeface does almost everything: Inter.** Weight and scale carry the
hierarchy — no serif/sans pairing.

- **Sans / display:** `Inter` (system-ui fallback), self-hosted, two-axis
  (weight + optical size). `font-optical-sizing: auto` means large type is drawn
  with genuine display letterforms rather than scaled-up body shapes.
- **Mono ("marginalia"):** `JetBrains Mono`, self-hosted — eyebrows/kickers,
  small labels, tags, email addresses, table column heads. UPPERCASE, letter-spaced.
- **Body:** 18px base, line-height 1.6, `tabular-nums`.

### Display scale

| Token              | Value                       |
| ------------------ | --------------------------- |
| `--weight-display` | `600` (section headings)    |
| `--weight-hero`    | `675` (hero h1 only)        |
| `--track-display`  | `-0.032em` (hero h1)        |
| `--track-title`    | `-0.024em` (section h2)     |
| `--track-sub`      | `-0.015em` (card/row h3)    |

Display type used to be 700 everywhere, from the hero down to a 1.1rem card
title. When every heading sits at the heaviest weight the page has no hierarchy
of voice, only of size. 600 with the optical-size axis engaged holds the same
authority and lets the hero be the only thing raising its voice.

Type scale (rem): `0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3`, plus
display `clamp(2.8rem, 7.5vw, 6rem)`. Weights: 400 / 500 / 600 / 700 / 800.

### The section band (the mono kicker)

The signature text pattern: a small mono uppercase label sitting above a large
Inter headline. The app tokenizes it, and those are the canonical values:

```css
font-family: var(--mono);
font-size: 0.62rem;       /* --band-size */
letter-spacing: 0.14em;   /* --band-track */
text-transform: uppercase;
color: var(--ink-3);      /* or --accent-text */
```

**One kicker and one headline per section.** The kicker is marginalia, not a
second headline.

### Serif

`--font-serif` on the marketing site resolves to `Georgia, 'Times New Roman',
serif`, and **no third webfont ships there**. `teim-app` does self-host Spectral
italic 500, used only for the word _luminate_. See §11.

---

## 4. Standalone headings

A standalone heading is a mono kicker above a bare Inter headline, with the
section opening on its own hairline rule. Nothing sits behind the type.

> **The marker-highlight device is retired.** Earlier versions of this guide
> described a hand-drawn marker rectangle behind standalone headlines:
> sharp-cornered, gradient-smeared, rotated a degree or two, wiping in on scroll.
> **The site no longer ships it.** There is no such rule anywhere in
> `src/styles/`, and `legal.css`, the closest thing the site has to a document
> page, sets a bare h1 under a kicker. `--accent-bar` survives only as a 1px
> link underline.
>
> Do not reintroduce it from this document, from an old deck, or from an
> exported PDF. Anything still carrying a yellow or teal swash behind a headline
> is out of date.

What separates sections now:

- a **1px rule** above the kicker
- the **kicker** in mono, teal or muted
- the **headline** in Inter 600 with the tracking for its level

---

## 5. Shape & layout language

- **Hairline separation.** Sections divide with 1px rules, not color blocks.
- **A row of things is divided, not boxed.** This is the rule most often got
  wrong. `.whyw-card` carries no border, no background, no radius and no
  shadow; siblings are separated by a single `border-left: 1px solid var(--rule)`
  and `.edge-row` by a single `border-bottom`. The comment in `home.css` is the
  reason: _"a rule beside each one boxed them in. Column gap does the
  separating instead."_ Giving every tile in a KPI row its own bordered,
  rounded container is the generic-dashboard look, and it is not this brand.
  Box something only when it is the one element on the page that must interrupt
  the reader.
- **Container:** max-width `1440px` (`--container-max`); horizontal padding
  `clamp(1.5rem, 4vw, 3rem)`. A section header block caps at `1180px`
  (`--head-max`) so a heading does not stop short of the content it introduces.
- **Reading measures:** `--measure-deck` `82ch`, `--measure-prose` `68ch`,
  `--measure-lede` `min(75%, 62rem)`. Read them from the tokens, because `ch` resolves
  against each element's own font size, so one number gives different widths on
  a deck and a headline.
- **Radii.** Three, and only three:

  | Token              | Value  | Use                                       |
  | ------------------ | ------ | ----------------------------------------- |
  | `--radius-control` | `8px`  | Buttons, small controls, callouts          |
  | `--radius-frame`   | `14px` | Cards, tiles, tables, panels. The default  |
  | `--radius-panel`   | `20px` | Large panels                               |

  The app names the same values `--radius-field` (12px, dense inputs),
  `--radius-card` (14px) and `--radius-pill` (999px, chips and badges).

- **Elevation:** a hairline does most of the work; the shadow only separates a
  frame from the page. `--lift` is `-3px` and `--lift-shadow` /
  `--shadow-frame` / `--shadow-control` are the whole vocabulary. **Shadows are
  neutral, never tinted**, because a shadow is the absence of light and takes the
  color of the surface it falls on. A teal shadow under a teal object reads as
  backlit plastic.
- **Left accent bars:** a filled `--surface-2` panel with a hairline all round
  and a 3px teal left border flags a qualification a reader must not skim.
- **Disclosures:** native `<details>` collapsibles keep pages scannable.
- **Desktop uses its width.** Avoid tall narrow text columns.

---

## 6. Motion

- Subtle and purposeful. Easing: `--ease` = `cubic-bezier(.22, 1, .36, 1)`.
- On load: content **rises and fades in**, staggered (headline → supporting → CTAs).
- On scroll: sections reveal via `.reveal` / `.reveal-soft`.
- Hover: small lifts, grey→teal icon fills.
- All motion respects `prefers-reduced-motion`.

---

## 7. Data visualization

Charts are the one place a second hue is required, and the rules are narrow.

- **Teal is series one; amber (`#C77A18`) is series two.** Gold never appears.
- A teal **fill** needs more chroma than teal **text**: `--accent-text`
  `#0A7F74` reads gray as a large fill. Step it up for marks.
- **One axis.** Never two y-scales on one chart. Two measures of different
  scale become two charts side by side, and the caption must say the scales
  differ, or a reader will compare the heights anyway.
- **Sequential for magnitude** (one hue, light→dark), **categorical for
  identity**, **diverging for polarity** (two hues, neutral gray midpoint).
  Never a rainbow.
- **Validate any categorical palette** against the lightness band, chroma
  floor, colorblind separation, normal-vision floor and surface contrast.
  Compute it; do not eyeball it.
- Thin marks, recessive gridlines, a 2px surface gap between adjacent fills,
  **selective** direct labels rather than a number on every point, and a legend
  whenever two or more series are present.
- Text in a chart wears ink tokens, never the series color. A colored mark
  beside the label carries identity.
- `tabular-nums` everywhere a figure appears.

---

## 8. Iconography

- **Line icons**, often **filled on hover** (grey → teal) so the whole shape reacts.
- Custom inline SVGs, lightweight and geometric.
- Social/profile links render as small **sharp-edged square chips** that pick up
  the teal accent on hover.

---

## 9. Logo & wordmark

- Wordmark **LUMECON** (Inter, bold, tracked-out) paired with a **cedar tree mark**.
- The word **"luminate"** in the tagline gets the gold italic treatment, the
  one place gold leads.
- OG / link-preview image uses a **pure white** background to match the logo's
  white square.

---

## 10. Voice & tone

- **Plain, confident, evidence-first.** Short declarative sentences. Lead with
  the promise, prove it with specifics.
- **Credibility forward** — names real institutions, methods and data sources;
  cites the rooms the numbers go into (councils, boards, funders, press).
- **No hype, honest hedging** — illustrative or demo figures are labeled as
  such; claims match what the product actually does.
- **Mono labels as marginalia** — short uppercase tags ("WHY IT MATTERS",
  "HOW WE WORK", "TRY IT") frame sections.
- **A number says what it is.** Committed is not spent; scheduled is not paid;
  a total is not a runway. Where a figure could be read two ways, the document
  says which.
- Inclusive and community-centered, especially toward tribal nations and
  mission-driven organizations.

### House style

Small mechanical rules. They exist because copy that breaks them reads as
generated rather than written, and that is the opposite of what the brand is
selling.

- **American spelling.** Color, not colour. Analyze, organize, summarize,
  labeled, center. This includes CSS comments, variable names and commit
  messages. (`prefers-color-scheme` is a CSS property name, so "colour" there
  is not a style preference, it is a bug.)
- **Avoid the em dash.** The dropped-in em-dash aside is the single loudest
  tell in machine-written prose. Use a comma, a colon, a period, or restructure
  the sentence. An en dash in a numeric or date range (February–August) is
  correct and stays. A dash as a nil marker in a table column is fine.
- **Write full sentences.** No dramatic fragments, no one-word sentences for
  emphasis. Compare the site's own copy: "Cedar organizes documents, proposes
  mappings and flags unresolved questions before values enter the model."
  Headings may be noun phrases; body copy may not.
- **No Oxford comma**, matching the site: "governments, universities,
  nonprofits, businesses, Tribal Nations and client work."
- **Label, don't editorialize.** A mono kicker is a noun phrase naming what
  follows ("Every geography", "Funding and cash"), never an instruction to the
  reader ("Read this carefully") or a rhetorical question.
- **Don't stack rule-of-three constructions.** One is rhetoric; three in a row
  is a tic.

---

## 11. Known divergences

Open, and recorded so nobody "fixes" one side to match the other by accident.

| Thing        | Marketing site                          | Product app                               |
| ------------ | --------------------------------------- | ----------------------------------------- |
| Ink scale    | `--ink` `#071824`, `--ink-2` `#33434A`, `--ink-3` `#647279` | `--ink` `#0A0F26`, `--ink-2` `#353B5C`, `--muted` `#6B6F8A` |
| Rule color   | `rgba(10, 28, 52, …)`                   | `rgba(10, 15, 38, …)`                     |
| Spectral     | Not shipped; `--font-serif` is Georgia  | Self-hosted Spectral italic 500           |

The app's ink scale and rule color are the older values the marketing site has
since moved off. Treat the site's as the direction of travel.

`BrandWordmark.astro` states that _luminate_ renders in "Spectral italic,
already in the font stack." On lumecon.ai it does not, because no Spectral face ships
there, so it falls back to Georgia italic. Either ship the face or change the
comment; do not assume the deck and the site render the tagline the same way.

---

## 12. Quick "do / don't"

**Do**

- Read the real values from the stylesheets listed at the top of this file.
- Separate with hairlines; keep surfaces near-white.
- Teal for interactive and accent UI; `--accent-text` for anything read.
- Amber for chart series; gold only for the wordmark and _luminate_.
- One mono kicker and one Inter headline per section.
- Neutral shadows, and a hairline doing most of the work.
- Say what a number is: committed, scheduled, paid, illustrative.

**Don't**

- Don't use gold as a generic accent, **or as a chart color**.
- Don't put a marker highlight behind a headline. It is retired (§4).
- Don't use `--accent` for text, or `--cedar` for body text; both fail AA.
- Don't tint a shadow.
- Don't add muddy mid-tone backgrounds.
- Don't pair a serif body with the sans — Inter carries the hierarchy.
- Don't treat this file as authoritative when a stylesheet disagrees.
