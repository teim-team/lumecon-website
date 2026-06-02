#!/usr/bin/env python3
"""
Render the investor memorandum into a branded landscape PDF.

Voice / brand rules:
  - Inter throughout (matches --font-display: Inter on the live site)
  - Standalone seal mark on the cover (no baked-in wordmark text)
  - Two-column body, editorial density
  - Spectral italic + gold reserved for the .lumin "luminate" accent

Custom markdown markers handled here (in addition to standard h1/h2/
h3, paragraphs, **bold**, *italic*, bullet lists, hr, and tables):

  [[SCREENSHOT: slug | caption]]          — branded placeholder block
  [[STATGRID: number | label | ...]]      — quantified market sizing
  [[WORKFLOWCOMPARE]]                     — two-column legacy-vs-Lumecon
  [[ROADMAP: year | label | ...]]         — visual timeline
  [[FUNDS: cat | amount | desc | ...]]    — use-of-funds breakdown table
  [[TEAMGRID: name | role | bio | ...]]   — team person cards
  [[INSTITUTIONS: name · name · ...]]     — credential strip

Run:  python3 docs/investor-memo/build.py
Output: docs/investor-memo/lumecon-investor-memo.pdf
"""
from __future__ import annotations
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
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
)

HERE = Path(__file__).parent
REPO = HERE.parent.parent
SRC = HERE / "lumecon-investor-memo.md"
PDF = HERE / "lumecon-investor-memo.pdf"
FONTS = HERE / "fonts"
SEAL = REPO / "public" / "brand" / "lumecon-logo-mark-transparent.png"

# ---- Brand palette (matches src/styles/global.css) ----
NAVY        = HexColor("#0A0F26")
INK         = HexColor("#0A0F26")
INK_2       = HexColor("#353B5C")
INK_3       = HexColor("#6B6F8A")
INK_4       = HexColor("#9DA1B5")
GOLD        = HexColor("#F0A91A")
ACCENT      = HexColor("#0FB5A5")
ACCENT_DEEP = HexColor("#0A8A7E")
ACCENT_BAR  = HexColor("#B8EDE6")
# Cream is kept as a token but is no longer used as a surface tint
# anywhere in the document. Surfaces and accent rails use teal tints
# instead so the deck reads as teal-heavy, matching the rest of the
# brand on the live site.
CREAM       = HexColor("#FAF6EE")
RULE        = HexColor("#E8E8EE")
RULE_STRONG = HexColor("#C4C7D4")
PAPER       = colors.white
ZEBRA       = HexColor("#F5FBFA")
PLACEHOLDER = HexColor("#F1F4F8")
# Teal-tinted surfaces. Used for the side rail, stat grid, team cards,
# Use-of-Funds totals row, and the legacy-workflow box. Softer than
# ACCENT_BAR so they read as page surfaces rather than highlights.
TEAL_BG_SOFT   = HexColor("#EAF7F4")
TEAL_BG_MEDIUM = HexColor("#D5EFEC")

