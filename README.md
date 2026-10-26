# 🔋 배터리 시장 뉴스 모니터링 시스템

전기차·ESS·배터리 소재 뉴스를 **매일 자동 수집 → 3축 분류 → 재직자 관점 중요도 점수 → 중복 제거 → 대시보드 표시**까지 처리하는 프로젝트.

> **이 문서는 AI 코딩 도구(Claude Code, OpenAI 코딩 에이전트, Cursor 등)나 개발자가 이 프로젝트를 이어받아 작업할 수 있도록 작성된 인수인계 문서입니다.** 아래 "현재 상태"와 "다음 할 일"을 먼저 읽으세요.

---

## 이 프로젝트를 쓰는 사람

- 한국 배터리 **양극재 소재사** 재직자용. 코딩 비전문가이므로, 변경 시 클릭 단위 안내나 자동화가 필요.
- 대화·UI 언어: **한국어**.

---

## 전체 구조

```
GitHub Actions (매일 cron, KST 08:00·20:00)
  └ collector/run.py 실행
      ├ core.collect()      네이버(한국어)+구글(영어) 뉴스 수집
      │                     → 중복 제거 → 3축 분류 → 중요도 점수 → 회사 인식
      ├ db.merge/save       data/news.json 누적 저장 + data/news.md 아카이브
      └ mailer.send_digest  (선택) 권역별 HTML 메일 발송
  └ data/news.json 을 저장소에 자동 커밋

GitHub Pages (정적 호스팅)
  └ index.html  대시보드. raw.githubusercontent.com에서 news.json 읽어 표시
  └ office.html 2D 픽셀 RPG "분석실" (권역별 에이전트, 현재 인사이트는 샘플)
```

**호스팅은 GitHub Pages와 Vercel을 함께 지원**한다. GitHub Pages는 기존 운영 주소로
사용하고, Vercel은 저장소를 연결해 미리보기·대체 배포 주소로 사용할 수 있다.
루트의 `vercel.json`이 최신 대시보드 배포를 설정한다. `web/` 폴더는 초기 Vercel
인증 버전의 잔재이며 **현재 배포 대상이 아니다** (참고용으로만 보존).

---

## 폴더 구조

```
battery-news/
├── config.yaml              ★ 운영자 설정 (키워드·분류사전·점수규칙·회사사전·차단매체)
├── collector/
│   ├── run.py               파이프라인 진입점 (수집→저장→메일)
│   ├── core.py              ★ 수집·중복제거·분류·점수 (핵심 로직)
│   ├── db.py                news.json + news.md 누적 저장
│   └── mailer.py            권역별 HTML 다이제스트 메일 (Gmail SMTP)
├── index.html               ★ 대시보드 (GitHub Pages 루트에 배포)
├── office.html              분석실 (2D RPG, 인사이트는 아직 샘플)
├── .github/workflows/daily.yml   GitHub Actions (cron + 수동 실행)
├── requirements.txt         requests, feedparser, PyYAML
├── data/                    news.json / news.md 가 여기 쌓임 (Actions가 커밋)
└── web/                     ⚠️ 미사용 (구 Vercel 버전, 무시)
```

★ = 자주 수정하는 핵심 파일

---

## 데이터 스키마 (news.json 안의 기사 1건)

```json
{
  "id": "url 해시",
  "title": "제목",
  "url": "원문 링크",
  "summary": "요약",
  "region": "Korea|China|Japan|NorthAmerica|Europe|Global",
  "application": "EV|ESS|SmallIT|Micromobility|Etc",
  "material": "Cathode|Anode|ElyteSep|CellPack|RawMaterial|Etc",
  "celltypes": ["LFP","NCM","전고체","나트륨","LMR"],
  "companies": [{"name":"CATL","stage":"Cell"}],
  "hashtags": ["업체명"],
  "score": 3,
  "source": "네이버|구글",
  "lang": "ko|en",
  "published": "ISO8601",
  "collected_at": "ISO8601"
}
```

**회사 밸류체인 단계(stage)**: `Mineral`(광물·제련) → `Precursor`(전구체) → `Competitor`(경쟁사/양극재) → `Cell`(셀사) → `Automaker`(완성차) → `Recycle`(재활용). 소재사 기준 upstream→downstream.

