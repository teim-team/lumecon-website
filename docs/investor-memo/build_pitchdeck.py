#!/usr/bin/env python3
"""
Lumecon pitch deck. 15 landscape slides modeled after the LIRA
deck the founder uses as a reference. Same structural moves
(navy tag label, big bold headline, card layouts, hero photos)
adapted to the Lumecon brand (teal accent, navy text, Inter type,
seal mark).

Image placeholders are explicit: every spot where a real photo or
product screenshot belongs is labeled with the slot name so the
founder can drop assets in later.

Run:    python3 docs/investor-memo/build_pitchdeck.py
Output: docs/investor-memo/lumecon-pitch-deck.pdf
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Flowable,
)

HERE = Path(__file__).parent
REPO = HERE.parent.parent
FONTS = HERE / "fonts"
PDF = HERE / "lumecon-pitch-deck.pdf"
SEAL = REPO / "public" / "brand" / "lumecon-logo-mark-transparent.png"

# ---- Fonts ----
for name, fname in [
    ("Inter", "Inter-Regular.ttf"),
    ("Inter-Medium", "Inter-Medium.ttf"),
    ("Inter-SemiBold", "Inter-SemiBold.ttf"),
    ("Inter-Bold", "Inter-Bold.ttf"),
    ("Spectral-Italic", "Spectral-Italic.ttf"),
]:
    try:
        pdfmetrics.registerFont(TTFont(name, str(FONTS / fname)))
    except Exception:
        pass
registerFontFamily("Inter",
    normal="Inter", bold="Inter-Bold",
    italic="Spectral-Italic", boldItalic="Inter-Bold")

# ---- Slide geometry (16:9 widescreen) ----
SLIDE_W = 13.33 * inch
SLIDE_H = 7.5 * inch
MARGIN = 0.55 * inch
CONTENT_W = SLIDE_W - 2 * MARGIN
CONTENT_H = SLIDE_H - 2 * MARGIN

# ---- Brand palette ----
NAVY        = HexColor("#0A0F26")
INK         = HexColor("#0A0F26")
INK_2       = HexColor("#353B5C")
INK_3       = HexColor("#6B6F8A")
INK_4       = HexColor("#9DA1B5")
GOLD        = HexColor("#F0A91A")
ACCENT      = HexColor("#0FB5A5")
ACCENT_DEEP = HexColor("#0A8A7E")
ACCENT_LIGHT = HexColor("#86D2C5")
ACCENT_BAR  = HexColor("#B8EDE6")
TEAL_BG_SOFT   = HexColor("#EAF7F4")
TEAL_BG_MEDIUM = HexColor("#D5EFEC")
TEAL_BG_DEEP   = HexColor("#C9EAE3")
RULE        = HexColor("#E8E8EE")
RULE_SOFT   = HexColor("#F2F4F7")
PAPER       = colors.white
SLIDE_BG    = HexColor("#FCFCFC")
TILE_BG     = HexColor("#F4F8FA")

MOAT_SHADES = [
    HexColor("#EAF7F4"),
    HexColor("#C9EAE3"),
    HexColor("#86D2C5"),
    HexColor("#39B7A4"),
    HexColor("#0A8A7E"),
]


def ps(name, **kw):
    base = dict(fontName="Inter", fontSize=11, leading=15, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


# ---- Custom flowables ----
class NavyTag(Flowable):
    """Pill-shaped navy tag label, mirrors LIRA's 'Problem' /
    'Solution' / 'Market Opportunity' tags. Small white text on a
    navy rounded rectangle."""

    def __init__(self, text, font_size=9):
        Flowable.__init__(self)
        self.text = text.upper()
        self.font_size = font_size
        text_w = pdfmetrics.stringWidth(self.text, "Inter-SemiBold",
                                          font_size)
        self.pad_x = 12
        self.pad_y = 6
        self.w = text_w + 2 * self.pad_x
        self.h = font_size + 2 * self.pad_y

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        c.setFillColor(NAVY)
        c.setStrokeColor(NAVY)
        c.roundRect(0, 0, self.w, self.h, self.h / 2,
                    stroke=0, fill=1)
        c.setFillColor(PAPER)
        c.setFont("Inter-SemiBold", self.font_size)
        text_w = pdfmetrics.stringWidth(self.text, "Inter-SemiBold",
                                          self.font_size)
        c.drawString((self.w - text_w) / 2,
                     (self.h - self.font_size) / 2 + 1, self.text)


class ImageSlot(Flowable):
    """Labeled image placeholder. Shows the slot name centrally and
    a thin teal dashed border so the founder can drop real assets in
    later. Use `caption` for an optional one-line description below
    the box. Slot label auto-shrinks to fit the box width."""

    def __init__(self, slot, w, h, caption=None,
                 fill=TEAL_BG_SOFT, border=ACCENT_LIGHT,
                 label_color=ACCENT_DEEP, big=False,
                 show_eyebrow=True):
        Flowable.__init__(self)
        self.slot = slot
        self.w = w
        self.h = h
        self.caption = caption
        self.fill = fill
        self.border = border
        self.label_color = label_color
        self.big = big
        self.show_eyebrow = show_eyebrow

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        c.setFillColor(self.fill)
        c.setStrokeColor(self.border)
        c.setLineWidth(0.8)
        c.setDash(4, 3)
        c.roundRect(0, 0, self.w, self.h, 10, stroke=1, fill=1)
        c.setDash(1, 0)

        # Auto-shrink the slot label so it never overflows the box.
        # Target width is the box minus 16pt of horizontal breathing
        # room on each side.
        target_w = self.w - 24
        ideal_size = 18 if self.big else 12
        s_label = self.slot.upper()
        slot_size = ideal_size
        for size in (ideal_size, 16, 14, 12, 11, 10, 9, 8, 7):
            if pdfmetrics.stringWidth(s_label, "Inter-Bold",
                                        size) <= target_w:
                slot_size = size
                break

        # Skip the eyebrow when the box is too small to fit both rows
        # of text comfortably (avatar tiles).
        show_eb = self.show_eyebrow and self.h >= 60

        if show_eb:
            eyebrow = "IMAGE  ·  PLACEHOLDER"
            eyebrow_size = 8 if self.big else 7
            c.setFillColor(self.label_color)
            c.setFont("Inter-SemiBold", eyebrow_size)
            eb_w = pdfmetrics.stringWidth(eyebrow, "Inter-SemiBold",
                                            eyebrow_size)
            c.drawString((self.w - eb_w) / 2,
                         self.h / 2 + slot_size / 2 + 6, eyebrow)

        c.setFillColor(NAVY)
        c.setFont("Inter-Bold", slot_size)
        s_w = pdfmetrics.stringWidth(s_label, "Inter-Bold", slot_size)
        c.drawString((self.w - s_w) / 2,
                     self.h / 2 - slot_size / 2 - 2, s_label)

        if self.caption and self.h >= 80:
            c.setFillColor(INK_3)
            c.setFont("Inter", 8)
            cap_w = pdfmetrics.stringWidth(self.caption, "Inter", 8)
            c.drawString((self.w - cap_w) / 2,
                         self.h / 2 - slot_size - 16, self.caption)


class FullBleedImage(Flowable):
    """Hero-image full-bleed placeholder. Fills the entire slide
    canvas. Use for the cover and the value-proposition / closing
    slides where LIRA uses a large photograph."""

    def __init__(self, slot, w, h, gradient=True):
        Flowable.__init__(self)
        self.slot = slot
        self.w = w
        self.h = h
        self.gradient = gradient

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        # Soft teal base
        c.setFillColor(TEAL_BG_SOFT)
        c.rect(0, 0, self.w, self.h, stroke=0, fill=1)
        if self.gradient:
            # Subtle darker corner so it doesn't read as a flat fill
            c.setFillColor(TEAL_BG_MEDIUM)
            c.rect(0, 0, self.w * 0.55, self.h, stroke=0, fill=1)

        # Centered placeholder label
        c.setFillColor(NAVY)
        c.setFont("Inter-Bold", 28)
        s_w = pdfmetrics.stringWidth(self.slot.upper(),
                                       "Inter-Bold", 28)
        c.drawString((self.w - s_w) / 2,
                     self.h / 2 + 8, self.slot.upper())
        c.setFillColor(ACCENT_DEEP)
        c.setFont("Inter-SemiBold", 11)
        sub = "IMAGE  ·  FULL-BLEED PLACEHOLDER"
        sub_w = pdfmetrics.stringWidth(sub, "Inter-SemiBold", 11)
        c.drawString((self.w - sub_w) / 2,
                     self.h / 2 - 18, sub)


class RaiseBadge(Flowable):
    """White rounded badge on the cover saying 'Raising $100K' in a
    style that mirrors LIRA's cover badge."""

    def __init__(self, text, font_size=11):
        Flowable.__init__(self)
        self.text = text
        self.font_size = font_size
        text_w = pdfmetrics.stringWidth(text, "Inter-SemiBold",
                                          font_size)
        self.pad_x = 14
        self.pad_y = 8
        self.w = text_w + 2 * self.pad_x
        self.h = font_size + 2 * self.pad_y

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        c.setFillColor(PAPER)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.6)
        c.roundRect(0, 0, self.w, self.h, 6, stroke=1, fill=1)
        c.setFillColor(NAVY)
        c.setFont("Inter-SemiBold", self.font_size)
        text_w = pdfmetrics.stringWidth(self.text, "Inter-SemiBold",
                                          self.font_size)
        c.drawString((self.w - text_w) / 2,
                     (self.h - self.font_size) / 2 + 1, self.text)