# ---- Fonts ----
pdfmetrics.registerFont(TTFont("Inter",          str(FONTS / "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Medium",   str(FONTS / "Inter-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Inter-SemiBold", str(FONTS / "Inter-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Bold",     str(FONTS / "Inter-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Spectral-Italic", str(FONTS / "Spectral-Italic.ttf")))
registerFontFamily(
    "Inter",
    normal="Inter",
    bold="Inter-Bold",
    italic="Spectral-Italic",
    boldItalic="Inter-Bold",
)

# ---- Page geometry (portrait Letter for contained sections) ----
PAGE_W, PAGE_H = LETTER  # 8.5" wide x 11" tall (portrait)
MARGIN_L = 1.0  * inch
MARGIN_R = 0.8  * inch
MARGIN_T = 0.7  * inch
MARGIN_B = 0.65 * inch
RAIL_W = 0.45 * inch
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R
CONTENT_H = PAGE_H - MARGIN_T - MARGIN_B
# Single-column body: column width equals the content width. The
# landscape two-column layout was breaking section content across
# pages in unhelpful places; one wider column lets the renderer
# keep h2 + body + screenshot together more often.
COL_W = CONTENT_W


# ---- Styles ----
def ps(name, **kw):
    base = dict(fontName="Inter", fontSize=9.5, leading=14, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)

STY = {
    # keepWithNext binds the kicker to the h2 that follows it; the h2
    # in turn binds to the first body flowable. The chain guarantees
    # section headers never orphan at the bottom of a page.
    "kicker": ps("kicker", fontName="Inter-SemiBold", fontSize=8, leading=11,
                 textColor=ACCENT_DEEP, spaceAfter=3,
                 keepWithNext=True),
    "h2":     ps("h2", fontName="Inter-Bold", fontSize=24, leading=28,
                 textColor=NAVY, spaceBefore=18, spaceAfter=10),
    "h3":     ps("h3", fontName="Inter-SemiBold", fontSize=11, leading=14,
                 textColor=NAVY, spaceBefore=10, spaceAfter=3),
    "body":   ps("body", fontSize=10, leading=15, spaceAfter=8, alignment=4),
    "pull":   ps("pull", fontName="Inter-Bold", fontSize=20, leading=25,
                 textColor=NAVY, spaceBefore=8, spaceAfter=14),
    "li":     ps("li", fontSize=10, leading=15, spaceAfter=3, leftIndent=14),
    "thead":  ps("thead", fontName="Inter-SemiBold", fontSize=8, leading=11,
                 textColor=PAPER),
    "tcell":  ps("tcell", fontSize=9, leading=12),
    "tstrong": ps("tstrong", fontName="Inter-SemiBold", fontSize=9, leading=12,
                  textColor=NAVY),
    "tnum":   ps("tnum", fontName="Inter-SemiBold", fontSize=9.5, leading=12,
                 textColor=NAVY, alignment=2),
    "cover-meta": ps("cover-meta", fontName="Inter-SemiBold", fontSize=8,
                     leading=11, textColor=INK_3, spaceAfter=18),
    "cover-title": ps("cover-title", fontName="Inter-Bold", fontSize=38,
                      leading=44, textColor=NAVY, spaceAfter=18),
    "cover-deck": ps("cover-deck", fontSize=14, leading=21, textColor=INK_2,
                     spaceAfter=8),
    "cover-foot": ps("cover-foot", fontName="Inter-SemiBold", fontSize=7.5,
                     leading=10, textColor=INK_3),
    "stat-num": ps("stat-num", fontName="Inter-Bold", fontSize=28, leading=30,
                   textColor=NAVY, alignment=1),
    "stat-lbl": ps("stat-lbl", fontSize=8, leading=11, textColor=INK_3,
                   alignment=1),
    "ph-eyebrow": ps("ph-eyebrow", fontName="Inter-SemiBold", fontSize=7,
                     leading=10, textColor=ACCENT_DEEP, alignment=1),
    "ph-cap": ps("ph-cap", fontSize=8.5, leading=12, textColor=INK_2,
                 alignment=1),
    "rd-year": ps("rd-year", fontName="Inter-Bold", fontSize=11, leading=14,
                  textColor=NAVY),
    "rd-label": ps("rd-label", fontSize=9, leading=12, textColor=INK_2),
    "tm-name": ps("tm-name", fontName="Inter-Bold", fontSize=10, leading=13,
                  textColor=NAVY),
    "tm-role": ps("tm-role", fontName="Inter-SemiBold", fontSize=8, leading=10,
                  textColor=ACCENT_DEEP, spaceAfter=2),
    "tm-bio": ps("tm-bio", fontSize=8.5, leading=11.5, textColor=INK),
    "inst": ps("inst", fontName="Inter-SemiBold", fontSize=8, leading=12,
               textColor=INK_3, alignment=1),
    "wf-h": ps("wf-h", fontName="Inter-SemiBold", fontSize=10, leading=13,
               textColor=NAVY, spaceAfter=4),
    "wf-l": ps("wf-l", fontSize=9, leading=12, textColor=INK, spaceAfter=2),
}


# ---- Highlight (hl-block) ----
# Mirrors src/styles/global.css .hl-block: a rotated rectangle filled
# with a linear gradient that fades transparent on both edges. The
# block sits behind the headline text and bleeds beyond it on the
# left and right, the way the site's ::before pseudo-element does.
# All variants are teal per the brand decision to drop the gold/green
# alternatives in document use.

from reportlab.platypus import Flowable
from PIL import Image as PILImage

HL_GRADIENT_PNG = HERE / "_hl-teal-gradient.png"


def _make_hl_gradient_png():
    """Pre-render the teal gradient as a PNG: transparent → teal at 0.26
    alpha → teal at 0.26 alpha → transparent, with the fade on the
    outer 8% on each end. Cached on disk on first call."""
    if HL_GRADIENT_PNG.exists():
        return
    width, height = 1200, 80
    img = PILImage.new("RGBA", (width, height), (0, 0, 0, 0))
    pix = img.load()
    r, g, b = 15, 181, 165
    peak_alpha = int(0.26 * 255)
    fade = 0.08
    for x in range(width):
        pct = x / width
        if pct < fade:
            alpha = int(peak_alpha * pct / fade)
        elif pct > 1 - fade:
            alpha = int(peak_alpha * (1 - pct) / fade)
        else:
            alpha = peak_alpha
        for y in range(height):
            pix[x, y] = (r, g, b, alpha)
    img.save(str(HL_GRADIENT_PNG), "PNG")


_make_hl_gradient_png()


# Slight asymmetric rotations per headline so adjacent hl-blocks tilt
# different ways, mirroring how the .hl-block / .hl-block--b / --c
# variants alternate on the site (negative, positive, larger negative,
# small positive, etc.).
_angle_iter = iter([])


def _next_angle():
    global _angle_iter
    try:
        return next(_angle_iter)
    except StopIteration:
        _angle_iter = iter([-1.8, 1.6, -2.4, 1.1, -1.5, 2.0, -2.0, 1.4])
        return next(_angle_iter)


class HlHeadline(Flowable):
    """A headline drawn with the hl-block treatment from the site:
    a tilted rectangle filled with a transparent-fade gradient (the
    pre-rendered PNG), bleeding past the text on both sides, with
    the headline glyphs drawn on top in navy."""

    def __init__(self, text, font_name="Inter-Bold", font_size=22,
                 navy=NAVY, col_w=COL_W, angle=-1.8,
                 leading_factor=1.6):
        Flowable.__init__(self)
        # Bind to the next flowable so the headline never orphans at
        # the bottom of a page without at least one body block beside it.
        self.keepWithNext = 1
        self.text = text
        self.font_name = font_name
        self.font_size = font_size
        self.navy = navy
        self.col_w = col_w
        self.angle = angle
        self.text_w = pdfmetrics.stringWidth(text, font_name, font_size)
        # Shrink to fit if the headline is wider than the column.
        if self.text_w > col_w - 16:
            scale = (col_w - 16) / self.text_w
            self.font_size = font_size * scale
            self.text_w = col_w - 16
        self.height = self.font_size * leading_factor

    def wrap(self, avail_w, avail_h):
        return (self.col_w, self.height + 4)

    def draw(self):
        c = self.canv
        baseline_y = self.height * 0.25
        bleed_l = 14
        bleed_r = 22
        bx = -bleed_l
        bw = self.text_w + bleed_l + bleed_r
        by = baseline_y - self.font_size * 0.18
        bh = self.font_size * 1.18
        cx = bx + bw / 2
        cy = by + bh / 2

        c.saveState()
        c.translate(cx, cy)
        c.rotate(self.angle)
        c.translate(-cx, -cy)
        c.drawImage(str(HL_GRADIENT_PNG), bx, by, width=bw, height=bh,
                    mask="auto")
        c.restoreState()

        c.setFillColor(self.navy)
        c.setFont(self.font_name, self.font_size)
        c.drawString(0, baseline_y, self.text)


def render_h2_with_hl(text):
    """h2 rendered with the rotated teal hl-block behind it.
    Any {{HL:color}} marker is stripped (teal is the only variant
    used in document form). Adjacent calls alternate tilt direction."""
    text = re.sub(r"\{\{HL:[a-z]+\}\}\s*", "", text).strip()
    return HlHeadline(text, font_name="Inter-Bold", font_size=24,
                      navy=NAVY, col_w=COL_W, angle=_next_angle())


# ---- Markdown parsing ----
def inline(s):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(
        r"(^|[^*])\*([^*]+?)\*(?!\*)",
        r'\1<font name="Spectral-Italic" color="#F0A91A">\2</font>',
        s,
    )
    # Footnote markers: [^N] → small teal superscript
    s = re.sub(
        r"\[\^(\d+)\]",
        r'<super rise="3"><font name="Inter-SemiBold" size="6.5" '
        r'color="#0A8A7E">\1</font></super>',
        s,
    )
    return s


CUSTOM_BLOCK_RE = re.compile(r"^\[\[([A-Z]+)(?::\s*(.*))?\]\]\s*$", re.DOTALL)


def parse(md):
    lines = md.splitlines()
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1; continue
        # Multi-line custom blocks: [[KIND: ... ]] possibly spanning lines.
        if line.startswith("[["):
            # Gather until we find the closing ]]
            buf = [line]; i += 1
            while not buf[-1].rstrip().endswith("]]") and i < n:
                buf.append(lines[i]); i += 1
            full = "\n".join(buf).strip()
            inner = full[2:-2].strip()  # drop [[ ]]
            kind, _, payload = inner.partition(":")
            yield "block", (kind.strip(), payload.strip()); continue
        if line.startswith("# "):
            yield "h1", line[2:].strip(); i += 1; continue
        if line.startswith("## "):
            yield "h2", line[3:].strip(); i += 1; continue
        if line.startswith("### "):
            yield "h3", line[4:].strip(); i += 1; continue
        if line.strip() == "---":
            yield "hr", None; i += 1; continue
        if line.startswith("|"):
            rows = []
            while i < n and lines[i].startswith("|"):
                rows.append(lines[i]); i += 1
            cells = [[c.strip() for c in r.strip("|").split("|")] for r in rows]
            header = cells[0]; align_row = cells[1]; body = cells[2:]
            aligns = []
            for a in align_row:
                if a.endswith(":") and a.startswith(":"): aligns.append("center")
                elif a.endswith(":"): aligns.append("right")
                else: aligns.append("left")
            yield "table", (header, body, aligns); continue
        if line.startswith(("- ", "* ")):
            items = []
            while i < n and lines[i].startswith(("- ", "* ")):
                items.append(lines[i][2:].strip()); i += 1
            yield "list", items; continue
        para = [line]; i += 1
        while i < n and lines[i].strip() and not lines[i].startswith(("#", "-", "*", "|", "[[")) and lines[i].strip() != "---":
            para.append(lines[i]); i += 1
        text = " ".join(para)
        bare = text.strip()
        if bare.startswith("**") and bare.endswith("**") and bare.count("**") == 2:
            yield "pull", bare[2:-2].strip()
        else:
            yield "p", text


# ---- Custom block renderers ----
def render_screenshot(payload, max_w=COL_W):
    """Branded screenshot placeholder, sized for a desktop screenshot
    (~16:10) at roughly half a page tall so the real screenshots fit
    in cleanly when they replace these placeholders."""
    slug, _, caption = payload.partition("|")
    slug = slug.strip(); caption = caption.strip()
    inner = Table(
        [
            [Paragraph("PRODUCT", STY["ph-eyebrow"])],
            [Paragraph(slug.upper().replace("-", " "), ps("ph-slug",
                fontName="Inter-Bold", fontSize=14, leading=18,
                textColor=NAVY, alignment=1))],
        ],
        colWidths=[max_w - 0.4 * inch],
    )
    inner.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    height = 4.0 * inch  # Approximately half a portrait page
    outer = Table([[inner]], colWidths=[max_w], rowHeights=[height])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PLACEHOLDER),
        ("BOX", (0, 0), (-1, -1), 0.7, RULE_STRONG),
        ("LINEABOVE", (0, 0), (-1, 0), 0, RULE_STRONG),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    caption_p = Paragraph(inline(caption), STY["ph-cap"])
    wrap = [outer, Spacer(1, 3), caption_p, Spacer(1, 6)]
    return KeepTogether(wrap)


def render_statgrid(payload):
    """Stat grid arranged as alternating number / label rows. Fixed row
    heights guarantee numbers across a row sit on the same baseline
    and labels under them line up regardless of label length.

    Pairs (col1, col2) per visual row; rows stack as:
        [num1, num2]
        [lbl1, lbl2]
        [num3, num4]
        [lbl3, lbl4]
        ...
    """
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    pairs = []
    for r in rows:
        num, _, lbl = r.partition("|")
        pairs.append((num.strip(), lbl.strip()))

    col_count = 2
    num_row_h = 36
    lbl_row_h = 28
    cell_w = (COL_W - 12) / col_count

    data = []
    row_heights = []
    # Build alternating number / label rows
    for j in range(0, len(pairs), col_count):
        chunk = pairs[j:j + col_count]
        while len(chunk) < col_count:
            chunk.append(("", ""))
        data.append([Paragraph(inline(n), STY["stat-num"]) for (n, _) in chunk])
        row_heights.append(num_row_h)
        data.append([Paragraph(inline(l), STY["stat-lbl"]) for (_, l) in chunk])
        row_heights.append(lbl_row_h)

    t = Table(data, colWidths=[cell_w] * col_count, rowHeights=row_heights)
    style = TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), TEAL_BG_SOFT),
        ("LINEABOVE",    (0, 0), (-1, 0), 0.5, ACCENT),
        ("LINEBELOW",    (0, -1), (-1, -1), 0.5, ACCENT),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 2),
        # Numbers sit at the BOTTOM of their row so the visual baseline
        # is shared across columns; labels sit at the TOP of their row
        # so they hug the number above them.
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])
    # Hairline divider between every (num, lbl) pair group
    for i in range(1, len(pairs) // col_count):
        style.add("LINEABOVE", (0, i * 2), (-1, i * 2), 0.4,
                  HexColor("#C4E5DF"))
    t.setStyle(style)
    return [KeepTogether(t), Spacer(1, 8)]


def render_workflow_compare(_payload=""):
    """Two-column side-by-side comparison. No "legacy / workflow" labels;
    neutral header copy that doesn't read as AI-deck boilerplate. Each
    column holds enough detail to stand on its own."""
    today_steps = [
        "A consultant is hired, or a desktop software license is opened.",
        "Data is collected by hand from spreadsheets, PDFs, and emails.",
        "Inputs are cleaned and harmonized manually.",
        "Multipliers are picked one by one. Assumptions are typed into the report margin.",
        "Charts are built by hand. A senior analyst writes the report.",
        "The deck is formatted overnight. Revisions take a week each.",
        "Every refresh starts over and is billed again.",
    ]
    lumecon_steps = [
        "The workspace opens to a clean study setup.",
        "PDFs, CSVs, and XLSX files are dropped into Cedar.",
        "Cedar structures inputs against public data automatically.",
        "Every assumption Cedar surfaces is reviewable and overridable.",
        "Branded report, deck, and executive summary export in one click.",
        "Revisions are a re-run, not a re-engagement.",
        "Refresh quarterly without reopening a contract.",
    ]

    def col_block(title_kicker, title, steps, is_today):
        if is_today:
            icon_bg = HexColor("#FBE5E3")
            icon_color = HexColor("#C84441")
            icon_char = "×"  # ×
            icon_size = 13
        else:
            icon_bg = TEAL_BG_MEDIUM
            icon_color = ACCENT_DEEP
            icon_char = "✓"  # ✓
            icon_size = 9

        col_outer = (COL_W - 0.2 * inch) / 2 - 8
        inner_w = col_outer - 24  # 12pt left + 12pt right padding
        icon_w = 14
        gap_w = 8
        text_w = inner_w - icon_w - gap_w

        icon_style = ps(f"wf-icon-{int(is_today)}",
            fontName="Inter-Bold", fontSize=icon_size, leading=icon_size + 2,
            textColor=icon_color, alignment=1)

        def make_item(step_text):
            icon_cell = Table([[Paragraph(icon_char, icon_style)]],
                              colWidths=[icon_w], rowHeights=[14])
            icon_cell.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), icon_bg),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            row = Table([[icon_cell, "", Paragraph(step_text, STY["wf-l"])]],
                        colWidths=[icon_w, gap_w, text_w])
            row.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            return row

        items = [make_item(s) for s in steps]
        head = [
            Paragraph(title_kicker, ps("wf-k", fontName="Inter-SemiBold",
                fontSize=7.5, leading=10,
                textColor=INK_3 if is_today else ACCENT_DEEP,
                spaceAfter=4)),
            Paragraph(title, STY["wf-h"]),
            Spacer(1, 4),
        ]
        rows = [[fl] for fl in head + items]
        cell = Table(rows, colWidths=[col_outer])
        cell.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1),
              TEAL_BG_SOFT if is_today else PAPER),
            ("BOX", (0, 0), (-1, -1), 0.7,
              HexColor("#C4E5DF") if is_today else ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        return cell

    today = col_block("TODAY", "Months of consultant time.",
                      today_steps, is_today=True)
    lumecon = col_block("WITH LUMECON", "Minutes of platform time.",
                        lumecon_steps, is_today=False)
    # Side-by-side row
    side_by_side = Table(
        [[today, lumecon]],
        colWidths=[(COL_W - 0.2 * inch) / 2 + 4] * 2,
    )
    side_by_side.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return KeepTogether([side_by_side, Spacer(1, 8)])


def render_roadmap(payload):
    """Visual timeline. Each line: year | label."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    items = []
    for r in rows:
        year, _, lbl = r.partition("|")
        items.append((year.strip(), lbl.strip()))
    cells = []
    for idx, (year, lbl) in enumerate(items):
        # Year chip + label
        chip = Table([[Paragraph(year, ps("rd-yr",
            fontName="Inter-Bold", fontSize=10, leading=12,
            textColor=PAPER, alignment=1))]],
            colWidths=[0.72 * inch],
            rowHeights=[0.32 * inch])
        chip.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), NAVY),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        cells.append([chip, Paragraph(inline(lbl), STY["rd-label"])])
    t = Table(cells, colWidths=[0.85 * inch, COL_W - 0.85 * inch - 6])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
    ]))
    return [KeepTogether(t), Spacer(1, 8)]


def render_funds(payload):
    """Use of funds table. Each line: category | amount | description."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    thead_style = ps("thead-soft",
        fontName="Inter-SemiBold", fontSize=8, leading=11,
        textColor=ACCENT_DEEP)
    data = [[
        Paragraph("Category", thead_style),
        Paragraph("Amount", thead_style),
        Paragraph("Detail", thead_style),
    ]]
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        if len(parts) < 3:
            parts += [""] * (3 - len(parts))
        data.append([
            Paragraph(parts[0], STY["tstrong"]),
            Paragraph(parts[1], STY["tnum"]),
            Paragraph(parts[2], STY["tcell"]),
        ])
    # Totals row
    total = 0
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        if len(parts) >= 2:
            amt = re.sub(r"[^\d]", "", parts[1])
            if amt: total += int(amt)
    data.append([
        Paragraph("<b>Total</b>", STY["tstrong"]),
        Paragraph(f"<b>${total:,}</b>", STY["tnum"]),
        Paragraph("", STY["tcell"]),
    ])
    col_w = COL_W
    t = Table(data, colWidths=[col_w * 0.27, col_w * 0.18, col_w * 0.55])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  PAPER),
        ("LINEBELOW",    (0, 0), (-1, 0),  1.0, ACCENT),
        ("LINEBELOW",    (0, 1), (-1, -2), 0.3, RULE),
        ("LINEABOVE",    (0, -1), (-1, -1), 0.5, ACCENT),
        ("BACKGROUND",   (0, -1), (-1, -1), TEAL_BG_SOFT),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return [KeepTogether(t), Spacer(1, 8)]


