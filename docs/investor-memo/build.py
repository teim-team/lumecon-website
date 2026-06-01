#!/usr/bin/env python3
"""
Render the investor memo (lumecon-investor-memo.md) into a branded,
print-ready PDF using ReportLab. The PDF uses the actual brand fonts
(Inter, Spectral) bundled in ./fonts/ and the seal mark from
/public/brand/lumecon-logo-mark-transparent.png, then renders the
"LUMECON" wordmark and "We luminate economies" tagline in HTML/CSS
style — matching how BrandWordmark.astro renders the brand on the
live site, instead of using a baked-in-text logo image.

Run from the repo root:

    python3 docs/investor-memo/build.py

Output: docs/investor-memo/lumecon-investor-memo.pdf
"""
from __future__ import annotations
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
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
)

HERE = Path(__file__).parent
REPO = HERE.parent.parent
SRC = HERE / "lumecon-investor-memo.md"
PDF = HERE / "lumecon-investor-memo.pdf"
FONTS = HERE / "fonts"
SEAL = REPO / "public" / "brand" / "lumecon-logo-mark-transparent.png"

# ---------- Brand palette (matches src/styles/global.css) ----------
NAVY        = HexColor("#0A0F26")
NAVY_SOFT   = HexColor("#1A2046")
INK         = HexColor("#0A0F26")
INK_2       = HexColor("#353B5C")
INK_3       = HexColor("#6B6F8A")
INK_4       = HexColor("#9DA1B5")
GOLD        = HexColor("#F0A91A")
GOLD_BAR    = HexColor("#FFE7A0")
ACCENT      = HexColor("#0FB5A5")
ACCENT_DEEP = HexColor("#0A8A7E")
ACCENT_BAR  = HexColor("#B8EDE6")
CREAM       = HexColor("#FAF6EE")
RULE        = HexColor("#E8E8EE")
RULE_STRONG = HexColor("#C4C7D4")
PAPER       = colors.white

