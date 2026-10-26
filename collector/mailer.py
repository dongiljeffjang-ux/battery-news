#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""STEEP 그룹별 HTML 다이제스트 메일 작성 및 Gmail SMTP 발송."""

import os
import ssl
import smtplib
import datetime as dt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

KST = dt.timezone(dt.timedelta(hours=9))

STEEP_ORDER = ["Social", "Technological", "Economic",
               "Environmental", "Political", "Uncategorized"]

REGION_KO = {
    "Korea": "🇰🇷한국", "China": "🇨🇳중국", "Japan": "🇯🇵일본",
    "NorthAmerica": "🇺🇸북미", "Europe": "🇪🇺유럽", "Global": "🌐글로벌",
}


def region_label(code):
    return REGION_KO.get(code, code or "")
STEEP_KO = {
    "Social": "사회 (Social)",
    "Technological": "기술 (Technological)",
    "Economic": "경제 (Economic)",
    "Environmental": "환경 (Environmental)",
    "Political": "정치·정책 (Political)",
    "Uncategorized": "미분류",
}


def build_html(fresh, today_str):
    groups = {k: [] for k in STEEP_ORDER}
    for a in fresh:
        groups.get(a["steep"], groups["Uncategorized"]).append(a)

    parts = [
        '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;'
        'max-width:680px;margin:0 auto;color:#1a1a1a">',
        f'<h2 style="border-bottom:3px solid #2b6cb0;padding-bottom:8px">'
        f'🔋 배터리 시장 뉴스 — {today_str}</h2>',
        f'<p style="color:#666">오늘 수집된 신규 기사 {len(fresh)}건</p>',
    ]
    for cat in STEEP_ORDER:
        arts = groups[cat]
        if not arts:
            continue
        parts.append(
            f'<h3 style="margin-top:24px;color:#2b6cb0">'
            f'{STEEP_KO[cat]} <span style="color:#999;font-weight:400">'
            f'({len(arts)})</span></h3>')
        parts.append('<ul style="padding-left:18px;line-height:1.5">')
        for a in arts:
            parts.append(
                f'<li style="margin-bottom:10px">'
                f'<a href="{a["url"]}" style="color:#1a1a1a;'
                f'font-weight:600;text-decoration:none">{a["title"]}</a>'
                f'<br><span style="color:#555;font-size:13px">'
                f'{a["summary"]}</span>'
                f'<br><span style="color:#999;font-size:12px">'
                f'{a["source"]} · {a["keyword"]}'
                f'{" · " + region_label(a.get("region")) if a.get("region") else ""}'
                f'{" · " + " ".join("#" + t for t in a.get("hashtags", [])) if a.get("hashtags") else ""}'
                f'</span></li>')
        parts.append('</ul>')
    parts.append(
        '<hr style="margin-top:24px;border:none;border-top:1px solid #eee">'
        '<p style="color:#aaa;font-size:12px">자동 발송된 메일입니다.</p></div>')
    return "".join(parts)


def get_recipients(cfg):
    env = os.environ.get("MAIL_TO", "").strip()
    if env:
        return [x.strip() for x in env.split(",") if x.strip()]
    return cfg.get("recipients", [])


def send_digest(cfg, fresh):
    if not fresh:
        print("[mail] 신규 기사 없음 → 발송 생략")
        return
    user = os.environ.get("GMAIL_USER")
    pw = os.environ.get("GMAIL_APP_PASSWORD")
    if not (user and pw):
        print("[mail] GMAIL_USER/APP_PASSWORD 없음 → 발송 생략")
        return
    recipients = get_recipients(cfg)
    if not recipients:
        print("[mail] 수신자 없음 → 발송 생략")
        return

    today = dt.datetime.now(KST).strftime("%Y-%m-%d")
    em = cfg.get("email", {})
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f'{em.get("subject_prefix","[배터리 뉴스]")} {today} ({len(fresh)}건)'
    msg["From"] = formataddr((em.get("sender_name", "Battery News Bot"), user))
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(build_html(fresh, today), "html", "utf-8"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as s:
        s.login(user, pw)
        s.sendmail(user, recipients, msg.as_string())
    print(f"[mail] {len(recipients)}명에게 발송 완료")