# ---- Page decoration ----
_PAGE_NUM = [0]
_TOTAL_SLIDES = 15


def make_page_decoration(slide_no, full_bleed=False):
    def decoration(canvas, doc):
        canvas.saveState()
        if not full_bleed:
            # Slide background fill
            canvas.setFillColor(SLIDE_BG)
            canvas.rect(0, 0, SLIDE_W, SLIDE_H, stroke=0, fill=1)
        # Footer: Lumecon mark bottom-left, "Confidential | N" bottom-right
        if not full_bleed:
            try:
                size = 0.32 * inch
                canvas.drawImage(str(SEAL),
                                 MARGIN, MARGIN - 8,
                                 width=size, height=size,
                                 mask="auto")
                canvas.setFont("Inter-Bold", 8.5)
                canvas.setFillColor(NAVY)
                canvas.drawString(MARGIN + size + 6,
                                  MARGIN - 8 + 11, "LUMECON")
            except Exception:
                pass
        # Page number bottom-right
        canvas.setFillColor(INK_3)
        canvas.setFont("Inter", 8.5)
        page_text = f"Confidential  |  {slide_no}"
        canvas.drawRightString(SLIDE_W - MARGIN, MARGIN - 2,
                               page_text)
        canvas.restoreState()
    return decoration


# ---- Slide helpers ----
def stack(flowables, col_w):
    """Helper: stack a list of flowables vertically into a single
    Table with one cell per row. Used to compose multi-element
    columns (e.g. tag + headline + grid) into a single placeable
    flowable so we can lay them out side-by-side."""
    t = Table([[fl] for fl in flowables], colWidths=[col_w])
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def slide_header(tag_text, headline, headline_size=32,
                 headline_color=NAVY, top_y=None):
    """A NavyTag followed by a big bold headline. Returns the flowables
    in order. The headline is rendered as a Paragraph in Inter-Bold."""
    head_style = ps("h", fontName="Inter-Bold",
                    fontSize=headline_size,
                    leading=int(headline_size * 1.08),
                    textColor=headline_color, spaceBefore=10,
                    spaceAfter=0)
    return [NavyTag(tag_text), Spacer(1, 14), Paragraph(headline, head_style)]


