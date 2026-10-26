---
name: Futurem 앱 내 권한관리 규약
alwaysApply: false
description: >
  Implement in-app role-based access control (RBAC) for Futurem internal FastAPI apps after SSO login.
  Use when tasks involve admin/user role separation, require_role Depends injection, ALLOWED_EMP_NOS access gate,
  ADMIN_EMP_NOS role config, protecting routes from unauthorized access, UI double-gating (template hide +
  server HTTPException 403), or verifying that URL sharing does not bypass permissions. Requires Futurem SSO session
  (futurem-sso) as a prerequisite — roles are always resolved from the authenticated SSO user, never
  from URL parameters.
---

# Futurem 앱 내 권한관리 규약

## 핵심 원칙

> **URL이 권한을 부여하지 않는다. SSO 계정이 권한을 가진다.**

URL을 공유받은 사람이 접속하면 포털(<사내_포털_URL>) SSO 로그인을 거치고,
**자신의 계정 기준으로 역할(role)이 결정**된다. 관리자가 공유한 URL이라도 수신자의 역할은 변하지 않는다.

```
URL 공유받은 사람이 접속
        ↓
SSO 로그인 (본인 계정으로 인증) ← 여기서 "누구인지" 확인
        ↓
[접근 게이트] ALLOWED_EMP_NOS 에 있는가?
   - 없으면 → 세션 미생성 → 403 (URL 공유받아도 동일)
   - 있으면 ↓
[역할 게이트] ADMIN_EMP_NOS 에 있는가?
   - 있으면 → 'admin'
   - 없으면 → 'user'
        ↓
라우트별 @require_role 로 접근 수준 결정
   - admin 전용 페이지 → user는 403
   - user 접근 가능 페이지 → 정상 접근
```

## Decision Interview Gate

코드 수정 전 아래 결정을 먼저 확정한다.
코드베이스에서 답을 추론할 수 있으면 묻지 말고 직접 확인한다.
결정이 필요한 경우 한 번에 한 질문만 한다.

```text
Question: <하나의 미결 결정>
Recommended answer: <구체적 기본값>
Why: <짧은 이유>
```

결정 순서:

1. **역할 결정 방식**
   - OPTION A — ENV 직번 목록 기반 (권장 기본값)
     - `ALLOWED_EMP_NOS`: 앱에 접근 가능한 직번 전체 목록 (접근 게이트)
     - `ADMIN_EMP_NOS`: 그 중 관리자 직번 목록 (역할 게이트, 선택)
     - DB 없이 O(1) 조회, 직번 소스 코드 미노출
     - **`ALLOWED_EMP_NOS` 미설정(빈 값) 시 아무도 접근 불가** — 반드시 설정 필요
   - OPTION B — DB 테이블 기반 (역할 종류가 3개 이상이거나 런타임 변경 필요 시)
   - 권장 기본값: OPTION A (단순, 빠름, 초기 앱에 충분)

2. **역할 종류와 접근 수준 정의**
   - 어떤 라우트를 admin 전용으로 제한할지 확인
   - 비인증 사용자(SSO 세션 없음)는 `/login`으로 리다이렉트하는지 확인
   - 권장 기본값: `admin` / `user` 두 역할, 미인증은 전체 차단

3. **기존 세션 구조 확인**
   - `request.session['user']` 에 `id`(직번), `role`, `name` 필드가 있는지 확인
   - SSO 콜백에서 `get_role(emp_no)` 를 호출해 role을 주입하는지 확인
   - `SessionMiddleware` 가 FastAPI app에 등록되어 있는지 확인
   - 없으면 futurem-sso futurem-sso 규약 선행 적용 필요

## 레퍼런스 먼저 읽기

구현 전 `references/Futurem-role-model.md` 를 읽는다.

해당 파일은 다음의 표준 패턴을 포함한다:
- `config.py` — `ALLOWED_EMP_NOS`, `ADMIN_EMP_NOS` 환경변수 파싱
- `auth/roles.py` — `get_role(emp_no)` 구현 (None 반환 포함)
- `auth/dependencies.py` — `require_role(*roles)` FastAPI Depends 구현
- `auth/middleware.py` — `AuthMiddleware` 글로벌 인증 게이트 + 403 예외 핸들러
- 라우트 적용 예시 (`dependencies=[require_role('admin')]`)
- Jinja2 UI 이중 제어 예시

## Workflow

1. **Decision Interview Gate 완료**
   - 역할 결정 방식, 역할 종류, 기존 세션 구조를 확정한 후에만 구현 시작

2. **`config.py` — 직번 목록 외부화 (2개)**
   - `ALLOWED_EMP_NOS`: 앱 접근 허용 직번 전체. 빈 값이면 전원 차단 (보안 기본값)
   - `ADMIN_EMP_NOS`: 관리자 직번. `ALLOWED_EMP_NOS` 의 부분집합이어야 함
   - 직번을 소스 코드에 절대 하드코딩하지 않는다

3. **`auth/roles.py` — `get_role()` 구현**
   - 반환 타입: `str | None`
   - `emp_no not in Config.ALLOWED_EMP_NOS` → `return None` (접근 거부)
   - `emp_no in Config.ADMIN_EMP_NOS` → `return 'admin'`
   - 그 외 → `return 'user'`

