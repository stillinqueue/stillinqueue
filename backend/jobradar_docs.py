"""PDF rendering for tailored resumes and cover letters (Job Radar).

The documents use the candidate's own CV design (teal header band, round photo, highlight boxes,
four skill columns, dates in a left column). HTML is printed to PDF with headless Chromium
(Playwright) so it looks exactly like a CV printed from Chrome. If Chromium isn't available the
code falls back to a simpler ReportLab layout so the pipeline never fails.
"""

from __future__ import annotations

import base64
import io
import os
import re
from datetime import date
from html import escape
from typing import Any, Optional

LABELS = {
    "en": {"highlights": "Highlights", "skills": "Skills", "experience": "Professional Experience",
           "projects": "Projects", "education": "Education", "certifications": "Certifications",
           "languages": "Languages", "cv": "Resume", "letter": "Cover Letter"},
    "de": {"highlights": "Schwerpunkte", "skills": "Kenntnisse", "experience": "Berufserfahrung",
           "projects": "Projekte", "education": "Ausbildung", "certifications": "Zertifikate",
           "languages": "Sprachen", "cv": "Lebenslauf", "letter": "Anschreiben"},
}
GERMAN_MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September",
                 "Oktober", "November", "Dezember"]

ICONS = {
    "email": '<path d="M2 5h20v14H2z M2 5l10 8 10-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    "phone": '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>',
    "address": '<path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
    "linkedin": '<path d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6zM8 19H5V9.5h3V19zM6.5 8.2a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5zM19 19h-3v-4.6c0-1.1 0-2.5-1.5-2.5S12.7 13 12.7 14.3V19h-3V9.5h2.8v1.3h.1a3.1 3.1 0 0 1 2.8-1.5c3 0 3.6 2 3.6 4.5V19z"/>',
    "github": '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>',
    "website": '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.4 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.4-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4z"/>',
}

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400'
         '&family=Alegreya:wght@700&display=swap" rel="stylesheet">')

BASE_CSS = """
  :root { --navy:#0f4c5c; --band:#d9ecec; --bar:#ebf4f4; --accent:#18a497; --text:#222; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; background:#fff; color:var(--text);
    font-family:'Alegreya Sans', 'Segoe UI', Arial, sans-serif; }
  h1 { font-family:'Alegreya', Georgia, serif; color:var(--navy); font-size:23pt; margin:0; letter-spacing:.2px; }
  .role { color:var(--navy); margin:1mm 0 2.6mm; }
  .contact span { display:flex; align-items:center; gap:2.2mm; }
  .contact svg { width:3.8mm; height:3.8mm; fill:var(--text); flex:none; }
  .contact a { color:var(--text); text-decoration:none; }
"""

RESUME_CSS = BASE_CSS + """
  @page { size: A4; margin: 10mm 0 8mm; }
  @page :first { margin: 0 0 8mm; }
  html, body { font-size:9.6pt; line-height:1.22; }
  header { background:var(--band); padding:5mm 13mm 3.5mm; display:flex; justify-content:space-between; align-items:center; gap:6mm; }
  .role { font-size:13.5pt; }
  .contact { display:grid; grid-template-columns: auto auto; column-gap:12mm; row-gap:1mm; font-size:9.6pt; }
  .photo { width:30mm; height:30mm; border-radius:50%; object-fit:cover; object-position:center 20%;
    border:3px solid #fff; box-shadow:0 0 0 2px var(--navy); flex:none; }
  main { padding:3mm 13mm 0; }
  .summary { margin:0 0 2mm; }
  h2 { background:var(--bar); color:var(--navy); font-family:'Alegreya', Georgia, serif; font-size:12.5pt;
    text-align:center; margin:1.8mm 0 1.3mm; padding:.4mm 0; break-after:avoid; }
  .highlights { display:grid; grid-template-columns:1fr 1fr 1fr; gap:2.5mm; margin-bottom:1mm; }
  .hl { border-left:3px solid var(--accent); background:#fafbfc; padding:1.4mm 2.5mm; font-size:9.3pt; }
  .hl > b:first-child { display:block; color:var(--navy); font-size:10pt; }
  .skills { display:grid; grid-template-columns:repeat(4,1fr); gap:3mm; font-size:9.5pt; }
  .skills .grp { display:block; color:var(--navy); font-size:10.2pt; margin-bottom:.5mm; font-weight:700; }
  .job { display:grid; grid-template-columns:34mm 1fr; column-gap:4mm; margin-bottom:1.3mm; break-inside:avoid; }
  .when { font-size:9.4pt; color:#444; }
  .title { font-weight:700; }
  .title i { font-weight:400; }
  ul { margin:.6mm 0 0; padding-left:4.5mm; }
  li { margin-bottom:.25mm; }
  li b, .summary b, .hl b + b, .thesis b { color:var(--navy); }
  .thesis { margin-top:.4mm; }
"""