def navy_card(title, body, w, h, accent_top=True,
              title_size=12, body_size=9):
    """White card with optional teal top accent. Used in 2x2 and 3x2
    card grids on multiple slides."""
    title_p = Paragraph(title,
        ps(f"nc-t-{title[:6]}", fontName="Inter-Bold",
           fontSize=title_size, leading=title_size + 3,
           textColor=NAVY, spaceAfter=4))
    body_p = Paragraph(body,
        ps(f"nc-b-{title[:6]}", fontName="Inter",
           fontSize=body_size, leading=body_size + 3,
           textColor=INK_2))
    inner = Table([[title_p], [body_p]], colWidths=[w - 24])
    inner.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    outer = Table([[inner]], colWidths=[w], rowHeights=[h])
    styles = [
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    if accent_top:
        styles.append(("LINEABOVE", (0, 0), (-1, 0), 2, ACCENT))
    outer.setStyle(TableStyle(styles))
    return outer


def numbered_card(num, title, body, w, h, with_image_slot=None):
    """Card with a numbered badge (01, 02 etc.), a title and body.
    Optionally includes an ImageSlot at the top half of the card."""
    num_p = Paragraph(num,
        ps(f"ny-n-{num}", fontName="Inter-Bold", fontSize=10,
           leading=12, textColor=ACCENT_DEEP, spaceAfter=4))
    title_p = Paragraph(title,
        ps(f"ny-t-{num}", fontName="Inter-Bold", fontSize=12,
           leading=15, textColor=NAVY, spaceAfter=4))
    body_p = Paragraph(body,
        ps(f"ny-b-{num}", fontName="Inter", fontSize=8.5,
           leading=11.5, textColor=INK_2))

    rows = []
    if with_image_slot:
        rows.append([ImageSlot(with_image_slot, w - 24, h * 0.45,
                                fill=PAPER, border=RULE,
                                label_color=INK_3)])
    rows.append([num_p])
    rows.append([title_p])
    rows.append([body_p])
    inner = Table(rows, colWidths=[w - 24])
    inner.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    outer = Table([[inner]], colWidths=[w], rowHeights=[h])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return outer


# ---- Slide 1: Cover ----
def slide_01_cover():
    """Cover content is drawn entirely on the canvas. Returns a
    sentinel spacer so platypus has something to place on the page."""
    return [Spacer(1, SLIDE_H - 2 * MARGIN)]


def draw_cover_overlay(canvas, doc):
    """Cover slide: full-bleed teal hero background + Lumecon logo,
    tagline, raise badge, and confidential strip."""
    canvas.saveState()
    # Hero background — soft teal gradient suggestion (placeholder for
    # a real photo). When the founder has a real cover image they can
    # drop it in here.
    canvas.setFillColor(TEAL_BG_MEDIUM)
    canvas.rect(0, 0, SLIDE_W, SLIDE_H, stroke=0, fill=1)
    canvas.setFillColor(TEAL_BG_SOFT)
    canvas.rect(SLIDE_W * 0.55, 0, SLIDE_W * 0.45, SLIDE_H,
                stroke=0, fill=1)

    # Hero placeholder note in upper-right
    canvas.setFillColor(ACCENT_DEEP)
    canvas.setFont("Inter-SemiBold", 8.5)
    canvas.drawRightString(SLIDE_W - MARGIN,
                            SLIDE_H - MARGIN - 4,
                            "IMAGE  ·  COVER HERO PLACEHOLDER")

    # Lumecon mark + wordmark
    try:
        size = 0.65 * inch
        canvas.drawImage(str(SEAL), MARGIN, SLIDE_H * 0.46,
                          width=size, height=size, mask="auto")
        canvas.setFont("Inter-Bold", 26)
        canvas.setFillColor(NAVY)
        canvas.drawString(MARGIN + size + 14, SLIDE_H * 0.46 + 21,
                          "LUMECON")
    except Exception:
        pass

    # Tagline
    canvas.setFont("Inter-Bold", 28)
    canvas.setFillColor(NAVY)
    canvas.drawString(MARGIN, SLIDE_H * 0.34,
                       "Make the economically invisible visible.")
    canvas.setFont("Inter", 13)
    canvas.setFillColor(INK_2)
    canvas.drawString(MARGIN, SLIDE_H * 0.27,
                       "Software-first economic impact infrastructure "
                       "for governments, tribal nations,")
    canvas.drawString(MARGIN, SLIDE_H * 0.235,
                       "enterprises, and mission-driven organizations.")

    # Raise badge upper-right
    badge_text = "Raising $100K"
    canvas.setFont("Inter-SemiBold", 12)
    text_w = pdfmetrics.stringWidth(badge_text, "Inter-SemiBold", 12)
    bx = SLIDE_W - MARGIN - text_w - 32
    by = SLIDE_H * 0.46
    bw = text_w + 32
    bh = 32
    canvas.setFillColor(PAPER)
    canvas.setStrokeColor(NAVY)
    canvas.setLineWidth(1.2)
    canvas.roundRect(bx, by, bw, bh, 6, stroke=1, fill=1)
    canvas.setFillColor(NAVY)
    canvas.drawString(bx + 16, by + 11, badge_text)

    # Confidential strip bottom-right
    canvas.setFont("Inter-SemiBold", 9.5)
    canvas.setFillColor(INK_3)
    canvas.drawRightString(SLIDE_W - MARGIN, MARGIN + 14,
                            "PRE-SEED ROUND  ·  CONFIDENTIAL")

    # Lumecon URL bottom-left
    canvas.setFont("Inter", 9.5)
    canvas.setFillColor(INK_3)
    canvas.drawString(MARGIN, MARGIN + 14,
                       "lumecon.ai  ·  Summer 2026")
    canvas.restoreState()


# ---- Slide 2: Problem ----
def slide_02_problem():
    """Left: tag + headline + 4 problem cards in 2x2. Right: image
    placeholder for a photograph that captures the problem (sticky
    notes, paperwork, a desktop monitor running legacy software)."""
    left_w = CONTENT_W * 0.55
    right_w = CONTENT_W * 0.40
    gap_w = CONTENT_W * 0.05

    cards = [
        ("Months-Long Projects",
         "Every study takes a quarter to a year. Time is the binding cost, "
         "not modeling capacity."),
        ("Five-Figure Per Study",
         "Practical cost runs $25,000 to $100,000 once software, consulting, "
         "and staff time are added together."),
        ("Black-Box Assumptions",
         "Reports cite multipliers without surfacing the choices behind them. "
         "Defending the number is the analyst's burden."),
        ("Stagnant Incumbents",
         "IMPLAN and REMI predate the cloud. The category waits for one of "
         "them to modernize or for a new entrant to do it."),
    ]
    card_w = (left_w - 12) / 2
    card_h = (CONTENT_H * 0.55) / 2
    card_rows = [
        [navy_card(*cards[0], w=card_w, h=card_h),
         navy_card(*cards[1], w=card_w, h=card_h)],
        [navy_card(*cards[2], w=card_w, h=card_h),
         navy_card(*cards[3], w=card_w, h=card_h)],
    ]
    cards_grid = Table(card_rows,
                        colWidths=[card_w + 6, card_w + 6],
                        rowHeights=[card_h + 8, card_h + 8])
    cards_grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    left_col = stack(
        slide_header("Problem",
                      "Economic Impact Analysis is Stuck in the 90s.",
                      headline_size=30) +
        [Spacer(1, 24), cards_grid],
        col_w=left_w,
    )
    right_col = ImageSlot("Legacy workflow",
                            right_w, CONTENT_H * 0.85,
                            caption=("Suggested: photo of paperwork / "
                                      "spreadsheets / consultant"),
                            big=True)
    layout = Table([[left_col, "", right_col]],
                    colWidths=[left_w, gap_w, right_w])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [layout]


# ---- Slide 3: Solution ----
def slide_03_solution():
    """Headline + 4 numbered image cards in a row for the Cedar
    workflow: source intake -> harmonize -> assumption ledger -> deliverable."""
    header = slide_header("Solution",
                            "Source Intake. Harmonize. Defend. Deliver.",
                            headline_size=30)
    steps = [
        ("01", "Source Intake",
         "PDFs, CSVs, XLSX files dropped into Cedar. Every field extracted "
         "and typed.",
         "Cedar upload"),
        ("02", "Harmonize",
         "Inputs structured against public datasets. Geographies, sectors, "
         "and time windows resolved automatically.",
         "Cedar harmonize"),
        ("03", "Assumption Ledger",
         "Every modeling choice surfaces for analyst sign-off. Override, "
         "annotate, or approve in place.",
         "Assumption ledger"),
        ("04", "Branded Deliverable",
         "Report, deck, and executive summary export with the customer's "
         "visual identity and the assumption record attached.",
         "Branded export"),
    ]
    n = len(steps)
    gap = 12
    card_w = (CONTENT_W - gap * (n - 1)) / n
    card_h = CONTENT_H * 0.55

    cells = []
    for num, title, body, slot in steps:
        cells.append(numbered_card(num, title, body, card_w, card_h,
                                     with_image_slot=slot))
    row = Table([cells],
                 colWidths=[card_w + (gap if i < n - 1 else 0)
                            for i in range(n)])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header + [Spacer(1, 28), row]


# ---- Slide 4: Product ----
def slide_04_product():
    """Left: 6 numbered platform cards in 2x3. Right: product mockup
    placeholder."""
    left_w = CONTENT_W * 0.55
    right_w = CONTENT_W * 0.40
    gap_w = CONTENT_W * 0.05

    items = [
        ("01", "Local",
         "Cities, counties, and state agencies. Tier ladder ships 2026."),
        ("02", "Tribal",
         "Tribal governments, enterprises, and Native organizations. "
         "Same engine, sovereign-aware geographies."),
        ("03", "Cedar",
         "AI workflow inside Sapling and Tree tiers. Source intake, "
         "harmonization, assumption tracking."),
        ("04", "Cedar Grove",
         "Organizational intelligence layer (2027). Harmonized customer "
         "memory across every study."),
        ("05", "Global",
         "Cross-border and supply-chain analysis (2028). Same backbone, "
         "international geographies."),
        ("06", "RIMS II / IMPLAN-Class Engine",
         "Underneath the AI layer: a credible regional input-output engine "
         "re-parameterized for complex jurisdictions."),
    ]
    card_w = (left_w - 12) / 2
    card_h = (CONTENT_H * 0.55) / 3
    rows = []
    for i in range(0, len(items), 2):
        rows.append([
            navy_card(f"{items[i][0]}  {items[i][1]}", items[i][2],
                       card_w, card_h),
            navy_card(f"{items[i+1][0]}  {items[i+1][1]}", items[i+1][2],
                       card_w, card_h),
        ])
    grid = Table(rows,
                  colWidths=[card_w + 6, card_w + 6],
                  rowHeights=[card_h + 8] * len(rows))
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    left_col = stack(
        slide_header("Product",
                      "Three Platforms. One Engine. One Ladder.",
                      headline_size=30) +
        [Spacer(1, 22), grid],
        col_w=left_w,
    )
    right_col = ImageSlot("Lumecon dashboard",
                            right_w, CONTENT_H * 0.85,
                            caption=("Suggested: product screenshot — "
                                      "completed study workspace"),
                            big=True)
    layout = Table([[left_col, "", right_col]],
                    colWidths=[left_w, gap_w, right_w])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [layout]


# ---- Slide 5: Value Proposition (full-bleed hero) ----
def slide_05_value_proposition():
    """Hero image placeholder + overlaid headline and benefits.
    Drawn entirely on the canvas."""
    return [Spacer(1, SLIDE_H - 2 * MARGIN)]


def draw_value_prop_overlay(canvas, doc):
    canvas.saveState()
    # Hero background
    canvas.setFillColor(TEAL_BG_SOFT)
    canvas.rect(0, 0, SLIDE_W, SLIDE_H, stroke=0, fill=1)
    # Subtle darker stripe right side
    canvas.setFillColor(TEAL_BG_MEDIUM)
    canvas.rect(SLIDE_W * 0.55, 0, SLIDE_W * 0.45, SLIDE_H,
                stroke=0, fill=1)
    canvas.setFillColor(ACCENT_DEEP)
    canvas.setFont("Inter-SemiBold", 8.5)
    canvas.drawRightString(SLIDE_W - MARGIN,
                            SLIDE_H - MARGIN - 4,
                            "IMAGE  ·  VALUE-PROP HERO PLACEHOLDER")

    # Tag and headline
    tag_h = 26
    tag_w = 90
    canvas.setFillColor(NAVY)
    canvas.roundRect(MARGIN, SLIDE_H - MARGIN - tag_h - 6,
                      tag_w, tag_h, tag_h / 2,
                      stroke=0, fill=1)
    canvas.setFillColor(PAPER)
    canvas.setFont("Inter-SemiBold", 9)
    canvas.drawString(MARGIN + 14,
                       SLIDE_H - MARGIN - tag_h + 4,
                       "VALUE PROPOSITION")

    canvas.setFillColor(NAVY)
    canvas.setFont("Inter-Bold", 40)
    canvas.drawString(MARGIN, SLIDE_H * 0.72,
                       "Built for the Hardest")
    canvas.drawString(MARGIN, SLIDE_H * 0.65,
                       "Geography First.")
    canvas.setFont("Inter", 14)
    canvas.setFillColor(INK_2)
    canvas.drawString(MARGIN, SLIDE_H * 0.58,
                       "Tribal economies force the hardest version of "
                       "every modeling problem.")
    canvas.drawString(MARGIN, SLIDE_H * 0.545,
                       "The infrastructure that solves them deploys "
                       "directly into the rest of the market.")

    # 3 check benefits
    benefits = [
        ("Sovereign-Aware Geographies",
         "Reservations, trust lands, ANC regions, and Native Hawaiian "
         "Home Lands as first-class objects."),
        ("Defensible Assumptions",
         "Every multiplier and every modeling choice surfaced for "
         "analyst sign-off before export."),
        ("Recurring Refresh",
         "One subscription, unlimited studies, quarterly refresh "
         "without reopening a contract."),
    ]
    y0 = SLIDE_H * 0.30
    for i, (title, body) in enumerate(benefits):
        bx = MARGIN
        by = y0 - i * 0.50 * inch
        canvas.setFillColor(ACCENT)
        canvas.circle(bx + 9, by + 6, 9, stroke=0, fill=1)
        canvas.setFillColor(PAPER)
        canvas.setFont("Inter-Bold", 10)
        canvas.drawString(bx + 5.5, by + 2.5, "✓")
        canvas.setFillColor(NAVY)
        canvas.setFont("Inter-Bold", 12.5)
        canvas.drawString(bx + 28, by + 4, title)
        canvas.setFillColor(INK_2)
        canvas.setFont("Inter", 10)
        canvas.drawString(bx + 260, by + 4, body)
    canvas.restoreState()


# ---- Slide 6: Market Opportunity ----
def slide_06_market():
    """TAM/SAM/SOM stacked teal bars + 3 supporting stat blocks."""
    header = slide_header("Market Opportunity",
                            "The Underserved Edge of a Proven Category.",
                            headline_size=30)
    # TAM/SAM/SOM bars
    bars = [
        ("TAM", "1.9M+ U.S. employer firms",
         "Plus 90,837 local governments, 575 tribes, 4,150 colleges, and the "
         "global subnational layer (140+ countries).", TEAL_BG_MEDIUM),
        ("SAM", "$1B+ recurring",
         "Tens of thousands of larger public charities, public-sector "
         "agencies, and tribal organizations carry recurring impact-study "
         "budgets today.", TEAL_BG_DEEP),
        ("SOM", "$25-100M near-term",
         "575 federally recognized tribes + a focused set of cities, "
         "counties, and federal-program offices reachable in the first "
         "24 months.", ACCENT_LIGHT),
    ]
    bar_h = 0.65 * inch
    bar_gap = 6
    bar_rows = []
    for label, headline, body, shade in bars:
        label_p = Paragraph(label,
            ps(f"mk-l-{label}", fontName="Inter-Bold", fontSize=18,
               leading=22, textColor=NAVY, alignment=1))
        head_p = Paragraph(headline,
            ps(f"mk-h-{label}", fontName="Inter-Bold", fontSize=15,
               leading=18, textColor=NAVY, alignment=2))
        body_p = Paragraph(body,
            ps(f"mk-b-{label}", fontName="Inter", fontSize=9,
               leading=12, textColor=INK_2, alignment=2))
        bar = Table(
            [[label_p, "",
              Table([[head_p], [body_p]],
                     colWidths=[CONTENT_W * 0.7 - 30])]],
            colWidths=[1.1 * inch, 14, CONTENT_W * 0.7],
            rowHeights=[bar_h],
        )
        bar.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), shade),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 16),
            ("RIGHTPADDING", (0, 0), (-1, -1), 16),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        bar_rows.append([bar])
    bars_table = Table(bar_rows, colWidths=[CONTENT_W],
                        rowHeights=[bar_h + bar_gap] * 3)
    bars_table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), bar_gap),
    ]))

    # Stat blocks underneath
    stats = [
        ("Existing Demand",
         "IMPLAN serves 900+ clients; Charlesbank acquired a controlling "
         "stake in 2024 for $100M+ at 35% YoY growth (WSJ)."),
        ("Underserved Customers",
         "Most organizations in the addressable set have never run an EIA "
         "because the cost floor is $25K-$100K per study."),
        ("Global Tailwind",
         "Subnational governments manage 40% of public expenditure and 58% "
         "of public investment in OECD countries."),
    ]
    stat_w = (CONTENT_W - 24) / 3
    stat_h = 0.85 * inch
    stat_cells = []
    for title, body in stats:
        title_p = Paragraph(title,
            ps(f"st-h-{title[:6]}", fontName="Inter-Bold", fontSize=10.5,
               leading=13, textColor=NAVY, spaceAfter=4))
        body_p = Paragraph(body,
            ps(f"st-b-{title[:6]}", fontName="Inter", fontSize=8.5,
               leading=11.5, textColor=INK_2))
        cell_inner = Table([[title_p], [body_p]], colWidths=[stat_w - 20])
        cell_inner.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        cell = Table([[cell_inner]], colWidths=[stat_w],
                      rowHeights=[stat_h])
        cell.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEABOVE", (0, 0), (-1, 0), 1.2, ACCENT),
        ]))
        stat_cells.append(cell)
    stats_row = Table([stat_cells],
                       colWidths=[stat_w + 8, stat_w + 8, stat_w])
    stats_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    return header + [Spacer(1, 18), bars_table, Spacer(1, 12), stats_row]