def render_teamgrid(payload):
    """Team person cards in a 3-column square grid. Each card carries
    a role label, a name, and a tight 1-2 line bio."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    cols = 3
    cell_w = (COL_W - 0.2 * inch) / cols
    cell_h = 2.05 * inch  # roughly square at the column width

    cards = []
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        if len(parts) < 3:
            parts += [""] * (3 - len(parts))
        name, role, bio = parts[0], parts[1], parts[2]
        inner = Table([
            [Paragraph(role.upper(), STY["tm-role"])],
            [Paragraph(name, STY["tm-name"])],
            [Spacer(1, 4)],
            [Paragraph(inline(bio), STY["tm-bio"])],
        ], colWidths=[cell_w - 14])
        inner.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        card = Table([[inner]], colWidths=[cell_w], rowHeights=[cell_h])
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), TEAL_BG_SOFT),
            ("LINEABOVE", (0, 0), (-1, 0), 1.6, ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        cards.append(card)

    # Pad with blank cells so the final row is full
    while len(cards) % cols != 0:
        cards.append(Spacer(cell_w, cell_h))

    rows_grid = []
    for j in range(0, len(cards), cols):
        rows_grid.append(cards[j:j + cols])

    grid = Table(rows_grid, colWidths=[cell_w] * cols)
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return [KeepTogether(grid), Spacer(1, 10)]


def render_pricing_side(payload):
    """Side-by-side pricing tables. Each input line:
        Title | Tier=Price | Tier=Price | Tier=Price ...
    """
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    if not rows:
        return []
    tables = []
    cell_w = (COL_W - 0.2 * inch) / 2
    thead_style = ps("thead-soft",
        fontName="Inter-SemiBold", fontSize=8, leading=11,
        textColor=ACCENT_DEEP)
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        title = parts[0]
        tier_lines = parts[1:]
        data = [[Paragraph("Tier", thead_style),
                 Paragraph("Annual price", thead_style)]]
        for tl in tier_lines:
            tier, _, price = tl.partition("=")
            data.append([
                Paragraph(tier.strip(), STY["tstrong"]),
                Paragraph(price.strip(), STY["tnum"]),
            ])
        tbl = Table(data, colWidths=[cell_w * 0.5, cell_w * 0.5])
        tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0),  PAPER),
            ("LINEBELOW",    (0, 0), (-1, 0),  1.0, ACCENT),
            ("LINEBELOW",    (0, 1), (-1, -1), 0.3, RULE),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING",   (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ]))
        block = [
            Paragraph(title, ps("rev-h", fontName="Inter-SemiBold",
                fontSize=10.5, leading=14, textColor=NAVY,
                spaceAfter=4)),
            tbl,
        ]
        wrap = Table([[fl] for fl in block], colWidths=[cell_w])
        wrap.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        tables.append(wrap)

    # Layout side by side: two tables per row
    grid_rows = []
    for j in range(0, len(tables), 2):
        pair = tables[j:j + 2]
        while len(pair) < 2:
            pair.append(Spacer(cell_w, 0))
        grid_rows.append(pair)
    grid = Table(grid_rows, colWidths=[cell_w + 4] * 2)
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [KeepTogether(grid), Spacer(1, 10)]


def render_institutions(payload):
    return [Paragraph(payload.upper().replace("·", "<font color='#0FB5A5'>·</font>"),
                      STY["inst"]), Spacer(1, 6)]


def render_addons(payload):
    """Arborist + Toolbox table. Each input line:
        Name | Price | Description
    Renders alongside the pricing tables as a separate compact table
    so the revenue picture is complete in one place."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    thead_style = ps("thead-soft",
        fontName="Inter-SemiBold", fontSize=8, leading=11,
        textColor=ACCENT_DEEP)
    data = [[
        Paragraph("Offering", thead_style),
        Paragraph("Price", thead_style),
        Paragraph("Detail", thead_style),
    ]]
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        if len(parts) < 3:
            parts += [""] * (3 - len(parts))
        data.append([
            Paragraph(parts[0], STY["tstrong"]),
            Paragraph(parts[1], STY["tnum"]),
            Paragraph(parts[2], STY["tcell"]),
        ])
    col_w = COL_W
    t = Table(data, colWidths=[col_w * 0.18, col_w * 0.17, col_w * 0.65])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  PAPER),
        ("LINEBELOW",    (0, 0), (-1, 0),  1.0, ACCENT),
        ("LINEBELOW",    (0, 1), (-1, -1), 0.3, RULE),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    return [KeepTogether(t), Spacer(1, 8)]


