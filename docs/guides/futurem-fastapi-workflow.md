---
name: Futurem FastAPI 전체 워크플로 규약
alwaysApply: false
description: Futurem FastAPI 프로젝트의 전체 아키텍처 워크플로우 가이드. 새 기능을 추가하거나 LLM 통합을 설계할 때 사용한다. 새 비즈니스 기능 end-to-end 구현, LLM 통합 기능 설계, .futurem-prompts/ 템플릿 작성, 테스트 전략 설계, 프로젝트 초기 보일러플레이트 설정이 필요할 때 사용한다. 개별 레이어 규약은 각 instruction file(futurem-adapters/routers/services/repositories)에서 자동 적용되므로, 이 가이드는 전체 흐름 설계 및 새 기능 end-to-end 구현에 집중한다.
---

# Futurem FastAPI 전체 워크플로 규약

## Description
Futurem FastAPI 프로젝트의 전체 아키텍처 워크플로우 가이드.

새 기능을 추가하거나 LLM 통합을 설계할 때 사용한다.
개별 레이어 규약은 각 instruction file(futurem-adapters/routers/services/repositories)에서 자동 적용된다.
이 가이드는 **전체 흐름 설계 및 새 기능 end-to-end 구현**에 집중한다.

## When to Use
- 새 비즈니스 기능 추가 (end-to-end)
- LLM 통합 기능 설계
- `.futurem-prompts/` 템플릿 작성
- 테스트 전략 설계
- 프로젝트 초기 보일러플레이트 설정

---

## 프로젝트 초기 설정 인터뷰 (Initial Setup)

개발자가 **"프로젝트 초기 구조 만들어줘"** 라고 하면, 코드를 생성하기 전에 반드시 아래 질문을 **한 번에 하나씩** 순서대로 물어본다.

```
Q1. 앱 이름이 무엇인가요?
    (예: 품질관리시스템, 설비점검앱)

Q2. Futurem SSO 로그인이 필요한가요? (Y/N)
    - Y: 사내 임직원만 접근 가능한 앱
    - N: 로그인 없이 사용 가능한 앱

Q3. 관리자/일반사용자 권한 분리가 필요한가요? (Y/N)  ← Q2가 Y일 때만 질문
    - Y: 관리자만 볼 수 있는 메뉴·기능이 있음
    - N: 로그인한 모든 직원이 동일한 권한
```

답변에 따른 생성 범위:

| Q2 SSO | Q3 RBAC | 적용 가이드 |
|--------|---------|-----------|
| N | - | `futurem-fastapi-template` (기본 뼈대만) |
| Y | N | `futurem-fastapi-template` → `futurem-sso` |
| Y | Y | `futurem-fastapi-template` → `futurem-sso` → `futurem-role-management` |

인터뷰 완료 후 **한 번에** 모든 파일을 생성한다. 단계별로 나눠서 생성하지 않는다.

---

## 프로젝트 구조

```
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 ← 라우터 등록만 (비즈니스 로직 금지)
│   │   ├── adapters/
│   │   │   ├── __init__.py
│   │   │   ├── logger.py           ← JSON 구조화 로거 (print 금지)
│   │   │   ├── llm_gateway.py      ← 유일한 LLM 호출 경로
│   │   │   └── preprocess.py       ← rule-based 전처리 필터 체인
│   │   ├── repositories/
│   │   │   └── __init__.py         ← 데이터 접근 (raw SQL 금지)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── health.py           ← 요청/응답 변환만 (로직 금지)
│   │   └── services/
│   │       ├── __init__.py
│   │       └── health_service.py   ← 도메인 로직
│   ├── requirements.txt            ← 버전 고정 필수 (>= 금지)
│   └── tests/
│       ├── test_health.py
│       └── test_llm_gateway.py      ← llm_gateway 어댑터 단위 테스트 (보일러플레이트)
├── .futurem-prompts/                  ← LLM 프롬프트 템플릿 (런타임 참조)
│   ├── _shared/
│   │   └── system-base.md          ← 공통 시스템 프롬프트 (캐싱 prefix)
│   └── quality/
│       └── defect-summary.yaml
├── frontend/
│   └── index.html                  ← 순수 HTML5+CSS+JS (프레임워크 금지)
├── docs/design/
│   └── _TEMPLATE.md                ← team 이상 등급 기술설계서 필수
└── .gitignore
```

---

## 새 기능 추가 — end-to-end 체크리스트

### 1. 요청/응답 모델 설계 (routers/)
```python
# routers/defect.py
class SummaryRequest(BaseModel):
    period: str = Field(min_length=1, max_length=50)
    equipment: str = Field(min_length=1, max_length=50)
    rows: str = Field(max_length=200_000)
```

### 2. 출력 스키마 설계 (services/)
```python
# services/defect_service.py
class DefectSummary(BaseModel):
    headline: str = Field(max_length=100, description="한 줄 요약")
    causes: list[str] = Field(max_length=5, description="추정 원인 최대 5개")
    severity: str = Field(pattern="^(high|medium|low)$")
```