# ---- Slide 7: Competition ----
def slide_07_competition():
    """Checkmark competitor matrix on the left; Key Advantages on right."""
    header = slide_header("Competition",
                            "Built for Modern Workflows, Not Legacy Software.",
                            headline_size=28)
    # Matrix
    cols = ["Modern Stack", "Tribal-Aware",
            "Recurring", "AI-Assisted", "Defensible"]
    rows_data = [
        ("Lumecon",   [True, True, True, True, True]),
        ("IMPLAN",    [False, False, False, False, True]),
        ("REMI",      [False, False, False, False, True]),
        ("Consultants", [False, "partial", False, "partial", True]),
        ("AI-only tools", [True, False, True, True, False]),
    ]
    head_row = [Paragraph("",
        ps("mc-h-", fontName="Inter-SemiBold", fontSize=9))] + [
        Paragraph(h.upper(),
            ps(f"mc-h-{h[:6]}", fontName="Inter-SemiBold", fontSize=8,
               leading=10, textColor=INK_3, alignment=1))
        for h in cols]
    data = [head_row]
    for name, marks in rows_data:
        row = [Paragraph(name,
            ps(f"mc-n-{name[:6]}", fontName="Inter-Bold", fontSize=10,
               leading=12, textColor=NAVY))]
        for m in marks:
            if m is True:
                glyph = "<font color='#0FB5A5'>●</font>"
                size = 15
            elif m is False:
                glyph = "<font color='#D5D7E0'>○</font>"
                size = 15
            else:
                # "Partial" rendered as a small uppercase label since
                # the half-filled circle glyph isn't in Inter.
                glyph = ("<font name='Inter-Bold' size='7' "
                         "color='#A35A0F'>PARTIAL</font>")
                size = 11
            row.append(Paragraph(f'<para align="center">{glyph}</para>',
                ps(f"mc-c-{name[:4]}", fontName="Inter-Bold",
                   fontSize=size, leading=size, alignment=1)))
        data.append(row)
    matrix_w = CONTENT_W * 0.58
    col_w = (matrix_w - 1.4 * inch) / len(cols)
    matrix = Table(data,
                    colWidths=[1.4 * inch] + [col_w] * len(cols))
    matrix.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL_BG_SOFT),
        ("LINEBELOW", (0, 0), (-1, 0), 1, ACCENT),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    advantages = [
        ("Tribal & Native-Economy Expertise",
         "Federal Reserve CICD, NCAI, Native Entity Enterprise dataset."),
        ("Complex-Geography Engine",
         "Sovereign geographies as first-class, not approximations."),
        ("Cedar Grove Memory",
         "Switching cost compounds as studies accumulate."),
        ("AI + Defensible",
         "Cedar surfaces every assumption for human sign-off before export."),
    ]
    adv_rows = []
    for t, b in advantages:
        t_p = Paragraph(t,
            ps(f"ka-t-{t[:6]}", fontName="Inter-Bold", fontSize=10.5,
               leading=13, textColor=NAVY, spaceAfter=2))
        b_p = Paragraph(b,
            ps(f"ka-b-{t[:6]}", fontName="Inter", fontSize=8.5,
               leading=11, textColor=INK_2))
        adv_rows.append([t_p])
        adv_rows.append([b_p])
        adv_rows.append([Spacer(1, 8)])
    adv_tbl = Table(adv_rows,
                     colWidths=[CONTENT_W * 0.38])
    adv_tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    adv_header = NavyTag("Key Advantages")
    right_col = Table([[adv_header], [Spacer(1, 14)], [adv_tbl]],
                       colWidths=[CONTENT_W * 0.38])
    right_col.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    layout = Table([[matrix, "", right_col]],
                    colWidths=[matrix_w, 0.2 * inch,
                                CONTENT_W - matrix_w - 0.2 * inch])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header + [Spacer(1, 22), layout]