LETTER_CSS = BASE_CSS + """
  @page { size: A4; margin: 0; }
  html, body { font-size:10.6pt; line-height:1.42; }
  header { background:var(--band); padding:7mm 18mm 5mm; }
  .role { font-size:13pt; }
  .contact { display:flex; flex-wrap:wrap; gap:1.2mm 8mm; font-size:9.6pt; }
  .contact svg { width:3.6mm; height:3.6mm; }
  main { padding:8mm 18mm 0; }
  .meta { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:7mm; }
  .recipient { line-height:1.35; }
  .date { color:#444; white-space:nowrap; }
  .subject { background:var(--bar); border-left:3px solid var(--accent); color:var(--navy); font-weight:700;
    padding:1.6mm 3mm; margin:0 0 5mm; }
  p { margin:0 0 3.4mm; text-align:left; }
  p b { color:var(--navy); }
  .sign { margin-top:6mm; }
  .sign .name { font-family:'Alegreya', Georgia, serif; color:var(--navy); font-size:13pt; margin-top:1mm; }
"""

_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def _rich(value: Any) -> str:
    """Escape text, then turn **phrase** into <b>phrase</b>."""
    return _BOLD_RE.sub(r"<b>\1</b>", escape(str(value or ""))).replace("**", "")


def _plain(value: Any) -> str:
    return str(value or "").replace("**", "")


def _handle(url: str) -> str:
    """'https://www.linkedin.com/in/venkatakanumuri/' -> 'venkatakanumuri'; 'https://stillinqueue.com' -> 'stillinqueue.com'."""
    url = (url or "").strip().rstrip("/")
    if "linkedin.com" in url or "github.com" in url:
        return url.split("/")[-1]
    return re.sub(r"^https?://(www\.)?", "", url)


def _href(url: str) -> str:
    url = (url or "").strip()
    return url if url.startswith(("http://", "https://", "mailto:")) else ("https://" + url if url else "")


def _contact_html(candidate: dict[str, Any]) -> str:
    items = []
    if candidate.get("email"):
        items.append(("email", f'<a href="mailto:{escape(candidate["email"])}">{escape(candidate["email"])}</a>'))
    if candidate.get("phone"):
        items.append(("phone", escape(candidate["phone"])))
    address = candidate.get("address") or candidate.get("location")
    if address:
        items.append(("address", escape(address)))
    for key in ("linkedin", "github", "website"):
        if candidate.get(key):
            items.append((key, f'<a href="{escape(_href(candidate[key]))}">{escape(_handle(candidate[key]))}</a>'))
    return "".join(f'<span><svg viewBox="0 0 24 24">{ICONS[k]}</svg>{v}</span>' for k, v in items)


def _photo_tag(photo: Optional[bytes], mime: Optional[str]) -> str:
    if not photo:
        return ""
    data = base64.b64encode(photo).decode("ascii")
    return f'<img class="photo" src="data:{escape(mime or "image/jpeg")};base64,{data}" alt="">'


def _role_block(role: dict[str, Any]) -> str:
    when = "<br>".join(escape(x) for x in (role.get("dates"), role.get("location")) if x)
    company = ", ".join(x for x in (role.get("company"), role.get("company_note")) if x)
    title = f'{escape(role.get("title", ""))}{", <i>" + escape(company) + "</i>" if company else ""}'
    bullets = "".join(f"<li>{_rich(b)}</li>" for b in role.get("bullets") or [] if str(b).strip())
    return (f'<div class="job"><div class="when">{when}</div><div><div class="title">{title}</div>'
            f'{"<ul>" + bullets + "</ul>" if bullets else ""}</div></div>')


