---
name: Futurem DataBridge REST API 연동 규약
alwaysApply: false
description: DataBridge REST API, 사내 업무 데이터 HTTP 조회, DATABRIDGE_API_KEY, X-API-Key, /api/me 권한 확인 요청에 적용한다.
---

# Futurem DataBridge REST API 연동 규약

DataBridge REST API는 사내 업무 데이터를 서버 측 애플리케이션에서 조회하는 HTTP GET 연동이다. API Key가 노출되므로 프론트엔드 JavaScript에서 직접 호출하지 않는다.

## 구현 전 확인

- 현재 프로젝트의 언어, 프레임워크, 실행 방식, 설정 로딩 방식을 먼저 확인한다.
- 사용자가 연결할 DataBridge API 문서 상세 화면의 텍스트를 제공했는지 확인한다.
- URL만 받으면 SSO 때문에 AI가 직접 열지 못할 수 있으므로 `GET /api/...`, Query Parameters, 인증 필요 여부, 응답 예시를 붙여넣어 달라고 요청한다.
- 연결할 API path, 필수/선택 파라미터, 결과 표시 방식, 호출 위치를 확정한 뒤 구현한다.

## 표준 설정

| 환경변수 | 용도 |
|----------|------|
| `DATABRIDGE_API_BASE_URL` | DataBridge REST API 서버 base URL |
| `DATABRIDGE_API_KEY` | DataBridge API Key |

## 구현 규칙

- REST API 호출은 백엔드에서만 수행한다.
- 모든 요청에 `X-API-Key` 헤더를 넣는다.
- API Key는 환경변수, Secret Manager, Vault 등 서버 실행 환경에서 읽는다.
- 요청 전 `/api/me`로 현재 API Key의 권한 범위를 확인할 수 있는 흐름을 제공한다.
- 날짜 파라미터는 API가 요구하는 `YYYYMMDD` 형식을 우선 사용한다.
- 화면에는 필요한 필드만 표시하고 불필요한 컬럼 전체를 노출하지 않는다.
- 금액 데이터는 통화 컬럼과 함께 다룬다.
- timeout을 명시하고 무제한 대기 요청을 만들지 않는다.
- 오류는 사용자가 조치 가능한 메시지로 변환하되 API Key와 내부 상세 오류는 노출하지 않는다.

## 금지

| 금지 | 대안 |
|------|------|
| 브라우저 JavaScript에 `DATABRIDGE_API_KEY` 노출 | 백엔드 API에서 프록시 호출 |
| API 문서 URL만 받고 구현 시작 | API path, Query Parameters, 응답 예시 확인 |
| API Key, 주민번호, 연락처 로그 출력 | 마스킹 또는 제외 |
| 사용자가 확정하지 않은 파라미터 임의 추가 | 기본값 문서화 후 보고 |
| 전체 컬럼을 그대로 화면 표시 | 업무 목적에 필요한 필드만 표시 |

## 완료 보고

구현 후 어떤 파일에 연결 코드를 추가했는지, 필요한 설정값을 어디서 읽는지, 확정한 API와 파라미터, 테스트 요청, 실제 연결 확인 여부를 보고한다.



## 참고문서

- Futurem AI 개발가이드 - DataBridge_APIDataBridge_API_연동_가이드_AI지시서.MD: https://gitlab.poscofuturem.com:8443/root/ai-dev-guide/-/blob/main/DataBridge_API_%EC%97%B0%EB%8F%99_%EA%B0%80%EC%9D%B4%EB%93%9C_AI%EC%A7%80%EC%8B%9C%EC%84%9C.MD?ref_type=heads