# ---------- Fonts ----------
pdfmetrics.registerFont(TTFont("Inter",          str(FONTS / "Inter-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Medium",   str(FONTS / "Inter-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Inter-SemiBold", str(FONTS / "Inter-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Bold",     str(FONTS / "Inter-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Spectral",       str(FONTS / "Spectral-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Spectral-Italic", str(FONTS / "Spectral-Italic.ttf")))
pdfmetrics.registerFont(TTFont("Spectral-SemiBold", str(FONTS / "Spectral-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Spectral-Bold",  str(FONTS / "Spectral-Bold.ttf")))

from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily(
    "Inter",
    normal="Inter",
    bold="Inter-Bold",
    italic="Inter",
    boldItalic="Inter-Bold",
)
registerFontFamily(
    "Spectral",
    normal="Spectral",
    bold="Spectral-Bold",
    italic="Spectral-Italic",
    boldItalic="Spectral-Bold",
)


# ---------- Styles ----------
STY = {
    "body": ParagraphStyle(
        "body",
        fontName="Spectral",
        fontSize=10.5,
        leading=15.5,
        textColor=INK,
        spaceAfter=8,
    ),
    "pullquote": ParagraphStyle(
        "pullquote",
        fontName="Spectral-SemiBold",
        fontSize=17,
        leading=22,
        textColor=NAVY,
        spaceBefore=6,
        spaceAfter=10,
        leftIndent=0,
    ),
    "h2": ParagraphStyle(
        "h2",
        fontName="Spectral-SemiBold",
        fontSize=19,
        leading=23,
        textColor=NAVY,
        spaceBefore=20,
        spaceAfter=4,
    ),
    "h2kicker": ParagraphStyle(
        "h2kicker",
        fontName="Inter-SemiBold",
        fontSize=7.5,
        leading=10,
        textColor=ACCENT_DEEP,
        spaceBefore=0,
        spaceAfter=2,
    ),
    "h3": ParagraphStyle(
        "h3",
        fontName="Inter-SemiBold",
        fontSize=11,
        leading=14,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=2,
    ),
    "callout-label": ParagraphStyle(
        "callout-label",
        fontName="Inter-SemiBold",
        fontSize=9.5,
        leading=13,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=1,
    ),
    "li": ParagraphStyle(
        "li",
        fontName="Spectral",
        fontSize=10.5,
        leading=15,
        textColor=INK,
        spaceAfter=3,
        leftIndent=14,
        bulletIndent=2,
    ),
    "cover-meta": ParagraphStyle(
        "cover-meta",
        fontName="Inter-SemiBold",
        fontSize=8,
        leading=11,
        textColor=INK_3,
        spaceAfter=22,
    ),
    "cover-title": ParagraphStyle(
        "cover-title",
        fontName="Spectral-SemiBold",
        fontSize=48,
        leading=52,
        textColor=NAVY,
        spaceAfter=20,
    ),
    "cover-deck": ParagraphStyle(
        "cover-deck",
        fontName="Spectral",
        fontSize=14,
        leading=21,
        textColor=INK_2,
        spaceAfter=10,
    ),
    "cover-foot": ParagraphStyle(
        "cover-foot",
        fontName="Inter-SemiBold",
        fontSize=7.5,
        leading=10,
        textColor=INK_3,
    ),
    "table-cell": ParagraphStyle(
        "table-cell",
        fontName="Inter",
        fontSize=9.5,
        leading=13,
        textColor=INK,
    ),
    "table-cell-strong": ParagraphStyle(
        "table-cell-strong",
        fontName="Inter-SemiBold",
        fontSize=9.5,
        leading=13,
        textColor=NAVY,
    ),
    "table-cell-num": ParagraphStyle(
        "table-cell-num",
        fontName="Inter-SemiBold",
        fontSize=10,
        leading=13,
        textColor=NAVY,
        alignment=2,  # right
    ),
    "table-head": ParagraphStyle(
        "table-head",
        fontName="Inter-SemiBold",
        fontSize=8,
        leading=11,
        textColor=PAPER,
    ),
}


# ---------- Markdown parsing ----------
def inline(s: str) -> str:
    """Apply inline markdown: **bold** -> <b>, *em* -> <i>.
       Escapes &<> for ReportLab's mini-XML parser."""
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(^|[^*])\*([^*]+?)\*(?!\*)", r"\1<i>\2</i>", s)
    return s


def parse(md: str):
    """Yield (kind, payload) tuples for renderer. kinds:
       'h1'(text), 'meta'(text), 'h2'(text), 'h3'(text),
       'p'(text), 'pull'(text), 'list'(items),
       'table'(rows, aligns), 'hr', 'callout-list'(items)."""
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
        # paragraph: gather until blank
        para = [line]; i += 1
        while i < n and lines[i].strip() and not lines[i].startswith(("#", "-", "*", "|")) and lines[i].strip() != "---":
            para.append(lines[i]); i += 1
        text = " ".join(para)
        # The two mission-statement paragraphs are bold-only and should
        # render as pull-quotes, not body paragraphs.
        bare = text.strip()
        if bare.startswith("**") and bare.endswith("**") and bare.count("**") == 2:
            yield "pull", bare[2:-2].strip()
        else:
            yield "p", text


# ---------- Custom flowables ----------
class BrandWordmark:
    """Mirrors src/components/BrandWordmark.astro: seal PNG + LUMECON
    caps in Inter SemiBold + 'We luminate economies' tagline with
    'luminate' as italic gold Spectral. Returns a flowable Table."""

    @staticmethod
    def build(size: str = "lg") -> Table:
        sizes = {
            "sm": dict(seal=22, name=11, tag=6.5, gap=6),
            "md": dict(seal=36, name=16, tag=8.5, gap=10),
            "lg": dict(seal=44, name=20, tag=10, gap=12),
        }
        cfg = sizes[size]
        seal_img = Image(str(SEAL), width=cfg["seal"], height=cfg["seal"])
        wordmark_style = ParagraphStyle(
            "wordmark",
            fontName="Inter-Bold",
            fontSize=cfg["name"],
            leading=cfg["name"] * 1.05,
            textColor=NAVY,
        )
        tag_style = ParagraphStyle(
            "wordmark-tag",
            fontName="Inter",
            fontSize=cfg["tag"],
            leading=cfg["tag"] * 1.25,
            textColor=NAVY,
        )
        # Use the actual brand: "LUMECON" all caps with .18em letter-spacing
        # via Inter Bold. ReportLab doesn't do CSS letter-spacing, so we
        # space the letters with thin spaces. Tagline italicizes
        # "luminate" in gold via mini-XML font tags.
        wordmark_text = "L U M E C O N"
        tag_text = (
            f'We <font name="Spectral-Italic" color="#F0A91A">'
            f'<font size="{cfg["tag"] * 1.2}">luminate</font></font> economies'
        )
        text_table = Table(
            [
                [Paragraph(wordmark_text, wordmark_style)],
                [Paragraph(tag_text, tag_style)],
            ],
            colWidths=[None],
            rowHeights=[cfg["name"] * 1.1, cfg["tag"] * 1.45],
            hAlign="LEFT",
        )
        text_table.setStyle(TableStyle([
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
            ("TOPPADDING",    (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        wrap = Table([[seal_img, text_table]], colWidths=[cfg["seal"] + cfg["gap"], None],
                     hAlign="LEFT")
        wrap.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
            ("TOPPADDING",    (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        return wrap


def hl_block_para(text: str, color=ACCENT_BAR, style=STY["cover-title"]) -> Paragraph:
    """Wrap the highlighted word in the title with an inline background
    via mini-XML. ReportLab's <font backColor> renders behind the
    glyphs, mirroring the .hl-block treatment on the site."""
    # The marker {{HL:...}} in source gets converted to background-highlighted.
    text = re.sub(
        r"\{\{HL:(.+?)\}\}",
        lambda m: f'<font backColor="#B8EDE6"> {m.group(1)} </font>',
        text,
    )
    return Paragraph(text, style)


# ---------- Page templates ----------
PAGE_W, PAGE_H = LETTER
MARGIN = 0.7 * inch
CONTENT_W = PAGE_W - 2 * MARGIN


def cover_decoration(canvas, doc):
    canvas.saveState()
    # Cream side rail on the cover only, full bleed left edge.
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, 0.45 * inch, PAGE_H, stroke=0, fill=1)
    # Thin gold rule near the rail
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(2)
    canvas.line(0.45 * inch, 0, 0.45 * inch, PAGE_H)
    canvas.restoreState()


def body_decoration(canvas, doc):
    canvas.saveState()
    # Running header: small wordmark + section label
    canvas.setFont("Inter-SemiBold", 7.5)
    canvas.setFillColor(INK_3)
    canvas.drawString(MARGIN, PAGE_H - 0.42 * inch, "LUMECON  /  INVESTOR MEMORANDUM")
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.42 * inch, "SUMMER 2026")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, PAGE_H - 0.5 * inch, PAGE_W - MARGIN, PAGE_H - 0.5 * inch)

    # Footer
    canvas.setFont("Inter", 7.5)
    canvas.setFillColor(INK_3)
    canvas.drawString(MARGIN, 0.42 * inch, "CONFIDENTIAL AND PROPRIETARY")
    canvas.drawRightString(PAGE_W - MARGIN, 0.42 * inch, f"Page {doc.page - 1}")
    canvas.restoreState()


# ---------- Build flowables from markdown ----------
def build_flowables(md: str):
    flow = []
    items = list(parse(md))

    # ---- Cover ----
    h1_text = None
    cover_meta_lines = []
    for k, v in items:
        if k == "h1":
            h1_text = v
        elif k == "p" and h1_text and not cover_meta_lines:
            # First paragraph after h1 = the metadata strip
            cover_meta_lines = [s.strip() for s in v.replace("**", "").split("  ") if s.strip()]
            break

    flow.append(Spacer(1, 0.55 * inch))
    flow.append(BrandWordmark.build("lg"))
    flow.append(Spacer(1, 0.65 * inch))
    flow.append(Paragraph(
        "INVESTOR MEMORANDUM  ·  SUMMER 2026  ·  CONFIDENTIAL AND PROPRIETARY",
        STY["cover-meta"],
    ))
    flow.append(hl_block_para("An {{HL:investor memorandum}}<br/>for Lumecon."))
    flow.append(Spacer(1, 0.18 * inch))
    flow.append(Paragraph(
        "Software-first economic impact analysis for the organizations "
        "the current market underserves. Built for governments, "
        "tribal nations, nonprofits, universities, foundations, "
        "enterprises, and the consultants who serve them.",
        STY["cover-deck"],
    ))
    flow.append(Spacer(1, 0.45 * inch))
    flow.append(HRFlowable(width="100%", thickness=0.6, color=RULE))
    flow.append(Spacer(1, 0.15 * inch))
    flow.append(Paragraph(
        "Lumecon Inc.  ·  A Delaware Corporation  ·  lumecon.ai",
        STY["cover-foot"],
    ))

    flow.append(NextPageTemplate("body"))
    flow.append(PageBreak())

    # ---- Body ----
    saw_h1 = False
    saw_cover_meta = False
    for k, v in items:
        if k == "h1":
            saw_h1 = True
            continue
        if k == "p" and saw_h1 and not saw_cover_meta:
            saw_cover_meta = True
            continue
        if k == "hr":
            flow.append(Spacer(1, 6))
            flow.append(HRFlowable(width="100%", thickness=0.5, color=RULE))
            flow.append(Spacer(1, 6))
        elif k == "h2":
            # Kicker + headline
            flow.append(Spacer(1, 4))
            flow.append(Paragraph(v.upper(), STY["h2kicker"]))
            flow.append(Paragraph(v, STY["h2"]))
        elif k == "h3":
            flow.append(Paragraph(v, STY["h3"]))
        elif k == "pull":
            flow.append(Spacer(1, 4))
            # Mission line: italic Spectral with gold "luminate"-style accent
            text = inline(v)
            flow.append(Paragraph(text, STY["pullquote"]))
        elif k == "p":
            flow.append(Paragraph(inline(v), STY["body"]))
        elif k == "list":
            for item in v:
                flow.append(Paragraph("• " + inline(item), STY["li"]))
            flow.append(Spacer(1, 4))
        elif k == "table":
            header, body, aligns = v
            # Build a table with navy header + zebra-striped body, right-
            # aligned price column when the header alignment row marks it.
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

            # Auto column widths: first column 38%, rest split evenly
            if col_count == 2:
                col_w = [CONTENT_W * 0.45, CONTENT_W * 0.55]
            else:
                col_w = [CONTENT_W / col_count] * col_count

            tbl = Table(data, colWidths=col_w, hAlign="LEFT")
            style = TableStyle([
                ("BACKGROUND",   (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR",    (0, 0), (-1, 0), PAPER),
                ("LEFTPADDING",  (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING",   (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
                ("LINEBELOW",    (0, 0), (-1, 0), 0.6, NAVY),
                ("LINEBELOW",    (0, 1), (-1, -2), 0.4, RULE),
                ("BACKGROUND",   (0, 2), (-1, -1), HexColor("#F5FBFA")),  # zebra row tint
                ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                  [PAPER, HexColor("#F5FBFA")]),
                ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ])
            tbl.setStyle(style)
            flow.append(Spacer(1, 4))
            flow.append(tbl)
            flow.append(Spacer(1, 10))

    return flow


# ---------- Doc assembly ----------
def main():
    md = SRC.read_text(encoding="utf-8")
    doc = BaseDocTemplate(
        str(PDF),
        pagesize=LETTER,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Lumecon Investor Memorandum",
        author="Lumecon Inc.",
        subject="Confidential investor memorandum",
    )

    cover_frame = Frame(
        0.7 * inch, 0.55 * inch,
        PAGE_W - 1.4 * inch, PAGE_H - 1.1 * inch,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        id="cover",
    )
    body_frame = Frame(
        MARGIN, 0.65 * inch,
        CONTENT_W, PAGE_H - 1.4 * inch,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        id="body",
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_decoration),
        PageTemplate(id="body",  frames=[body_frame],  onPage=body_decoration),
    ])

    flow = build_flowables(md)
    doc.build(flow)
    print("Wrote:", PDF)


if __name__ == "__main__":
    main()