def render_screenshot_pair(payload):
    """Two screenshot placeholders side by side, each at half column
    width and a shorter height so the pair fits on one page row."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    cell_w = (COL_W - 0.2 * inch) / 2
    height = 2.8 * inch

    def one(slug, caption):
        inner = Table(
            [[Paragraph("PRODUCT", STY["ph-eyebrow"])],
             [Paragraph(slug.upper().replace("-", " "),
                ps("ph-slug-small", fontName="Inter-Bold",
                   fontSize=11, leading=14, textColor=NAVY,
                   alignment=1))]],
            colWidths=[cell_w - 0.3 * inch],
        )
        outer = Table([[inner]], colWidths=[cell_w], rowHeights=[height])
        outer.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PLACEHOLDER),
            ("BOX", (0, 0), (-1, -1), 0.7, RULE_STRONG),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        cap = Paragraph(inline(caption), STY["ph-cap"])
        block = Table([[outer], [cap]], colWidths=[cell_w])
        block.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return block

    cells = []
    for r in rows[:2]:
        slug, _, caption = r.partition("|")
        cells.append(one(slug.strip(), caption.strip()))
    while len(cells) < 2:
        cells.append(Spacer(cell_w, height))
    pair = Table([cells], colWidths=[cell_w + 4] * 2)
    pair.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [KeepTogether(pair), Spacer(1, 10)]


def render_cedarflow(_payload=""):
    """Cedar's source-intake-to-deliverable flow. Four steps shown as
    cards in a row with chevrons between them. This is the one product
    diagram in the document; it replaces the row of empty wireframe
    placeholders the deck used to carry."""
    steps = [
        ("01", "Source intake",
         "Drop PDFs, CSVs, and XLSX files. Cedar extracts and types every field."),
        ("02", "Harmonize",
         "Inputs match against public datasets. Geographies, sectors, and time windows resolve automatically."),
        ("03", "Assumption ledger",
         "Every modeling choice surfaces for analyst review. Override, annotate, or approve in place."),
        ("04", "Deliverable",
         "Report, deck, and executive summary export branded to the customer with the assumption record attached."),
    ]
    n = len(steps)
    # Six segments: 4 cards + 3 chevrons between
    chev_w = 14
    card_w = (COL_W - chev_w * (n - 1) - 6) / n

    def card(num, title, desc):
        kicker = Paragraph(
            num,
            ps(f"cf-num-{num}",
               fontName="Inter-Bold", fontSize=10, leading=12,
               textColor=ACCENT_DEEP, spaceAfter=4),
        )
        title_p = Paragraph(
            title,
            ps(f"cf-t-{num}",
               fontName="Inter-Bold", fontSize=10.5, leading=13,
               textColor=NAVY, spaceAfter=4),
        )
        desc_p = Paragraph(
            desc,
            ps(f"cf-d-{num}",
               fontName="Inter", fontSize=8.5, leading=11.5,
               textColor=INK_2),
        )
        inner = Table(
            [[kicker], [title_p], [desc_p]],
            colWidths=[card_w - 18],
        )
        inner.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        outer = Table([[inner]], colWidths=[card_w], rowHeights=[1.55 * inch])
        outer.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PAPER),
            ("BOX", (0, 0), (-1, -1), 0.7, ACCENT),
            ("LINEABOVE", (0, 0), (-1, 0), 2.2, ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return outer

    chev = Paragraph(
        "›",
        ps("cf-chev",
           fontName="Inter-Bold", fontSize=18, leading=22,
           textColor=ACCENT_DEEP, alignment=1),
    )

    row_cells = []
    col_widths = []
    for i, (num, title, desc) in enumerate(steps):
        row_cells.append(card(num, title, desc))
        col_widths.append(card_w)
        if i < n - 1:
            row_cells.append(chev)
            col_widths.append(chev_w)
    row = Table([row_cells], colWidths=col_widths)
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    caption = Paragraph(
        "Cedar's workflow. Each step is auditable; the analyst signs off "
        "on every assumption before the deliverable exports.",
        STY["ph-cap"],
    )
    return [KeepTogether([row, Spacer(1, 4), caption]), Spacer(1, 10)]


def render_references(payload):
    """Numbered references list. Each input line:
        N | citation text
    Renders as a two-column table: the number in teal, the citation
    in body type, with hairline separators. The aim is a clean
    bibliography, not a footer block."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    data = []
    for r in rows:
        num, _, text = r.partition("|")
        num_p = Paragraph(
            num.strip(),
            ps(f"ref-n-{num.strip()}",
               fontName="Inter-Bold", fontSize=8, leading=11,
               textColor=ACCENT_DEEP, alignment=2),
        )
        text_p = Paragraph(
            text.strip(),
            ps(f"ref-t-{num.strip()}",
               fontName="Inter", fontSize=8.5, leading=12,
               textColor=INK_2),
        )
        data.append([num_p, text_p])
    t = Table(
        data,
        colWidths=[0.32 * inch, COL_W - 0.32 * inch - 4],
    )
    style = TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ])
    for i in range(1, len(data)):
        style.add("LINEABOVE", (0, i), (-1, i), 0.3, RULE)
    t.setStyle(style)
    return [t, Spacer(1, 8)]


