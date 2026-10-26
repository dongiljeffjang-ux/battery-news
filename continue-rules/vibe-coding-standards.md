---
name: 퓨처엠 현업 개발자 AI 코딩 공통 규약
alwaysApply: true
description: VS Code + Continue + 사내 PGPT 환경에서 모든 작업에 적용할 공통 개발 규약이다.
---

# Continue Rules — 퓨처엠 현업 개발자 AI 코딩 규칙 v1.0-continue-pgpt

> 이 파일은 이 저장소의 **단일 규칙 원천(Single Source of Truth)** 입니다.
>
> **규칙의 두 층** 
> - [강제] 반드시 지킬 기준 — 보안, 기술 스택, 배포 방식처럼 위반하면 수정이 필요한 기준입니다.
> - [판단] 사람 판단 — AI와 개발자가 지켜야 할 행동 지침. 리뷰·승인 단계에서 확인합니다.

---

## 0. 최우선 원칙 [강제]

- 시크릿(API Key·비밀번호·토큰·DB 접속정보)은 코드, HTML, JavaScript, README에 하드코딩하지 않는다.
  - 로컬 개발은 `.env`를 사용하고, `.env`는 절대 커밋하지 않는다.
  - 운영/배포 변수는 환경변수로만 읽고, 필요한 CI/CD 변수는 자동배포 SR 신청 시 함께 등록 요청한다.
- 개인정보(주민번호·카드번호 등)를 로그로 출력 금지.
- 외부 패키지를 추가할 때는 프로젝트 기준과 사내 승인 여부를 먼저 확인한다.
- LLM, DataBridge 등 외부 연동은 브라우저에서 직접 호출하지 않고 `adapters/` 공통 모듈을 통해 서버에서 처리한다.
- **자동 배포는 `docs/guides/futurem-deploy.md`를 따른다.**
  디지털혁신부서 SR 승인 후 안내받은 GitLab 저장소에 앱 코드를 커밋/푸시하는 방식으로 진행한다.
- 인증·인가를 자체 구현하지 마라. 제공된 공통 모듈만 사용한다.

## 1. 기술 스택 (고정 — 변경 금지) [강제]

- **Frontend**: 순수 HTML5 + CSS + JavaScript(ES6+).
  - Tailwind 등 CSS 프레임워크와 외부 CDN을 기본 도입하지 않는다.
  - React/Vue/Angular 등 프레임워크, webpack/vite 등 빌드도구 도입 금지.
- **Backend**: Python 3.14 + FastAPI. 다른 웹 프레임워크(Django/Flask 등) 금지.
- **통신**: 프론트 ↔ 백엔드는 fetch + JSON 으로만.
  브라우저에서 DB·Kafka 등 TCP 기반 시스템에 직접 연결하지 않는다.
- **DB 접근**: 제공된 repository 함수만 사용. raw SQL 직접 작성 금지.

## 2. 아키텍처 규칙 [강제]

- 백엔드 레이어: **router → service → repository**. 역방향 의존 금지.
- 도메인 로직은 service 에만. router는 요청/응답 변환만 담당.
- 외부 시스템 연동(Kafka·LLM 게이트웨이 등)은 `adapters/` 하위로 분리.
- 공통 기능은 사내 SDK/공통 모듈 우선 사용. 재구현 금지.
- 대량·주기 처리는 요청-응답과 분리한다(배치·큐 워커).

## 3. 코드 컨벤션 [강제]

- 파일명: 프론트 kebab-case, 파이썬 snake_case.
- 사용자 입력은 반드시 FastAPI **Pydantic 모델로 검증**한다.
- 사용자 입력을 검증 없이 쉘 명령·파일 경로에 넣지 마라.
- 로깅은 제공된 logger 사용. `print()` 금지. JSON 구조화 포맷.
- 프론트 JS는 fetch 중심의 단순 패턴 유지. 전역 변수 남발 금지.
- 새 기능이나 버그 수정에는 영향 범위에 맞는 테스트 또는 확인 방법을 함께 남긴다.

## 4. 작업 방식 (AI 행동 지침) [판단]