4. **`auth/dependencies.py` — `require_role()` FastAPI 의존성 구현**
   - `request.session['user']['role']` 을 읽어 허용 역할 목록에 없으면 `raise HTTPException(status_code=403)`
   - `Depends(require_role('admin'))` 형태로 라우트 `dependencies=` 파라미터에 주입

5. **`auth/middleware.py` — 글로벌 인증 미들웨어 등록**
   - `BaseHTTPMiddleware` 로 구현: 세션 없으면 `RedirectResponse(url='/login')` 반환
   - `/login`, `/sso/callback`, `/static` 경로는 예외 처리
   - `@app.exception_handler(StarletteHTTPException)` 로 403 처리: `403.html` 렌더링

6. **SSO 콜백에서 접근 게이트 + 역할 주입**
   - `role = get_role(emp_no)` 호출
   - `role is None` 이면: 세션 미생성, 로그 기록 후 `raise HTTPException(status_code=403)`
   - `role` 이 있으면: `request.session['user']['role'] = role` 저장
   - 이후 모든 요청은 세션의 role 값을 신뢰 (재계산 불필요)

7. **라우트에 `require_role` 의존성 주입**
   - admin 전용: `dependencies=[require_role('admin')]`
   - admin + user 공용: `dependencies=[require_role('admin', 'user')]`
   - `@router.get/post` 선언부의 `dependencies=` 파라미터로 주입

8. **UI 이중 제어 적용**
   - 템플릿: `{% if request.session.user.role == 'admin' %}` 로 메뉴/버튼 숨김 (`request` 를 Jinja2 context에 반드시 전달)
   - 서버: 동일 라우트에 `dependencies=[require_role('admin')]` 도 필수
   - **UI 숨김만으로는 부족하다** — URL 직접 입력 시 서버 차단이 없으면 접근 가능

## Implementation Rules

- 직번(emp_no)을 소스 코드나 Git 저장소에 절대 커밋하지 않는다 (`.env` 에만 보관)
- `ALLOWED_EMP_NOS` 를 설정하지 않으면 앱에 아무도 접근할 수 없다 — 배포 전 반드시 확인
- `ADMIN_EMP_NOS` 는 `ALLOWED_EMP_NOS` 의 부분집합이어야 한다 (미포함 직번을 admin으로 설정해도 접근 자체가 거부됨)
- 역할은 SSO 로그인 시점에 한 번 결정하고 `request.session['user']` 에 저장한다
- `domainName` 파라미터는 화이트리스트로 검증한다 (SSRF 방지)
- `SessionMiddleware` 에 `https_only=True`, `same_site="lax"` 를 설정한다
- 프론트엔드 숨김과 서버 `HTTPException(403)` 둘 다 구현한다

## Done Criteria

구현 완료 기준. 아래 항목을 순서대로 직접 확인한다.

### 기능 검증

- [ ] `ALLOWED_EMP_NOS` 에 없는 직번 → `get_role()` 이 `None` 반환
- [ ] `ALLOWED_EMP_NOS` 에 있고 `ADMIN_EMP_NOS` 에도 있는 직번 → `'admin'` 반환
- [ ] `ALLOWED_EMP_NOS` 에 있고 `ADMIN_EMP_NOS` 에 없는 직번 → `'user'` 반환
- [ ] SSO 콜백에서 `role is None` 이면 세션 미생성 + 403 반환
- [ ] admin 전용 라우트에 `dependencies=[require_role('admin')]` 이 적용되어 있음
- [ ] `request.session['user']['role']` 이 SSO 콜백 후 세션에 저장됨

### 실환경 SSO 검증 (<사내_포털_URL>)

`http://<사내_포털_URL>/` 로그인 후 아래 3가지 시나리오를 확인한다.

| # | 시나리오 | 접속 계정 | 기대 결과 |
|---|---------|-----------|-----------|
| 1 | 포털 로그인 후 앱 URL 접속 | **ALLOWED + ADMIN 직번** | `request.session.user.role == 'admin'` → admin 페이지 정상 접근 |
| 2 | 포털 로그인 후 앱 URL 접속 | **ALLOWED 직번 (비관리자)** | `request.session.user.role == 'user'` → admin URL 접근 시 **403** |
| 3 | 포털 로그인 후 앱 URL 접속 | **ALLOWED 미포함 직번** | 세션 미생성 → 로그인 직후 **403** (앱 진입 불가) |
| 4 | 관리자가 admin 페이지 URL을 일반직원에게 공유 | **URL 수신한 ALLOWED 직번** | URL 직접 입력해도 본인 역할(user) 적용 → **403** |

**확인 체크리스트**

```
□ <사내_포털_URL> 포털에서 로그인 → 앱 URL 접속
□ 앱 서버 로그에서 'SSO 로그인 성공' 또는 'SSO 접근 거부' 메시지 확인
□ ALLOWED 직번: request.session['user']['role'] 값 확인 (admin 또는 user)
□ ALLOWED 미포함 직번: 로그인 직후 403.html 렌더링 확인 (세션 없음)
□ admin 전용 URL을 user 계정으로 직접 입력 → 403.html 렌더링 확인
□ 브라우저 개발자도구 > Application > Cookies: sso_token 값이 보이지 않음 (서버 세션 보관)
□ 비로그인 상태(쿠키 삭제 후)에서 앱 URL 접속 → /login 리다이렉트 확인
□ 시나리오 4: URL 공유 수신자(user)가 admin 페이지에 403을 받음
```




