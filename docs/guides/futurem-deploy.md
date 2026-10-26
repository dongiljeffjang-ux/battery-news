---
name: Futurem 자동 배포 이용 규약
alwaysApply: false
description: Futurem 사내 GitLab 저장소, 전산운영팀 SR, NodePort, 커밋/푸시 기반 자동 배포 요청에 적용한다.
---

# Futurem 자동 배포 이용 규약

Futurem 자동 배포는 전산운영팀이 준비한 GitLab 저장소와 CI/CD 파이프라인을 사용하는 방식이다. 현업 개발자는 SR 승인 후 안내받은 GitLab 저장소에 애플리케이션 코드를 커밋하고 푸시하는 것까지만 수행한다.

AI는 자동 배포 요청을 받더라도 파이프라인, 쿠버네티스, 서버 접속 절차를 새로 만들지 않는다. 전산운영팀이 제공한 기준을 확인하고, 커밋/푸시에 필요한 애플리케이션 코드와 안내만 정리한다.

## 단일 기준

- 배포 기준 문서는 Futurem 사내 `자동_배포_가이드_AI지시서`를 따른다.
- 외부 클라우드 배포, 별도 파이프라인 작성, 서버 직접 접속 배포, 수동 인계 방식은 사용하지 않는다.
- GitLab CI/CD를 포함한 배포 환경과 NodePort 접속 기준은 전산운영팀이 준비한 것으로 본다.
- 현업 개발자는 전산운영팀에서 안내받은 저장소에 소스코드를 커밋하고 푸시한다.
- 푸시 이후 빌드, 이미지 생성, 배포, 서비스 반영은 GitLab CI/CD 자동 파이프라인이 처리한다.

## SR 선행 조건

개발자가 자동 배포를 사용하려면 먼저 전산운영팀으로 SR을 신청해야 한다.

| 항목 | 값 |
|------|----|
| SR 구분 | `사무자동화 - 전사 AI 챌린지` |
| 요청 내용 | GitLab 저장소, GitLab 계정, 사용할 NodePort 발급 등 자동 배포 파이프라인 요청 |
| 승인 후 안내받는 값 | GitLab 계정, 저장소 URL, NodePort, 접속 URL 또는 접속 기준 |

SR 승인이 완료되지 않았거나 GitLab 저장소 URL, 계정, NodePort를 안내받지 못했다면 배포 작업을 진행하지 않는다. 필요한 선행 항목을 먼저 안내한다.

프로젝트 실행에 필요한 앱 전용 CI/CD 변수가 있으면 SR 신청 시 함께 등록 요청하도록 안내한다.

예:

```text
AI_GW_TOKEN
DATABRIDGE_API_KEY
MAIL_USERNAME
MAIL_PASSWORD
SMS_DEFAULT_CALLBACK
DATABASE_URL
SSO_VALIDATE_URL
```

값 자체를 AI 채팅, 코드, README, YAML, Git 커밋에 적지 않는다. 변수명, 용도, 필요한 사유만 정리해서 전산운영팀에 전달하도록 안내한다.

## 구현 전 확인

자동 배포 관련 요청을 받으면 먼저 아래 값을 확인한다.

```text
자동 배포 이용을 위해 SR 승인 정보를 확인하겠습니다.
- GitLab 계정:
- 저장소 URL:
- 부여받은 NodePort:
- 전산운영팀이 안내한 푸시 대상 브랜치:
- 앱 실행에 필요한 추가 CI/CD 변수명:
```

코드베이스에서는 다음을 확인한다.

- 현재 프로젝트의 실행 방식
- 앱 시작 파일과 실행 명령
- 앱 내부 포트
- 필요한 환경변수
- 커밋 제외 대상: `.env`, 토큰, 인증서, 개인키, 로컬 DB, 캐시, 빌드 산출물

## AI가 해야 할 일

- 제공한 GitLab 저장소 URL을 기준으로 Git remote 설정을 도와준다.
- 현재 프로젝트가 커밋 가능한 상태인지 확인한다.
- `.gitignore`에 민감정보와 로컬 산출물이 제외되어 있는지 확인한다.
- 앱 코드, 정적 파일, 의존성 명세 등 개발자가 만든 소스만 커밋 대상으로 정리한다.
- 전산운영팀이 안내한 브랜치로 커밋/푸시할 수 있게 명령을 안내하거나 수행한다.
- 푸시 후 GitLab에서 Pipeline 실행 여부와 NodePort 접속 URL 확인 방법을 안내한다.

