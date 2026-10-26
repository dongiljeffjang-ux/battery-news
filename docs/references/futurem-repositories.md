---
name: Futurem FastAPI repositories 레이어 규약
globs: "**/repositories/**"
alwaysApply: false
description: repositories 레이어 작업 시 DB 접근, 함수 명명, 세션 주입 규약을 적용한다.
---

# Futurem FastAPI repositories 레이어 규약

repositories 레이어는 데이터 접근만 담당한다. 비즈니스 로직, HTTP 처리, LLM 호출을 넣지 않는다.

레이어 의존 방향은 `routers → services → repositories`이며 역방향 의존은 금지한다.

## 함수 명명 규약

| 동작 | 함수 패턴 | 예시 |
|------|----------|------|
| 단건 조회 | `find_by_{field}` | `find_by_id`, `find_by_name` |
| 목록 조회 | `find_all`, `find_by_{condition}` | `find_all`, `find_by_period` |
| 생성 | `create` | `create` |
| 수정 | `update` | `update` |
| 삭제 | `delete` | `delete` |
| 존재 확인 | `exists_by_{field}` | `exists_by_id` |

## DB 세션 주입 규칙

- ORM 세션을 repository 함수 내부에서 직접 생성하지 않는다.
- FastAPI `Depends(get_db)`로 주입받은 세션을 service 또는 repository로 전달한다.
- repository 함수는 DB 작업 결과를 반환하고 판단 로직은 service에 둔다.

```python
def find_by_id(db: Session, order_id: str) -> Order | None:
    return db.query(Order).filter(Order.id == order_id).first()
```

## 금지

| 금지 | 대안 |
|------|------|
| `connection.execute("SELECT ...")` | ORM 쿼리 |
| `text("SELECT * FROM ...")` | ORM filter |
| 조건 분기, 계산, LLM 호출 | services로 위임 |
| `print()` | 제공 logger |
| `SessionLocal()` 직접 생성 | `Depends(get_db)` 주입 |
| 개인정보 로그 출력 | PII 필드 제외 |