# ---- Slide 8: Business Model ----
def slide_08_business_model():
    """4 image-card style cards in a 2x2 with pricing / economics
    /buyer / margin trajectory. Mirrors LIRA's business-model slide."""
    header = slide_header("Business Model",
                            "Recurring Subscriptions, Unlimited Studies.",
                            headline_size=30)
    cards = [
        ("Tiered Subscriptions",
         "Sprout / Sapling / Tree. $7,500 to $25,000 annual per platform. "
         "Cedar AI included in Sapling and above.",
         "Pricing tiers"),
        ("Per-Customer Economics",
         "One subscription, unlimited studies, every geography included. "
         "Quarterly refresh without reopening a contract.",
         "Customer economics"),
        ("Consulting Layer",
         "Arborist (consultant plan, $15K) and Toolbox (publication-ready "
         "deliverables, +$15K) for firms running studies on outside clients.",
         "Consultant tier"),
        ("Margin Trajectory",
         "Software-led; data and modeling infrastructure are sunk costs. "
         "Cedar Grove deepens switching cost and renewal rate over time.",
         "Margin curve"),
    ]
    card_w = (CONTENT_W - 18) / 2
    card_h = (CONTENT_H * 0.58) / 2
    rows = []
    for i in range(0, len(cards), 2):
        rows.append([
            bm_card(*cards[i], w=card_w, h=card_h),
            bm_card(*cards[i + 1], w=card_w, h=card_h),
        ])
    grid = Table(rows,
                  colWidths=[card_w + 9, card_w + 9],
                  rowHeights=[card_h + 12, card_h + 12])
    grid.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return header + [Spacer(1, 22), grid]


def bm_card(title, body, slot, w, h):
    """Business-model card: small image-slot strip on the left, title
    + body on the right. Mirrors LIRA's BM cards that use a photo
    background and overlay text."""
    img = ImageSlot(slot, w * 0.42, h - 24,
                     caption=None, fill=TEAL_BG_MEDIUM,
                     border=ACCENT_LIGHT, label_color=NAVY)
    title_p = Paragraph(title,
        ps(f"bm-t-{slot[:6]}", fontName="Inter-Bold", fontSize=14,
           leading=17, textColor=NAVY, spaceAfter=6))
    body_p = Paragraph(body,
        ps(f"bm-b-{slot[:6]}", fontName="Inter", fontSize=9.5,
           leading=12.5, textColor=INK_2))
    text_col = Table([[title_p], [body_p]],
                      colWidths=[w * 0.55 - 20])
    text_col.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    inner = Table([[img, "", text_col]],
                   colWidths=[w * 0.42, 12, w * 0.55 - 12])
    inner.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    outer = Table([[inner]], colWidths=[w], rowHeights=[h])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return outer


# ---- Slide 9: Why Now ----
def slide_09_why_now():
    """AI-capability vs institutional-adoption gap visualization."""
    header = slide_header("Why Now",
                            "AI Capability Outpaces Institutional Adoption.",
                            headline_size=30)
    chart = WhyNowChart(CONTENT_W * 0.6, CONTENT_H * 0.55)
    benefits = [
        ("Modeling Capacity",
         "Engine speed and multiplier libraries have been adequate for "
         "decades. Capacity has never been the bottleneck."),
        ("Document Throughput",
         "Reading PDFs, cleaning spreadsheets, naming assumptions, and "
         "drafting narratives is the actual binding constraint."),
        ("Reviewable AI",
         "Customers will adopt AI when every step is reviewable. Cedar's "
         "assumption ledger is built for that constraint."),
    ]
    ben_rows = []
    for t, b in benefits:
        t_p = Paragraph(t,
            ps(f"wn-t-{t[:6]}", fontName="Inter-Bold", fontSize=10.5,
               leading=13, textColor=NAVY, spaceAfter=4))
        b_p = Paragraph(b,
            ps(f"wn-b-{t[:6]}", fontName="Inter", fontSize=8.5,
               leading=11.5, textColor=INK_2))
        ben_rows.append([t_p])
        ben_rows.append([b_p])
        ben_rows.append([Spacer(1, 10)])
    ben_tbl = Table(ben_rows, colWidths=[CONTENT_W * 0.34])
    ben_tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    layout = Table([[chart, "", ben_tbl]],
                    colWidths=[CONTENT_W * 0.6,
                                CONTENT_W * 0.06,
                                CONTENT_W * 0.34])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header + [Spacer(1, 22), layout]


class WhyNowChart(Flowable):
    """Two-curve AI gap chart. AI capability rises steeply, adoption
    rises slowly, gap between them shaded. Drawn with canvas paths."""

    def __init__(self, w, h):
        Flowable.__init__(self)
        self.w = w
        self.h = h

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        pad = 22
        chart_x = pad
        chart_y = pad
        chart_w = self.w - 2 * pad
        chart_h = self.h - 2 * pad - 18

        # Axis frame (subtle)
        c.setStrokeColor(HexColor("#D5D7E0"))
        c.setLineWidth(0.5)
        c.line(chart_x, chart_y, chart_x + chart_w, chart_y)
        c.line(chart_x, chart_y, chart_x, chart_y + chart_h)

        # AI capability curve (steep)
        ai_pts = []
        for i in range(41):
            t = i / 40
            # Logistic-ish steep curve
            x = chart_x + t * chart_w
            y_pct = (t ** 2.4) * 0.85 + 0.1
            y = chart_y + y_pct * chart_h
            ai_pts.append((x, y))

        # Institutional adoption curve (gentle)
        ad_pts = []
        for i in range(41):
            t = i / 40
            x = chart_x + t * chart_w
            y_pct = t * 0.32 + 0.05
            y = chart_y + y_pct * chart_h
            ad_pts.append((x, y))

        # Shade the gap between curves
        c.setFillColor(HexColor("#D5EFEC"))
        path = c.beginPath()
        path.moveTo(ai_pts[0][0], ai_pts[0][1])
        for x, y in ai_pts[1:]:
            path.lineTo(x, y)
        for x, y in reversed(ad_pts):
            path.lineTo(x, y)
        path.close()
        c.drawPath(path, fill=1, stroke=0)

        # Adoption curve (slower)
        c.setStrokeColor(INK_3)
        c.setLineWidth(2)
        for i in range(len(ad_pts) - 1):
            c.line(ad_pts[i][0], ad_pts[i][1],
                   ad_pts[i + 1][0], ad_pts[i + 1][1])

        # AI capability curve (top, teal)
        c.setStrokeColor(ACCENT_DEEP)
        c.setLineWidth(2.4)
        for i in range(len(ai_pts) - 1):
            c.line(ai_pts[i][0], ai_pts[i][1],
                   ai_pts[i + 1][0], ai_pts[i + 1][1])

        # Curve labels
        c.setFillColor(ACCENT_DEEP)
        c.setFont("Inter-Bold", 11)
        c.drawString(ai_pts[-1][0] - 105, ai_pts[-1][1] + 4,
                     "AI capability")
        c.setFillColor(INK_3)
        c.setFont("Inter-Bold", 11)
        c.drawString(ad_pts[-1][0] - 130, ad_pts[-1][1] + 4,
                     "Institutional adoption")

        # Gap callout
        gap_mid_idx = 26
        gx = ai_pts[gap_mid_idx][0]
        gy_top = ai_pts[gap_mid_idx][1]
        gy_bot = ad_pts[gap_mid_idx][1]
        gy_mid = (gy_top + gy_bot) / 2
        c.setFillColor(NAVY)
        c.setFont("Inter-Bold", 10)
        c.drawString(gx + 8, gy_mid, "The gap")
        c.setFont("Inter", 9)
        c.setFillColor(INK_2)
        c.drawString(gx + 8, gy_mid - 11, "= Lumecon's opening")

        # Axis labels
        c.setFillColor(INK_3)
        c.setFont("Inter-SemiBold", 7.5)
        c.drawString(chart_x, chart_y - 14, "2022")
        c.drawString(chart_x + chart_w - 25, chart_y - 14, "2026")
        c.saveState()
        c.translate(chart_x - 14, chart_y + chart_h / 2)
        c.rotate(90)
        c.drawString(-20, 0, "CAPABILITY")
        c.restoreState()