MOAT_SHADES = [
    HexColor("#EAF7F4"),
    HexColor("#C9EAE3"),
    HexColor("#86D2C5"),
    HexColor("#39B7A4"),
    HexColor("#0A8A7E"),
]


def render_moat(payload):
    """Stratigraphic moat. One row per layer, deepening from top
    (lightest teal, broadest reach) to bottom (deepest teal, hardest
    to displace). Each row carries a depth bar, the layer name, and
    the full description so the diagram reads as a real defensibility
    map rather than a stack of empty rectangles."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    layers = []
    for r in rows:
        title, _, desc = r.partition("|")
        layers.append((title.strip(), desc.strip()))

    n = len(layers)
    bar_col_w = 0.55 * inch
    title_col_w = 1.85 * inch
    desc_col_w = COL_W - bar_col_w - title_col_w - 6
    cells = []
    for i, (title, desc) in enumerate(layers):
        shade = MOAT_SHADES[min(i, len(MOAT_SHADES) - 1)]
        # Depth marker: a small horizontal stack that gets longer as
        # we go down. Visualizes "deeper layer, harder to dislodge."
        bar_w = bar_col_w - 14
        depth = bar_w * (i + 1) / n
        depth_flow = Table(
            [[""]],
            colWidths=[depth],
            rowHeights=[10],
        )
        depth_flow.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), shade),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        layer_kicker = Paragraph(
            f"LAYER {i+1}",
            ps(f"moat-k-{i}",
               fontName="Inter-SemiBold", fontSize=6.5, leading=9,
               textColor=ACCENT_DEEP, spaceAfter=3),
        )
        depth_cell = Table(
            [[layer_kicker], [depth_flow]],
            colWidths=[bar_col_w - 8],
        )
        depth_cell.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        title_p = Paragraph(
            title,
            ps(f"moat-t-{i}",
               fontName="Inter-Bold", fontSize=10, leading=13,
               textColor=NAVY),
        )
        desc_p = Paragraph(
            desc,
            ps(f"moat-d-{i}",
               fontName="Inter", fontSize=9, leading=12.5,
               textColor=INK_2),
        )
        cells.append([depth_cell, title_p, desc_p])

    t = Table(cells, colWidths=[bar_col_w, title_col_w, desc_col_w])
    style = TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.7, HexColor("#C4E5DF")),
    ])
    # Hairline separators between layer rows
    for i in range(1, n):
        style.add("LINEABOVE", (0, i), (-1, i), 0.4, HexColor("#DDEEEA"))
    t.setStyle(style)
    return [KeepTogether(t), Spacer(1, 10)]


def render_advisor_grid(payload):
    """Advisors row, with cards visually different from the main team
    cards: outlined rather than filled, smaller, accent rule below the
    name. Sits on its own row so the visual separation from team is
    explicit."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    cols = 3
    cell_w = (COL_W - 0.2 * inch) / cols
    cell_h = 1.55 * inch

    cards = []
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        if len(parts) < 3:
            parts += [""] * (3 - len(parts))
        name, role, bio = parts[0], parts[1], parts[2]
        inner = Table([
            [Paragraph("ADVISOR", ps("adv-eyebrow",
                fontName="Inter-SemiBold", fontSize=7, leading=10,
                textColor=ACCENT_DEEP, spaceAfter=2))],
            [Paragraph(name, ps("adv-name",
                fontName="Inter-Bold", fontSize=10, leading=13,
                textColor=NAVY))],
            [Paragraph(role, ps("adv-role",
                fontName="Inter", fontSize=8, leading=10,
                textColor=INK_3, spaceAfter=3))],
            [Paragraph(inline(bio), STY["tm-bio"])],
        ], colWidths=[cell_w - 14])
        inner.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        card = Table([[inner]], colWidths=[cell_w], rowHeights=[cell_h])
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PAPER),
            ("BOX", (0, 0), (-1, -1), 0.6, ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        cards.append(card)

    while len(cards) % cols != 0:
        cards.append(Spacer(cell_w, cell_h))

    rows_grid = [cards[j:j + cols] for j in range(0, len(cards), cols)]
    grid = Table(rows_grid, colWidths=[cell_w] * cols)
    grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    advisor_header = Paragraph("ADVISORS",
        ps("adv-header", fontName="Inter-SemiBold", fontSize=8,
           leading=11, textColor=ACCENT_DEEP, spaceBefore=8, spaceAfter=4))
    return [advisor_header, KeepTogether(grid), Spacer(1, 8)]


# ---- Page decoration ----
def cover_decoration(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(TEAL_BG_SOFT)
    canvas.rect(0, 0, RAIL_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2.2)
    canvas.line(RAIL_W, 0, RAIL_W, PAGE_H)
    canvas.restoreState()


def body_decoration(canvas, doc):
    canvas.saveState()
    # Teal-tinted side rail with the brand accent line at the inside
    # edge. Continuous through the deck.
    canvas.setFillColor(TEAL_BG_SOFT)
    canvas.rect(0, 0, RAIL_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2.2)
    canvas.line(RAIL_W, 0, RAIL_W, PAGE_H)
    # Running header
    canvas.setFont("Inter-SemiBold", 7.5)
    canvas.setFillColor(INK_3)
    canvas.drawString(MARGIN_L, PAGE_H - 0.36 * inch,
                      "LUMECON  /  INVESTOR MEMORANDUM")
    canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 0.36 * inch,
                           "SUMMER 2026")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, PAGE_H - 0.43 * inch,
                PAGE_W - MARGIN_R, PAGE_H - 0.43 * inch)
    # Footer
    canvas.setFont("Inter", 7.5)
    canvas.drawString(MARGIN_L, 0.3 * inch, "CONFIDENTIAL AND PROPRIETARY")
    canvas.drawRightString(PAGE_W - MARGIN_R, 0.3 * inch,
                           f"Page {doc.page - 1}")
    canvas.restoreState()


