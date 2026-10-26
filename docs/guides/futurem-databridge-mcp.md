---
name: Futurem DataBridge MCP 연동 규약
alwaysApply: false
description: DataBridge MCP, FastMCP, mcp-remote, get_my_permissions, get_tables, query_table 기반 업무 데이터 조회 요청에 적용한다.
---

# Futurem DataBridge MCP 연동 규약

DataBridge MCP는 사내 업무 데이터를 AI 앱에서 조회할 수 있게 하는 MCP 서버 연동이다. 사용자의 자연어 질문을 MCP 툴 호출로 변환하되 API Key와 조회 권한을 엄격히 보호한다.

## 구현 전 확인

- 현재 프로젝트의 언어, 프레임워크, 실행 방식, 설정 로딩 방식을 먼저 확인한다.
- Python 앱은 FastMCP 클라이언트 패턴을 우선한다.
- 프론트엔드만 있는 프로젝트라도 MCP 연결 코드는 서버 측 라우트, 백엔드, 서버 액션 등 안전한 서버 실행 위치에 둔다.

## 표준 설정

| 환경변수 | 용도 |
|----------|------|
| `DATABRIDGE_MCP_URL` | DataBridge MCP 서버 URL |
| `DATABRIDGE_API_KEY` | DataBridge API Key |

## 구현 규칙

- `DATABRIDGE_API_KEY`는 코드, 화면, 로그, 저장소에 노출하지 않는다.
- 사용자 질문을 바로 조회하지 말고 `get_my_permissions`로 권한 범위를 확인한다.
- 테이블명을 모르면 `get_tables(source)`로 먼저 찾는다.
- `query_table` 호출 시 `columns`를 명시해 필요한 컬럼만 조회한다.
- 대량 조회를 피하고 `limit`, 필터, 정렬 조건을 명확히 지정한다.
- 금액 데이터는 통화 컬럼을 함께 확인하고 통화가 섞인 금액을 단일 합계처럼 처리하지 않는다.
- DataBridge MCP를 VS Code + Continue 개발 환경에 먼저 붙여 권한과 테이블 구조를 확인한 뒤 앱 코드를 구현할 수 있다.

## 금지

| 금지 | 대안 |
|------|------|
| 프론트엔드에서 MCP URL/API Key 직접 사용 | 서버 측 MCP 클라이언트 |
| 권한 확인 없이 테이블 조회 | `get_my_permissions` 선행 |
| 전체 컬럼 조회 후 화면 표시 | 필요한 컬럼만 `columns`로 지정 |
| 무제한 대량 조회 | `limit`, 필터, 정렬 조건 지정 |
| API Key 또는 민감 업무 데이터 로그 출력 | 마스킹 또는 제외 |

## 완료 보고

구현 후 어떤 파일에 MCP 연결 코드를 추가했는지, 필요한 설정값, 앱에서 테스트할 질문, 실제 연결 확인 여부를 보고한다.


## 참고문서

- Futurem AI 개발가이드 - DataBridge_MCP_연동_가이드_AI지시서.md: https://gitlab.poscofuturem.com:8443/root/ai-dev-guide/-/blob/main/DataBridge_MCP_%EC%97%B0%EB%8F%99_%EA%B0%80%EC%9D%B4%EB%93%9C_AI%EC%A7%80%EC%8B%9C%EC%84%9C.md?ref_type=heads
