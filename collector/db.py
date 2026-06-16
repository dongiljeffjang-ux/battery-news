#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JSON DB + Markdown 아카이브 누적."""

import os
import json
import datetime as dt

KST = dt.timezone(dt.timedelta(hours=9))


def load_db(json_path):
    if not os.path.exists(json_path):
        return {"updated_at": None, "articles": []}
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def merge(db, new_items):
    """기존 id 와 겹치지 않는 것만 추가. (오늘 신규분 리스트도 반환)"""
    existing = {a["id"] for a in db["articles"]}
    fresh = [it for it in new_items if it["id"] not in existing]
    db["articles"].extend(fresh)
    db["articles"].sort(key=lambda a: a.get("published") or "", reverse=True)
    db["updated_at"] = dt.datetime.now(KST).isoformat()
    return fresh


def save_db(json_path, db):
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


def append_markdown(md_path, fresh):
    if not fresh:
        return
    new_file = not os.path.exists(md_path)
    os.makedirs(os.path.dirname(md_path), exist_ok=True)
    with open(md_path, "a", encoding="utf-8") as f:
        if new_file:
            f.write("# 배터리 뉴스 아카이브\n\n")
            f.write("| 일시 | STEEP | 출처 | 제목 | 요약 |\n")
            f.write("|---|---|---|---|---|\n")
        for a in fresh:
            pub = (a.get("published") or "")[:16].replace("T", " ")
            title = a["title"].replace("|", "\\|")
            summ = a["summary"].replace("|", "\\|")
            f.write(f"| {pub} | {a['steep']} | {a['source']} | "
                    f"[{title}]({a['url']}) | {summ} |\n")
