"""PDF rendering for tailored resumes and cover letters (Job Radar)."""

from __future__ import annotations

import io
from datetime import date
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, KeepTogether, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer

ACCENT = colors.HexColor("#1d4ed8")
MUTED = colors.HexColor("#475569")


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()["Normal"]
    return {
        "name": ParagraphStyle("name", parent=base, fontName="Helvetica-Bold", fontSize=19, leading=23, textColor=colors.HexColor("#0f172a")),
        "headline": ParagraphStyle("headline", parent=base, fontName="Helvetica", fontSize=10.5, leading=14, textColor=ACCENT),
        "contact": ParagraphStyle("contact", parent=base, fontSize=8.8, leading=12, textColor=MUTED),
        "section": ParagraphStyle("section", parent=base, fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=ACCENT, spaceBefore=7, spaceAfter=2),
        "body": ParagraphStyle("body", parent=base, fontSize=9.2, leading=12.4, alignment=TA_LEFT),
        "role": ParagraphStyle("role", parent=base, fontName="Helvetica-Bold", fontSize=9.6, leading=12.5),
        "meta": ParagraphStyle("meta", parent=base, fontName="Helvetica-Oblique", fontSize=8.6, leading=11, textColor=MUTED),
        "bullet": ParagraphStyle("bullet", parent=base, fontSize=9.0, leading=11.8),
        "letter": ParagraphStyle("letter", parent=base, fontSize=10.5, leading=15, spaceAfter=8),
    }


def _p(value: Any, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(str(value or "")), style)


def _doc(buffer: io.BytesIO, title: str, author: str) -> SimpleDocTemplate:
    return SimpleDocTemplate(
        buffer, pagesize=A4, title=title, author=author,
        leftMargin=16 * mm, rightMargin=16 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
    )


def render_resume_pdf(resume: dict[str, Any]) -> bytes:
    s = _styles()
    story: list[Any] = [
        _p(resume.get("name"), s["name"]),
        _p(resume.get("headline"), s["headline"]),
        _p(resume.get("contact_line"), s["contact"]),
        Spacer(1, 3),
        HRFlowable(width="100%", thickness=0.8, color=ACCENT, spaceAfter=3),
    ]

    def section(title: str) -> None:
        story.append(_p(title.upper(), s["section"]))

    if resume.get("summary"):
        section("Profile")
        story.append(_p(resume["summary"], s["body"]))

    if resume.get("skills"):
        section("Key Skills")
        for group in resume["skills"]:
            items = ", ".join(group.get("items") or [])
            story.append(Paragraph(f"<b>{escape(group.get('group', ''))}:</b> {escape(items)}", s["body"]))

    if resume.get("experience"):
        section("Professional Experience")
        for role in resume["experience"]:
            bullets = ListFlowable(
                [ListItem(_p(b, s["bullet"]), leftIndent=9) for b in role.get("bullets") or []],
                bulletType="bullet", start="•", leftIndent=9, bulletFontSize=8,
            )
            header = f"{escape(role.get('title', ''))} · {escape(role.get('company', ''))}"
            meta = " | ".join(x for x in [role.get("location"), role.get("dates")] if x)
            story.append(KeepTogether([Paragraph(header, s["role"]), _p(meta, s["meta"]), bullets, Spacer(1, 4)]))

    if resume.get("education"):
        section("Education")
        for edu in resume["education"]:
            story.append(Paragraph(f"<b>{escape(edu.get('degree', ''))}</b> · {escape(edu.get('school', ''))}", s["body"]))
            meta = " | ".join(x for x in [edu.get("dates"), edu.get("details")] if x)
            if meta:
                story.append(_p(meta, s["meta"]))

    for key, title in (("certifications", "Certifications"), ("languages", "Languages")):
        if resume.get(key):
            section(title)
            story.append(_p(" · ".join(resume[key]), s["body"]))

    buffer = io.BytesIO()
    _doc(buffer, f"Resume - {resume.get('name', '')}", resume.get("name", "")).build(story)
    return buffer.getvalue()


def render_cover_letter_pdf(letter: dict[str, Any], sender: dict[str, Any], job: dict[str, Any]) -> bytes:
    s = _styles()
    today = date.today()
    is_german = (letter.get("language") or "").lower().startswith("de")
    date_line = today.strftime("%d.%m.%Y") if is_german else today.strftime("%d %B %Y")
    story: list[Any] = [
        _p(sender.get("name"), s["name"]),
        _p(sender.get("contact_line"), s["contact"]),
        Spacer(1, 14),
        _p(job.get("company"), s["body"]),
        _p(job.get("location"), s["body"]),
        Spacer(1, 10),
        _p(date_line, s["body"]),
        Spacer(1, 10),
        Paragraph(f"<b>{escape(letter.get('subject', ''))}</b>", s["letter"]),
        _p(letter.get("greeting"), s["letter"]),
    ]
    story += [_p(par, s["letter"]) for par in letter.get("paragraphs") or []]
    story += [_p(letter.get("closing"), s["letter"]), _p(sender.get("name"), s["letter"])]
    buffer = io.BytesIO()
    _doc(buffer, f"Cover letter - {job.get('company', '')}", sender.get("name", "")).build(story)
    return buffer.getvalue()
