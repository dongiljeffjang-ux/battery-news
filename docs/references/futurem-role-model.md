# Futurem FastAPI 앱 권한관리 모델 — 표준 코드 레퍼런스

표준 구현 출처: `d:\vibeCoding\sample-app`

---

## 접근 흐름

```
[포털: <사내_포털_URL>]
        ↓  로그인
[SWP SSO 서버]
        ↓  ssoToken POST (redirect.jsp → /sso/callback)
[앱: sso_callback()]
        ↓  isValidSSO.jsp 서버-서버 검증
        ↓  emp_no 파싱
        ↓  get_role(emp_no) 호출
            ├─ ALLOWED_EMP_NOS 미포함 → None → 세션 미생성 → HTTPException(403)
            ├─ ADMIN_EMP_NOS 포함  → 'admin'
            └─ 그 외               → 'user'
        ↓  role 있음: request.session['user'] = { id, name, email, role, sso_token }
        ↓
[앱: AuthMiddleware]
        ↓  request.session['user'] 없으면 → RedirectResponse('/login')
        ↓  있으면 → 라우트 진입 허용
        ↓
[라우트: dependencies=[require_role('admin')]]
        ↓  session role == 'admin' → 진입 허용
           session role == 'user'  → HTTPException(403)

╏ URL을 공유받아 접속해도 "접속자 본인의 SSO 계정"으로 역할이 결정됨
╏ ALLOWED_EMP_NOS 에 없으면 세션 자체가 만들어지지 않음 (url 공유 효과 없음)
```

---

## 표준 코드 스니펫

### 1. `config.py` — 직번 목록 외부화 (2개)

```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # 접근 허용 직번 목록. .env의 ALLOWED_EMP_NOS 값을 읽음 (소스코드에 값 없음)
    # 빈 값이면 빈 set → 아무도 접근 불가 (보안 기본값). 배포 전 반드시 설정 필요.
    # 예: ALLOWED_EMP_NOS=12345,67890,11111
    ALLOWED_EMP_NOS = set(filter(None, os.environ.get('ALLOWED_EMP_NOS', '').split(',')))

    # 관리자 직번 목록. ALLOWED_EMP_NOS 의 부분집합이어야 함.
    # 예: ADMIN_EMP_NOS=12345
    ADMIN_EMP_NOS = set(filter(None, os.environ.get('ADMIN_EMP_NOS', '').split(',')))
```

### 2. `auth/roles.py` — 역할 결정 함수

```python
from config import Config


def get_role(emp_no: str) -> str | None:
    """직번으로 role 반환.
    ALLOWED_EMP_NOS 미포함 → None (접근 거부, 세션 미생성)
    ADMIN_EMP_NOS 포함    → 'admin'
    그 외                 → 'user'
    """
    if emp_no not in Config.ALLOWED_EMP_NOS:
        return None
    return 'admin' if emp_no in Config.ADMIN_EMP_NOS else 'user'
```

> **DB 기반 확장 시**: `get_role()` 내부에서 `UserRole.query.filter_by(emp_no=emp_no).first()` 로 교체.
> 호출부(`sso_callback`)는 수정 불필요.

### 3. `auth/dependencies.py` — FastAPI 역할 의존성

```python
from fastapi import Request, HTTPException, Depends


def require_role(*roles):
    """지정한 role 중 하나여야만 라우트 진입 허용. 불일치 시 HTTPException(403)."""
    async def dependency(request: Request):
        role = request.session.get('user', {}).get('role', 'guest')
        if role not in roles:
            raise HTTPException(status_code=403, detail="권한이 없습니다")
    return Depends(dependency)
```

### 4. `auth/middleware.py` — 글로벌 인증 미들웨어

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse

_EXEMPT_PATHS = {'/login', '/sso/callback'}
_EXEMPT_PREFIX = '/static'


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith(_EXEMPT_PREFIX):
            return await call_next(request)
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)
        if request.session.get('user') is None:
            return RedirectResponse(url='/login', status_code=302)
        return await call_next(request)


def init_auth(app):
    from starlette.exceptions import HTTPException as StarletteHTTPException
    from fastapi.templating import Jinja2Templates

    app.add_middleware(AuthMiddleware)

    templates = Jinja2Templates(directory="templates")

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        if exc.status_code == 403:
            return templates.TemplateResponse(
                "403.html", {"request": request}, status_code=403
            )
        raise exc
```

### 5. SSO 콜백에서 접근 게이트 + 역할 주입 (`routers/auth.py`)

```python
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from auth.roles import get_role

router = APIRouter()