## AI가 하지 말아야 할 일

인프라, 파이프라인, 배포 설정 파일은 전산운영팀 관리 영역으로 본다. 명시적인 별도 요청과 제공된 공식 템플릿 없이 생성하거나 수정하지 않는다.

```text
.gitlab-ci.yml
deploy/
infra/
```

금지 사항:

- 외부 클라우드 배포 가이드 작성
- 별도 배포 파이프라인 작성
- 배포 산출물 패키지 또는 서버 업로드용 압축 파일 생성
- 서버 직접 접속 기반 배포 절차 안내
- 서버 직접 기동 절차 안내
- 클러스터 명령으로 직접 배포하도록 안내
- NodePort 임의 지정
- `KUBECONFIG_CONTENT`, Registry 비밀번호, API Key 원문을 코드나 문서에 작성
- 사용자가 준 토큰을 Git remote URL에 저장
- force push

## Git 작업 규칙

- 먼저 `git status --short`, `git remote -v`, `git branch --show-current`를 확인한다.
- 현재 폴더가 Git 저장소가 아니면 `git init` 여부를 사용자에게 확인하고, 전산운영팀이 안내한 저장소 URL을 remote로 설정한다.
- 기존 remote가 다르면 바로 덮어쓰지 말고 사용자에게 현재 remote와 안내받은 URL이 다르다고 알린다.
- 커밋 전 `.env`, 토큰 파일, 인증서, 개인키, kubeconfig, 로컬 DB, 대용량 임시 파일이 포함되지 않았는지 확인한다.
- 푸시 대상 브랜치는 전산운영팀이 안내한 브랜치를 따른다. 안내가 없으면 먼저 확인한다.
- 브랜치 보호 정책, 권한 부족, 인증 실패로 push가 막히면 에러를 요약하고 전산운영팀 또는 GitLab 권한 확인이 필요하다고 안내한다.

## 배포 후 확인

현업 개발자가 직접 확인할 수 있는 범위만 안내한다.

- GitLab 저장소에서 커밋이 반영됐는지 확인
- GitLab `CI/CD > Pipelines`에서 파이프라인이 시작됐는지 확인
- 파이프라인 성공 후 전산운영팀이 안내한 NodePort 접속 URL로 접속 확인
- 접속 실패 시 Pipeline 상태, 최근 커밋, 안내받은 NodePort, 앱 로그 확인 가능 여부를 전산운영팀에 전달

배포 클러스터, Runner, Registry, kubeconfig, 서비스 리소스 문제는 전산운영팀 관리 영역으로 안내한다.

## 오류 대응

| 증상 | 안내 |
|------|------|
| SR 승인 전 배포 요청 | SR 구분 `사무자동화 - 전사 AI 챌린지`로 먼저 신청하도록 안내 |
| 저장소 URL 없음 | 전산운영팀에서 GitLab 저장소 URL을 받은 뒤 진행 |
| NodePort 없음 | 전산운영팀에서 NodePort를 받은 뒤 접속 URL 확인 |
| Push 인증 실패 | GitLab 계정, 권한, 인증 방식 확인 |
| Push는 됐지만 Pipeline 미실행 | 전산운영팀에 저장소 CI/CD 설정 확인 요청 |
| Pipeline 실패 | 실패 로그의 앱 오류만 확인하고, 파이프라인/배포 설정 문제는 전산운영팀에 전달 |
| 접속 불가 | NodePort, Pipeline 성공 여부, 최근 커밋 SHA를 정리해 전산운영팀에 문의 |
| 앱에서 API Key/DB 접속 오류 | 앱 전용 CI/CD 변수 등록 여부 확인 |

## 완료 보고

자동 배포 관련 작업 후에는 아래만 보고한다.

- 사용한 GitLab 저장소 URL
- 푸시한 브랜치
- 커밋 SHA
- 앱 전용 CI/CD 변수 등록 필요 여부
- Pipeline 확인 위치
- NodePort 접속 URL 또는 전산운영팀 안내 필요 항목

## 참고문서

- Futurem AI 개발가이드 - 자동 배포 가이드 AI지시서: https://gitlab.poscofuturem.com:8443/root/ai-dev-guide/-/blob/main/%EC%9E%90%EB%8F%99_%EB%B0%B0%ED%8F%AC_%EA%B0%80%EC%9D%B4%EB%93%9C_AI%EC%A7%80%EC%8B%9C%EC%84%9C.MD?ref_type=heads