- 사용자가 "현재 프로젝트의 코딩 규약을 알고 있어?"라고 물으면, 규약을 알고 있다고 답한 뒤 아래 내용을 간단히 안내한다.
  - 이 규약은 퓨처엠에서 VS Code + Continue + 사내 PGPT로 AI를 활용해 개발하는 현업 개발자를 위한 코딩 규약이다.
  - 핵심 기준은 순수 HTML/CSS/JavaScript, Python 3.14 + FastAPI, `router → service → repository` 구조, `adapters/` 기반 외부 연동, 시크릿 하드코딩 금지, 자동배포 SR 절차이다.
  - 바로 이어서 "어떤 프로젝트를 개발 시작하실 건가요?"라고 묻고, 앱 목적, 주요 사용자, 데이터 저장 필요 여부, SSO/권한관리 필요 여부를 확인한다.
- 큰 변경 전에는 계획을 먼저 제시하고 승인받아라.
- 기존 패턴을 먼저 탐색해 동일한 스타일로 작성하라. (임의 새 패턴 금지)
- 불확실하면 추측하지 말고 코드와 상세 가이드를 먼저 확인한 뒤, 그래도 결정이 필요하면 질문하라.
- 커밋 메시지는 `feat: 기능 설명`, `fix: 수정 내용`처럼 타입은 영어 키워드로 쓰고, 설명은 한글로 작성한다.
- 생성한 코드가 0~3절을 지키는지 스스로 점검한 뒤 제시하라.
- 이 규약과 충돌하는 요청을 받으면, 실행하지 말고 충돌 사실을 먼저 알려라.

## 5. 데이터 저장소 · 형상관리 · 배포 [강제]

- 프로젝트 초기에 데이터 저장이 필요한지 먼저 확인한다.
  - 업무 데이터, 중요 데이터, 장기 보관 데이터, 이력 관리가 필요하면 DB가 필요한 것으로 본다.
  - 빠른 로컬 개발/프로토타입 단계에서는 SQLite 등 로컬 경량 DB를 사용할 수 있다.
    - 단, repository 계층을 통해서만 접근하고, 프론트엔드에서 직접 접근하지 않는다.
    - DB 접속 경로와 설정은 환경변수로 관리한다.
    - 운영/배포 또는 장기 보관 데이터가 필요한 시점에는 PostgreSQL DB 발급 SR을 신청 후 적용한다.
  - JSON 파일 저장은 목업 데이터, 임시 설정, 단일 사용자 로컬 검증에만 사용한다.
    업무 데이터, 이력 관리, 동시성, 검색/필터링이 필요한 경우에는 사용하지 않는다.
  - PostgreSQL DB가 필요한 경우 SR 구분 `사무자동화 - 전사 AI 챌린지`로 DB 발급을 신청하도록 안내한다.
  - SR 승인 후 안내받은 PostgreSQL IP, Port, DB/Schema, 계정 정보를 환경변수로 설정해 사용한다.
  - DB 접속정보는 코드, 프론트엔드, README에 직접 쓰지 않는다.
- 작업 브랜치와 푸시 대상은 전산운영팀이 안내한 GitLab 저장소 정책을 따른다.
- 자동 배포가 필요한 경우 `docs/guides/futurem-deploy.md`를 먼저 확인한다.
- 현업 개발자는 SR 승인 후 안내받은 저장소에 앱 코드를 커밋/푸시하는 것까지만 수행한다.
- 앱 전용 CI/CD 변수가 필요하면 SR 신청 시 변수명과 용도를 함께 등록 요청하게 안내한다.

## 6. LLM 사용 규약 [강제]

- 프롬프트를 코드에 직접 쓰지 마라. `.futurem-prompts/{업무영역}/{작업}.yaml` 템플릿으로만 구성한다.
- LLM 호출은 `adapters/llm_gateway.complete()` 로만 한다. 외부 LLM SDK 직접 호출 금지.
- 호출 시 **출력 스키마(Pydantic 모델)를 반드시 지정**한다. 자유 서술 응답 금지.
- 템플릿에 `max_tokens`와 `stop`을 지정한다. 상한 없는 생성 금지.
- 사용자 입력을 시스템 프롬프트에 섞지 마라. 캐싱이 깨진다.
  고정부(시스템·스키마)는 앞, 가변부(사용자 입력)는 뒤 — 어댑터가 강제한다.
