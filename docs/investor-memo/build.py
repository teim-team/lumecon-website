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
CREAM       = HexColor("#FAF6EE")
RULE        = HexColor("#E8E8EE")
RULE_STRONG = HexColor("#C4C7D4")
PAPER       = colors.white
ZEBRA       = HexColor("#F5FBFA")
PLACEHOLDER = HexColor("#F1F4F8")

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

# ---- Page geometry ----
PAGE_W, PAGE_H = landscape(LETTER)
MARGIN_L = 0.85 * inch
MARGIN_R = 0.6  * inch
MARGIN_T = 0.6  * inch
MARGIN_B = 0.55 * inch
RAIL_W = 0.45 * inch
GUTTER = 0.35 * inch
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R
CONTENT_H = PAGE_H - MARGIN_T - MARGIN_B
COL_W = (CONTENT_W - GUTTER) / 2


# ---- Styles ----
def ps(name, **kw):
    base = dict(fontName="Inter", fontSize=9.5, leading=14, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)

STY = {
    "kicker": ps("kicker", fontName="Inter-SemiBold", fontSize=7.5, leading=10,
                 textColor=ACCENT_DEEP, spaceAfter=2),
    "h2":     ps("h2", fontName="Inter-Bold", fontSize=15, leading=18,
                 textColor=NAVY, spaceBefore=8, spaceAfter=3),
    "h3":     ps("h3", fontName="Inter-SemiBold", fontSize=10.5, leading=13,
                 textColor=NAVY, spaceBefore=8, spaceAfter=2),
    "body":   ps("body", spaceAfter=6),
    "pull":   ps("pull", fontName="Inter-SemiBold", fontSize=14, leading=18,
                 textColor=NAVY, spaceBefore=4, spaceAfter=8),
    "li":     ps("li", spaceAfter=2, leftIndent=12),
    "thead":  ps("thead", fontName="Inter-SemiBold", fontSize=8, leading=11,
                 textColor=PAPER),
    "tcell":  ps("tcell", fontSize=9, leading=12),
    "tstrong": ps("tstrong", fontName="Inter-SemiBold", fontSize=9, leading=12,
                  textColor=NAVY),
    "tnum":   ps("tnum", fontName="Inter-SemiBold", fontSize=9.5, leading=12,
                 textColor=NAVY, alignment=2),
    "cover-meta": ps("cover-meta", fontName="Inter-SemiBold", fontSize=8,
                     leading=11, textColor=INK_3, spaceAfter=18),
    "cover-title": ps("cover-title", fontName="Inter-Bold", fontSize=30,
                      leading=34, textColor=NAVY, spaceAfter=14),
    "cover-deck": ps("cover-deck", fontSize=15, leading=22, textColor=INK_2,
                     spaceAfter=8),
    "cover-foot": ps("cover-foot", fontName="Inter-SemiBold", fontSize=7.5,
                     leading=10, textColor=INK_3),
    "stat-num": ps("stat-num", fontName="Inter-Bold", fontSize=22, leading=24,
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


# ---- Markdown parsing ----
def inline(s):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(
        r"(^|[^*])\*([^*]+?)\*(?!\*)",
        r'\1<font name="Spectral-Italic" color="#F0A91A">\2</font>',
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
    """Branded screenshot placeholder. slug | caption."""
    slug, _, caption = payload.partition("|")
    slug = slug.strip(); caption = caption.strip()
    # Inner content of the placeholder box
    inner = Table(
        [
            [Paragraph("PRODUCT", STY["ph-eyebrow"])],
            [Paragraph(slug.upper().replace("-", " "), ps("ph-slug",
                fontName="Inter-Bold", fontSize=11, leading=14,
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
    # Outer box with cream + dashed border
    height = 1.55 * inch
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
    """payload lines: number | label / one per line, separated by newlines."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    cells = []
    for r in rows:
        num, _, lbl = r.partition("|")
        cells.append([
            Paragraph(num.strip(), STY["stat-num"]),
            Paragraph(lbl.strip(), STY["stat-lbl"]),
        ])
    # Render as 2-column grid: 2 stats per row
    grid = []
    for j in range(0, len(cells), 2):
        left = cells[j]
        right = cells[j + 1] if j + 1 < len(cells) else [Paragraph("", STY["stat-num"]), Paragraph("", STY["stat-lbl"])]
        grid.append([
            Table([left[0:1], left[1:2]],
                  colWidths=[(COL_W - 12) / 2],
                  style=TableStyle([
                      ("LEFTPADDING", (0, 0), (-1, -1), 0),
                      ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                      ("TOPPADDING", (0, 0), (-1, -1), 2),
                      ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                  ])),
            Table([right[0:1], right[1:2]],
                  colWidths=[(COL_W - 12) / 2],
                  style=TableStyle([
                      ("LEFTPADDING", (0, 0), (-1, -1), 0),
                      ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                      ("TOPPADDING", (0, 0), (-1, -1), 2),
                      ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                  ])),
        ])
    t = Table(grid, colWidths=[(COL_W - 12) / 2] * 2)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, RULE),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return [t, Spacer(1, 6)]


def render_workflow_compare(_payload=""):
    """Two-column diagram: legacy workflow vs Lumecon workflow."""
    legacy_steps = [
        "Hire a consultant or open a desktop software license.",
        "Collect data manually from spreadsheets and PDFs.",
        "Clean and harmonize inputs by hand.",
        "Pick multipliers; document assumptions in the report margin.",
        "Build charts. Write the report. Format the deck.",
        "Revise. Re-run. Bill again for the next update.",
    ]
    lumecon_steps = [
        "Open the workspace.",
        "Upload PDFs, CSVs, and XLSX files into Cedar.",
        "Cedar structures inputs against public data sources.",
        "Review every assumption Cedar surfaces; approve or override.",
        "Export the branded report, deck, and executive summary.",
        "Refresh quarterly. Same workspace. No re-engagement.",
    ]

    def col_block(title_kicker, title, steps, accent):
        items = [Paragraph(s, STY["wf-l"]) for s in steps]
        head = [
            Paragraph(title_kicker, ps("wf-k", fontName="Inter-SemiBold",
                fontSize=7, leading=10, textColor=accent, spaceAfter=2)),
            Paragraph(title, STY["wf-h"]),
        ]
        cell = Table([[h] for h in head + items], colWidths=[COL_W - 0.5 * inch])
        cell.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CREAM if accent == INK_3 else PAPER),
            ("BOX", (0, 0), (-1, -1), 0.6,
              RULE if accent == INK_3 else ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        return cell

    legacy = col_block("LEGACY WORKFLOW", "Months of consultant time.",
                       legacy_steps, INK_3)
    lumecon = col_block("LUMECON WORKFLOW", "Minutes of platform time.",
                        lumecon_steps, ACCENT_DEEP)
    # Stack vertically inside the single column the markdown sits in
    return KeepTogether([legacy, Spacer(1, 6), lumecon, Spacer(1, 6)])


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
    return [t, Spacer(1, 6)]


def render_funds(payload):
    """Use of funds table. Each line: category | amount | description."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    data = [[
        Paragraph("Category", STY["thead"]),
        Paragraph("Amount", STY["thead"]),
        Paragraph("Detail", STY["thead"]),
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
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.4, NAVY),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, RULE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.6, NAVY),
        ("BACKGROUND", (0, -1), (-1, -1), CREAM),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [PAPER, ZEBRA]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return [t, Spacer(1, 6)]


def render_teamgrid(payload):
    """Team person cards. Each line: name | role | bio."""
    rows = [r.strip() for r in payload.split("\n") if r.strip()]
    cards = []
    for r in rows:
        parts = [p.strip() for p in r.split("|")]
        if len(parts) < 3:
            parts += [""] * (3 - len(parts))
        name, role, bio = parts[0], parts[1], parts[2]
        card = Table([
            [Paragraph(role.upper(), STY["tm-role"])],
            [Paragraph(name, STY["tm-name"])],
            [Spacer(1, 3)],
            [Paragraph(inline(bio), STY["tm-bio"])],
        ], colWidths=[COL_W - 14])
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CREAM),
            ("LINEABOVE", (0, 0), (-1, 0), 1.4, ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        cards.append(card)
        cards.append(Spacer(1, 6))
    return cards


def render_institutions(payload):
    return [Paragraph(payload.upper().replace("·", "<font color='#0FB5A5'>·</font>"),
                      STY["inst"]), Spacer(1, 6)]


# ---- Page decoration ----
def cover_decoration(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, RAIL_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(2.2)
    canvas.line(RAIL_W, 0, RAIL_W, PAGE_H)
    canvas.restoreState()


def body_decoration(canvas, doc):
    canvas.saveState()
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
    canvas.setFont("Inter", 7.5)
    canvas.drawString(MARGIN_L, 0.3 * inch, "CONFIDENTIAL AND PROPRIETARY")
    canvas.drawRightString(PAGE_W - MARGIN_R, 0.3 * inch,
                           f"Page {doc.page - 1}")
    canvas.restoreState()


# ---- Cover ----
def build_cover():
    seal_size = 3.6 * inch
    seal = Image(str(SEAL), width=seal_size, height=seal_size)

    right = [
        Paragraph(
            "INVESTOR MEMORANDUM  ·  SUMMER 2026  ·  CONFIDENTIAL",
            STY["cover-meta"],
        ),
        # Title smaller now; deck larger and stronger
        Paragraph(
            'An <font backColor="#B8EDE6"> investor memorandum </font> '
            'for Lumecon.',
            STY["cover-title"],
        ),
        Paragraph(
            "<b>Software-first economic impact analysis</b> for the "
            "organizations the current market underserves. Built for "
            "governments, tribal nations, nonprofits, universities, "
            "foundations, enterprises, and the consultants who serve them.",
            STY["cover-deck"],
        ),
        Spacer(1, 0.2 * inch),
        HRFlowable(width="100%", thickness=0.6, color=RULE),
        Spacer(1, 8),
        Paragraph(
            "Lumecon Inc.  ·  A Delaware Corporation  ·  lumecon.ai",
            STY["cover-foot"],
        ),
    ]

    t = Table(
        [[seal, right]],
        colWidths=[seal_size + 0.4 * inch,
                   PAGE_W - RAIL_W - MARGIN_R - seal_size - 0.4 * inch - 0.6 * inch],
        rowHeights=[CONTENT_H],
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (0, 0), "TOP"),
        ("VALIGN", (1, 0), (1, 0), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [t]


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
            flow.append(Paragraph(v.upper(), STY["kicker"]))
            flow.append(Paragraph(v, STY["h2"]))
        elif k == "h3":
            flow.append(Paragraph(v, STY["h3"]))
        elif k == "pull":
            flow.append(Spacer(1, 2))
            flow.append(Paragraph(inline(v), STY["pull"]))
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
            t = Table(data, colWidths=cw, hAlign="LEFT")
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, NAVY),
                ("LINEBELOW", (0, 1), (-1, -2), 0.3, RULE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PAPER, ZEBRA]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            flow.append(Spacer(1, 2))
            flow.append(t)
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
            elif kind == "INSTITUTIONS":
                flow.extend(render_institutions(payload))
    return flow


# ---- Build ----
def main():
    md = SRC.read_text(encoding="utf-8")
    doc = BaseDocTemplate(
        str(PDF),
        pagesize=landscape(LETTER),
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="Lumecon Investor Memorandum",
        author="Lumecon Inc.",
        subject="Confidential investor memorandum",
    )
    cover_frame = Frame(
        RAIL_W + 0.4 * inch, MARGIN_B,
        PAGE_W - RAIL_W - 0.4 * inch - MARGIN_R,
        PAGE_H - MARGIN_T - MARGIN_B,
        id="cover", leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0,
    )
    body_left = Frame(
        MARGIN_L, MARGIN_B + 0.15 * inch,
        COL_W, PAGE_H - MARGIN_T - MARGIN_B - 0.45 * inch,
        id="left", leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0,
    )
    body_right = Frame(
        MARGIN_L + COL_W + GUTTER, MARGIN_B + 0.15 * inch,
        COL_W, PAGE_H - MARGIN_T - MARGIN_B - 0.45 * inch,
        id="right", leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0,
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_decoration),
        PageTemplate(id="body", frames=[body_left, body_right],
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