---

## 분류·점수 로직 (core.py)

모두 **규칙 기반(키워드 매칭)**. 사전은 전부 `config.yaml`에 있음.

- **권역 분류** `classify_region`: 지명·기업 키워드 매칭. 영문 약자(GM 등)는 단어 경계(`\b`)로 매칭해 오분류 방지. 한국 지명(울산·포항 등) 우선.
- **3축 분류** `classify_pick`: application·material 각각 가장 많이 매칭된 카테고리 하나(대표). 없으면 `Etc`.
- **셀타입** `extract_celltypes`: 해당되는 것 모두 (뱃지용).
- **회사 인식** `extract_companies`: 회사명+밸류체인 단계 반환. 한글·영문 표기 모두 등록됨.
- **중요도 점수** `score_importance`: base 3점에서 가감.
  - pos_top(+2.5): 수주·계약·증설·양산·공급망·내재화·JV·전고체·46파이 등 (실무 직결)
  - pos_strong(+1.5): LFP·NCM·양극재·리튬·니켈 등
  - pos_med(+1): ESS·전기차·정책·주요 플레이어
  - neg_strong(-3): 마이스터고·홀덤·선풍기 등 노이즈
  - neg_med(-1.8): 지역행정·테마주·코스피·건설 등
  - region_bonus: 해외 권역 +1
  - 영어 키워드도 포함(contract, supply chain, cathode 등).
- **중복 제거** `event_signature`+`is_same_event`: 제목 유사도(임계 0.60) 또는 핵심 서명(회사+숫자+핵심명사) 겹침으로 판정. 표현이 달라도 "에코프로+니켈+150만" 같은 핵심이 겹치면 같은 사건으로 묶음. 네이버 우선 유지.

**중요도 점수 정확도** (사용자 394건 채점 대비): 고점 적중 89%, ±1 이내 74%, 저점 적중 47%. 저점 노이즈는 규칙 기반의 한계로 절반만 걸러짐 → AI 재선별로 개선 예정.

---

## 대시보드 (index.html)

- 순수 정적 HTML/CSS/JS 1파일. 외부 의존성 없음.
- **접속 게이트**: 공유 키 `[REDACTED]` (클라이언트 측 간단 게이트, 진짜 인증 아님 → Supabase로 교체 예정).
- **디자인**: 밝은 파스텔(순백 배경 + 하늘·민트). CSS 변수로 테마 관리.
- **사이드바 필터**: 권역 / Application / 소재 / 회사(밸류체인 단계별) / 기간 / 업체 해시태그.
- **본문**: 관련성 3단계 구조.
  - 오늘의 핵심 뉴스 TOP 10 (점수 상위 10개, 순위 뱃지, 항상 펼침)
  - 그 외 고관련(4~5점) / 중간(3점) / 낮은(1~2점) — 각각 접기/펼치기
- 각 기사: 별점(중요도) + Application 색태그 + 소재 + 셀타입 뱃지 + 회사 뱃지(단계 아이콘) + 권역 + EN 태그(영어 기사) + 업체 해시태그.
- 데이터 소스 URL: https://raw.githubusercontent.com/dongiljeffjang-ux/battery-news/main/data/news.json

---

## 배포 방법

