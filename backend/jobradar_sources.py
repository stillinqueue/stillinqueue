"""Job source adapters for the SQ-AI Job Radar agent.

Every adapter reads only public job listings that the company or board itself
publishes (official ATS posting APIs, public XML feeds, or the same JSON the
public career page loads). Nothing here logs in, submits applications, or
bypasses access controls. Adapters are polite: one request per page, a short
timeout, and a descriptive User-Agent.

Each adapter returns a list of normalized job dicts:
    {
        "source": str, "external_id": str, "company": str, "title": str,
        "location": str, "url": str, "apply_url": str, "description": str,
        "posted_at": iso-str | None, "salary_min": float | None,
        "salary_max": float | None, "salary_currency": str | None,
    }
"""

from __future__ import annotations

import html
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Optional
from urllib.parse import quote, urljoin

import httpx

USER_AGENT = "StillInQueue-JobRadar/1.0 (+https://stillinqueue.com)"
TIMEOUT = httpx.Timeout(25.0, connect=10.0)
MAX_DESC_CHARS = 12000

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"[ \t\r\f\v]+")
_NL_RE = re.compile(r"\n{3,}")


def _client() -> httpx.Client:
    return httpx.Client(timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}, follow_redirects=True)


def _request(client: httpx.Client, method: str, url: str, *, retries: int = 3, pause: float = 0.0, **kwargs: Any) -> httpx.Response:
    """HTTP call that backs off politely on 429/503 (honouring Retry-After) instead of hammering the site."""
    import time

    if pause:
        time.sleep(pause)
    for attempt in range(retries + 1):
        response = client.request(method, url, **kwargs)
        if response.status_code not in (429, 503) or attempt == retries:
            response.raise_for_status()
            return response
        retry_after = response.headers.get("Retry-After", "")
        wait = float(retry_after) if retry_after.isdigit() else 5.0 * (2 ** attempt)
        time.sleep(min(wait, 60.0))
    raise RuntimeError("unreachable")


def html_to_text(raw: Optional[str]) -> str:
    if not raw:
        return ""
    text_value = html.unescape(raw)
    text_value = re.sub(r"(?i)<\s*(br|/p|/div|/li|/h\d)\s*/?>", "\n", text_value)
    text_value = re.sub(r"(?i)<\s*li[^>]*>", "\n- ", text_value)
    text_value = _TAG_RE.sub(" ", text_value)
    text_value = html.unescape(text_value)
    text_value = _WS_RE.sub(" ", text_value)
    text_value = "\n".join(line.strip() for line in text_value.splitlines())
    return _NL_RE.sub("\n\n", text_value).strip()[:MAX_DESC_CHARS]


def _iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def _parse_dt(value: Any) -> Optional[str]:
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        seconds = value / 1000 if value > 10_000_000_000 else value
        return _iso(datetime.fromtimestamp(seconds, tz=timezone.utc))
    raw = str(value).strip()
    for candidate in (raw.replace("Z", "+00:00"), raw.replace("+0000", "+00:00")):
        try:
            return _iso(datetime.fromisoformat(candidate))
        except ValueError:
            continue
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return _iso(datetime.strptime(raw[:10], fmt))
        except ValueError:
            continue
    return None


def _job(**kwargs: Any) -> dict[str, Any]:
    base = {
        "source": "", "external_id": "", "company": "", "title": "", "location": "",
        "url": "", "apply_url": "", "description": "", "posted_at": None,
        "salary_min": None, "salary_max": None, "salary_currency": None,
    }
    base.update({k: v for k, v in kwargs.items() if k in base})
    base["title"] = (base["title"] or "").strip()
    base["apply_url"] = base["apply_url"] or base["url"]
    return base


# ---------------------------------------------------------------------------
# Aggregator: Arbeitnow (free German job board API)
# ---------------------------------------------------------------------------