# ---- Slide 10: GTM Strategy ----
def slide_10_gtm():
    """4 numbered list items on the left, upward arrow/curve graphic
    on the right. Mirrors LIRA's GTM slide."""
    header = slide_header("GTM Strategy",
                            "Tribes First. Cities Follow. Global Next.",
                            headline_size=30)
    items = [
        ("Founder-Led Wedge",
         "First Tribal and Local pilots acquired via direct outreach to "
         "tribal governments, NCAI relationships, and state EDOs."),
        ("Partnership Layer",
         "NACA, tribal enterprise networks, Native CDFI Coalition, and "
         "Cornell CICD pipeline drive the next cohort of pilots."),
        ("State + Federal Programs",
         "Federal-program impact reporting (HUD, USDA, EDA, BIA) becomes "
         "a recurring use case that pulls the customer base broader."),
        ("Global Expansion",
         "Subnational governments worldwide carry the same measurement "
         "problem; UCLG and OECD networks open the international leg."),
    ]
    list_rows = []
    for t, b in items:
        t_p = Paragraph(t,
            ps(f"gt-t-{t[:6]}", fontName="Inter-Bold", fontSize=11.5,
               leading=14, textColor=NAVY, spaceAfter=3))
        b_p = Paragraph(b,
            ps(f"gt-b-{t[:6]}", fontName="Inter", fontSize=9,
               leading=12, textColor=INK_2))
        list_rows.append([t_p])
        list_rows.append([b_p])
        list_rows.append([HRFlowable(width=CONTENT_W * 0.5,
                                       thickness=0.4, color=RULE,
                                       spaceBefore=8, spaceAfter=8)])
    list_tbl = Table(list_rows, colWidths=[CONTENT_W * 0.5])
    list_tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    arrow = GTMArrow(CONTENT_W * 0.42, CONTENT_H * 0.55)
    layout = Table([[list_tbl, "", arrow]],
                    colWidths=[CONTENT_W * 0.5,
                                CONTENT_W * 0.08,
                                CONTENT_W * 0.42])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header + [Spacer(1, 18), layout]


class GTMArrow(Flowable):
    """Big upward-sweeping arrow that visualizes the wedge widening
    into the broader market. Drawn entirely with canvas paths."""

    def __init__(self, w, h):
        Flowable.__init__(self)
        self.w = w
        self.h = h

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        # Bezier-style sweep from bottom-left to top-right
        c.setStrokeColor(ACCENT)
        c.setLineWidth(36)
        c.setLineCap(1)
        path = c.beginPath()
        path.moveTo(self.w * 0.08, self.h * 0.18)
        path.curveTo(self.w * 0.30, self.h * 0.15,
                     self.w * 0.55, self.h * 0.85,
                     self.w * 0.82, self.h * 0.78)
        c.drawPath(path, stroke=1, fill=0)
        # Arrowhead
        c.setFillColor(ACCENT)
        c.setStrokeColor(ACCENT)
        head = c.beginPath()
        head.moveTo(self.w * 0.78, self.h * 0.92)
        head.lineTo(self.w * 0.95, self.h * 0.76)
        head.lineTo(self.w * 0.78, self.h * 0.62)
        head.close()
        c.drawPath(head, fill=1, stroke=0)

        # Markers along the curve
        markers = [
            (self.w * 0.10, self.h * 0.18, "TRIBES"),
            (self.w * 0.35, self.h * 0.30, "LOCAL"),
            (self.w * 0.60, self.h * 0.62, "FEDERAL"),
            (self.w * 0.80, self.h * 0.78, "GLOBAL"),
        ]
        for x, y, label in markers:
            c.setFillColor(PAPER)
            c.setStrokeColor(NAVY)
            c.setLineWidth(1.2)
            c.circle(x, y, 6, stroke=1, fill=1)
            c.setFillColor(NAVY)
            c.setFont("Inter-Bold", 8)
            c.drawString(x - 18, y - 20, label)


# ---- Slide 11: Roadmap ----
def slide_11_roadmap():
    """Horizontal timeline with milestones, mirrors LIRA's roadmap."""
    header = slide_header("Roadmap",
                            "MVP. Pilots. Platform.",
                            headline_size=32)
    milestones = [
        ("Q2 2026",
         "MVP shipped. Local + Tribal Economic Impact in pilot tier ladder."),
        ("Q3-Q4 2026",
         "First paid pilots. Cedar live inside Sapling and Tree."),
        ("2027",
         "Cedar Grove ships as the organizational intelligence layer on Tree."),
        ("2028",
         "Global Economic Impact launches. Cross-border and supply-chain "
         "studies."),
        ("Beyond",
         "Federated learning across customers. Federal program reporting "
         "becomes recurring."),
    ]
    tl = TimelineFlowable(milestones, CONTENT_W, CONTENT_H * 0.55)
    return header + [Spacer(1, 22), tl]


class TimelineFlowable(Flowable):
    """Horizontal timeline. A teal-tinted band runs the width of the
    slide; circles mark each milestone; titles sit above the band,
    descriptions below it."""

    def __init__(self, milestones, w, h):
        Flowable.__init__(self)
        self.milestones = milestones
        self.w = w
        self.h = h

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        n = len(self.milestones)
        # Tinted band (back)
        band_top = self.h * 0.70
        band_bot = self.h * 0.30
        c.setFillColor(TEAL_BG_SOFT)
        c.rect(0, band_bot, self.w, band_top - band_bot,
               stroke=0, fill=1)
        # Center axis line
        axis_y = (band_top + band_bot) / 2
        c.setStrokeColor(ACCENT)
        c.setLineWidth(1.4)
        c.line(20, axis_y, self.w - 30, axis_y)
        # Arrowhead at far right
        c.setFillColor(ACCENT)
        path = c.beginPath()
        path.moveTo(self.w - 32, axis_y - 5)
        path.lineTo(self.w - 18, axis_y)
        path.lineTo(self.w - 32, axis_y + 5)
        path.close()
        c.drawPath(path, fill=1, stroke=0)

        col_w = (self.w - 60) / n
        for i, (label, desc) in enumerate(self.milestones):
            cx = 30 + col_w * i + col_w / 2
            # Marker dot
            c.setFillColor(NAVY)
            c.setStrokeColor(NAVY)
            c.circle(cx, axis_y, 5, stroke=0, fill=1)
            # Year label above
            c.setFillColor(NAVY)
            c.setFont("Inter-Bold", 12)
            label_w = pdfmetrics.stringWidth(label, "Inter-Bold", 12)
            c.drawString(cx - label_w / 2, axis_y + 22, label)
            # Tick line above + below
            c.setStrokeColor(ACCENT_DEEP)
            c.setLineWidth(0.6)
            c.line(cx, axis_y + 5, cx, axis_y + 16)
            c.line(cx, axis_y - 5, cx, axis_y - 16)
            # Description below — wrap to col width
            c.setFillColor(INK_2)
            c.setFont("Inter", 8.5)
            max_chars = max(int((col_w - 16) / 4.5), 18)
            lines = wrap_text(desc, max_chars, max_lines=4)
            for j, line in enumerate(lines):
                line_w = pdfmetrics.stringWidth(line, "Inter", 8.5)
                c.drawString(cx - line_w / 2,
                             axis_y - 26 - j * 11, line)