### 뉴스 수집 (GitHub Actions)
- `.github/workflows/daily.yml` 이 cron으로 자동 실행. 수동 실행은 Actions 탭 → daily-news → Run workflow.
- **필요한 Secrets** (저장소 Settings → Secrets):
  - `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` (네이버 검색 API — 필수)
  - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_TO` (메일 발송용 — 선택, 없으면 메일만 skip)

### 대시보드 (GitHub Pages)
- 저장소 Settings → Pages → Source를 main 브랜치로 설정하면 index.html이 배포됨.
- index.html, office.html은 저장소 **루트**에 있어야 함.

### 대시보드 (Vercel)
- Vercel에서 이 GitHub 저장소를 Import하고 Framework Preset은 `Other`로 설정한다.
- 별도 Build Command와 Output Directory 없이 배포한다.
- 루트 `vercel.json`과 `data/news.json`을 사용하므로 최신 대시보드와 동일한 데이터가 표시된다.
- Vercel에서는 `/data/news.json`을 직접 읽고, GitHub Pages에서는 기존 raw GitHub URL을 사용한다.
- GitHub Actions가 `data/news.json`을 커밋하면 Vercel도 다음 배포 시 최신 데이터를 반영한다.

---

## 알려진 이슈 / 주의사항

1. **분류 체계 변경 시 모든 파일 일관 반영 필수.** 과거 STEEP→3축 전환 때 db.py를 빠뜨려 KeyError로 Actions가 실패한 적 있음. config·core·mailer·db를 항상 함께 확인할 것.
2. **기존 누적 기사엔 새 필드가 없음.** application/material/companies/lang/score는 새로 수집되는 기사부터 채워짐.
3. **영어 뉴스 번역 미구현.** 구글 영어 뉴스는 원문 그대로 표시. Top 10 영어 기사 한국어 번역은 AI 붙일 때 할 예정.
4. **저점 노이즈 필터링 한계(48%).** AI 재선별로 개선 예정.
5. **접속 게이트가 진짜 인증이 아님.** [REDACTED] 키는 우회 가능. Supabase 인증으로 교체 예정.
6. **차단 매체**: config blocked_sources에 매일노동뉴스, labortoday 등록됨.

---

## 로드맵 (다음 할 일, 사용자가 확정한 순서)

규칙 기반 뼈대는 완성 상태. 다음은 AI·백엔드를 얹는 단계. 사용자 합의 순서:

1. **서비스 DB·AI 선별 구조** ← 토대. 원본 뉴스와 AI 선별 결과·피드백·규칙 버전을 Supabase에 저장한다.
2. **Supabase 인증** — 회사 이메일(여러 도메인) 매직링크 로그인. 공유 키 게이트는 마지막에 대체한다.
   - 진행하던 결정: 매직링크 + 여러 도메인 허용. Supabase 프로젝트 생성 안내까지 갔고 사용자가 일시 중단.
3. **UI 단순화**
4. **좋아요/싫어요** (Supabase 저장) → 피드백 수집
5. **AI 2차 선별** — 규칙 1차 후 후보만 AI 재선별. 피드백으로 규칙 버전 업데이트.
   - AI는 가장 저렴한 모델로 결정 예정(GPT mini급 vs Claude Haiku급). API 키 아직 없음(발급 필요).
6. **이메일 발송** — 원하면 1회 뉴스 메일 (mailer.py 뼈대 있음)
7. **분석실 AI 인사이트** — office.html 샘플을 진짜 AI로. 권역/application 담당 에이전트가 주 1회 인사이트 도출, 팀장이 웹 검색으로 크리틱.

### AI 선별 흐름
원본 JSON은 수집·백업용으로 유지하고, 서비스 화면은 아래 순서의 결과를 사용한다.

```
수집 → 중복·노이즈 제거 → 규칙 기반 후보 30~50건
     → AI TOP 10 선별 → daily_top_news 저장
     → 사용자 좋아요/싫어요 → rule_versions 갱신
```

AI 호출은 새 기사·내용 변경 기사에만 수행하고, 이미 평가한 기사는 `ai_rankings` 캐시를 재사용한다. 초기 AI 후보 선별 모델은 비용 절감을 위해 `gpt-4o-mini`를 사용한다. 실행량과 토큰은 `ai_runs`에 기록해 비용을 추적한다.

**커스텀 회사 필터**: 사용자가 직접 회사 추가/삭제 + 백엔드 저장은 1번(Supabase) 완료 후. 현재는 config의 32개 회사 고정.

---

## 로컬 실행 (개발용)

```bash
pip install -r requirements.txt
export NAVER_CLIENT_ID=...
export NAVER_CLIENT_SECRET=...
python collector/run.py
python -m http.server 8000   # http://localhost:8000/index.html
```

config.yaml 하나만 수정하면 키워드·분류·점수·회사 목록 조정 가능. 코드 수정 불필요.