### 3. 프롬프트 템플릿 작성 (.futurem-prompts/)
```yaml
# .futurem-prompts/quality/defect-summary.yaml
id: quality/defect-summary
version: 1
system: _shared/system-base.md      # 고정부 (캐싱 prefix, 매 요청 동일)
output_schema: DefectSummary
max_tokens: 800
stop: ["</END>"]
preprocess:
  - strip_html
  - mask_pii
  - collapse_whitespace
  - truncate_rows: 50               # 상위 50행만 LLM에 전달
user_template: |
  다음 설비 이상 데이터를 요약하라.

  기간: {period}
  설비: {equipment}

  데이터:
  {rows}
```

### 4. 서비스 함수 구현 (services/)
```python
def summarize(period: str, equipment: str, rows: str) -> DefectSummary:
    return llm_gateway.complete(
        template_id="quality/defect-summary",
        params={"period": period, "equipment": equipment, "rows": rows},
        output_model=DefectSummary,
    )
```

### 5. 라우터 엔드포인트 구현 (routers/)
```python
PREVIEW_LIMIT = 20

@router.post("/summary")
def summary(body: SummaryRequest):
    result = defect_service.summarize(body.period, body.equipment, body.rows)
    return {
        "summary": result,
        "preview_limit": PREVIEW_LIMIT,
        "download_url": "/api/defects/export",
    }
```

### 6. 라우터를 main.py에 등록
```python
from app.routers import defect
app.include_router(defect.router)
```

### 7. 테스트 작성 (backend/tests/)
```python
# tests/test_defect_router.py
from fastapi.testclient import TestClient
from app.main import app

def test_summary_validates_input():
    r = TestClient(app).post("/api/defects/summary", json={})
    assert r.status_code == 422   # Pydantic 검증 실패

def test_health():
    r = TestClient(app).get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
```

---

## LLM 토큰 최적화 원칙

### 캐싱 (1-1)
```
[고정부] system 프롬프트 + 출력 스키마  ← 캐싱 prefix (매 요청 동일)
[가변부] 사용자 입력 + 조회 데이터      ← 매 요청 달라짐
```
- `system` 필드는 항상 `_shared/system-base.md` 참조 (변경 최소화)
- 사용자 입력을 시스템 프롬프트에 섞으면 캐싱이 깨짐

### 전처리 (1-3)
```
raw_text → strip_html → mask_pii → collapse_whitespace → truncate_rows → LLM
```
- 대용량 테이블을 그대로 LLM에 넣지 않는다
- 상위 50행만 전달하고, 전체는 `/export` 다운로드

### 구조화 출력 (3-2)
- `output_model` (Pydantic) 지정 → JSON Mode 강제
- `max_tokens` + `stop` 지정 → 필요 이상 생성 방지
- 필드를 좁게 정의 → 출력 토큰 절감

---

## 테스트 전략 (커버리지 60% 하한)

`test_llm_gateway.py`는 보일러플레이트 파일이다. 프로젝트 초기 구조 생성 시 반드시 포함한다.

```python
# test_llm_gateway.py — LLM 어댑터 토큰 최적화 검증
def test_고정부가_가변부보다_앞에_온다():
    tpl = llm_gateway.load_template("quality/defect-summary")
    msgs = llm_gateway.build_messages(tpl, {"period": "7월", "equipment": "1CGL", "rows": "a"}, DefectSummary)
    assert msgs[0]["role"] == "system"     # 고정부 앞
    assert msgs[1]["role"] == "user"       # 가변부 뒤
    assert "1CGL" not in msgs[0]["content"]   # 입력이 고정부에 섞이면 캐싱 깨짐

def test_전처리_개인정보_마스킹():
    out = preprocess.mask_pii("담당 900101-1234567 / 010-1234-5678")
    assert "[주민번호]" in out and "[전화번호]" in out

def test_전처리_대용량_행_축약():
    text = "\n".join(f"row{i}" for i in range(200))
    out = preprocess.truncate_rows(text, 50)
    assert "생략" in out
```

---

## requirements.txt 규약

```
# Secure Repository 승인 패키지만. 버전 고정 필수 (>= 금지).
fastapi==0.115.0
uvicorn==0.30.6
pydantic==2.9.2
httpx==0.27.2
pyyaml==6.0.2
```

---

## 프론트엔드 규약

```html
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>App</title></head>
<body>
  <!-- textContent 사용 (innerHTML 금지) -->
  <main id="app"></main>
  <script src="app.js"></script>
</body>
</html>
```

```javascript
// fetch + JSON만 사용
async function fetchSummary(period, equipment, rows) {
  const res = await fetch('/api/defects/summary', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({period, equipment, rows}),
  });
  const data = await res.json();
  // innerHTML 금지 — textContent 사용
  document.getElementById('result').textContent = data.summary.headline;
}
```

---

## 보안 체크리스트 (코드 생성 후 자가 점검)

- [ ] 시크릿·API 키를 코드에 하드코딩하지 않았는가?
- [ ] 모든 외부 입력을 Pydantic 모델로 검증하는가?
- [ ] `print()` 대신 `logger` 를 사용하는가?
- [ ] raw SQL을 직접 작성하지 않았는가?
- [ ] LLM을 `llm_gateway.complete()` 경유로만 호출하는가?
- [ ] `output_model` 을 지정하였는가?
- [ ] 에러 응답에 내부 스택 트레이스를 포함하지 않는가?
- [ ] 프론트에 `innerHTML` / `eval()` 을 사용하지 않는가?




