---
name: Futurem FastAPI routers 레이어 규약
globs: "**/routers/**"
alwaysApply: false
description: routers 레이어 작업 시 HTTP 요청/응답, 입력 검증, API 경로 규약을 적용한다.
---

# Futurem FastAPI routers 레이어 규약

routers 레이어는 HTTP 요청/응답 변환만 담당한다. 도메인 로직은 services로 위임한다.

레이어 의존 방향은 `routers → services → repositories`이며 역방향 의존은 금지한다.

## 입력 검증

모든 사용자 입력은 Pydantic 모델로 받는다. `body: dict` 수신은 금지한다.

| 필드 타입 | 필수 제약 |
|----------|----------|
| 문자열 | `min_length`, `max_length` 지정 |
| 숫자 | `gt`/`ge`, `lt`/`le` 상한 지정 |
| URL | `field_validator`로 `http` 또는 `https`만 허용 |

## 응답 패턴

| 상황 | 패턴 |
|------|------|
| 대량 데이터 | 상위 `PREVIEW_LIMIT=20`건만 응답하고 `download_url` 제공 |
| LLM 스트리밍 | `StreamingResponse` + `data: {json}\n\n` + `data: [DONE]\n\n` |
| 장시간 작업 | `202 Accepted` + `job_id` 반환 후 `/jobs/{id}` 폴링 |
| HITL resume | `GET /sessions/{id}/status` + `POST /sessions/{id}/resume` |
| 헬스체크 | `GET /health` → `{"status": "ok"}` |

헬스체크는 DB, LLM, 외부 API 같은 외부 의존성을 호출하지 않는다.

## 파일명, prefix, tags

| 파일 | prefix | tags |
|------|--------|------|
| `health.py` | `/api` | `["health"]` |
| `orders.py` | `/api/orders` | `["orders"]` |
| `defect.py` | `/api/defects` | `["defects"]` |
| `order_items.py` | `/api/order-items` | `["order-items"]` |

API 경로는 소문자, 복수형, kebab-case를 사용한다.

## 금지

| 금지 | 대안 |
|------|------|
| `body: dict` | Pydantic 모델 |
| 라우터 내 비즈니스 로직 | services로 위임 |
| `raise HTTPException(detail=str(e))` | `"처리 중 오류가 발생했습니다."` 같은 범용 메시지 |
| `print()` | 제공 logger |
| 전체 표 응답 | 상위 N건 + `download_url` |
| 30초 이상 동기 대기 | BackgroundTasks + job 폴링 |



