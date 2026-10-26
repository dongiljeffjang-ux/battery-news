---
name: Futurem SSO 인증 구현 규약
alwaysApply: false
description: Futurem WebSEAL SSO, ssoToken, POST Relay, SSO_VALIDATE_URL, 인증 콜백 구현 요청에 적용한다.
---

# Futurem SSO 인증 구현 규약

SSO는 서버 측에서 토큰을 검증하고 애플리케이션 세션 또는 JWT를 발급하는 방식으로 구현한다. 프론트엔드에서 SSO 토큰을 검증하거나 SSO 검증 서버를 직접 호출하지 않는다.

## 구현 전 확인

- 현재 프로젝트의 언어, 프레임워크, 인증 구조, 디렉터리 구조를 먼저 파악한다.
- 기존 로그인/세션/JWT 구조가 있으면 보존하고 SSO 진입점만 추가한다.
- `redir_url`은 루트가 아니라 relay 엔드포인트 경로로 지정한다.

## 권장 흐름

1. 사용자를 SSO 로그인 URL로 이동시킨다.
2. SSO가 `POST /auth/sso/relay`로 `ssoToken`을 전달한다.
3. relay POST가 `ssoToken`을 쿼리스트링으로 변환해 프론트 또는 로그인 페이지로 302 리다이렉트한다.
4. 프론트는 URL의 `ssoToken`을 읽어 백엔드 `GET /auth/sso/relay`를 호출한다.
5. 백엔드는 서버에서 SSO 검증 URL을 호출한다.
6. 성공 시 사용자 정보를 매핑하고 세션 또는 JWT를 발급한다.
7. URL에서 `ssoToken`이 남지 않도록 history replace 또는 리다이렉트를 수행한다.

## 표준 설정

| 환경변수 | 용도 |
|----------|------|
| `SSO_ENABLED` | SSO 기능 활성화 여부 |
| `SSO_DOMAIN` | SSO 서버 도메인 |
| `SSO_VALIDATE_PATH` | 검증 API path |
| `SSO_VALIDATE_URL` | 검증 전체 URL |
| `SSO_SERVICE` | 서비스 종류 및 쿠키 이름 결정 |
| `SSO_SSL_VERIFY` | TLS 검증 여부 |
| `SSO_AUTO_CREATE_USER` | 미등록 사용자 자동 생성 여부 |
| `SSO_TIMEOUT` | 검증 요청 timeout |

기본값 예시:

```dotenv
SSO_ENABLED=true
SSO_DOMAIN=<사내_SSO_DOMAIN>
SSO_VALIDATE_PATH=/idms/U61/jsp/isValidSSO.jsp
SSO_VALIDATE_URL=
SSO_SERVICE=sms.nonssl
SSO_SSL_VERIFY=false
SSO_AUTO_CREATE_USER=false
SSO_TIMEOUT=5
```

## 토큰 검증 상수

`ssoToken`이 `=`로 끝나지 않으면 검증 전에 `=`를 1개 붙인다. 이미 `=`로 끝나면 그대로 사용한다.

| `SSO_SERVICE` | 쿠키 이름 | 사용 환경 |
|---------------|-----------|-----------|
| `sms.nonssl` | `SWP-H-SESSION-ID` | 사내망 HTTP 기본값 |
| `sms.ssl` | `SWP-S-SESSION-ID` | 사내망 HTTPS |
| `failover.nonssl` | `SWP-ID` | 페일오버 |

검증 요청은 서버에서만 수행한다.

```http
GET http://<사내_SSO_DOMAIN>/idms/U61/jsp/isValidSSO.jsp HTTP/1.1
Cookie: SWP-H-SESSION-ID={ssoToken};
```

## SSO 응답 필드 매핑

`isValidSSO.jsp` 성공 응답은 콤마 구분 문자열이다. 0-based index로 파싱한다.

