#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""파이프라인 진입점: 수집 → DB 누적 → 메일 발송."""

import os
import sys
import yaml
import datetime as dt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core
import db as dbmod
import mailer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KST = dt.timezone(dt.timedelta(hours=9))


def main():
    with open(os.path.join(ROOT, "config.yaml"), "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    json_path = os.path.join(ROOT, cfg["output"]["json_db"])
    md_path = os.path.join(ROOT, cfg["output"]["md_archive"])

    candidates = core.collect(cfg)
    database = dbmod.load_db(json_path)
    fresh = dbmod.merge(database, candidates)
    dbmod.save_db(json_path, database)
    dbmod.append_markdown(md_path, fresh)

    print(f"수집 후보 {len(candidates)} / 신규 누적 {len(fresh)} / "
          f"총 {len(database['articles'])}건")

    try:
        mailer.send_digest(cfg, fresh)
    except Exception as e:
        print(f"[mail] 발송 실패: {e}", file=sys.stderr)

    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a") as f:
            f.write(f"new_count={len(fresh)}\n")


if __name__ == "__main__":
    main()
