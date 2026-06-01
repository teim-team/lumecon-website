#!/usr/bin/env python3
"""
Render the investor memo (lumecon-investor-memo.md) into a branded,
print-ready LANDSCAPE PDF using ReportLab. Matches the lumecon.ai
visual system:

  - Inter for body and display (the site uses --font-display: Inter,
    not Spectral; Spectral is reserved for the .lumin italic accent)
  - Standalone seal mark on the cover (no baked-in "LUMECON" text)
  - Cream side rail with gold accent line
  - Teal hl-block highlight on the cover title accent word
  - Two-column body layout for editorial density
  - Inter-Bold navy table headers with zebra-striped body rows

Run from the repo root:

    python3 docs/investor-memo/build.py

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
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    HRFlowable,
    Image,
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

# ---------- Brand palette (matches src/styles/global.css) ----------
NAVY        = HexColor("#0A0F26")
INK         = HexColor("#0A0F26")
INK_2       = HexColor("#353B5C")
INK_3       = HexColor("#6B6F8A")
INK_4       = HexColor("#9DA1B5")
GOLD        = HexColor("#F0A91A")
ACCENT      = HexColor("#0FB5A5")
ACCENT_DEEP = HexColor("#0A8A7E")
ACCENT_BAR  = HexColor("#B8EDE6")
CREAM       = HexColor("#FAF6EE")
RULE        = HexColor("#E8E8EE")
RULE_STRONG = HexColor("#C4C7D4")
PAPER       = colors.white
ZEBRA       = HexColor("#F5FBFA")

# ---------- Fonts (Inter only for memo body + display) ----------
pdfmetrics.registerFont(TTFont("Inter",          str(FONTS / "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Medium",   str(FONTS / "Inter-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Inter-SemiBold", str(FONTS / "Inter-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Bold",     str(FONTS / "Inter-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Spectral-Italic", str(FONTS / "Spectral-Italic.ttf")))

from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily(
    "Inter",
    normal="Inter",
    bold="Inter-Bold",
    italic="Spectral-Italic",  # the only italic on the site is .lumin
    boldItalic="Inter-Bold",
)


# ---------- Page geometry ----------
PAGE_W, PAGE_H = landscape(LETTER)   # 11" x 8.5"
MARGIN_L = 0.85 * inch
MARGIN_R = 0.6 * inch
MARGIN_T = 0.6 * inch
MARGIN_B = 0.55 * inch
RAIL_W = 0.45 * inch                  # cream left rail width (cover)
GUTTER = 0.35 * inch                  # space between body columns

# Content area after standard margins
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R
CONTENT_H = PAGE_H - MARGIN_T - MARGIN_B


# ---------- Styles ----------
STY = {
    "kicker": ParagraphStyle(
        "kicker",
        fontName="Inter-SemiBold",
        fontSize=7.5,
        leading=10,
        textColor=ACCENT_DEEP,
        spaceAfter=2,
    ),
    "h2": ParagraphStyle(
        "h2",
        fontName="Inter-Bold",
        fontSize=15,
        leading=18,
        textColor=NAVY,
        letterSpace=-0.2,
        spaceBefore=8,
        spaceAfter=3,
    ),
    "h3": ParagraphStyle(
        "h3",
        fontName="Inter-SemiBold",
        fontSize=10.5,
        leading=13,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=2,
    ),
    "body": ParagraphStyle(
        "body",
        fontName="Inter",
        fontSize=9.5,
        leading=14,
        textColor=INK,
        spaceAfter=6,
    ),
    "pullquote": ParagraphStyle(
        "pullquote",
        fontName="Inter-SemiBold",
        fontSize=14,
        leading=18,
        textColor=NAVY,
        spaceBefore=4,
        spaceAfter=8,
        letterSpace=-0.3,
    ),
    "li": ParagraphStyle(
        "li",
        fontName="Inter",
        fontSize=9.5,
        leading=14,
        textColor=INK,
        spaceAfter=2,
        leftIndent=12,
        bulletIndent=0,
    ),
    "table-head": ParagraphStyle(
        "table-head",
        fontName="Inter-SemiBold",
        fontSize=8,
        leading=11,
        textColor=PAPER,
    ),
    "table-cell": ParagraphStyle(
        "table-cell",
        fontName="Inter",
        fontSize=9,
        leading=12,
        textColor=INK,
    ),
    "table-cell-strong": ParagraphStyle(
        "table-cell-strong",
        fontName="Inter-SemiBold",
        fontSize=9,
        leading=12,
        textColor=NAVY,
    ),
    "table-cell-num": ParagraphStyle(
        "table-cell-num",
        fontName="Inter-SemiBold",
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
        alignment=2,  # right
    ),
    "cover-meta": ParagraphStyle(
        "cover-meta",
        fontName="Inter-SemiBold",
        fontSize=8,
        leading=11,
        textColor=INK_3,
        spaceAfter=18,
    ),
    "cover-title": ParagraphStyle(
        "cover-title",
        fontName="Inter-Bold",
        fontSize=44,
        leading=48,
        textColor=NAVY,
        spaceAfter=18,
        letterSpace=-1.2,
    ),
    "cover-deck": ParagraphStyle(
        "cover-deck",
        fontName="Inter",
        fontSize=12,
        leading=18,
        textColor=INK_2,
        spaceAfter=8,
    ),
    "cover-foot": ParagraphStyle(
        "cover-foot",
        fontName="Inter-SemiBold",
        fontSize=7.5,
        leading=10,
        textColor=INK_3,
    ),
    "cover-tag": ParagraphStyle(
        "cover-tag",
        fontName="Inter",
        fontSize=9,
        leading=12,
        textColor=NAVY,
    ),
}


# ---------- Markdown parsing ----------
def inline(s: str) -> str:
    """Escape &<> for ReportLab's mini-XML, then apply **bold** / *em*.
    The .lumin gold-italic 'luminate' accent on the site is mirrored by
    routing italic markdown through Spectral-Italic in the gold color."""
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(
        r"(^|[^*])\*([^*]+?)\*(?!\*)",
        r'\1<font name="Spectral-Italic" color="#F0A91A">\2</font>',
        s,
    )
    return s


def parse(md: str):
    lines = md.splitlines()
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1
            continue
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
            header = cells[0]
            align_row = cells[1]
            body = cells[2:]
            aligns = []
            for a in align_row:
                if a.endswith(":") and a.startswith(":"): aligns.append("center")
                elif a.endswith(":"): aligns.append("right")
                else: aligns.append("left")
            yield "table", (header, body, aligns); continue
        if line.startswith("- ") or line.startswith("* "):
            items = []
            while i < n and (lines[i].startswith("- ") or lines[i].startswith("* ")):
                items.append(lines[i][2:].strip()); i += 1
            yield "list", items; continue
        para = [line]; i += 1
        while i < n and lines[i].strip() and not lines[i].startswith(("#", "-", "*", "|")) and lines[i].strip() != "---":
            para.append(lines[i]); i += 1
        text = " ".join(para)
        bare = text.strip()
        if bare.startswith("**") and bare.endswith("**") and bare.count("**") == 2:
            yield "pull", bare[2:-2].strip()
        else:
            yield "p", text


# ---------- Page decoration (canvas drawing on every page) ----------
def cover_decoration(canvas, doc):
    canvas.saveState()
    # Cream side rail full-bleed on the left
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, RAIL_W, PAGE_H, stroke=0, fill=1)
    # Gold accent rule at the rail edge
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(2.2)
    canvas.line(RAIL_W, 0, RAIL_W, PAGE_H)
    canvas.restoreState()


def body_decoration(canvas, doc):
    canvas.saveState()
    # Header
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


# ---------- Cover ----------
def build_cover():
    """Cover laid out manually in a 2-column Table so the standalone
    seal sits on the left and the title block sits on the right.
    Returns a list of flowables for the cover page."""
    # Left cell: standalone seal mark (large, no wordmark text)
    seal_size = 3.8 * inch
    seal_img = Image(str(SEAL), width=seal_size, height=seal_size)

    # Right cell: kicker + title + deck + footer line
    right_flow = [
        Paragraph(
            "INVESTOR MEMORANDUM  ·  SUMMER 2026  ·  CONFIDENTIAL",
            STY["cover-meta"],
        ),
        # Title with the teal hl-block highlight behind the accent word.
        # backColor in mini-XML draws the highlight behind the glyphs,
        # which mirrors the .hl-block treatment on the site.
        Paragraph(
            'An <font backColor="#B8EDE6"> investor memorandum </font> '
            'for Lumecon.',
            STY["cover-title"],
        ),
        Paragraph(
            "Software-first economic impact analysis for the organizations "
            "the current market underserves. Built for governments, tribal "
            "nations, nonprofits, universities, foundations, enterprises, "
            "and the consultants who serve them.",
            STY["cover-deck"],
        ),
        Spacer(1, 0.25 * inch),
        HRFlowable(width="100%", thickness=0.6, color=RULE),
        Spacer(1, 8),
        Paragraph(
            "Lumecon Inc.  ·  A Delaware Corporation  ·  lumecon.ai",
            STY["cover-foot"],
        ),
    ]

    # 2-column wrapper table
    cover_table = Table(
        [[seal_img, right_flow]],
        colWidths=[seal_size + 0.4 * inch,
                   PAGE_W - RAIL_W - MARGIN_R - seal_size - 0.4 * inch - 0.6 * inch],
        rowHeights=[CONTENT_H],
    )
    cover_table.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (0, 0), "TOP"),
        ("VALIGN",        (1, 0), (1, 0), "MIDDLE"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [cover_table]


# ---------- Body flow ----------
def build_body(md: str):
    flow = []
    items = list(parse(md))

    # Skip the h1 + cover-meta paragraph; the cover already carries them.
    saw_h1 = False
    saw_meta = False

    for k, v in items:
        if k == "h1":
            saw_h1 = True
            continue
        if k == "p" and saw_h1 and not saw_meta:
            saw_meta = True
            continue
        if k == "hr":
            flow.append(Spacer(1, 2))
            flow.append(HRFlowable(width="100%", thickness=0.4, color=RULE))
            flow.append(Spacer(1, 4))
        elif k == "h2":
            flow.append(Paragraph(v.upper(), STY["kicker"]))
            flow.append(Paragraph(v, STY["h2"]))
        elif k == "h3":
            flow.append(Paragraph(v, STY["h3"]))
        elif k == "pull":
            flow.append(Spacer(1, 2))
            flow.append(Paragraph(inline(v), STY["pullquote"]))
        elif k == "p":
            flow.append(Paragraph(inline(v), STY["body"]))
        elif k == "list":
            for item in v:
                flow.append(Paragraph("• " + inline(item), STY["li"]))
            flow.append(Spacer(1, 4))
        elif k == "table":
            header, body, aligns = v
            col_count = len(header)
            data = [[Paragraph(inline(h), STY["table-head"]) for h in header]]
            for row in body:
                cells = []
                for idx, c in enumerate(row):
                    align = aligns[idx] if idx < len(aligns) else "left"
                    if align == "right":
                        cells.append(Paragraph(inline(c), STY["table-cell-num"]))
                    elif idx == 0:
                        cells.append(Paragraph(inline(c), STY["table-cell-strong"]))
                    else:
                        cells.append(Paragraph(inline(c), STY["table-cell"]))
                data.append(cells)

            # Tables sit inside a column; constrain width to column width
            col_total = (CONTENT_W - GUTTER) / 2
            if col_count == 2:
                col_w = [col_total * 0.5, col_total * 0.5]
            else:
                col_w = [col_total / col_count] * col_count

            tbl = Table(data, colWidths=col_w, hAlign="LEFT")
            tbl.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR",    (0, 0), (-1, 0), PAPER),
                ("LEFTPADDING",  (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING",   (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
                ("LINEBELOW",    (0, 0), (-1, 0), 0.5, NAVY),
                ("LINEBELOW",    (0, 1), (-1, -2), 0.3, RULE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PAPER, ZEBRA]),
                ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ]))
            flow.append(Spacer(1, 2))
            flow.append(tbl)
            flow.append(Spacer(1, 8))

    return flow


# ---------- Build ----------
def main():
    md = SRC.read_text(encoding="utf-8")

    doc = BaseDocTemplate(
        str(PDF),
        pagesize=landscape(LETTER),
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title="Lumecon Investor Memorandum",
        author="Lumecon Inc.",
        subject="Confidential investor memorandum",
    )

    # Cover frame: single column edge-to-edge inside the standard margins,
    # but the page also has the cream rail painted via cover_decoration().
    cover_frame = Frame(
        RAIL_W + 0.4 * inch,
        MARGIN_B,
        PAGE_W - RAIL_W - 0.4 * inch - MARGIN_R,
        PAGE_H - MARGIN_T - MARGIN_B,
        id="cover",
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )

    # Body: 2 columns of editorial text. Frame widths are derived from
    # CONTENT_W minus the gutter.
    col_w = (CONTENT_W - GUTTER) / 2
    body_left = Frame(
        MARGIN_L,
        MARGIN_B + 0.15 * inch,
        col_w,
        PAGE_H - MARGIN_T - MARGIN_B - 0.45 * inch,
        id="left",
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    body_right = Frame(
        MARGIN_L + col_w + GUTTER,
        MARGIN_B + 0.15 * inch,
        col_w,
        PAGE_H - MARGIN_T - MARGIN_B - 0.45 * inch,
        id="right",
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_decoration),
        PageTemplate(id="body",  frames=[body_left, body_right],
                     onPage=body_decoration),
    ])

    flow = []
    flow.extend(build_cover())
    flow.append(NextPageTemplate("body"))
    flow.append(PageBreak())
    flow.extend(build_body(md))

    doc.build(flow)
    print("Wrote:", PDF)


if __name__ == "__main__":
    main()