@router.post('/sso/callback')
async def sso_callback(request: Request):
    # ... SSO 토큰 검증 및 emp_no 파싱 ...

    # 접근 허용 직번 확인 (ALLOWED_EMP_NOS 게이트) — 세션 생성 전에 검사
    role = get_role(emp_no)
    if role is None:
        logger.info('SSO 접근 거부: emp_no=%s (ALLOWED_EMP_NOS 미포함)', emp_no)
        raise HTTPException(status_code=403)

    request.session['user'] = {
        'id':        emp_no,
        'name':      display_name,
        'email':     mail,
        'role':      role,         # ← 로그인 시점에 한 번만 결정
        'sso_token': token,        # ← 서버 세션에만 보관, 프론트 미노출
    }
    logger.info('SSO 로그인 성공: emp_no=%s role=%s', emp_no, role)
    return RedirectResponse(url='/', status_code=302)
```

### 6. 라우트에 `require_role` 의존성 주입

```python
from auth.dependencies import require_role

# admin 전용
@router.get('/employees/new', dependencies=[require_role('admin')])
async def employee_new(request: Request):
    return templates.TemplateResponse("employee_new.html", {"request": request})

# admin 전용 (삭제)
@router.post('/employees/{emp_id}/delete', dependencies=[require_role('admin')])
async def employee_delete(request: Request, emp_id: int):
    ...

# admin + user 공용 (명시적으로 열어줄 때)
@router.get('/employees', dependencies=[require_role('admin', 'user')])
async def employee_list(request: Request):
    return templates.TemplateResponse("employee_list.html", {"request": request})
```

> `@router.get/post` 의 `dependencies=` 파라미터로 주입한다.

### 7. Jinja2 UI 이중 제어 (`templates/base.html`)

```html
<!-- 메뉴 숨김 (UI 제어) — request는 Jinja2 context로 반드시 전달 -->
{% if request.session.user.role == 'admin' %}
<li class="nav-item">
  <a class="nav-link" href="/employees/new">직원 등록</a>
</li>
{% endif %}

<!-- 역할 배지 표시 -->
<span class="badge {% if request.session.user.role == 'admin' %}bg-danger{% else %}bg-secondary{% endif %}">
  {{ request.session.user.role | upper }}
</span>
```

> **주의**: UI 숨김만으로는 부족하다.
> URL을 직접 입력하면 메뉴가 숨겨져 있어도 서버에 요청이 도달하뉔로,
> 반드시 라우트에 `dependencies=[require_role('admin')]` 을 함께 적용해야 한다.

---

## `.env` 설정 예시

```dotenv
# 앱 접근 허용 직번 목록 (쉼표 구분, 공백 없음)
# 빈 값이면 아무도 접근 불가 (보안 기본값) — 배포 전 반드시 설정
ALLOWED_EMP_NOS=12345,67890,11111

# ALLOWED_EMP_NOS 의 부분집합으로 관리자 지정
ADMIN_EMP_NOS=12345

SECRET_KEY=your-secret-key-here
APP_BASE_URL=http://127.30.64.63:8000
```

> `ALLOWED_EMP_NOS` 미설정 시 모든 접속이 차단된다. 앱 배포 후 반드시 확인.

---

## 금지 패턴

| 패턴 | 이유 |
|------|------|
| `?role=admin` URL 파라미터로 역할 전달 | URL 조작으로 권한 우회 가능 |
| 프론트엔드 숨김만으로 권한 제어 | URL 직접 입력 시 서버 차단 없음 |
| 소스 코드에 직번 하드코딩 | Git 커밋 시 직번 노출 |
| 역할을 매 요청마다 DB에서 재조회 | 성능 저하, 세션 기반 1회 결정이 충분 |
| SSO 토큰을 프론트엔드에 노출 | 토큰 탈취 위험, 서버 세션에만 보관 |

---

## DB 기반 확장 패턴 (선택 사항)

역할 종류가 3개 이상이거나 런타임 변경이 필요한 경우:

```python
# models.py 추가
from sqlalchemy import Column, String
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class UserRole(Base):
    __tablename__ = 'user_roles'
    emp_no = Column(String(20), primary_key=True)
    role   = Column(String(20), nullable=False, default='user')

# auth/roles.py 교체
from sqlalchemy.orm import Session as DBSession
from models import UserRole

def get_role(emp_no: str, db: DBSession) -> str | None:
    if emp_no not in Config.ALLOWED_EMP_NOS:
        return None
    record = db.query(UserRole).filter_by(emp_no=emp_no).first()
    return record.role if record else 'user'
```

> `sso_callback()` 과 `@require_role` 데코레이터는 수정 불필요.
> `get_role()` 내부만 교체하면 나머지 구조는 동일하게 동작.