def build_resume_html(resume: dict[str, Any], candidate: dict[str, Any], language: str = "en",
                      photo: Optional[bytes] = None, photo_mime: Optional[str] = None) -> str:
    lab = LABELS["de" if (language or "").startswith("de") else "en"]
    parts = [f'<p class="summary">{_rich(resume.get("summary"))}</p>' if resume.get("summary") else ""]
    if resume.get("highlights"):
        boxes = "".join(f'<div class="hl"><b>{escape(_plain(h.get("title")))}</b>{_rich(h.get("text"))}</div>'
                        for h in resume["highlights"][:3])
        parts.append(f'<h2>{lab["highlights"]}</h2><div class="highlights">{boxes}</div>')
    if resume.get("skills"):
        cols = "".join(f'<div><span class="grp">{escape(_plain(g.get("group")))}</span>'
                       + "<br>".join(escape(_plain(i)) for i in g.get("items") or []) + "</div>"
                       for g in resume["skills"][:4])
        parts.append(f'<h2>{lab["skills"]}</h2><div class="skills">{cols}</div>')
    if resume.get("experience"):
        parts.append(f'<h2>{lab["experience"]}</h2>' + "".join(_role_block(r) for r in resume["experience"]))
    if resume.get("projects"):
        parts.append(f'<h2>{lab["projects"]}</h2>' + "".join(_role_block(r) for r in resume["projects"]))
    if resume.get("education"):
        rows = []
        for e in resume["education"]:
            when = "<br>".join(escape(x) for x in (e.get("dates"), e.get("location")) if x)
            details = f'<div class="thesis">{_rich(e.get("details"))}</div>' if e.get("details") else ""
            rows.append(f'<div class="job"><div class="when">{when}</div><div><div class="title">'
                        f'{escape(e.get("degree", ""))}{", <i>" + escape(e["school"]) + "</i>" if e.get("school") else ""}'
                        f'</div>{details}</div></div>')
        parts.append(f'<h2>{lab["education"]}</h2>' + "".join(rows))
    if resume.get("certifications"):
        parts.append(f'<div class="job"><div class="when">{lab["certifications"]}</div>'
                     f'<div>{" &middot; ".join(escape(_plain(c)) for c in resume["certifications"])}</div></div>')
    if resume.get("languages"):
        langs = resume["languages"] if isinstance(resume["languages"], str) else " · ".join(resume["languages"])
        parts.append(f'<div class="job" style="margin-bottom:0"><div class="when">{lab["languages"]}</div>'
                     f'<div>{escape(_plain(langs)).replace(" · ", " &middot; ")}</div></div>')
    name = escape(candidate.get("name") or "")
    return (f'<!doctype html><html lang="{"de" if lab is LABELS["de"] else "en"}"><head><meta charset="utf-8">'
            f'<title>{lab["cv"]} {name}</title>{FONTS}<style>{RESUME_CSS}</style></head><body>'
            f'<header><div><h1>{name}</h1><div class="role">{escape(_plain(resume.get("headline")))}</div>'
            f'<div class="contact">{_contact_html(candidate)}</div></div>{_photo_tag(photo, photo_mime)}</header>'
            f'<main>{"".join(parts)}</main></body></html>')


def _letter_date(city: str, german: bool) -> str:
    today = date.today()
    text = f"{today.day:02d}.{today.month:02d}.{today.year}" if german else today.strftime("%d %B %Y").lstrip("0")
    return f"{city}, {text}" if city else text


def build_cover_letter_html(letter: dict[str, Any], candidate: dict[str, Any], job: dict[str, Any],
                            headline: str = "") -> str:
    german = (letter.get("language") or "").lower().startswith("de")
    lab = LABELS["de" if german else "en"]
    lines = [l for l in letter.get("recipient_lines") or [] if str(l).strip()] or [job.get("company") or ""]
    recipient = f"<b>{escape(_plain(lines[0]))}</b>" + "".join(f"<br>{escape(_plain(l))}" for l in lines[1:])
    city = candidate.get("city") or (candidate.get("location") or "").split(",")[0].strip()
    paragraphs = "".join(f"<p>{_rich(p)}</p>" for p in letter.get("paragraphs") or [])
    name = escape(candidate.get("name") or "")
    return (f'<!doctype html><html lang="{"de" if german else "en"}"><head><meta charset="utf-8">'
            f'<title>{lab["letter"]} {name}</title>{FONTS}<style>{LETTER_CSS}</style></head><body>'
            f'<header><h1>{name}</h1>{"<div class=role>" + escape(_plain(headline)) + "</div>" if headline else ""}'
            f'<div class="contact">{_contact_html(candidate)}</div></header>'
            f'<main><div class="meta"><div class="recipient">{recipient}</div>'
            f'<div class="date">{escape(_letter_date(city, german))}</div></div>'
            f'<div class="subject">{escape(_plain(letter.get("subject")))}</div>'
            f'<p>{escape(_plain(letter.get("greeting")))}</p>{paragraphs}'
            f'<div class="sign">{escape(_plain(letter.get("closing")))}<div class="name">{name}</div></div>'
            f'</main></body></html>')


