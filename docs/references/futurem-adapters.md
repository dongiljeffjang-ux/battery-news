---
name: Futurem FastAPI adapters 레이어 규약
globs: "**/adapters/**"
alwaysApply: false
description: adapters 레이어 작업 시 외부 시스템 연동, logger, LLM gateway, preprocess 규약을 적용한다.
---

# Futurem FastAPI adapters 레이어 규약

adapters 레이어는 외부 시스템 연동만 담당한다. `routers/`나 `services/`에서 LLM SDK, 로깅 인프라, 외부 API 클라이언트를 직접 호출하지 않는다.

## logger.py

- `print()`를 사용하지 말고 제공된 logger를 사용한다.
- 개인정보, 토큰, 비밀번호, 주민번호, 카드번호를 로그에 남기지 않는다.
- 예외는 내부 로그에만 기록하고 HTTP 응답에는 범용 메시지만 전달한다.

```python
from app.adapters.logger import logger

logger.info("order_created", extra={"order_id": order.id})
logger.warning("retry_triggered", extra={"attempt": 2})
logger.exception("db_failed")
```

## llm_gateway.py

LLM 호출은 반드시 `llm_gateway.complete()` 하나로 통일한다.

| 함수 | 역할 |
|------|------|
| `load_template(template_id)` | YAML 로드 및 필수 필드 검증 |
| `build_messages(tpl, params, output_model)` | 고정부(system) 앞, 가변부(user) 뒤로 메시지 구성 |
| `complete(template_id, params, output_model)` | 템플릿 로드, 메시지 조립, 게이트웨이 호출, 출력 검증 |

필수 환경변수는 코드에 하드코딩하지 않는다.

| 변수 | 설명 |
|------|------|
| `AI_GW_URL` | 사내 AI 게이트웨이 URL |
| `AI_GW_TOKEN` | 사내 AI 게이트웨이 토큰 |

## preprocess.py

LLM에 대용량 데이터나 개인정보 가능성이 있는 원문을 그대로 넣지 않는다. 필요한 경우 전처리 필터를 거친다.

| 필터 | 역할 |
|------|------|
| `strip_html` | HTML 태그 제거 |
| `mask_pii` | 주민번호, 전화번호 등 개인정보 마스킹 |
| `collapse_whitespace` | 중복 공백과 빈 줄 축약 |
| `truncate_rows` | 대용량 데이터 상위 N행만 전달 |

## 금지

| 금지 | 대안 |
|------|------|
| `boto3`, `openai`, `anthropic` SDK 직접 import | `llm_gateway.complete()` |
| `output_model` 없이 LLM 호출 | Pydantic 출력 모델 지정 |
| `print()` | `logger.info(...)` |
| 토큰/URL 하드코딩 | 환경변수 |
| `traceback.format_exc()`를 HTTP 응답에 포함 | `logger.exception()` 후 범용 메시지 |