# ---- Cover ----
def build_cover():
    """Portrait cover. Seal mark on top, title in the middle, the
    website's actual tagline ("We luminate economies") below. No
    marketing paragraph; the rest of the document carries the detail.
    """
    seal_size = 2.4 * inch
    seal = Image(str(SEAL), width=seal_size, height=seal_size)

    # Tagline mirrors the website's descriptor strip ("Economic impact
    # analysis software ..."). The rest of the document carries the
    # detail; the cover just states what Lumecon is.
    tagline_style = ps("cover-tagline",
        fontName="Inter", fontSize=15, leading=22,
        textColor=INK_2, spaceAfter=8)
    tagline_html = (
        "Economic impact analysis software for governments, "
        "enterprises, and mission-driven organizations."
    )

    return [
        Spacer(1, 0.2 * inch),
        seal,
        Spacer(1, 1.0 * inch),
        Paragraph(
            "INVESTOR MEMORANDUM  ·  SUMMER 2026  ·  CONFIDENTIAL",
            STY["cover-meta"],
        ),
        Paragraph(
            'An <font backColor="#B8EDE6"> investor memorandum </font> '
            'for Lumecon.',
            STY["cover-title"],
        ),
        Paragraph(tagline_html, tagline_style),
        Spacer(1, 0.45 * inch),
        HRFlowable(width="100%", thickness=0.6, color=RULE),
        Spacer(1, 10),
        Paragraph(
            "Lumecon Inc.  ·  A Delaware Corporation  ·  lumecon.ai",
            STY["cover-foot"],
        ),
    ]


