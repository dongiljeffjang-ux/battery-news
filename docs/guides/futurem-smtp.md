---
name: Futurem SMTP 메일 발송 규약
alwaysApply: false
description: SMTP 메일 발송, MAIL_* 환경변수, STARTTLS/SSL, HTML 메일, MailHog 테스트 구현 요청에 적용한다.
---

# Futurem SMTP 메일 발송 규약

메일 발송은 서버 측에서만 수행한다. SMTP 서버, 계정, 발신자 주소, TLS/SSL 설정은 모두 환경변수로 관리한다.

## 구현 전 확인

- 현재 프로젝트의 언어/프레임워크, 설정 로딩 방식, 디렉터리 구조를 먼저 파악한다.
- 기존 메일 라이브러리가 있으면 우선 사용하고, 없으면 Python은 stdlib `smtplib` 패턴을 사용한다.
- 구현 후 `.env.example`과 로컬 테스트 방법을 함께 제공한다.

## 표준 설정

| 환경변수 | 용도 |
|----------|------|
| `MAIL_HOST` | SMTP 서버 호스트 |
| `MAIL_PORT` | SMTP 포트 |
| `MAIL_USERNAME` | SMTP 사용자 |
| `MAIL_PASSWORD` | SMTP 비밀번호 |
| `MAIL_DEFAULT_SENDER` | 기본 발신자 |
| `MAIL_USE_TLS` | STARTTLS 사용 여부 |
| `MAIL_USE_SSL` | SSL 직접 연결 여부 |
| `MAIL_SSL_VERIFY` | TLS 인증서 검증 여부 |
| `MAIL_TIMEOUT_SECONDS` | timeout |

## 구현 규칙

- 465 포트는 `SMTP_SSL`, 587 포트는 `SMTP + STARTTLS`를 사용한다.
- `MAIL_USE_TLS`와 `MAIL_USE_SSL`을 동시에 true로 설정하지 않는다.
- STARTTLS는 `EHLO → STARTTLS → EHLO` 순서를 지킨다.
- FastAPI 같은 async 프레임워크에서 `smtplib` 직접 호출은 스레드 풀로 위임한다.
- HTML 메일은 Outlook 호환성을 고려해 인라인 스타일을 우선한다.
- 운영 전에 앱 서버에서 SMTP 서버 포트로 outbound 방화벽이 열려 있는지 확인한다.
- 로컬 테스트는 MailHog 또는 Python 디버깅 SMTP 서버를 사용한다.

## 금지

| 금지 | 대안 |
|------|------|
| SMTP 설정값 하드코딩 | `MAIL_*` 환경변수 |
| `MAIL_USE_TLS=true`와 `MAIL_USE_SSL=true` 동시 설정 | 둘 중 하나만 true |
| async 함수에서 `smtplib` 직접 호출 | 스레드 풀 위임 |
| SSL 검증 무조건 비활성화 | `MAIL_SSL_VERIFY`로 제어 |
| 발신자 주소 하드코딩 | `MAIL_DEFAULT_SENDER` |
| 메일 본문에 민감정보 포함 | 필요한 최소 정보만 포함 |

## 완료 보고

구현 후 설정값 목록, 테스트 방법, 운영 방화벽/발신 도메인 확인 필요 여부를 보고한다.



## 참고문서

- Futurem AI 개발가이드 - SMTP_메일_발송_구현_가이드_AI지시서.md: https://gitlab.poscofuturem.com:8443/root/ai-dev-guide/-/blob/main/SMTP_%EB%A9%94%EC%9D%BC_%EB%B0%9C%EC%86%A1_%EA%B5%AC%ED%98%84_%EA%B0%80%EC%9D%B4%EB%93%9C_AI%EC%A7%80%EC%8B%9C%EC%84%9C.md?ref_type=heads