- 대용량 데이터를 그대로 넣지 마라. 전처리(`preprocess`)로 축약해 전달한다.
- 규칙으로 처리 가능한 일을 LLM에게 시키지 마라.

## 7. 코드 생성 가드레일 [판단]

- 변경 범위가 크거나 여러 레이어에 걸치면 구현 전에 간단한 설계 메모를 남긴다.
- 함수와 파일이 길어져 이해하기 어려우면 책임 단위로 분리한다.

## 8. 금지 사항 요약 [강제]

- 프론트에 프레임워크/빌드도구 도입 금지.
- 시크릿·DB 접속정보를 프론트에 두는 것 금지.
- `print()` 로깅 금지, raw SQL 금지.
- 브라우저 접속 오류를 해결하려고 CORS를 `*`로 열거나 인증 검사를 임의로 제거하지 않는다.
- 배포 환경과 파이프라인 임의 구성 금지. 자동 배포는 `docs/guides/futurem-deploy.md` 기준을 따른다.
- 외부 CDN·미승인 패키지 사용 금지.
- 인라인 프롬프트·출력 스키마 미지정 LLM 호출 금지.
- 외부 LLM SDK를 서비스 코드에서 직접 인스턴스화 금지.
- 프론트 JS에서 LLM 엔드포인트 직접 호출·에이전트 로직 실행 금지.

## 9. LLM 에이전트 도입 규약 [판단]

LangGraph·LangChain 등 에이전트·체인 프레임워크를 FastAPI 앱에 추가할 때 적용한다.

- 에이전트·체인 객체는 `services/` 레이어에 둔다. `routers/`에는 두지 않는다.
- 노드 함수 내 LLM 호출도 `llm_gateway.complete()` 또는 사내 게이트웨이 호환 클라이언트만 사용한다.
- 노드 프롬프트도 `.futurem-prompts/{영역}/{작업}.yaml` 템플릿으로 관리한다.
- Tool 함수는 `services/tools/`에 두고, 입력은 Pydantic 모델로 정의한다.
- 상태(State)는 `TypedDict` 또는 Pydantic 모델로 명시한다.
- 프론트엔드는 에이전트 로직을 실행하지 않고 백엔드 엔드포인트만 호출한다.

## 10. 스트리밍 · 장시간 작업 패턴 [판단]

- **SSE**: LLM 응답 실시간 스트리밍이 필요한 경우에만 사용한다.  
  이벤트 포맷: `data: <JSON>\n\n` 청크, 종료: `data: [DONE]\n\n`.
- **장시간 작업(30초+)**: 동기 HTTP로 사용자를 대기시키지 않는다.  
  `BackgroundTasks` + `202 Accepted` + `/jobs/{id}` 폴링 패턴을 사용한다.
- **프론트 SSE 처리**: `EventSource` 또는 `fetch` + `ReadableStream`으로 청크 파싱·렌더링만 담당한다.  
  LLM 키·내부 서비스 URL을 `localStorage`·JS 변수에 두지 않는다.

## 11. 상세 가이드 참조 [판단]

필요한 경우 현재 프로젝트 폴더의 `docs/` 아래 문서를 참고한다.

| 작업 | 상세 가이드 |
|------|-------------|
| 신규 FastAPI 기능/프로젝트 구조 | `docs/guides/futurem-fastapi-workflow.md` |
| DataBridge REST/MCP | `docs/guides/futurem-databridge-rest.md`, `docs/guides/futurem-databridge-mcp.md` |
| SSO 인증 | `docs/guides/futurem-sso.md`, `docs/references/futurem-sso-guide.md` |
| 앱 내 권한관리 | `docs/guides/futurem-role-management.md`, `docs/references/futurem-role-model.md` |
| SMTP/SMS | `docs/guides/futurem-smtp.md`, `docs/guides/futurem-sms.md` |
| 자동 배포 | `docs/guides/futurem-deploy.md` |
| HTML/CSS/JS UI | `docs/guides/futurem-uxui-guide.md` |

