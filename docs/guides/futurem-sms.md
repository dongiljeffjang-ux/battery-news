---
name: Futurem 문자 발송 연동 규약
alwaysApply: false
description: 사내 SMS URL 호출, CP949/MS949 인코딩, SMS_* 환경변수, 드라이런, 중복 발송 방지 요청에 적용한다.
---

# Futurem 문자 발송 연동 규약

문자 발송은 사내 SMS URL을 백엔드에서 호출하는 방식으로 구현한다. 프론트엔드에서 SMS URL이나 발신 설정을 직접 사용하지 않는다.

## 구현 전 확인

- 현재 프로젝트의 언어/프레임워크, 설정 로딩 방식, 서버 API 구조, 로그 처리 방식을 먼저 파악한다.
- 운영 수신번호로 자동 테스트 발송하지 않는다.
- 먼저 dry-run으로 최종 URL과 파라미터가 올바르게 만들어지는지 확인한다.

## 표준 설정

| 환경변수 | 용도 |
|----------|------|
| `SMS_ENABLED` | 문자 발송 활성화 여부 |
| `SMS_API_URL` | SMS 호출 URL |
| `SMS_TABLE` | 고객사/업무 테이블 값 |
| `SMS_DEFAULT_SENDER_NAME` | 기본 발신자명 |
| `SMS_DEFAULT_CALLBACK` | 기본 회신번호 |
| `SMS_QUERY_ENCODING` | 한글 query 인코딩, 기본 `cp949` |
| `SMS_TIMEOUT_SECONDS` | timeout |
| `SMS_DRY_RUN` | 실제 발송 없이 URL만 생성 |

## 구현 규칙

- `sndr`, `rcvr`, `msg`처럼 한글이 들어가는 Query Parameter는 CP949/MS949로 URL 인코딩한다.
- Python `requests.get(..., params=params)`, Node `URLSearchParams`, `encodeURIComponent`, Java UTF-8 encoder를 그대로 쓰지 않는다.
- URL 문자열을 직접 이어 붙이지 말고 CP949/MS949 인코딩 helper를 사용한다.
- 수신번호와 발신번호를 정규화한다.
- 발송 로그를 남기되 휴대폰 번호는 `010****1234` 형태로 마스킹한다.
- 업무 key 기준 중복 발송 방지 로직을 둔다.
- 대량 발송은 대상 건수 확인, 중복 제거, rate limit을 적용한다.

## 금지

| 금지 | 대안 |
|------|------|
| 프론트엔드에서 SMS URL 직접 호출 | 백엔드 API에서만 호출 |
| UTF-8 기본 query encoder 사용 | CP949/MS949 encoder |
| 운영 수신번호로 자동 테스트 | dry-run 후 승인된 번호 단건 테스트 |
| 휴대폰 번호 전체 로그 저장 | 마스킹 |
| 발신번호/고객사 ID 하드코딩 | 환경변수 또는 서버 설정 |
| 실패 응답 무시 | 예외 처리와 실패 로그 |

## 완료 보고

구현 후 dry-run 결과, 실제 발송 전 확인 절차, 필요한 환경변수, 중복 방지 기준, 로그 마스킹 방식을 보고한다.


## 참고문서

- Futurem AI 개발가이드 - 문자_발송_연동_가이드_AI지시서.md: https://gitlab.poscofuturem.com:8443/root/ai-dev-guide/-/blob/main/%EB%AC%B8%EC%9E%90_%EB%B0%9C%EC%86%A1_%EC%97%B0%EB%8F%99_%EA%B0%80%EC%9D%B4%EB%93%9C_AI%EC%A7%80%EC%8B%9C%EC%84%9C.md?ref_type=heads