# ---- Body ----
def build_body(md):
    flow = []
    items = list(parse(md))
    saw_h1, saw_meta = False, False
    for k, v in items:
        if k == "h1":
            saw_h1 = True; continue
        if k == "p" and saw_h1 and not saw_meta:
            saw_meta = True; continue
        if k == "hr":
            flow.append(Spacer(1, 2))
            flow.append(HRFlowable(width="100%", thickness=0.4, color=RULE))
            flow.append(Spacer(1, 4))
        elif k == "h2":
            # Strip any {{HL:color}} marker from the kicker label so the
            # tiny mono caps eyebrow above the h2 doesn't repeat the
            # marker text. The marker is consumed by render_h2_with_hl.
            kicker_text = re.sub(r"\{\{HL:[a-z]+\}\}", "", v).strip()
            # Kicker and headline use keepWithNext to bind to the
            # first body flowable that follows; no manual page-break
            # gymnastics needed.
            flow.append(Paragraph(kicker_text.upper(), STY["kicker"]))
            flow.append(render_h2_with_hl(v))
        elif k == "h3":
            flow.append(Paragraph(v, STY["h3"]))
        elif k == "pull":
            # Wrap the pull-quote together with the trailing flowable
            # already in the column so it can't orphan onto its own page
            # (the closing mission line was landing alone on the final
            # page before this).
            pull_p = Paragraph(inline(v), STY["pull"])
            if flow and isinstance(flow[-1], Paragraph):
                prior = flow.pop()
                flow.append(KeepTogether([prior, Spacer(1, 2), pull_p]))
            else:
                flow.append(Spacer(1, 2))
                flow.append(pull_p)
        elif k == "p":
            flow.append(Paragraph(inline(v), STY["body"]))
        elif k == "list":
            for item in v:
                flow.append(Paragraph("• " + inline(item), STY["li"]))
            flow.append(Spacer(1, 4))
        elif k == "table":
            header, body, aligns = v
            col_count = len(header)
            data = [[Paragraph(inline(h), STY["thead"]) for h in header]]
            for row in body:
                cs = []
                for idx, c in enumerate(row):
                    align = aligns[idx] if idx < len(aligns) else "left"
                    if align == "right":
                        cs.append(Paragraph(inline(c), STY["tnum"]))
                    elif idx == 0:
                        cs.append(Paragraph(inline(c), STY["tstrong"]))
                    else:
                        cs.append(Paragraph(inline(c), STY["tcell"]))
                data.append(cs)
            if col_count == 2:
                cw = [COL_W * 0.5, COL_W * 0.5]
            else:
                cw = [COL_W / col_count] * col_count
            # Lighter, editorial table style: no heavy navy header bar.
            # Header text in teal-deep on white with a teal underline.
            # Thin neutral row separators. No alternating zebra fill
            # (that SaaS look read as vibe-coded).
            data[0] = [
                Paragraph(inline(h), ps("thead-soft",
                    fontName="Inter-SemiBold", fontSize=8, leading=11,
                    textColor=ACCENT_DEEP,
                    spaceBefore=0, spaceAfter=0))
                for h in header
            ]
            t = Table(data, colWidths=cw, hAlign="LEFT")
            t.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, 0),  PAPER),
                ("LINEBELOW",    (0, 0), (-1, 0),  1.0, ACCENT),
                ("LINEBELOW",    (0, 1), (-1, -1), 0.3, RULE),
                ("LEFTPADDING",  (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING",   (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
                ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ]))
            flow.append(Spacer(1, 2))
            flow.append(KeepTogether(t))
            flow.append(Spacer(1, 8))
        elif k == "block":
            kind, payload = v
            if kind == "SCREENSHOT":
                flow.append(render_screenshot(payload))
            elif kind == "STATGRID":
                flow.extend(render_statgrid(payload))
            elif kind == "WORKFLOWCOMPARE":
                flow.append(render_workflow_compare(payload))
            elif kind == "ROADMAP":
                flow.extend(render_roadmap(payload))
            elif kind == "FUNDS":
                flow.extend(render_funds(payload))
            elif kind == "TEAMGRID":
                flow.extend(render_teamgrid(payload))
            elif kind == "ADVISORGRID":
                flow.extend(render_advisor_grid(payload))
            elif kind == "INSTITUTIONS":
                flow.extend(render_institutions(payload))
            elif kind == "PRICING":
                flow.extend(render_pricing_side(payload))
            elif kind == "ADDONS":
                flow.extend(render_addons(payload))
            elif kind == "SCREENSHOTPAIR":
                flow.extend(render_screenshot_pair(payload))
            elif kind == "MOAT":
                flow.extend(render_moat(payload))
            elif kind == "CEDARFLOW":
                flow.extend(render_cedarflow(payload))
            elif kind == "REFERENCES":
                flow.extend(render_references(payload))
    return flow


