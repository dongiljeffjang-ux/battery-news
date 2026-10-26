# 바이브코딩(VibeCoding) VS Code + Continue 규약 배포 패키지

> **사내 시민 개발자를 위한 VS Code + Continue + PGPT 코딩 규약 자동 설치 패키지**
>
> 이 패키지는 Futurem FastAPI 개발의 핵심 규칙을 현재 프로젝트 폴더의 Continue rules로 설치하고, 긴 절차형 문서는 프로젝트 안의 `docs/`에서 함께 참조합니다.

---

## 이 패키지가 하는 일

VS Code의 Continue 확장 프로그램이 사내 표준 아키텍처와 보안 규약을 따르도록 최소 `.md` 규칙 파일을 현재 프로젝트 폴더의 `.continue/rules/` 위치에 복사합니다. 작업 절차, 체크리스트, 긴 참고자료는 프로젝트 안의 `docs/` 폴더를 참조합니다.

| 구분 | 설치 위치 | 효과 |
|------|----------|------|
| Continue rules | `.continue\rules\` | 이 프로젝트를 VS Code로 열었을 때 사내 개발 규약 적용 |
| Futurem guides | `docs\` | 긴 절차서, 체크리스트, 참고자료 확인 |

---

## 사전 요건

- Windows PC
- VS Code 설치
- Continue 확장 프로그램 설치
- Continue에서 사내 PGPT 모델 연동 완료

이 패키지는 현재 프로젝트에 Continue 규칙 파일을 설치합니다. 사내 PGPT 모델 연결 설정은 플랫폼팀 안내에 따라 먼저 완료되어 있어야 합니다.

---

## 설치 방법

### Step 1. 압축 해제

받은 zip 파일을 개발할 프로젝트 폴더에 압축 해제합니다.

예:

```powershell
C:\Users\홍길동\Projects\my-fastapi-app\
```

### Step 2. install.bat 실행

`install.bat` 파일을 더블클릭합니다.

처음 실행 시 보안 경고가 나타나면 "실행" 또는 "예"를 선택합니다.

PowerShell에서 실행할 수도 있습니다.

```powershell
cd C:\Users\홍길동\Projects\my-fastapi-app
.\install.bat
```

### Step 3. 적용 확인

이 프로젝트 폴더를 VS Code로 열거나 재시작한 뒤 Continue 채팅에서 아래처럼 질문합니다.

```text
현재 프로젝트의 코딩 규약을 알고 있어?
```

정상 적용되면 Continue가 사내 PGPT 응답에서 다음처럼 안내해야 합니다.

```text
네, 알고 있습니다.
이 규약은 퓨처엠에서 VS Code + Continue + 사내 PGPT로 AI를 활용해 개발하는 현업 개발자를 위한 코딩 규약입니다.

주요 기준은 순수 HTML/CSS/JavaScript, Python 3.14 + FastAPI, router → service → repository 구조, adapters 기반 외부 연동, 시크릿 하드코딩 금지, 자동배포 SR 절차입니다.

어떤 프로젝트를 개발 시작하실 건가요?
앱 목적, 주요 사용자, 데이터 저장 필요 여부, SSO/권한관리 필요 여부를 알려주세요.
```

응답에는 다음 핵심 내용이 포함되어야 합니다.

- `router → service → repository` 레이어 구조
- `print()` 금지 및 logger 사용
- Pydantic 입력 검증
- LLM 직접 호출 금지 및 `llm_gateway.complete()` 사용
- 프론트엔드는 순수 HTML/CSS/JavaScript 사용
- 신규 기능, SSO, 권한관리, 배포, UI/UX 작업별 가이드

---

## 설치 후 폴더 구조

```text
내_개발프로젝트\.continue\rules\
  ├── vibe-coding-standards.md          (전체 공통 규칙)
  ├── futurem-adapters.md               (adapters/ 작업 시 상세 규약 참조)
  ├── futurem-repositories.md           (repositories/ 작업 시 상세 규약 참조)
  ├── futurem-routers.md                (routers/ 작업 시 상세 규약 참조)
  └── futurem-services.md               (services/ 작업 시 상세 규약 참조)

내_개발프로젝트\docs\
  ├── guides\
  │   ├── futurem-fastapi-workflow.md
  │   ├── futurem-databridge-rest.md
  │   ├── futurem-databridge-mcp.md
  │   ├── futurem-sso.md
  │   ├── futurem-role-management.md
  │   ├── futurem-smtp.md
  │   ├── futurem-sms.md
  │   ├── futurem-deploy.md
  │   └── futurem-uxui-guide.md
  └── references\
      ├── futurem-adapters.md
      ├── futurem-routers.md
      ├── futurem-services.md
      ├── futurem-repositories.md
      ├── futurem-role-model.md
      ├── futurem-sso-auth-guide-ko.md
      └── futurem-sso-guide.md
```

---

## 규약 파일 역할

| 파일 | 역할 |
|------|------|
| `vibe-coding-standards.md` | 모든 작업에 적용할 공통 보안, 아키텍처, 기술 스택 규칙 |
| `futurem-adapters.md` | `adapters/` 작업 시 상세 규약 위치 안내 |
| `futurem-repositories.md` | `repositories/` 작업 시 상세 규약 위치 안내 |
| `futurem-routers.md` | `routers/` 작업 시 상세 규약 위치 안내 |
| `futurem-services.md` | `services/` 작업 시 상세 규약 위치 안내 |

상세 가이드 문서는 Continue가 자동으로 항상 읽는 규칙이 아니라, 작업 중 필요한 경우 현재 프로젝트의 `docs/`에서 참고하거나 Continue 채팅에 첨부할 수 있는 보조 자료입니다. rules 폴더는 공통 규칙과 레이어별 포인터만 남겨 가볍게 유지합니다.

---

## 개발 표준 요약

- 표준 도구: VS Code + Continue + 사내 PGPT
- 백엔드: Python 3.14 + FastAPI
- 프론트엔드: 순수 HTML5 + CSS + JavaScript
- 통신: fetch + JSON
- 레이어: `router → service → repository`
- 외부 연동: `adapters/` 경유
- LLM: `adapters/llm_gateway.complete(output_model=Model)` 경유
- 프롬프트: `.futurem-prompts/{업무영역}/{작업}.yaml`
- 입력 검증: Pydantic 모델 필수
- 로깅: 제공 logger 사용, `print()` 금지
- 보안: 시크릿 하드코딩 금지, 개인정보 로그 금지
- 자동 배포: 전산운영팀 SR 선행, SR 구분 `사무자동화 - 전사 AI 챌린지`
- 배포 방식: 전산운영팀이 안내한 GitLab 저장소에 앱 코드를 커밋/푸시하면 사전 구성된 GitLab CI/CD가 자동 배포

---

## 지원

설치 관련 문의는 AI 바이브코딩 지원 담당자에게 연락하세요.

---

*패키지 버전: v1.0-continue-pgpt-futurem | 최종 업데이트: 2026-08-27*

