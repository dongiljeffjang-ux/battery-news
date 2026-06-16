# 🔋 배터리 시장 뉴스 파이프라인

전기차·ESS 등 배터리 시장 뉴스를 **매일 자동 수집 → STEEP 분류 → 요약 →
이메일 발송 → DB 누적 → 인증 웹 대시보드** 까지 처리하는 무료 스택 프로젝트.

## 전체 구조

```
            ┌─────────────── GitHub Actions (매일 cron) ───────────────┐
            │  네이버/구글 뉴스 수집 → 중복제거 → STEEP 분류 → 요약     │
            │            ↓                                ↓             │
            │   data/news.json 커밋(DB 누적)        Gmail 다이제스트 발송 │
            └──────────────────────────┬──────────────────────────────┘
                                       │ raw.githubusercontent.com
                                       ▼
          ┌──────────────── Vercel (서버리스) ────────────────┐
          │  /          로그인 (공유 비번 + 서명 쿠키)         │
          │  /dashboard 인증된 사용자만 · STEEP 게이지 + 목록  │
          │  /api/news  인증 후 news.json 반환                 │
          └───────────────────────────────────────────────────┘
```

> 역할 분리 이유: Vercel은 서버리스라 상태를 못 들고 있습니다.
> 그래서 **데이터 생성·누적·발송은 GitHub Actions**, **읽기 전용 열람은 Vercel**이 맡습니다.
> DB는 레포의 `data/news.json` 으로 클라우드에 누적·버전관리됩니다.

```
battery-news/
├─ config.yaml              ← 운영자 설정 (키워드/STEEP사전/수신자)
├─ requirements.txt
├─ collector/               ← 수집 파이프라인 (Python)
│  ├─ core.py               수집·중복제거·STEEP분류·요약
│  ├─ db.py                 JSON DB + MD 아카이브 누적
│  ├─ mailer.py             STEEP별 HTML 메일 + Gmail SMTP
│  └─ run.py                진입점
├─ data/                    ← 누적 결과 (자동 생성·커밋)
│  ├─ news.json             웹이 읽는 메인 DB
│  └─ news.md               사람이 보는 백업 아카이브
├─ web/                     ← Vercel 대시보드
│  ├─ vercel.json
│  ├─ api/{login,logout,news,dashboard,_auth}.js, _dashboard.html
│  └─ public/index.html     로그인 페이지
└─ .github/workflows/daily.yml
```

---

## 1단계 · 수집기 배포 (GitHub)

1. 이 폴더를 GitHub 레포로 푸시.
2. **Settings → Secrets and variables → Actions** 에 등록:
   | Secret | 용도 | 필수 |
   |---|---|---|
   | `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | 네이버 검색 API | 선택(없으면 구글만) |
   | `GMAIL_USER` | 발송 Gmail 주소 | 메일 쓸 때 |
   | `GMAIL_APP_PASSWORD` | Gmail **앱 비밀번호** (2단계 인증 후 발급) | 메일 쓸 때 |
   | `MAIL_TO` | 수신자, 쉼표구분 (config 대신) | 선택 |
3. `config.yaml`의 `keywords`·`recipients`·`steep`를 운영 목적에 맞게 수정.
4. **Actions 탭 → daily-news → Run workflow** 로 즉시 테스트.
   - 실행 시각은 `.github/workflows/daily.yml`의 `cron`에서 변경 (UTC 기준).
   - 현재 설정: `0 23 * * *` = KST 매일 오전 8시.

### 네이버 API 키 발급
developers.naver.com → 애플리케이션 등록 → "검색" API 추가 → Client ID/Secret.

### Gmail 앱 비밀번호
Google 계정 → 보안 → 2단계 인증 켜기 → 앱 비밀번호 생성 → 16자리 사용.

---

## 2단계 · 웹 대시보드 배포 (Vercel)

1. vercel.com → New Project → 같은 레포 임포트 → **Root Directory를 `web`로 지정**.
2. **Environment Variables** 등록:
   | 변수 | 설명 |
   |---|---|
   | `SITE_PASSWORD` | 사용자에게 알려줄 접속 비밀번호 |
   | `AUTH_SECRET` | 쿠키 서명용 무작위 문자열 (32자+ 권장) |
   | `GITHUB_REPO` | `youruser/battery-news` |
   | `GITHUB_BRANCH` | `main` (기본값) |
   | `GITHUB_TOKEN` | **private 레포일 때만** (repo read 권한 PAT) |
3. 배포 후 도메인 접속 → 비밀번호 입력 → 대시보드.

### 권한 관리 방식
- 단일 공유 비밀번호 + HMAC 서명 쿠키(7일 유효, HttpOnly·Secure).
- 비밀번호를 아는 사람만 접속. 비번 교체는 Vercel의 `SITE_PASSWORD` 변경으로 즉시.
- 데이터 API(`/api/news`)와 대시보드 페이지(`/dashboard`) 모두 인증을 통과해야만 응답.

---

## STEEP 분류 / 요약 방식 (규칙기반)

- 분류: 기사 제목+요약에 `config.yaml > steep` 사전의 단어가 가장 많이 매칭된
  카테고리로 지정. 어디에도 안 걸리면 `Uncategorized`.
- 요약: 원문 설명의 앞 N문장 추출(기본 2문장, 180자).
- **한계**: 단순 키워드 매칭이라 모호한 기사는 오분류될 수 있습니다.
  사전 단어를 늘리면 정확도가 올라갑니다. 추후 LLM 요약/분류로 교체 가능
  (`core.py`의 `make_summary` / `classify_steep` 만 바꾸면 됨).

## 로컬 테스트
```bash
pip install -r requirements.txt
export GMAIL_USER=... GMAIL_APP_PASSWORD=...   # 선택
python collector/run.py
# 결과: data/news.json, data/news.md 생성
```
