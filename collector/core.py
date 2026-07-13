#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""뉴스 수집 · 중복제거 · 권역·Application·소재 분류 · 요약 (규칙기반)."""

import os
import re
import sys
import html
import hashlib
import datetime as dt
from urllib.parse import (urlparse, urlunparse, parse_qs,
                          urlencode, quote)

from difflib import SequenceMatcher

import requests
import feedparser

KST = dt.timezone(dt.timedelta(hours=9))

# 제목 유사도 임계값. 높을수록 "거의 똑같아야" 중복으로 봄(보수적),
# 낮을수록 "비슷하면" 중복으로 봄(적극적). 0.60 = 강하게 제거.
TITLE_SIM_THRESHOLD = 0.60

# 같은 사건 판정용 사전 (회사명 + 핵심명사)
DEDUP_COMPANIES = [
    "에코프로비엠", "에코프로", "LG에너지솔루션", "LG엔솔", "삼성SDI", "SK온",
    "SK이노베이션", "포스코퓨처엠", "포스코", "엘앤에프", "LG화학",
    "CATL", "BYD", "비야디", "테슬라", "토요타", "도요타", "파나소닉",
    "노스볼트", "고려아연", "리비안", "폭스바겐",
]
DEDUP_KEYNOUNS = [
    "니켈", "리튬", "코발트", "망간", "양극재", "음극재", "전해질", "분리막",
    "전고체", "ESS", "배전망", "수주", "유증", "인니", "인도네시아",
    "증설", "합작", "공장", "리콜", "RAV4", "라브4", "신차",
]


def normalize_title(t: str) -> str:
    """제목에서 머리표·기호·공백을 제거해 비교용으로 정규화."""
    t = t or ""
    t = re.sub(r"\[[^\]]*\]", "", t)   # [속보] [단독] 등
    t = re.sub(r"\([^)]*\)", "", t)    # (종합) (영상) 등
    t = re.sub(r"\s*-\s*[\w.가-힣]+$", "", t)  # 끝 매체명 "- 더구루"
    t = re.sub(r"[^0-9a-z가-힣]", "", t.lower())  # 한글·영문·숫자만 남김
    return t


def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def event_signature(title: str):
    """제목에서 '사건 지문'을 뽑음: 대표회사 + 숫자 + 핵심명사들."""
    comp = [c for c in DEDUP_COMPANIES if c in title]
    nums = re.findall(r"\d+만|\d+억|\d+톤|\d+%|\d+\.\d+", title)
    nouns = [n for n in DEDUP_KEYNOUNS if n in title]
    sig = set()
    rep_comp = None
    if comp:
        rep_comp = comp[0]
        # 계열사 표기를 그룹명으로 통일 (에코프로비엠→에코프로, LG엔솔→LG에너지솔루션)
        if "에코프로" in rep_comp:
            rep_comp = "에코프로"
        elif rep_comp in ("LG엔솔",):
            rep_comp = "LG에너지솔루션"
        elif rep_comp == "비야디":
            rep_comp = "BYD"
        elif rep_comp == "도요타":
            rep_comp = "토요타"
        sig.add(rep_comp)
    sig.update(nouns[:3])
    if nums:
        sig.add(nums[0])
    return sig, rep_comp


def is_same_event(title_a, norm_a, sig_a, comp_a,
                  title_b, norm_b, sig_b, comp_b) -> bool:
    """두 기사가 같은 사건인지: 유사도 또는 (같은 회사 + 핵심 2개 이상 공유)."""
    if title_similarity(norm_a, norm_b) >= TITLE_SIM_THRESHOLD:
        return True
    if comp_a and comp_b and comp_a == comp_b:
        if len(sig_a & sig_b) >= 2:
            return True
    return False


def _source_rank(src: str) -> int:
    """중복 시 남길 우선순위. 네이버 우선(요약이 있으므로)."""
    return 0 if src == "네이버" else 1


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


def classify_pick(text: str, cat_dict: dict, default: str = "Etc") -> str:
    """가장 많이 매칭된 카테고리 하나(대표). 없으면 default."""
    t = text.lower()
    best, best_n = default, 0
    for cat, words in (cat_dict or {}).items():
        n = sum(1 for w in words if w.lower() in t)
        if n > best_n:
            best, best_n = cat, n
    return best


def extract_celltypes(text: str, cell_dict: dict) -> list:
    """해당되는 셀타입 뱃지 모두(중복 없이). 없으면 빈 리스트."""
    t = text.lower()
    out = []
    for name, variants in (cell_dict or {}).items():
        if any(v.lower() in t for v in variants):
            out.append(name)
    return out