| 인덱스 | 필드명 | 설명 |
|--------|--------|------|
| `[0]` | `iv-user` | 로그인 ID |
| `[1]` | `sp_empno` | 사번, SSO 연동 핵심 키 |
| `[2]` | `companyCode` | 회사 코드 |
| `[4]` | `seealso` | 부서명 |
| `[5]` | `departmentNumber` | 부서 코드 |
| `[7]` | `companyname` | 회사명 |
| `[8]` | `displayname` | 성명 |
| `[9]` | `mail` | 이메일 |
| `[10]` | `inoutside` | 접속 구분, `I` 사내, `OVP` VPN, `OVD` VDI |
| `[15]` | `sp_agenttype` | 단말 종류, `P` PC, `M` 모바일 |

인증 성공 조건:

- HTTP status가 200이다.
- 응답을 `,` 또는 `;` 기준으로 분리했을 때 최소 2개 이상이다.
- `parts[0]`에 `Unauthenticated`가 없다.
- 사번은 반드시 `parts[1].strip()`에서 가져온다.

실패 응답은 `Unauthenticated` 또는 `error`로 취급한다.

## 사용자 모델 요구사항

SSO 연동을 위해 사용자 모델에는 `employee_id` 컬럼이 필요하다.

| 필드 | 용도 |
|------|------|
| `username` | 로그인 ID |
| `employee_id` | 사번, SSO 연동 키 |
| `email` | 이메일 |
| `role` | 권한 |
| `is_active` | 활성 여부 |
| `last_login` | 마지막 로그인 |

기존 계정 호환을 위해 `employee_id` 조회를 우선하고, 없으면 `username` fallback을 사용한다. fallback으로 조회에 성공하면 `employee_id`를 업데이트한다.

## 보안 규칙

- 클라이언트가 보낸 domain/url로 outbound HTTP 요청을 만들지 않는다.
- 검증 URL은 `SSO_VALIDATE_URL` 또는 `SSO_DOMAIN`/`SSO_VALIDATE_PATH` 환경변수에서만 구성한다.
- `ssoToken`은 로그, URL history, 화면에 남기지 않는다.
- `ssoToken`은 DB에 저장하지 않고 검증 후 즉시 파기한다.
- blocking SSO 검증 I/O는 async 함수에서 스레드 풀로 위임한다.
- 미등록 사용자 처리, 권한 부여, 자동 계정 생성 여부를 명시적으로 결정한다.

## 금지

| 금지 | 대안 |
|------|------|
| 프론트엔드에서 SSO 검증 서버 직접 호출 | 백엔드 relay/검증 엔드포인트 |
| `redir_url`에 서비스 루트 지정 | `/auth/sso/relay` 같은 전용 경로 |
| 클라이언트 입력 domain/url로 검증 URL 구성 | 서버 환경변수 |
| `ssoToken` 로그 출력 | 토큰 마스킹 또는 미기록 |
| `ssoToken` DB 저장 | 검증 후 즉시 파기 |
| 검증 없이 `parts[1]` 사용 | `Unauthenticated` 검사 후 사용 |
| `SSO_AUTO_CREATE_USER=true` 기본값 | 기본값 `false`, 운영에서 명시 |
| `SSO_SSL_VERIFY` 하드코딩 | 환경변수로 제어 |

## 완료 보고

구현 후 relay 경로, 검증 URL 설정 방식, 쿠키명 매핑, 사용자 필드 인덱스 매핑, 미등록 사용자 처리, 테스트 방법을 보고한다.


## 참고문서

- Futurem AI 개발가이드 - SSO_인증_구현_가이드_AI지시서.md: https://gitlab.poscofuturem.com:8443/root/ai-dev-guide/-/blob/main/SSO_%EC%9D%B8%EC%A6%9D_%EA%B5%AC%ED%98%84_%EA%B0%80%EC%9D%B4%EB%93%9C_AI%EC%A7%80%EC%8B%9C%EC%84%9C.md?ref_type=heads