# ---- Build ----
def main():
    md = SRC.read_text(encoding="utf-8")
    doc = BaseDocTemplate(
        str(PDF),
        pagesize=LETTER,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="Lumecon Investor Memorandum",
        author="Lumecon Inc.",
        subject="Confidential investor memorandum",
    )
    # Portrait single-column frames. The cover frame indents past the
    # teal side rail so the cover content reads as inset from the
    # brand edge. The body frame uses the same left inset on every
    # page so the rail anchors the document consistently.
    cover_frame = Frame(
        RAIL_W + 0.4 * inch, MARGIN_B,
        PAGE_W - RAIL_W - 0.4 * inch - MARGIN_R,
        PAGE_H - MARGIN_T - MARGIN_B,
        id="cover", leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0,
    )
    body_frame = Frame(
        MARGIN_L, MARGIN_B + 0.15 * inch,
        COL_W, PAGE_H - MARGIN_T - MARGIN_B - 0.45 * inch,
        id="body", leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0,
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_decoration),
        PageTemplate(id="body", frames=[body_frame],
                     onPage=body_decoration),
    ])
    flow = build_cover()
    flow.append(NextPageTemplate("body"))
    flow.append(PageBreak())
    flow.extend(build_body(md))
    doc.build(flow)
    print("Wrote:", PDF)


if __name__ == "__main__":
    main()