# ---------------------------------------------------------------------------
# HTML -> PDF
# ---------------------------------------------------------------------------

def _set_metadata(pdf: bytes, title: str, author: str) -> bytes:
    """Replace browser metadata (e.g. 'HeadlessChrome', 'Skia/PDF') with the candidate's own name."""
    try:
        from pypdf import PdfReader, PdfWriter
        writer = PdfWriter(clone_from=PdfReader(io.BytesIO(pdf)))
        writer.metadata = None
        writer.add_metadata({"/Title": title, "/Author": author, "/Creator": author, "/Producer": author})
        out = io.BytesIO()
        writer.write(out)
        return out.getvalue()
    except Exception:
        return pdf


def html_to_pdf(html_doc: str) -> bytes:
    """Print HTML with headless Chromium. JOBRADAR_CHROME_CHANNEL=chrome uses an installed Chrome (local dev)."""
    from playwright.sync_api import sync_playwright

    channel = os.getenv("JOBRADAR_CHROME_CHANNEL") or None
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel=channel, args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"])
        try:
            page = browser.new_page()
            page.set_content(html_doc, wait_until="networkidle", timeout=30000)
            page.evaluate("document.fonts.ready")
            return page.pdf(format="A4", print_background=True, prefer_css_page_size=True)
        finally:
            browser.close()


LAST_RENDER_ERROR: dict[str, str] = {}  # most recent design-printer failure (shown to the user)


def render_resume_pdf(resume: dict[str, Any], language: str = "en", candidate: Optional[dict[str, Any]] = None,
                      photo: Optional[bytes] = None, photo_mime: Optional[str] = None) -> bytes:
    candidate = candidate or {}
    german = (language or "").startswith("de")
    title = f'{"Lebenslauf" if german else "Resume"} {candidate.get("name", "")}'.strip()
    try:
        pdf = html_to_pdf(build_resume_html(resume, candidate, language, photo, photo_mime))
        LAST_RENDER_ERROR.pop("error", None)
    except Exception as exc:
        LAST_RENDER_ERROR["error"] = f"{type(exc).__name__}: {str(exc)[:200]}"
        pdf = _fallback_resume_pdf(resume, candidate, language)
    return _set_metadata(pdf, title, candidate.get("name", ""))


def render_cover_letter_pdf(letter: dict[str, Any], candidate: dict[str, Any], job: dict[str, Any],
                            headline: str = "") -> bytes:
    german = (letter.get("language") or "").lower().startswith("de")
    title = f'{"Anschreiben" if german else "Cover Letter"} {candidate.get("name", "")}'.strip()
    try:
        pdf = html_to_pdf(build_cover_letter_html(letter, candidate, job, headline))
    except Exception:
        pdf = _fallback_letter_pdf(letter, candidate, job)
    return _set_metadata(pdf, title, candidate.get("name", ""))


# ---------------------------------------------------------------------------
# Fallback (no Chromium): simple ReportLab layout with the same content.
# ---------------------------------------------------------------------------

def _rl():
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    base = getSampleStyleSheet()["Normal"]
    navy = colors.HexColor("#0f4c5c")
    styles = {
        "name": ParagraphStyle("n", parent=base, fontName="Helvetica-Bold", fontSize=19, leading=23, textColor=navy),
        "role": ParagraphStyle("r", parent=base, fontSize=11, leading=14, textColor=navy),
        "small": ParagraphStyle("s", parent=base, fontSize=8.8, leading=12),
        "h2": ParagraphStyle("h", parent=base, fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=navy, spaceBefore=6),
        "body": ParagraphStyle("b", parent=base, fontSize=9.4, leading=12.5),
        "letter": ParagraphStyle("l", parent=base, fontSize=10.5, leading=15, spaceAfter=8),
    }
    doc = lambda buf: SimpleDocTemplate(buf, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm,  # noqa: E731
                                        topMargin=14 * mm, bottomMargin=14 * mm)
    return Paragraph, Spacer, styles, doc


