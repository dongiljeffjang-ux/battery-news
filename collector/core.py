#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""뉴스 수집 · 중복제거 · STEEP 분류 · 요약 (규칙기반)."""

import os
import re
import sys
import html
import hashlib
import datetime as dt
from urllib.parse import (urlparse, urlunparse, parse_qs,
                          urlencode, quote)

import requests
import feedparser

KST = dt.timezone(dt.timedelta(hours=9))


# ───────── 유틸 ─────────
def strip_tags(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def normalize_url(url: str) -> str:
    try:
        p = urlparse(url)
        q = parse_qs(p.query)
        drop = {"utm_source", "utm_medium", "utm_campaign", "utm_term",
                "utm_content", "oc", "ved", "usg", "fbclid", "gclid"}
        q = {k: v for k, v in q.items() if k not in drop}
        return urlunparse((p.scheme, p.netloc, p.path.rstrip("/"),
                           "", urlencode(q, doseq=True), ""))
    except Exception:
        return url


def url_hash(url: str) -> str:
    return hashlib.sha1(normalize_url(url).encode("utf-8")).hexdigest()[:12]


def split_sentences(text: str):
    parts = re.split(r"(?<=[.!?。…])\s+|(?<=다\.)\s*", text or "")
    return [s.strip() for s in parts if s.strip()]


def make_summary(desc: str, cfg_sum: dict) -> str:
    sents = split_sentences(desc)
    out = " ".join(sents[: cfg_sum.get("max_sentences", 2)]) or desc
    mc = cfg_sum.get("max_chars", 180)
    return (out[:mc] + "…") if len(out) > mc else out


def classify_steep(text: str, steep_dict: dict) -> str:
    """가장 많이 매칭된 카테고리. 동점이면 사전 정의 순서 우선."""
    t = text.lower()
    best, best_n = "Uncategorized", 0
    for cat, words in steep_dict.items():
        n = sum(1 for w in words if w.lower() in t)
        if n > best_n:
            best, best_n = cat, n
    return best


# ───────── 소스: 네이버 ─────────
def fetch_naver(keyword, cfg):
    cid = os.environ.get("NAVER_CLIENT_ID")
    sec = os.environ.get("NAVER_CLIENT_SECRET")
    if not (cid and sec):
        print(f"[naver] 키 없음, skip ({keyword})", file=sys.stderr)
        return []
    items = []
    try:
        r = requests.get(
            "https://openapi.naver.com/v1/search/news.json",
            headers={"X-Naver-Client-Id": cid,
                     "X-Naver-Client-Secret": sec},
            params={"query": keyword, "display": cfg.get("display", 30),
                    "sort": cfg.get("sort", "date")},
            timeout=15)
        r.raise_for_status()
        for it in r.json().get("items", []):
            pub = None
            try:
                pub = dt.datetime.strptime(
                    it.get("pubDate", ""),
                    "%a, %d %b %Y %H:%M:%S %z").astimezone(KST)
            except Exception:
                pass
            items.append({
                "title": strip_tags(it.get("title", "")),
                "url": it.get("originallink") or it.get("link", ""),
                "desc": strip_tags(it.get("description", "")),
                "pub": pub, "source": "네이버", "keyword": keyword})
    except Exception as e:
        print(f"[naver] 오류 {keyword}: {e}", file=sys.stderr)
    return items


# ───────── 소스: 구글 ─────────
def fetch_google(keyword, cfg):
    q = quote(f"{keyword} when:2d")
    rss = (f"https://news.google.com/rss/search?q={q}"
           f"&hl={cfg.get('hl','ko')}&gl={cfg.get('gl','KR')}"
           f"&ceid={cfg.get('ceid','KR:ko')}")
    items = []
    try:
        feed = feedparser.parse(rss)
        for e in feed.entries[: cfg.get("max_items", 30)]:
            pub = None
            if getattr(e, "published_parsed", None):
                pub = dt.datetime(*e.published_parsed[:6],
                                  tzinfo=dt.timezone.utc).astimezone(KST)
            items.append({
                "title": strip_tags(getattr(e, "title", "")),
                "url": getattr(e, "link", ""),
                "desc": strip_tags(getattr(e, "summary", "")),
                "pub": pub, "source": "구글", "keyword": keyword})
    except Exception as ex:
        print(f"[google] 오류 {keyword}: {ex}", file=sys.stderr)
    return items


def within_age(pub, max_age_days):
    if not max_age_days or pub is None:
        return True
    return pub >= dt.datetime.now(KST) - dt.timedelta(days=max_age_days)


def collect(cfg):
    """설정대로 수집 → 정규화된 신규 후보 리스트 반환 (중복 미적용)."""
    raw = []
    for kw in cfg.get("keywords", []):
        if cfg["sources"]["naver"].get("enabled"):
            raw += fetch_naver(kw, cfg["sources"]["naver"])
        if cfg["sources"]["google"].get("enabled"):
            raw += fetch_google(kw, cfg["sources"]["google"])

    steep_dict = cfg.get("steep", {})
    cfg_sum = cfg.get("summary", {})
    max_age = cfg.get("max_age_days", 2)

    out, seen = [], set()
    for it in raw:
        if not it["url"] or not within_age(it["pub"], max_age):
            continue
        h = url_hash(it["url"])
        if h in seen:
            continue
        seen.add(h)
        text = f"{it['title']} {it['desc']}"
        out.append({
            "id": h,
            "title": it["title"],
            "url": it["url"],
            "summary": make_summary(it["desc"], cfg_sum),
            "steep": classify_steep(text, steep_dict),
            "source": it["source"],
            "keyword": it["keyword"],
            "published": it["pub"].isoformat() if it["pub"] else None,
            "collected_at": dt.datetime.now(KST).isoformat(),
        })
    return out