def classify_region(text: str, region_dict: dict) -> str:
    """가장 많이 매칭된 권역. 어디에도 안 걸리면 'Global'.
    영문 약자(GM, EU 등)는 단어경계로 정확히 매칭해 오분류를 줄임."""
    t = text.lower()
    best, best_n = "Global", 0
    for reg, words in (region_dict or {}).items():
        n = 0
        for w in words:
            wl = w.lower()
            if re.fullmatch(r"[a-z]+", wl):       # 영문 약자
                if re.search(r"\b" + re.escape(wl) + r"\b", t):
                    n += 2
            else:                                   # 한글·혼합
                if wl in t:
                    n += 2
        if n > best_n:
            best, best_n = reg, n
    return best


def extract_hashtags(text: str, tag_dict: dict) -> list:
    """사전의 변형어가 본문에 있으면 해당 대표 태그를 부착(중복 없이)."""
    t = text.lower()
    tags = []
    for tag, variants in (tag_dict or {}).items():
        if any(v.lower() in t for v in variants):
            tags.append(tag)
    return tags


def score_importance(text: str, region: str, sc: dict) -> int:
    """재직자 관점 중요도 점수(1~5). 실무 직결일수록 높음."""
    if not sc:
        return 3
    t = text.lower()
    def has(words):
        return any(w.lower() in t for w in (words or []))
    s = float(sc.get("base", 3))
    if has(sc.get("pos_top")):
        s += 2.5
    elif has(sc.get("pos_strong")):
        s += 1.5
    elif has(sc.get("pos_med")):
        s += 1
    elif "배터리" in t or "이차전지" in t:
        s += 0.5
    if has(sc.get("neg_strong")):
        s -= 3
    elif has(sc.get("neg_med")):
        s -= 1.8
    s += (sc.get("region_bonus", {}) or {}).get(region, 0)
    return max(1, min(5, round(s)))


def is_blocked(item: dict, blocked: list) -> bool:
    """제외 매체인지 (출처/URL에 차단어가 있으면 True)."""
    if not blocked:
        return False
    hay = f"{item.get('source','')} {item.get('url','')}".lower()
    return any(b.lower() in hay for b in blocked)


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

    app_dict = cfg.get("application", {})
    mat_dict = cfg.get("material", {})
    cell_dict = cfg.get("celltype", {})
    region_dict = cfg.get("regions", {})
    tag_dict = cfg.get("hashtags", {})
    scoring = cfg.get("scoring", {})
    blocked = cfg.get("blocked_sources", [])
    cfg_sum = cfg.get("summary", {})
    max_age = cfg.get("max_age_days", 2)

    # 1단계: URL 기준 중복 제거 + 기간 필터
    by_url, seen = [], set()
    for it in raw:
        if not it["url"] or not within_age(it["pub"], max_age):
            continue
        if is_blocked(it, blocked):   # 제외 매체 거르기
            continue
        h = url_hash(it["url"])
        if h in seen:
            continue
        seen.add(h)
        by_url.append(it)

    # 2단계: 제목 유사도 기준 중복 제거.
    # 네이버를 먼저 보도록 정렬해, 같은 사건 묶음에서 네이버가 대표로 남게 함.
    by_url.sort(key=lambda x: _source_rank(x["source"]))
    kept = []
    for it in by_url:
        nt = normalize_title(it["title"])
        sig, comp = event_signature(it["title"])
        dup = False
        for k in kept:
            if is_same_event(it["title"], nt, sig, comp,
                             k["_title"], k["_nt"], k["_sig"], k["_comp"]):
                dup = True
                break
        if dup:
            continue
        it["_nt"] = nt
        it["_sig"] = sig
        it["_comp"] = comp
        it["_title"] = it["title"]
        kept.append(it)

    # 3단계: 최종 항목 구성
    out = []
    for it in kept:
        text = f"{it['title']} {it['desc']}"
        region = classify_region(text, region_dict)
        out.append({
            "id": url_hash(it["url"]),
            "title": it["title"],
            "url": it["url"],
            "summary": make_summary(it["desc"], cfg_sum),
            "region": region,
            "application": classify_pick(text, app_dict),
            "material": classify_pick(text, mat_dict),
            "celltypes": extract_celltypes(text, cell_dict),
            "hashtags": extract_hashtags(text, tag_dict),
            "score": score_importance(text, region, scoring),
            "source": it["source"],
            "keyword": it["keyword"],
            "published": it["pub"].isoformat() if it["pub"] else None,
            "collected_at": dt.datetime.now(KST).isoformat(),
        })
    return out
