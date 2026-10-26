---
name: Futurem FastAPI services 레이어 규약
globs: "**/services/**"
alwaysApply: false
description: services 레이어 작업 시 도메인 로직, LLM 호출, LangGraph 규약을 적용한다.
---

# Futurem FastAPI services 레이어 규약

services 레이어는 도메인 로직만 담당한다. HTTP 처리는 routers, 외부 연동은 adapters, 데이터 접근은 repositories에 둔다.

레이어 의존 방향은 `routers → services → repositories`이며 역방향 의존은 금지한다.

## 복잡도 상한

| 단위 | 상한 |
|------|------|
| 함수 | 50줄 초과 시 `_private_helper()`로 분리 |
| 파일 | 300줄 초과 시 책임 기준으로 파일 분리 |
| 스키마 클래스 | 파일 상단에 배치 |

## LLM 호출 규약

- LLM 호출은 `llm_gateway.complete(output_model=Model)`만 사용한다.
- `output_model` Pydantic 모델 지정은 필수다.
- 자유 서술 응답을 그대로 사용하지 않는다.
- 규칙으로 처리 가능한 로직은 서비스 함수에서 직접 처리하고 LLM에 맡기지 않는다.
- 프롬프트는 `.futurem-prompts/{영역}/{작업}.yaml` 템플릿으로 관리한다.

## Pydantic 출력 스키마

필드를 좁게 정의할수록 LLM 출력이 안정적이다.

| 필드 타입 | 권장 제약 |
|----------|----------|
| `str` | `max_length=N` |
| `list[str]` | `max_length=N`으로 항목 수 제한 |
| 분류값 | `pattern="^(a|b|c)$"` |
| `dict` | 금지 |

## LangGraph 에이전트 규약

| 항목 | 규칙 |
|------|------|
| StateGraph 위치 | `services/`에만 정의 |
| 상태 객체 | `TypedDict` 또는 Pydantic 모델 |
| 노드 내 LLM | `llm_gateway.complete()`만 사용 |
| Tool 함수 위치 | `services/tools/` |
| Tool 입력 | Pydantic 모델 필수 |
| 노드 프롬프트 | `.futurem-prompts/{영역}/{작업}.yaml` |

## 에러 처리

내부 오류는 logger에 남기고, 사용자 응답에는 내부 정보를 노출하지 않는다.

```python
try:
    ...
except Exception:
    logger.exception("event_name")
    raise HTTPException(500, "처리 중 오류가 발생했습니다.")
```

## 금지

| 금지 | 대안 |
|------|------|
| `Request`, `Response` 등 HTTP 코드 | routers만 담당 |
| raw SQL | repositories 함수 사용 |
| SDK 직접 LLM 호출 | `llm_gateway.complete()` |
| `print()` | 제공 logger |
| `output_model` 없는 LLM 호출 | Pydantic 모델 |
| 인라인 프롬프트 | `.futurem-prompts` 템플릿 |
| `StateGraph`를 `routers/`에 정의 | `services/`에 정의 |
| 무형 `dict` 상태 | `TypedDict` 또는 Pydantic |



