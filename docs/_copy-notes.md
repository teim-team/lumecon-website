---

## Appendix B: my own copy-edit notes

_These are my recommendations, not changes already made. I would like them argued with._

**Scope.** Written against the six pages the site had when the pass was made:
`/`, `/pricing`, `/methodology`, `/cedar`, `/glossary` and `/naics`. It has not
been extended to the pages added since — `/why-lumecon`, `/cedar-commons`,
`/cedar-grove`, `/start`, `/team` and `/contact` — so the absence of a note on
one of those means nobody has looked, not that there was nothing to say. This
file is hand-maintained and is appended verbatim to the generated copy document
by `npm run docs:copy`; the appendix above it is computed.

**Since acted on.** `/methodology`'s commitments are four rather than five (the
platform comparison moved to `/why-lumecon`, which now owns the buyer's
argument) and the page carries a labelled assumptions-and-limits section. The
Edge section on the homepage is four linked rows rather than six tiles, and the
two table-stakes tiles named below are gone. Everything else here is open.

### Whole-site

1. **Two headline-metric definitions are duplicated verbatim between `/methodology` and `/glossary`: GDP contribution and economic output.** The underlying question is unresolved: **which page owns the definition of a headline metric?** My view is the glossary owns definitions and the methodology page should link to it rather than restate it, because the methodology page's job is the mathematics.

### `/` Homepage

- The audience list appears twice: in the hero and on the "Built to adapt" card. Once is enough. The card's job is "adapts to any organization type", which the heading already says.
- "Every plan gets the real platform" is a pricing argument on the page that is meant to say why Lumecon matters. It is also made, better, on `/pricing`.
- The Edge section compresses the methodology page into a short set of linked rows. It is four now, and the two table-stakes tiles ("Runs in your browser", "Nothing to install or maintain") that prompted this note are gone.

### `/pricing`

- Strongest page on the site. The argument is clear and the prices are visible, which is a real advantage over IMPLAN.
- The free-account pitch is made three times: the Seed card tagline, the "Don't take our word for it" band, and an FAQ answer. All three say bring your documents, build end to end, see direct effects.
- The FAQ is 671 words, over half the page. Some of those answers are arguing methodology, which is another page's job.

### `/methodology`

- The best-written page. The equations beside the prose is the right device and it earns the credibility the rest of the site claims.
- At roughly 2,800 words it is also the longest, and the "commitments" disclosures account for a large share of them. Worth asking which of the four a buyer actually opens.
- The closing mission block restates the homepage's closing block almost exactly. One of them should go.

### `/cedar`

- Tight and well-argued. Least to change.
- "Cedar is Lumecon's AI economic analyst" then "It works across intake, analysis, interpretation and reporting" then "running alongside Cedar Impact rather than sitting on top of finished results" is three clauses before the reader learns what it does for them.

### `/glossary`

- Doing more than defining. The "Input-output model" entry explains how the model is built, which is the methodology page's argument.
- Definitions are good and plain. This page is underrated and under-linked.

### `/naics`

- Restates the two-digit rationale that `/methodology` owns, in full, before pointing at it.
- The duotone photography here is the best visual work on the site by a distance.

### Legal and support pages

- `/terms`, `/privacy`, `/ai-and-data-use` and `/accessibility` read as though written by different hands. `/ai-and-data-use` is the most useful of the four to a buyer and the hardest to find.