def wrap_text(text, max_chars, max_lines=4):
    words = text.split()
    lines = []
    cur = []
    cur_len = 0
    for w in words:
        if cur and cur_len + len(w) + 1 > max_chars:
            lines.append(" ".join(cur))
            cur = [w]
            cur_len = len(w)
            if len(lines) >= max_lines:
                break
        else:
            cur.append(w)
            cur_len += len(w) + 1
    if cur and len(lines) < max_lines:
        lines.append(" ".join(cur))
    return lines


# ---- Slide 12: Team ----
def slide_12_team():
    """Founder photo on the left, expertise cards in 2x2 on the right,
    advisors row with photos at the bottom."""
    header = slide_header("Team",
                            "Researchers Who Built the Data.",
                            headline_size=30)
    photo = ImageSlot("Elijah Moreno",
                       CONTENT_W * 0.22, CONTENT_H * 0.45,
                       caption="Founder + CEO",
                       fill=TEAL_BG_MEDIUM,
                       border=ACCENT_LIGHT, label_color=NAVY, big=True)

    cards = [
        ("Tribal Economy Expertise",
         "Federal Reserve CICD, NCAI Mankiller Fellow, Native Entity "
         "Enterprise dataset."),
        ("Economic Modeling",
         "Duke PhD, Oxford MSc, Federal Reserve Board and CICD economists, "
         "Native CDFI lending research."),
        ("Cedar / AI",
         "Illinois Urbana-Champaign. AI assistant for source intake and "
         "assumption tracking."),
        ("Platform Engineering",
         "Cornell CS+Business. Customer-facing platform end to end. Modsy "
         "and Chime architecture advisory."),
    ]
    card_w = (CONTENT_W * 0.55 - 12) / 2
    card_h = (CONTENT_H * 0.45) / 2
    rows = []
    for i in range(0, 4, 2):
        rows.append([
            navy_card(cards[i][0], cards[i][1], card_w, card_h),
            navy_card(cards[i + 1][0], cards[i + 1][1], card_w, card_h),
        ])
    cards_grid = Table(rows,
                        colWidths=[card_w + 6, card_w + 6],
                        rowHeights=[card_h + 8, card_h + 8])
    cards_grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    top_row = Table([[photo, "", cards_grid]],
                     colWidths=[CONTENT_W * 0.22,
                                 CONTENT_W * 0.06,
                                 CONTENT_W * 0.55])
    top_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    # Advisors row
    advisors = [
        ("Vod Vilfort",
         "MIT econometrics. AER: Insights, 2025.",
         "VV"),
        ("Brian Kim",
         "Dartmouth. Modsy + Chime engineering.",
         "BK"),
        ("Havala Hanson, PhD",
         "Alaska Fairbanks. Data governance.",
         "HH"),
        ("Laurel Wheeler, PhD",
         "Duke Econ. Federal Reserve CICD.",
         "LW"),
    ]
    adv_w = (CONTENT_W - 60) / 4
    adv_cells = []
    for name, bio, slot in advisors:
        photo = ImageSlot(slot, 0.6 * inch, 0.6 * inch,
                            caption=None, fill=TEAL_BG_MEDIUM,
                            border=ACCENT_LIGHT, label_color=NAVY,
                            show_eyebrow=False)
        name_p = Paragraph(name,
            ps(f"adv-n-{slot[:4]}", fontName="Inter-Bold", fontSize=9,
               leading=11, textColor=NAVY, spaceAfter=1))
        bio_p = Paragraph(bio,
            ps(f"adv-b-{slot[:4]}", fontName="Inter", fontSize=7.5,
               leading=9.5, textColor=INK_2))
        text_col = Table([[name_p], [bio_p]],
                          colWidths=[adv_w - 0.55 * inch - 10])
        text_col.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        cell = Table([[photo, "", text_col]],
                      colWidths=[0.55 * inch, 6, adv_w - 0.55 * inch - 6])
        cell.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        adv_cells.append(cell)
    adv_label = NavyTag("Advisors", font_size=8)
    adv_row = Table([adv_cells],
                     colWidths=[adv_w + 6, adv_w + 6, adv_w + 6, adv_w])
    adv_row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    adv_section = Table(
        [[adv_label, "", adv_row]],
        colWidths=[1.0 * inch, 12, CONTENT_W - 1.0 * inch - 12])
    adv_section.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), TEAL_BG_SOFT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return header + [Spacer(1, 18), top_row, Spacer(1, 14), adv_section]


# ---- Slide 13: Traction ----
def slide_13_traction():
    """Progress items list on the left, product/process image on right."""
    header = slide_header("Traction & Validation",
                            "Capital Deployed. Counsel Engaged. MVP Underway.",
                            headline_size=28)
    items = [
        ("Founder Capital",
         "$50K committed, $25K already deployed across contractor work, "
         "infrastructure, and incorporation."),
        ("Fellowship Support",
         "$6K awarded (fellowship name TBD pending founder confirmation)."),
        ("Legal Engagement",
         "Cornell Law Entrepreneurship Clinic actively engaged on "
         "corporate, IP, and customer-contracting workstreams."),
        ("MVP Delivery",
         "Local and Tribal Economic Impact pilot tier ladder targeting "
         "end of June 2026; full launch end of 2026."),
        ("Strategic Outreach",
         "Early conversations underway with NACA and tribal enterprise "
         "networks as priority pilot relationships."),
        ("Commercial Surface",
         "lumecon.ai live with public product positioning, pricing, "
         "and inbound capture."),
    ]
    list_rows = []
    for t, b in items:
        t_p = Paragraph(t,
            ps(f"tr-t-{t[:6]}", fontName="Inter-Bold", fontSize=10.5,
               leading=13, textColor=NAVY))
        b_p = Paragraph(b,
            ps(f"tr-b-{t[:6]}", fontName="Inter", fontSize=8.5,
               leading=11, textColor=INK_2))
        row = Table([[t_p, b_p]],
                     colWidths=[1.6 * inch, CONTENT_W * 0.60 - 1.6 * inch])
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        list_rows.append([row])
        list_rows.append([HRFlowable(width=CONTENT_W * 0.6,
                                       thickness=0.3, color=RULE,
                                       spaceBefore=8, spaceAfter=8)])
    list_tbl = Table(list_rows, colWidths=[CONTENT_W * 0.6])
    list_tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    image = ImageSlot("Cedar workspace screenshot",
                        CONTENT_W * 0.36, CONTENT_H * 0.55,
                        caption=("Suggested: real product screenshot once "
                                  "MVP ships"), big=True)
    layout = Table([[list_tbl, "", image]],
                    colWidths=[CONTENT_W * 0.6, CONTENT_W * 0.04,
                                CONTENT_W * 0.36])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header + [Spacer(1, 18), layout]


# ---- Slide 14: Use of Funds ----
def slide_14_use_of_funds():
    """Donut chart + 4 funding categories with $ amounts and percent
    shares, mirrors LIRA's investment slide."""
    header = slide_header("Use of Funds",
                            "$100K to MVP and First Paid Pilots.",
                            headline_size=30)
    sub = Paragraph(
        '<font color="#0A8A7E"><b>16 months</b></font> '
        'of focused build, contractor capacity, and pilot acquisition.',
        ps("uf-sub", fontName="Inter", fontSize=12, leading=15,
           textColor=INK_2, spaceBefore=4, spaceAfter=18))

    donut = FundsDonut(2.8 * inch, 2.8 * inch)

    items_left = [
        ("$50K", "50%", "Contractors",
         "Economist, two data scientists, and software engineer at "
         "8 to 12 hours per week for six months."),
        ("$10K", "10%", "Infrastructure",
         "Cloud computing, storage, monitoring, and security stack."),
    ]
    items_right = [
        ("$30K", "30%", "Legal · Compliance · IP",
         "Corporate governance, customer contracting, financing "
         "documentation, patents, trademarks, copyrights."),
        ("$10K", "10%", "Marketing · Pilots",
         "Pilot implementation, customer onboarding, sales motions, "
         "early customer-acquisition spend."),
    ]

    def funds_item(amt, pct, title, body):
        head_html = (
            f'<font name="Inter-Bold" color="#0FB5A5" size="18">{amt}</font> '
            f'<font name="Inter-Bold" color="#86D2C5" size="13">{pct}</font>'
        )
        head_p = Paragraph(head_html,
            ps(f"uf-h-{title[:6]}", fontName="Inter", fontSize=18,
               leading=22, textColor=NAVY, spaceAfter=2))
        t_p = Paragraph(title,
            ps(f"uf-t-{title[:6]}", fontName="Inter-Bold", fontSize=10.5,
               leading=13, textColor=NAVY, spaceAfter=3))
        b_p = Paragraph(body,
            ps(f"uf-b-{title[:6]}", fontName="Inter", fontSize=8.5,
               leading=11, textColor=INK_2))
        col = Table([[head_p], [t_p], [b_p]],
                     colWidths=[CONTENT_W * 0.32])
        col.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        return col

    left_col_items = [funds_item(*items_left[0]),
                       Spacer(1, 18),
                       funds_item(*items_left[1])]
    right_col_items = [funds_item(*items_right[0]),
                        Spacer(1, 18),
                        funds_item(*items_right[1])]
    left_col_tbl = Table([[fl] for fl in left_col_items],
                          colWidths=[CONTENT_W * 0.32])
    right_col_tbl = Table([[fl] for fl in right_col_items],
                           colWidths=[CONTENT_W * 0.32])
    for t in (left_col_tbl, right_col_tbl):
        t.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))

    layout = Table([[left_col_tbl, "", donut, "", right_col_tbl]],
                    colWidths=[CONTENT_W * 0.32, CONTENT_W * 0.02,
                                2.8 * inch,
                                CONTENT_W * 0.02, CONTENT_W * 0.32])
    layout.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return header + [sub, layout]