def fetch_arbeitnow(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    pages = int(config.get("pages", 5))
    jobs: list[dict[str, Any]] = []
    with _client() as client:
        for page in range(1, pages + 1):
            response = client.get("https://www.arbeitnow.com/api/job-board-api", params={"page": page})
            response.raise_for_status()
            data = response.json().get("data", [])
            if not data:
                break
            for item in data:
                jobs.append(_job(
                    source="arbeitnow",
                    external_id=item.get("slug", ""),
                    company=item.get("company_name", ""),
                    title=item.get("title", ""),
                    location=("Remote, " if item.get("remote") else "") + (item.get("location") or ""),
                    url=item.get("url", ""),
                    description=html_to_text(item.get("description")),
                    posted_at=_parse_dt(item.get("created_at")),
                ))
    return jobs


# ---------------------------------------------------------------------------
# Official ATS posting APIs
# ---------------------------------------------------------------------------

def fetch_greenhouse(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    token = config["token"]
    with _client() as client:
        response = client.get(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs", params={"content": "true"})
        response.raise_for_status()
        items = response.json().get("jobs", [])
    return [
        _job(
            source="greenhouse",
            external_id=f"{token}:{item.get('id')}",
            company=config.get("company") or token,
            title=item.get("title", ""),
            location=(item.get("location") or {}).get("name", ""),
            url=item.get("absolute_url", ""),
            description=html_to_text(item.get("content")),
            posted_at=_parse_dt(item.get("first_published") or item.get("updated_at")),
        )
        for item in items
    ]


def fetch_lever(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    slug = config["token"]
    host = "api.eu.lever.co" if config.get("eu") else "api.lever.co"
    with _client() as client:
        response = client.get(f"https://{host}/v0/postings/{slug}", params={"mode": "json"})
        response.raise_for_status()
        items = response.json()
    jobs = []
    for item in items:
        categories = item.get("categories") or {}
        salary = item.get("salaryRange") or {}
        jobs.append(_job(
            source="lever",
            external_id=f"{slug}:{item.get('id')}",
            company=config.get("company") or slug,
            title=item.get("text", ""),
            location=categories.get("location") or ", ".join(categories.get("allLocations") or []),
            url=item.get("hostedUrl", ""),
            apply_url=item.get("applyUrl", ""),
            description=(item.get("descriptionPlain") or "") + "\n" + html_to_text(item.get("additional")),
            posted_at=_parse_dt(item.get("createdAt")),
            salary_min=salary.get("min"),
            salary_max=salary.get("max"),
            salary_currency=salary.get("currency"),
        ))
    return jobs


def fetch_ashby(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    board = config["token"]
    with _client() as client:
        response = client.get(
            f"https://api.ashbyhq.com/posting-api/job-board/{board}",
            params={"includeCompensation": "true"},
        )
        response.raise_for_status()
        items = response.json().get("jobs", [])
    jobs = []
    for item in items:
        if item.get("isListed") is False:
            continue
        salary_min = salary_max = currency = None
        for tier in ((item.get("compensation") or {}).get("summaryComponents") or []):
            if tier.get("compensationType") == "Salary":
                salary_min, salary_max = tier.get("minValue"), tier.get("maxValue")
                currency = tier.get("currencyCode")
                break
        locations = [item.get("location") or ""]
        locations += [s.get("location", "") for s in (item.get("secondaryLocations") or [])]
        if item.get("isRemote"):
            locations.insert(0, "Remote")
        jobs.append(_job(
            source="ashby",
            external_id=f"{board}:{item.get('id')}",
            company=config.get("company") or board,
            title=item.get("title", ""),
            location=", ".join(loc for loc in locations if loc),
            url=item.get("jobUrl", ""),
            apply_url=item.get("applyUrl", ""),
            description=item.get("descriptionPlain") or html_to_text(item.get("descriptionHtml")),
            posted_at=_parse_dt(item.get("publishedAt")),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency=currency,
        ))
    return jobs


def fetch_smartrecruiters(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    company_id = config["token"]
    jobs = []
    with _client() as client:
        for keyword in keywords or [""]:
            params: dict[str, Any] = {"limit": 100, "q": keyword}
            if config.get("country"):
                params["country"] = config["country"]
            response = client.get(f"https://api.smartrecruiters.com/v1/companies/{company_id}/postings", params=params)
            response.raise_for_status()
            for item in response.json().get("content", []):
                loc = item.get("location") or {}
                jobs.append(_job(
                    source="smartrecruiters",
                    external_id=f"{company_id}:{item.get('id')}",
                    company=config.get("company") or (item.get("company") or {}).get("name") or company_id,
                    title=item.get("name", ""),
                    location=", ".join(x for x in [loc.get("city"), loc.get("region"), loc.get("country")] if x),
                    url=f"https://jobs.smartrecruiters.com/{company_id}/{item.get('id')}",
                    description="",  # filled lazily by enrich_description
                    posted_at=_parse_dt(item.get("releasedDate")),
                ))
    return jobs


def fetch_personio(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    slug = config["token"]
    domain = config.get("domain", "de")
    base = f"https://{slug}.jobs.personio.{domain}"
    with _client() as client:
        response = client.get(f"{base}/xml", params={"language": config.get("language", "en")})
        response.raise_for_status()
        root = ET.fromstring(response.content)
    jobs = []
    for pos in root.findall("position"):
        job_id = (pos.findtext("id") or "").strip()
        parts = []
        for desc in pos.findall("./jobDescriptions/jobDescription"):
            parts.append(f"{desc.findtext('name') or ''}\n{html_to_text(desc.findtext('value'))}")
        offices = [pos.findtext("office") or ""] + [o.text or "" for o in pos.findall("./additionalOffices/office")]
        jobs.append(_job(
            source="personio",
            external_id=f"{slug}:{job_id}",
            company=config.get("company") or (pos.findtext("subcompany") or slug),
            title=pos.findtext("name") or "",
            location=", ".join(o for o in offices if o),
            url=f"{base}/job/{job_id}",
            description="\n\n".join(parts)[:MAX_DESC_CHARS],
            posted_at=_parse_dt(pos.findtext("createdAt")),
        ))
    return jobs


# ---------------------------------------------------------------------------
# Large-employer career sites (public search JSON / HTML the site itself serves)
# ---------------------------------------------------------------------------

_WD_POSTED_RE = re.compile(r"(\d+)\+?\s+Days?\s+Ago", re.I)


def _workday_posted(label: str) -> Optional[str]:
    now = datetime.now(timezone.utc)
    label = (label or "").strip()
    if re.search(r"today", label, re.I):
        return _iso(now)
    if re.search(r"yesterday", label, re.I):
        return _iso(now - timedelta(days=1))
    match = _WD_POSTED_RE.search(label)
    if match:
        return _iso(now - timedelta(days=int(match.group(1))))
    return None


def fetch_workday(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    """config: {tenant, wd: 'wd3', site, company}"""
    tenant, wd, site = config["tenant"], config.get("wd", "wd3"), config["site"]
    host = f"https://{tenant}.{wd}.myworkdayjobs.com"
    api = f"{host}/wday/cxs/{tenant}/{site}"
    jobs: dict[str, dict[str, Any]] = {}
    with _client() as client:
        for keyword in keywords or [""]:
            search = f"{keyword} {config.get('location_hint', '')}".strip()
            for offset in range(0, int(config.get("max_results", 60)), 20):
                response = _request(
                    client, "POST", f"{api}/jobs", pause=1.0,
                    json={"appliedFacets": {}, "limit": 20, "offset": offset, "searchText": search},
                )
                postings = response.json().get("jobPostings", [])
                for item in postings:
                    path = item.get("externalPath", "")
                    if not path or path in jobs:
                        continue
                    jobs[path] = _job(
                        source="workday",
                        external_id=f"{tenant}:{path}",
                        company=config.get("company") or tenant,
                        title=item.get("title", ""),
                        location=item.get("locationsText", ""),
                        url=f"{host}/{site}{path}",
                        description="",  # filled lazily by enrich_description
                        posted_at=_workday_posted(item.get("postedOn", "")),
                    )
                if len(postings) < 20:
                    break
    return list(jobs.values())


def fetch_phenom(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    """Phenom People career sites (e.g. careers.siemens-healthineers.com).

    config: {base, lang, country, company, filters?}
    """
    base = config["base"].rstrip("/")
    jobs: dict[str, dict[str, Any]] = {}
    with _client() as client:
        for keyword in keywords or [""]:
            body = {
                "lang": config.get("lang", "en_global"),
                "deviceType": "desktop",
                "country": config.get("country", "global"),
                "pageName": "search-results",
                "ddoKey": "refineSearch",
                "sortBy": "Most recent",
                "subsearch": "",
                "from": 0,
                "jobs": True,
                "counts": False,
                "all_fields": [],
                "size": int(config.get("max_results", 50)),
                "clearAll": False,
                "jdsource": "facets",
                "isSliderEnable": False,
                "pageId": "page20",
                "siteType": "external",
                "keywords": keyword,
                "global": True,
                "selected_fields": config.get("filters", {"country": ["Germany"]}),
            }
            response = client.post(f"{base}/widgets", json=body)
            response.raise_for_status()
            data = ((response.json().get("refineSearch") or {}).get("data") or {})
            locale_path = config.get("locale_path", "global/en")
            for item in data.get("jobs", []):
                job_id = str(item.get("jobId") or item.get("jobSeqNo") or "")
                if not job_id or job_id in jobs:
                    continue
                jobs[job_id] = _job(
                    source="phenom",
                    external_id=f"{base}:{job_id}",
                    company=config.get("company") or base,
                    title=item.get("title", ""),
                    location=", ".join(x for x in [item.get("city"), item.get("state"), item.get("country")] if x),
                    url=f"{base}/{locale_path}/job/{job_id}",
                    apply_url=item.get("applyUrl") or "",
                    description=html_to_text(item.get("descriptionTeaser")),
                    posted_at=_parse_dt(item.get("postedDate")),
                )
    return list(jobs.values())


_AVATURE_LINK_RE = re.compile(r'href="(?P<url>[^"]*/JobDetail/[^"]+)"[^>]*>\s*(?P<title>[^<]{3,200}?)\s*<', re.I)


def fetch_avature(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    """Avature career sites (e.g. jobs.siemens.com/en_US/externaljobs).

    Reads the public search results page and keeps job links + titles.
    Location and date are filled from the detail page in enrich_description.
    """
    base = config["base"].rstrip("/")
    jobs: dict[str, dict[str, Any]] = {}
    skip_titles = {"learn more", "apply", "apply now", "details", "mehr erfahren"}
    page_size = 6  # Avature renders a fixed page size; paginate with folderOffset
    with _client() as client:
        for keyword in keywords or [""]:
            query = f"{keyword} {config.get('location_hint', '')}".strip()
            for offset in range(0, int(config.get("max_results", 36)), page_size):
                params = {"listFilterMode": 1, "folderRecordsPerPage": page_size, "folderOffset": offset}
                response = _request(client, "GET", f"{base}/SearchJobs/{quote(query)}", params=params, pause=0.5)
                found = 0
                for match in _AVATURE_LINK_RE.finditer(response.text):
                    url = urljoin(base + "/", html.unescape(match.group("url")))
                    title = html.unescape(match.group("title")).strip()
                    if url in jobs or title.lower() in skip_titles:
                        continue
                    found += 1
                    jobs[url] = _job(
                        source="avature",
                        external_id=url,
                        company=config.get("company") or base,
                        title=title,
                        url=url,
                        description="",
                    )
                if found == 0:
                    break
    return list(jobs.values())


_AVATURE_FIELD_RE = re.compile(
    r'field__label"\s*>\s*(?P<label>[^<]+?)\s*</div>\s*<div class="article__content__view__field__value"\s*>(?P<value>.*?)</div>',
    re.S,
)


def _parse_avature_detail(job: dict[str, Any], page: str) -> None:
    fields = {m.group("label").strip().lower(): html_to_text(m.group("value")) for m in _AVATURE_FIELD_RE.finditer(page)}
    locations = fields.get("location(s)") or fields.get("location") or fields.get("standort(e)") or ""
    if locations:
        parts = [line.strip().lstrip("-").strip() for line in locations.splitlines()]
        job["location"] = "; ".join(p for p in parts if p)
    posted = fields.get("posted since") or fields.get("veröffentlicht seit")
    if posted:
        try:
            job["posted_at"] = _iso(datetime.strptime(posted.strip(), "%d-%b-%Y"))
        except ValueError:
            pass
    if fields.get("company"):
        job["company"] = fields["company"]
    meta = [f"{k.title()}: {v}" for k, v in fields.items() if k in ("experience level", "work mode", "job type", "employment type")]
    body = html_to_text(page)
    start = body.find(job.get("title", "")[:40]) if job.get("title") else -1
    job["description"] = ("\n".join(meta) + "\n\n" + (body[start:] if start > 0 else body))[:MAX_DESC_CHARS]


ADAPTERS: dict[str, Callable[[dict[str, Any], list[str]], list[dict[str, Any]]]] = {
    "arbeitnow": fetch_arbeitnow,
    "greenhouse": fetch_greenhouse,
    "lever": fetch_lever,
    "ashby": fetch_ashby,
    "smartrecruiters": fetch_smartrecruiters,
    "personio": fetch_personio,
    "workday": fetch_workday,
    "phenom": fetch_phenom,
    "avature": fetch_avature,
    "google_jobs": None,  # set below
}


# ---------------------------------------------------------------------------
# Google Jobs (via SerpApi). Google itself has no public jobs/search API for new
# customers, so this uses SerpApi's licensed Google Jobs endpoint. Needs the
# SERPAPI_API_KEY environment variable; free plan = 250 searches/month.
# ---------------------------------------------------------------------------

_AGO_RE = re.compile(r"(\d+)\+?\s*(minute|hour|day|week|month)", re.I)
JOB_BOARD_DOMAINS = ("linkedin.", "indeed.", "stepstone.", "glassdoor.", "xing.", "monster.", "jooble.",
                     "kimeta.", "jobware.", "stellenanzeigen.", "talent.com", "jobrapido.", "softgarden.io/job-board")


def _ago_to_iso(label: str) -> Optional[str]:
    match = _AGO_RE.search(label or "")
    if not match:
        return None
    amount, unit = int(match.group(1)), match.group(2).lower()
    delta = {"minute": timedelta(minutes=amount), "hour": timedelta(hours=amount), "day": timedelta(days=amount),
             "week": timedelta(weeks=amount), "month": timedelta(days=30 * amount)}[unit]
    return _iso(datetime.now(timezone.utc) - delta)


def fetch_google_jobs(config: dict[str, Any], keywords: list[str]) -> list[dict[str, Any]]:
    """config: {locations: ["Bavaria, Germany", "Germany"], max_queries: 6}. Records config['_calls']."""
    import os

    api_key = os.getenv("SERPAPI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("add SERPAPI_API_KEY on Render to enable Google Jobs (free account at serpapi.com)")
    locations = config.get("locations") or ["Germany"]
    max_queries = int(config.get("max_queries", 6))
    terms = [k for k in keywords if k.strip()][: max(1, max_queries // max(1, len(locations)))]
    jobs: dict[str, dict[str, Any]] = {}
    calls, errors = 0, []
    with _client() as client:
        for term in terms:
            for location in locations:
                if calls >= max_queries:
                    break
                calls += 1
                try:
                    response = _request(client, "GET", "https://serpapi.com/search.json", retries=1, params={
                        "engine": "google_jobs", "q": term, "location": location, "gl": "de", "hl": "en",
                        "api_key": api_key,
                    })
                except Exception as exc:  # keep other queries going
                    errors.append(str(exc)[:80])
                    continue
                for item in response.json().get("jobs_results", []) or []:
                    job_id = item.get("job_id") or f"{item.get('company_name')}|{item.get('title')}"
                    if job_id in jobs:
                        continue
                    options = [o for o in item.get("apply_options") or [] if o.get("link")]
                    direct = [o for o in options if not any(d in o["link"].lower() for d in JOB_BOARD_DOMAINS)]
                    chosen = (direct or options or [{}])[0]
                    link = chosen.get("link") or item.get("share_link") or ""
                    extensions = item.get("detected_extensions") or {}
                    jobs[job_id] = _job(
                        source="google_jobs",
                        external_id=str(job_id)[:300],
                        company=item.get("company_name", ""),
                        title=item.get("title", ""),
                        location=item.get("location", ""),
                        url=link,
                        description=(item.get("description") or "")[:MAX_DESC_CHARS],
                        posted_at=_ago_to_iso(extensions.get("posted_at", "")),
                    )
    config["_calls"] = calls
    if errors and not jobs:
        raise RuntimeError("; ".join(errors[:2]))
    return list(jobs.values())


ADAPTERS["google_jobs"] = fetch_google_jobs


# ---------------------------------------------------------------------------
# Lazy enrichment: fetch the full description only for jobs that passed the
# cheap keyword/location filter, so we don't hammer career sites.
# ---------------------------------------------------------------------------

_LD_JSON_RE = re.compile(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', re.S | re.I)


def enrich_description(job: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    if job.get("description") and len(job["description"]) > 400:
        return job
    if job.get("source") == "google_jobs":
        return job  # Google Jobs already gives the full text; its links point at third-party sites.
    try:
        with _client() as client:
            if job["source"] == "workday":
                tenant, wd, site = config["tenant"], config.get("wd", "wd3"), config["site"]
                path = job["external_id"].split(":", 1)[1]
                response = _request(client, "GET", f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}{path}", pause=0.5)
                info = response.json().get("jobPostingInfo", {})
                job["description"] = html_to_text(info.get("jobDescription"))
                job["location"] = info.get("location") or job["location"]
                job["posted_at"] = _parse_dt(info.get("startDate")) or job["posted_at"]
                job["apply_url"] = info.get("externalUrl") or job["url"]
            elif job["source"] == "smartrecruiters":
                company_id, posting_id = job["external_id"].split(":", 1)
                response = client.get(f"https://api.smartrecruiters.com/v1/companies/{company_id}/postings/{posting_id}")
                response.raise_for_status()
                sections = (response.json().get("jobAd") or {}).get("sections") or {}
                job["description"] = "\n\n".join(
                    f"{s.get('title', '')}\n{html_to_text(s.get('text'))}" for s in sections.values() if isinstance(s, dict)
                )[:MAX_DESC_CHARS]
            elif job["source"] == "avature":
                response = _request(client, "GET", job["url"], pause=0.5)
                _parse_avature_detail(job, response.text)
            else:
                response = _request(client, "GET", job["url"], pause=0.3)
                page = response.text
                # Prefer schema.org JobPosting data, which most career sites embed for Google Jobs.
                import json as _json
                for block in _LD_JSON_RE.findall(page):
                    try:
                        data = _json.loads(block.strip())
                    except ValueError:
                        continue
                    for node in data if isinstance(data, list) else [data]:
                        if isinstance(node, dict) and node.get("@type") == "JobPosting":
                            job["description"] = html_to_text(node.get("description")) or job["description"]
                            job["posted_at"] = _parse_dt(node.get("datePosted")) or job["posted_at"]
                            loc = node.get("jobLocation")
                            loc = loc[0] if isinstance(loc, list) and loc else loc
                            address = (loc or {}).get("address") if isinstance(loc, dict) else None
                            if isinstance(address, dict):
                                job["location"] = ", ".join(
                                    str(address.get(k)) for k in ("addressLocality", "addressRegion", "addressCountry")
                                    if address.get(k) and not isinstance(address.get(k), dict)
                                ) or job["location"]
                            salary = (node.get("baseSalary") or {}).get("value") if isinstance(node.get("baseSalary"), dict) else None
                            if isinstance(salary, dict):
                                job["salary_min"] = salary.get("minValue") or job["salary_min"]
                                job["salary_max"] = salary.get("maxValue") or job["salary_max"]
                                job["salary_currency"] = node["baseSalary"].get("currency") or job["salary_currency"]
                if not job.get("description") or len(job["description"]) < 200:
                    job["description"] = html_to_text(page)[:MAX_DESC_CHARS]
    except Exception:  # enrichment is best-effort; the job is still usable
        pass
    return job
