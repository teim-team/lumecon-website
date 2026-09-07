"""Build the research-team question list as a PDF.

Every question is anchored to a sentence that is live on lumecon.ai today,
so the meeting can work from what the site claims rather than from an
abstract checklist.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

OUT = "/home/user/lumecon-website/docs/methodology-open-questions.pdf"

INK = colors.HexColor("#1A2036")
MUTED = colors.HexColor("#5B6178")
RULE = colors.HexColor("#D8DBE4")
ACCENT = colors.HexColor("#0A7F74")
QUOTE_BG = colors.HexColor("#F4F6F8")

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(
        name=name,
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=6,
    )
    base.update(kw)
    return ParagraphStyle(**base)


S = {
    "title": style("title", fontName="Helvetica-Bold", fontSize=19, leading=23,
                   spaceAfter=3),
    "subtitle": style("subtitle", fontSize=10.5, leading=15, textColor=MUTED,
                      spaceAfter=14),
    "h2": style("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
                spaceBefore=16, spaceAfter=3),
    "h2sub": style("h2sub", fontSize=9, leading=12.5, textColor=MUTED,
                   spaceAfter=9),
    "body": style("body"),
    "q": style("q", fontName="Helvetica-Bold", fontSize=10, leading=14,
               spaceBefore=9, spaceAfter=3),
    "quote": style("quote", fontName="Helvetica-Oblique", fontSize=9,
                   leading=12.5, textColor=MUTED, leftIndent=8, rightIndent=8,
                   spaceBefore=3, spaceAfter=3),
    "need": style("need", fontSize=9.5, leading=13, leftIndent=11,
                  spaceAfter=2),
    "small": style("small", fontSize=8.5, leading=11.5, textColor=MUTED),
    "cell": style("cell", fontSize=9, leading=12, spaceAfter=0),
    "cellb": style("cellb", fontName="Helvetica-Bold", fontSize=9, leading=12,
                   spaceAfter=0),
}


def quote(text, where, verbatim=True):
    """A sentence published on the site, or a note that none exists.

    Only genuinely quoted copy gets quotation marks. The document says its
    quotations are verbatim, so a paraphrase must not be dressed as one.
    """
    body = f'&ldquo;{text}&rdquo;' if verbatim else text
    p = Paragraph(body, S["quote"])
    loc = Paragraph(where, S["small"])
    t = Table([[p], [loc]], colWidths=[6.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), QUOTE_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
    ]))
    return t


def question(n, q, said, where, needs, verbatim=True):
    """One numbered question: the ask, the live claim, what answers it."""
    flow = [Paragraph(f"{n}. {q}", S["q"])]
    if said:
        flow += [quote(said, where, verbatim), Spacer(1, 5)]
    for need in needs:
        flow.append(Paragraph(f"&bull;&nbsp;&nbsp;{need}", S["need"]))
    flow.append(Spacer(1, 3))
    return KeepTogether(flow)


def section(title, sub):
    return [Paragraph(title, S["h2"]), Paragraph(sub, S["h2sub"])]


story = []

# ---------------------------------------------------------------- header
story.append(Paragraph("Methodology: open questions", S["title"]))
story.append(Paragraph(
    "Questions the research team needs to answer before the methodology page "
    "can support a procurement review. Prepared 7 September 2026.",
    S["subtitle"]))

story.append(Paragraph(
    "Every question below is anchored to a sentence published on lumecon.ai "
    "today. The site currently states these as settled; the documentation "
    "behind them is not on the page. That gap is the whole agenda. A city "
    "manager will accept the screenshots. The economist or procurement "
    "officer asked to defend the purchase will ask these.",
    S["body"]))
story.append(Paragraph(
    "An answer is complete when a reviewer outside Lumecon could reproduce "
    "or challenge it. &ldquo;We use a standard approach&rdquo; is not an "
    "answer; the parameter, the source, the sample and the test are.",
    S["body"]))

# --------------------------------------------------- A. parameters
story += section(
    "A. Parameters and procedures that are asserted but not specified",
    "The page names a method, then stops before the number a reviewer would check.")

story.append(question(
    1,
    "How is the Flegg exponent calibrated, and against what?",
    "The exponent δ sets how strongly regional smallness discounts local "
    "purchasing. It is calibrated against observed regional data rather than "
    "fixed by assumption.",
    "/methodology, Eq. 04 caption",
    [
        "Which observed data: which series, which years, which geographies.",
        "What is being fit, and what the objective function minimises.",
        "The sample: how many regions, of what sizes and industry mixes.",
        "The resulting value or range of δ, and how it varies by region size.",
        "How it was validated out of sample, and what the error was.",
    ]))

story.append(question(
    2,
    "Which control totals does RAS converge on?",
    "R and S are diagonal scaling matrices, updated each round until the "
    "regional table converges on its control totals.",
    "/methodology, Eq. 05 caption",
    [
        "Name the row and column totals: regional output by sector, employment, "
        "value added, final demand, or some combination.",
        "Their source and vintage.",
        "The convergence criterion and iteration cap.",
        "What happens when it fails to converge, and whether the analysis stops.",
    ]))

story.append(question(
    3,
    "What is the stated hierarchy for wage fallback?",
    "Where a suppressed sector clearly exists in the region, its employment is "
    "estimated from wider employment-per-establishment patterns, and wages fall "
    "back through a stated hierarchy of sources.",
    "/methodology, Suppressed and small-area data",
    [
        "The hierarchy itself, in order. The page says it is stated; it is not.",
        "&ldquo;Wider patterns&rdquo; at what level: state, division, national, "
        "same NAICS, neighbouring counties.",
        "How &ldquo;clearly exists&rdquo; is decided, and what happens when it "
        "is ambiguous.",
        "Whether estimated values carry bounds, and whether those reach the "
        "result the customer sees.",
    ]))

story.append(question(
    4,
    "Which higher-frequency series update which model quantities?",
    "Between benchmarks, higher-frequency public series for employment, wages "
    "and prices keep the model close to present conditions.",
    "/methodology, Between benchmarks",
    [
        "A mapping: series to quantity to transformation.",
        "Whether they update levels only, or also the structural coefficients.",
        "How a benchmark revision reconciles against values already updated.",
        "Whether two analyses run months apart on the same activity can differ, "
        "and by how much.",
    ]))

story.append(question(
    5,
    "What defines a credible multiplier range, and what happens outside it?",
    "Validation flags any multiplier outside the ranges credible for an economy "
    "of that size and composition.",
    "/methodology, validation",
    [
        "How the ranges were established: literature, internal estimation, or "
        "comparison against another model.",
        "Whether &ldquo;flags&rdquo; means warns, blocks, or silently adjusts.",
        "Who sees the flag: the analyst, Lumecon, or nobody.",
        "This connects to a separate claim that a run failing a critical check "
        "stops. Confirm which checks are blocking.",
    ]))

story.append(question(
    6,
    "How is the government account closed?",
    "A government account that collects taxes and returns them as procurement "
    "and transfers.",
    "/methodology, induced effects",
    [
        "Which flows are endogenous and which are exogenous.",
        "The marginal propensities used, and their source.",
        "What prevents circular amplification between the household and "
        "government accounts.",
        "Whether this is a Type II or a SAM multiplier, and how it is labelled "
        "to the customer.",
        "Endogenising government is a defensible choice, but it raises induced "
        "effects and reviewers will ask why the number is higher than IMPLAN's "
        "default.",
    ]))

# --------------------------------------------------- B. definitions
story += section(
    "B. Definitions the site reports as headline numbers but does not define",
    "These appear on every results page. A reviewer cannot check a number whose unit is unstated.")

story.append(question(
    7,
    "What is a job?",
    "The count of jobs supported by the activity across the direct, indirect "
    "and induced layers over the analysis period. It is a job count; where a "
    "conversion basis matters, the analysis states it.",
    "/methodology and /glossary, Jobs supported",
    [
        "Headcount, full-time equivalent, annual average, or job-years. The "
        "current wording avoids choosing.",
        "How part-time and seasonal work is counted.",
        "For construction, whether a two-year build reports one number or two.",
        "This is the single most contested number in public economic impact "
        "work and the definition has to be on the page.",
    ]))

story.append(question(
    8,
    "How are tax impacts estimated?",
    "Tax impacts are one of the five headline results on every analysis. "
    "There is no tax methodology anywhere on the site to quote.",
    "No corresponding copy exists — this is the gap",
    [
        "Which taxes, at which levels of government.",
        "Incidence assumptions.",
        "Whether rates are effective or statutory, and their source and year.",
        "How tribal government taxation is handled, given it is a named "
        "capability.",
    ], verbatim=False))

story.append(question(
    9,
    "What price year do results carry?",
    "Historical analyses run from 2015 to present where the data support it.",
    "/methodology, data vintages",
    [
        "Whether results are in current or constant dollars, and which deflator.",
        "Which year's industrial structure a 2015 analysis uses: 2015's or today's.",
        "How changing county and reservation boundaries are handled across that "
        "span.",
        "A historical comparison that silently mixes a past activity year with "
        "present-day relationships is the kind of error that ends a "
        "credibility argument.",
    ]))

# --------------------------------------------------- C. limitations
story += section(
    "C. Limitations the page does not state",
    "A defensible methodology makes its boundaries easy to find. These are the standard "
    "objections in public economic impact work, and the page currently answers none of them.")

lim = [
    ("Gross versus net", "Whether results are gross activity or net of what "
     "would have happened anyway."),
    ("Displacement and substitution", "Whether the analysis accounts for "
     "activity displaced from elsewhere in the region."),
    ("Opportunity cost", "Whether the alternative use of public funds is "
     "considered."),
    ("Construction versus operations", "How one-time construction is separated "
     "from recurring operations, and over what period."),
    ("Capital and margins", "How capital purchases and retail margins are "
     "treated."),
    ("Commuting and residence", "Whether induced effects account for workers "
     "living outside the region."),
    ("Imports and leakage", "How leakage is imposed beyond the purchase "
     "coefficient."),
    ("Double counting", "How overlapping projects or nested geographies are "
     "handled, particularly the state and homelands scopes shown side by side."),
    ("Uncertainty", "Whether any sensitivity or confidence range is available, "
     "and if not, what a reviewer should say instead."),
    ("Appropriate use", "What this model should not be used for: cost-benefit, "
     "fiscal impact, distributional analysis, causal evaluation."),
]
rows = [[Paragraph("<b>Limitation</b>", S["cellb"]),
         Paragraph("<b>What the page must say</b>", S["cellb"])]]
rows += [[Paragraph(a, S["cellb"]), Paragraph(b, S["cell"])] for a, b in lim]
t = Table(rows, colWidths=[1.75 * inch, 4.85 * inch], repeatRows=1)
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, 0), 0.9, INK),
    ("LINEBELOW", (0, 1), (-1, -2), 0.4, RULE),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
]))
story.append(t)
story.append(Spacer(1, 4))
story.append(Paragraph(
    "The ask is not to solve these. It is to decide, for each, whether Lumecon "
    "handles it, does not handle it, or handles it partially, and to write the "
    "sentence that says so.", S["body"]))

# --------------------------------------------------- D. review
story += section(
    "D. Two questions that are not about the model",
    "Both come up in procurement and neither is a research question, but the research team owns the answer.")

story.append(question(
    10,
    "Who has reviewed the methodology, and can we say so?",
    "Built by economists, engineers and researchers with experience at the "
    "Federal Reserve and leading universities.",
    "Homepage, The Lumecon edge",
    [
        "Named people and institutions, or the claim should come off the site. "
        "Anonymous prestige reads as marketing.",
        "Whether any outside economist has reviewed the model, and whether they "
        "will be cited.",
        "Whether a technical appendix or working paper can be published. This "
        "is the strongest single thing available for winning a sceptical "
        "reviewer, and it does not exist yet.",
    ]))

story.append(question(
    11,
    "What can the model actually analyse today?",
    "The site says &ldquo;measure the economic impact of any decision&rdquo; "
    "and &ldquo;every supported U.S. geography&rdquo;. Neither has a stated "
    "boundary.",
    "Homepage hero and throughout — quoted fragments within a summary",
    [
        "Which analysis types are live rather than planned.",
        "Which geographies are genuinely supported, including whether every "
        "reservation and trust land is covered or only those with sufficient "
        "data.",
        "What happens when a region is too small or too suppressed to model, "
        "and what the customer is told.",
        "This is the boundary between current capability and roadmap, and it "
        "runs through most of the site's overclaiming.",
    ], verbatim=False))

# --------------------------------------------------- close
story += section("What a good outcome from tomorrow looks like",
                 "Not all eleven answered. Three decisions made.")
for a, b in [
    ("Own each question.", "A name against each of the eleven, and a date. Several "
     "are a paragraph of writing, not new research."),
    ("Decide what is publishable.", "Some answers belong on the page, some in a "
     "downloadable technical appendix, some only in an RFP response. Sort them now "
     "rather than per-question later."),
    ("Agree the limitations section in principle.", "Section C is the highest-value "
     "and lowest-cost item on this list. It needs a decision that Lumecon will publish "
     "its boundaries, and one person to draft it."),
]:
    story.append(Paragraph(f"<b>{a}</b> {b}", S["body"]))

story.append(Spacer(1, 10))
story.append(Paragraph(
    "Prepared from the methodology, NAICS and homepage copy live on lumecon.ai "
    "on 7 September 2026, and from an external review of the full site copy. "
    "Blocks in quotation marks are verbatim from the site; the two that are "
    "not carry a note saying what they are instead.", S["small"]))


# ---------------------------------------------------------------- render
def furniture(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.95 * inch, 0.62 * inch,
                      "Lumecon · Methodology open questions · internal")
    canvas.drawRightString(LETTER[0] - 0.95 * inch, 0.62 * inch,
                           str(canvas.getPageNumber()))
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(0.95 * inch, 0.8 * inch, LETTER[0] - 0.95 * inch, 0.8 * inch)
    canvas.restoreState()


doc = BaseDocTemplate(OUT, pagesize=LETTER,
                      leftMargin=0.95 * inch, rightMargin=0.95 * inch,
                      topMargin=0.85 * inch, bottomMargin=1.0 * inch,
                      title="Lumecon methodology: open questions",
                      author="Lumecon Inc.",
                      subject="Questions for the research team")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=furniture)])
doc.build(story)
print("wrote", OUT)