class FundsDonut(Flowable):
    """Donut chart for the Use-of-Funds slide. Center carries the
    total in big type. Wedges are sized to allocation and colored in
    the teal palette so the visual ties back to the brand."""

    SHADES = [
        HexColor("#0A8A7E"),
        HexColor("#0FB5A5"),
        HexColor("#39B7A4"),
        HexColor("#86D2C5"),
    ]
    SEGMENTS = [50, 30, 10, 10]

    def __init__(self, w, h):
        Flowable.__init__(self)
        self.w = w
        self.h = h

    def wrap(self, aw, ah):
        return (self.w, self.h)

    def draw(self):
        c = self.canv
        cx = self.w / 2
        cy = self.h / 2
        outer_r = min(self.w, self.h) / 2 - 8
        inner_r = outer_r * 0.58
        start = 90
        for i, pct in enumerate(self.SEGMENTS):
            sweep = -(pct / 100.0) * 360
            c.setFillColor(self.SHADES[i])
            c.setStrokeColor(PAPER)
            c.setLineWidth(2)
            c.wedge(cx - outer_r, cy - outer_r,
                    cx + outer_r, cy + outer_r,
                    start, sweep, fill=1, stroke=1)
            start += sweep
        c.setFillColor(PAPER)
        c.circle(cx, cy, inner_r, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Inter-Bold", 26)
        label = "$100K"
        lw = pdfmetrics.stringWidth(label, "Inter-Bold", 26)
        c.drawString(cx - lw / 2, cy - 6, label)
        c.setFillColor(INK_3)
        c.setFont("Inter-SemiBold", 7.5)
        sub = "TOTAL RAISE"
        sw = pdfmetrics.stringWidth(sub, "Inter-SemiBold", 7.5)
        c.drawString(cx - sw / 2, cy - 22, sub)


# ---- Slide 15: Closing ----
def slide_15_closing():
    return [Spacer(1, SLIDE_H - 2 * MARGIN)]


def draw_closing_overlay(canvas, doc):
    canvas.saveState()
    # Hero background
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, SLIDE_W, SLIDE_H, stroke=0, fill=1)
    # Subtle accent strip across the middle
    canvas.setFillColor(HexColor("#0B173A"))
    canvas.rect(0, SLIDE_H * 0.20, SLIDE_W, SLIDE_H * 0.30,
                stroke=0, fill=1)
    canvas.setFillColor(HexColor("#D5EFEC"))
    canvas.setFont("Inter-SemiBold", 8.5)
    canvas.drawRightString(SLIDE_W - MARGIN,
                            SLIDE_H - MARGIN - 4,
                            "IMAGE  ·  CLOSING HERO PLACEHOLDER")

    # Logo top-left
    try:
        size = 0.65 * inch
        canvas.drawImage(str(SEAL), MARGIN, SLIDE_H - MARGIN - size - 6,
                          width=size, height=size, mask="auto")
        canvas.setFont("Inter-Bold", 24)
        canvas.setFillColor(PAPER)
        canvas.drawString(MARGIN + size + 12,
                           SLIDE_H - MARGIN - size + 18,
                           "LUMECON")
    except Exception:
        pass

    # Bookend brand line
    canvas.setFont("Inter-Bold", 48)
    canvas.setFillColor(PAPER)
    canvas.drawString(MARGIN, SLIDE_H * 0.56,
                       "Make the economically")
    canvas.drawString(MARGIN, SLIDE_H * 0.475,
                       "invisible visible.")
    # Brand strip accent
    canvas.setFillColor(ACCENT)
    canvas.rect(MARGIN, SLIDE_H * 0.44,
                SLIDE_W * 0.20, 4, stroke=0, fill=1)

    # Thank-you + URL
    canvas.setFont("Inter-Bold", 22)
    canvas.setFillColor(PAPER)
    canvas.drawString(MARGIN, MARGIN + 14, "Thank you.")
    canvas.setFont("Inter-SemiBold", 12)
    canvas.setFillColor(HexColor("#86D2C5"))
    canvas.drawRightString(SLIDE_W - MARGIN, MARGIN + 14,
                            "lumecon.ai  ·  Confidential")
    canvas.restoreState()


# ---- Build ----
def main():
    doc = BaseDocTemplate(
        str(PDF),
        pagesize=(SLIDE_W, SLIDE_H),
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title="Lumecon Pitch Deck",
        author="Lumecon Inc.",
        subject="Confidential pre-seed pitch deck",
    )
    # Body frames for regular content slides
    body_frame = Frame(MARGIN, MARGIN,
                        CONTENT_W, CONTENT_H - 0.25 * inch,
                        id="body", leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0)
    # Full-bleed frame for hero slides
    full_frame = Frame(0, 0, SLIDE_W, SLIDE_H,
                        id="full", leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0)

    templates = []
    # Slide 1 (cover, full-bleed + overlay)
    def cover_dec(canvas, doc):
        make_page_decoration(1, full_bleed=True)(canvas, doc)
        draw_cover_overlay(canvas, doc)
    templates.append(PageTemplate(id="s1", frames=[full_frame],
                                    onPage=cover_dec))
    # Slides 2-4 (body)
    for i in range(2, 5):
        templates.append(PageTemplate(id=f"s{i}", frames=[body_frame],
                                        onPage=make_page_decoration(i)))
    # Slide 5 (value prop, full-bleed + overlay)
    def vp_dec(canvas, doc):
        make_page_decoration(5, full_bleed=True)(canvas, doc)
        draw_value_prop_overlay(canvas, doc)
    templates.append(PageTemplate(id="s5", frames=[full_frame],
                                    onPage=vp_dec))
    # Slides 6-14 (body)
    for i in range(6, 15):
        templates.append(PageTemplate(id=f"s{i}", frames=[body_frame],
                                        onPage=make_page_decoration(i)))
    # Slide 15 (closing, full-bleed + overlay)
    def cl_dec(canvas, doc):
        make_page_decoration(15, full_bleed=True)(canvas, doc)
        draw_closing_overlay(canvas, doc)
    templates.append(PageTemplate(id="s15", frames=[full_frame],
                                    onPage=cl_dec))

    doc.addPageTemplates(templates)

    slide_builders = [
        slide_01_cover, slide_02_problem, slide_03_solution,
        slide_04_product, slide_05_value_proposition, slide_06_market,
        slide_07_competition, slide_08_business_model, slide_09_why_now,
        slide_10_gtm, slide_11_roadmap, slide_12_team,
        slide_13_traction, slide_14_use_of_funds, slide_15_closing,
    ]

    flow = []
    for i, builder in enumerate(slide_builders, start=1):
        flow.append(NextPageTemplate(f"s{i}"))
        if i > 1:
            flow.append(PageBreak())
        flow.extend(builder())

    doc.build(flow)
    print("Wrote:", PDF)


if __name__ == "__main__":
    main()