def _contact_text(candidate: dict[str, Any]) -> str:
    keys = ("email", "phone", "address", "linkedin", "github", "website")
    return " · ".join(escape(_handle(candidate[k]) if k in ("linkedin", "github", "website") else candidate[k])
                      for k in keys if candidate.get(k))


def _fallback_resume_pdf(resume: dict[str, Any], candidate: dict[str, Any], language: str) -> bytes:
    Paragraph, Spacer, s, doc = _rl()
    lab = LABELS["de" if (language or "").startswith("de") else "en"]
    story = [Paragraph(escape(candidate.get("name", "")), s["name"]), Paragraph(escape(_plain(resume.get("headline"))), s["role"]),
             Paragraph(_contact_text(candidate), s["small"]), Spacer(1, 6), Paragraph(_rich(resume.get("summary")), s["body"])]
    if resume.get("highlights"):
        story.append(Paragraph(lab["highlights"], s["h2"]))
        story += [Paragraph(f'<b>{escape(_plain(h.get("title")))}:</b> {_rich(h.get("text"))}', s["body"]) for h in resume["highlights"]]
    if resume.get("skills"):
        story.append(Paragraph(lab["skills"], s["h2"]))
        story += [Paragraph(f'<b>{escape(_plain(g.get("group")))}:</b> {escape(", ".join(_plain(i) for i in g.get("items") or []))}', s["body"])
                  for g in resume["skills"]]
    for key in ("experience", "projects"):
        if resume.get(key):
            story.append(Paragraph(lab[key], s["h2"]))
            for r in resume[key]:
                story.append(Paragraph(f'<b>{escape(r.get("title", ""))}</b>, {escape(r.get("company", ""))} · '
                                       f'{escape(r.get("dates", ""))} · {escape(r.get("location", ""))}', s["body"]))
                story += [Paragraph("• " + _rich(b), s["body"]) for b in r.get("bullets") or []]
                story.append(Spacer(1, 3))
    if resume.get("education"):
        story.append(Paragraph(lab["education"], s["h2"]))
        for e in resume["education"]:
            story.append(Paragraph(f'<b>{escape(e.get("degree", ""))}</b>, {escape(e.get("school", ""))} · {escape(e.get("dates", ""))}', s["body"]))
            if e.get("details"):
                story.append(Paragraph(_rich(e["details"]), s["body"]))
    if resume.get("languages"):
        story += [Paragraph(lab["languages"], s["h2"]), Paragraph(escape(_plain(resume["languages"])), s["body"])]
    buf = io.BytesIO()
    doc(buf).build(story)
    return buf.getvalue()


def _fallback_letter_pdf(letter: dict[str, Any], candidate: dict[str, Any], job: dict[str, Any]) -> bytes:
    Paragraph, Spacer, s, doc = _rl()
    german = (letter.get("language") or "").startswith("de")
    city = candidate.get("city") or (candidate.get("location") or "").split(",")[0].strip()
    story = [Paragraph(escape(candidate.get("name", "")), s["name"]), Paragraph(_contact_text(candidate), s["small"]), Spacer(1, 14)]
    story += [Paragraph(escape(_plain(l)), s["body"]) for l in letter.get("recipient_lines") or [job.get("company", "")]]
    story += [Spacer(1, 8), Paragraph(escape(_letter_date(city, german)), s["body"]), Spacer(1, 10),
              Paragraph(f'<b>{escape(_plain(letter.get("subject")))}</b>', s["letter"]),
              Paragraph(escape(_plain(letter.get("greeting"))), s["letter"])]
    story += [Paragraph(_rich(p), s["letter"]) for p in letter.get("paragraphs") or []]
    story += [Paragraph(escape(_plain(letter.get("closing"))), s["letter"]), Paragraph(escape(candidate.get("name", "")), s["letter"])]
    buf = io.BytesIO()
    doc(buf).build(story)
    return buf.getvalue()
