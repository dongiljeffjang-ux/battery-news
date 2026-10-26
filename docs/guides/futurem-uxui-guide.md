---
name: Futurem UX/UI 구현 규약
alwaysApply: false
description: Futurem 사내 시스템 HTML/CSS 프론트엔드 작업 시 적용해야 하는 UX/UI 가이드 규약. 레이아웃(기본형/보조형), GNB/LNB 네비게이션, Footer, 탭메뉴, 버튼, 슬라이더, 검색모듈, 모달 대화상자, 오류안내 페이지 등 PC 웹 컴포넌트 전체 명세를 포함한다. 신규 화면 개발, 컴포넌트 구현, 스타일 작성 시 반드시 이 가이드를 참조한다.
---

# Futurem UX/UI 구현 규약

## Description

Futurem 사내 PC 웹 시스템의 UX/UI 표준 규약. 모든 프론트엔드(HTML/CSS/JS) 작업 시 이 가이드에 정의된 값을 그대로 사용한다.  
임의의 색상·폰트·간격·컴포넌트 스타일을 사용하지 않는다.

## When to Use

- 신규 HTML 화면 개발 시
- 레이아웃 구조 선택 (기본형/보조형, GNB/LNB 방식)
- 버튼·탭·슬라이더·검색·모달 등 컴포넌트 구현 시
- 색상·폰트·간격 등 디자인 토큰 확인 시
- 오류 페이지 구현 시

---

## 1. 디자인 토큰 (Design Tokens)

### 1-1. 색상 팔레트

| 토큰 이름 | 색상 코드 | 사용처 |
|----------|----------|--------|
| `color-primary` | `#048add` | 헤더 배경, 활성 버튼, GNB 배경 |
| `color-primary-border` | `#166eca` | 강조 테두리, 검색바 테두리 |
| `color-primary-dark` | `#0d5fac` | 검색 버튼 배경 |
| `color-primary-hover` | `#88eaff` | Drop-Down GNB hover 대안 |
| `color-blue-btn` | `#008fca` | btn2(Primary 버튼) 배경 |
| `color-blue-btn-shadow` | `#007db9` | btn2 inset box-shadow |
| `color-blue-btn-border` | `#005c8b` | btn2 테두리 |
| `color-blue-btn-active` | `#0073bb` | GNB 구분선 |
| `color-gray-btn` | `#676d7c` | btn3(Secondary 버튼) 배경 |
| `color-gray-btn-border` | `#454545` | btn3 테두리 |
| `color-sidebar-bg` | `#f5f5f5` | 사이드바 배경 |
| `color-submenu-bg` | `#e9eaec` | GNB 2depth 배경, 서브메뉴 hover |
| `color-submenu-hover` | `#d9dbdc` | GNB 3depth hover |
| `color-border-main` | `#c4c4c4` | 헤더 하단·사이드바 우측 테두리 |
| `color-border-form` | `#c0c5cb` | 입력 요소·버튼 기본 테두리 |
| `color-border-separator` | `#dadada` | 구분선, Footer 상단선 |
| `color-border-subtle` | `#e1e3e4` | GNB 항목 구분선 |
| `color-table-header-bg` | `#eeeff0` | 테이블 thead/tbody th 배경 |
| `color-table-border` | `#828f9f` | 테이블 상단 테두리 |
| `color-table-row-border` | `#e4e4e4` | 테이블 셀 구분선 |
| `color-modal-header-bg` | `#555` | 모달 헤더 배경 |
| `color-text-default` | `#333` | 기본 본문 텍스트 |
| `color-text-muted` | `#555` | 푸터, 보조 텍스트 |
| `color-text-caption` | `#858585` | 비활성·캡션 텍스트 |
| `color-text-link` | `#0c6dcc` | 페이지네이션 현재 페이지 |
| `color-text-active` | `#166eca` | Tab-A 활성 텍스트 |
| `color-text-on-dark` | `#fff` | 헤더·버튼 위 텍스트 |
| `color-error-summary` | `#05507d` | 오류 페이지 요약 텍스트 |
| `color-error-detail` | `#0092de` | 오류 페이지 강조 텍스트 |
| `color-slider-active` | `#00a0e2` | 슬라이더 핸들·range 배경 |
| `color-overlay` | `rgba(0,0,0,0.2)` | 모달 배경 오버레이 |

### 1-2. 타이포그래피

| 요소 | 폰트 | 크기 | 굵기 | 색상 | 비고 |
|------|------|------|------|------|------|
| 기본 본문 | `"돋움", dotum, sans-serif` | `75%` (base) | 400 | `#333` | letter-spacing: 0, line-height: 1.17 |
| 헤더 h1 | `"맑은 고딕", Malgun Gothic` | `20px` | 400 | `#fff` | — |
| Point 버튼 | `"맑은 고딕", Malgun Gothic` | `20px` | bold | `#fff` | letter-spacing: -1px |
| LNB 페이지 제목 (h2) | `"맑은 고딕", Malgun Gothic` | `30px` | 400 | `#000` | line-height: 32px, letter-spacing: -2px |
| 모달 제목 (h2) | `"맑은 고딕", Malgun Gothic` | `16px` | 400 | `#fff` | line-height: 20px |
| GNB 주메뉴 | 기본 폰트 상속 | `14px` | 400 | `#fff` | active: `#048add` |
| 오류 요약 | `"맑은 고딕", Malgun Gothic` | `20px` | 400 | `#05507d` | line-height: 30px, letter-spacing: -1px |

### 1-3. 간격·크기 규약

| 요소 | 값 |
|------|-----|
| 사이드바 너비 | `200px` |
| 헤더 높이 (기본형) | `50px` |
| 헤더 높이 (보조형 전체) | `100px` (로고 50px + 배경바 50px) |
| 컨테이너 너비 (보조형) | `980px` |
| 최소 너비 (기본형) | `1345px` |
| 최소 너비 (보조형) | `1000px` |
| Footer 높이 | `105px` |
| Footer margin-top | `30px` |
| 입력 요소 높이 | `24px` |
| 슬라이더 트랙 높이 | `10px` |
| 슬라이더 핸들 크기 | `22px × 22px` |
| 모달 너비 | `500px` |
| 모달 패딩 (content) | `20px 20px 0` |
| 오류 페이지 컨테이너 | `600px`, padding: `40px 50px` |

### 1-4. Border Radius 규약

| 요소 | 값 |
|------|-----|
| Point 버튼 | `7px` |
| 일반 버튼 (btn1/2/3) | `4px` |
| 슬라이더 핸들 | `11px` (원형) |
| 슬라이더 트랙 | `5px` |
| GNB 주메뉴 hover (보조형) | `3px 3px 0 0` (상단만) |
| 페이지네이션 버튼 | `2px` |

### 1-5. Z-index 계층

| 레이어 | Z-index |
|--------|---------|
| 모달 배경 + 팝업 | `500` |
| 헤더 (기본형 B) | `200` |
| 사이드바 (기본형 A) | `200` |
| 헤더·사이드바 (기본형 B) | `200` / `100` |
| 기본 콘텐츠 | `auto (0)` |

---

## 2. 레이아웃 패턴

### 2-1. 기본형 A (좌측 고정 사이드바 + 상단 헤더)

```
┌─────────────────────────────────┐
│ HEADER (50px, #048add)          │  ← z-index: 200
├──────┬──────────────────────────┤
│ SIDE │                          │
│ BAR  │  CONTENT AREA            │
│ 200px│                          │
│(#f5f5│                          │
│  f5) │                          │
└──────┴──────────────────────────┘
```

**규약**
- 최소 너비: `1345px`
- 사이드바: `position: fixed; width: 200px; top: 0; left: 0; bottom: 0; background: #f5f5f5; border-right: 1px solid #c4c4c4`
- 헤더: `position: fixed; left: 0; top: 0; right: 0; height: 50px; background: #048add; border-bottom: 1px solid #c4c4c4`
- 콘텐츠: `margin-left: 200px; margin-top: 50px`
- CI 로고: `166px × 16px; margin: 17px auto` (사이드바 상단)
- Point 버튼: `168px × 31px`, 로고 하단 배치
- GFM(Global Function Menu): `position: absolute; right: 20px; top: 19px` — 구분선은 `1px solid rgba(255,255,255,.3); height: 12px`
- 콘텐츠 높이 동적 조절: `$(window).height() - $('#header').outerHeight()`

### 2-2. 기본형 B (상단 헤더에 로고 포함)

기본형 A와 동일한 레이아웃이나, CI 로고가 **헤더 좌측**에 위치함.

- 로고: `position: absolute; left: 15px; top: 16px`
- 로고 구분선: `display: inline-block; width: 1px; height: 17px; background: rgba(255,255,255,.3)`
- 헤더 z-index: `200`, 사이드바 z-index: `100`

### 2-3. 보조형 기본 구조 (Fixed 폭 컨테이너)

```
┌──────────────────────────────────────────┐
│ LOGO / 시스템명         (50px)            │
│ HEADER BAR (#048add)   (50px)            │
├──────────────────────────────────────────┤
│  ┌────────────── 980px ──────────────┐   │
│  │ SIDEBAR(200px) + CONTENT          │   │
│  └───────────────────────────────────┘   │
├──────────────────────────────────────────┤
│ FOOTER (105px)                           │
└──────────────────────────────────────────┘
```

**규약**
- 최소 너비: `1000px`
- 컨테이너: `width: 980px; margin: 0 auto`
- 헤더: 상단 50px 로고 영역 + `position: absolute; left: 0; top: 50px; height: 50px; background: #048add`
- 사이드바: `width: 200px; float: left; margin-right: 30px; background: #f5f5f5; border: 1px solid #c4c4c4`
- 로고·시스템명 구분선: `1px × 18px; background: #dadada`
- Footer: `margin-top: 30px; height: 105px; border-top: 1px solid #dadada`

---

## 3. GNB (Global Navigation) 패턴

### 3-1. 수직 GNB (기본형 사이드바 GNB)

**1depth 메뉴**

| 속성 | 값 |
|------|-----|
| 항목 구분선 | `border-top: 1px solid #e1e3e4` |
| 활성 구분선 | `border-top: 1px solid #c4c4c4; margin-top: -1px` |
| 링크 패딩 | `padding: 10px 35px 7px 40px` |
| 아이콘 크기 | `19px × 17px` (ic_gnb.png sprite) |
| hover/active bg | `#e9eaec` / bold |

**2depth 서브메뉴 (slideToggle 200ms)**

| 속성 | 값 |
|------|-----|
| 컨테이너 | `padding: 8px 0 9px; background: #e9eaec; display: none` |
| 항목 패딩 | `padding: 5px 15px 2px 51px` |
| 아이콘 | `15px × 13px; background-position: 0 -30px` |
| hover bg | `#d9dbdc` |

**토글 버튼:** `position: absolute; right: 9px; top: 8px; 15px × 15px` — sprite: 닫힘 `1px -59px` → 열림 `1px -89px`

**토글:** `slideToggle(200ms)` — `.togg` 클릭 시 `.open` 클래스 토글 + 하위 `ul` 슬라이드

### 3-2. 수평 GNB 일반형 (보조형, 2depth)

**위치:** `position: absolute; left: 0; top: 50px; width: 980px`

| 요소 | 값 |
|------|-----|
| 1depth 링크 | `padding: 12px 15px 17px; font-size: 14px; color: #fff` |
| 1depth 구분선 | `1px × 16px; background: #0073bb; position: absolute; left: 0; top: 17px` |
| 1depth hover/active | `color: #048add; background: #fff; border-radius: 3px 3px 0 0` |
| 2depth 구분선 바 | `position: absolute; left: 0; top: 100px; width: 100%; height: 40px; background: #fff; border-bottom: 1px solid #dadada` |
| 2depth 링크 | `padding: 15px 0 13px; float: left` |
| 2depth hover/active | `padding-bottom: 9px; color: #048add; border-bottom: 4px solid #048add` |

### 3-3. 수평 GNB Drop-Down형 (보조형, 3depth)

| 요소 | 값 |
|------|-----|
| 1depth hover | `color: #88eaff` |
| 2depth 드롭다운 | `position: absolute; top: 50px; left: 50%; width: 160px; margin-left: -80px; padding: 5px 0; background: #048add; border: 0 1px 1px solid #dadada` |
| 2depth 항목 | `padding: 6px 15px 3px; color: #fff` |
| 2depth hover | `color: #048add; background: #fff` |
| 3depth | `position: absolute; left: 160px; top: 0; width: 150px; background: #51bfed` |

### 3-4. Mega Drop-Down GNB (보조형, 3depth 테이블형)

| 요소 | 값 |
|------|-----|
| 메가메뉴 컨테이너 | `position: absolute; left: 0; top: 50px; width: 100%; background: #fff; border: 0 1px 1px solid #ccc` |
| 테이블 | `width: 100%; border-spacing: 0 30px; margin: -10px 0; 5컬럼 20%씩` |
| 셀 구분선 | `border-left: 1px solid #eaeaea` (첫 번째 셀 제외) |
| 2depth 링크 | `color: #048add; font-weight: bold; padding: 6px 15px 3px` |
| 3depth bullet | `width: 4px; height: 1px; position: absolute; left: 15px; padding-left: 23px` |

---

## 4. LNB (Local Navigation) 패턴

### 4-1. 기본형 LNB (헤더 h1에서 드롭다운)

| 요소 | 값 |
|------|-----|
| 컨테이너 | `position: absolute; left: 20px; top: 50px; width: 180px; background: #fff; border: 1px solid #c4c4c4` |
| h1 토글 아이콘 | `13px × 7px` (ic_lnb.png), `.on`에서 회전 |
| 2depth 항목 | `padding: 10px 9px 7px 30px; border-bottom: 1px solid #e1e3e4` |
| 2depth 아이콘 | `15px × 13px; background-position: 0 -60px` |
| 2depth hover | `background: #e9eaec` |
| 3depth | `position: absolute; left: 180px; top: -1px; width: 150px; background: #f5f5f5` |
| 3depth 항목 | `padding: 5px 9px 2px 19px` |
| 3depth bullet | `5px × 1px; background-position: 0 -90px` |
| 3depth hover | `background: #e1e3e4` |

### 4-2. 보조형 LNB (좌측 사이드바 수직 LNB)

| 요소 | 값 |
|------|-----|
| 컨테이너 | `padding: 15px 0; border-top: 1px solid #d0d0d0; border-bottom: 1px solid #d0d0d0` |
| 1depth 항목 | `padding: 6px 16px 3px 0` |
| 1depth hover | `color: #048add` |
| 1depth active | `color: #048add; text-decoration: underline` |
| 확장 아이콘 | `9px × 5px` (ic_lnb.png) |
| 2depth 컨테이너 | `margin: 5px 0; padding: 10px 0; background: #e9eaec; display: none` (`.active`에서 `display: block`) |
| 2depth 항목 | `padding: 6px 15px 3px 23px` |
| 2depth bullet | `4px × 1px; left: 15px; top: 11px` |
| 2depth hover | `color: #048add; text-decoration: underline` |
| 페이지 제목 h2 | `margin: 30px 0 20px; font: 30px "맑은 고딕"; line-height: 32px; letter-spacing: -2px` |

---

## 5. Footer 규약

**사용 컨텍스트:** 보조형 레이아웃 하단 (기본형에는 없음)

| 요소 | 값 |
|------|-----|
| 컨테이너 | `position: relative; height: 105px; margin-top: 30px; border-top: 1px solid #dadada` |
| 정책 링크 위치 | `position: absolute; left: 0; top: 20px` |
| 정책 링크 구분선 | `1px × 11px; background: #dadada; margin: 2px 5px 0` |
| 정책 링크 hover | `color: #048add; text-decoration: underline` |
| 사이트 링크 위치 | `position: absolute; right: 0` |
| 사이트 링크 버튼 | `display: block; padding: 6px 25px 4px 6px; border: 1px solid #c0c5cb` |
| 토글 아이콘 | `9px × 5px` (ic_togg.png), 열림: `background-position: 0 0` |
| 드롭다운 | `position: absolute; left: 0; bottom: 23px; width: 100%; background: #fff; border: 1px solid #c0c5cb` |
| 드롭다운 항목 hover | `background: #eaeaea` |
| WAC 마크 | `position: absolute; right: 170px; top: 13px` |
| Copyright | `position: absolute; left: 0; top: 50px; line-height: 17px; color: #555` |

**HTML 구조:**
```html
<div id="footer">
  <ul class="policy-link"><li><a>이용약관</a></li><li><span></span><a>개인정보처리방침</a></li></ul>
  <div class="site-link-1"><!-- 드롭다운 1 --></div>
  <div class="site-link-2"><!-- 드롭다운 2 --></div>
  <a class="wac-mark"><img src="img/mark_wac.png" alt="웹접근성인증마크"></a>
  <address>회사명 <span></span> 주소 <br>Copyright &copy; Futurem. All Rights Reserved.</address>
</div>
```

---

## 6. 컴포넌트 명세

### 6-1. 탭메뉴 (Tab Menu)

**Tab-A (소프트 스타일 — 흰 배경 활성)**

| 상태 | padding | background | color | 기타 |
|------|---------|------------|-------|------|
| 컨테이너 `.tab-a` | `0 1px 0 5px` | — | — | `margin-bottom: 15px; border-bottom: 1px solid #c0c5cb` |
| 기본 `.tab-a > li > a` | `9px 14px 7px` | `#e9e9eb` | 상속 | `border: 1px solid #c0c5cb; border-bottom: none` |
| 활성/hover | `9px 14px 8px` | `#fff` | `#166eca` | `font-weight: bold; letter-spacing: -1px` |

**Tab-B (솔리드 스타일 — 파란 배경 활성)**

| 상태 | padding | background | color | 기타 |
|------|---------|------------|-------|------|
| 기본 `.tab-b > li > a` | `9px 14px 7px` | `#fff` | 상속 | `border: 1px solid #c0c5cb` |
| 활성/hover | `9px 14px 7px` | `#048add` | `#fff` | `position: relative; border-color: #048add` |

---

### 6-2. 버튼 (Buttons)

| 클래스 | 역할 | 핵심 스펙 |
|--------|------|----------|
| `.btn-point` | 주요 CTA | `168px × 31px; padding-top: 7px; font: bold 20px "맑은고딕"; color: #fff; bg: #048add; border: 1px solid #166eca; radius: 7px` |
| `.btn-point.disabled` | 비활성 CTA | `color: #e8e7e7; bg: #bbbcbe; border-color: #97989a` |
| `.btn-group > li > a` | 그룹 버튼 | `min-width: 24px; padding: 1px 9px 0; line-height: 21px; bg: #fff; box-shadow: #eeeff0 0 -1px inset; border: 1px solid #c0c5cb` |
| `.btn-group active/hover` | — | `color: #fff; bg: #008fca; box-shadow: #007db9 0 -1px inset; border-color: #005c8b` |
| `.btn-group :first/:last` | — | `border-radius: 4px 0 0 4px` / `0 4px 4px 0` |
| `.btn0` | 슬롯 아이콘 (O/X/달력) | `22px × 22px; bg: #fff; box-shadow: #eeeff0 inset; border: 1px solid #c0c5cb; radius: 4px` |
| `.btn0.ic-o/ic-x/ic-cal` | sprite | `bg-pos: 3px 3px / 3px -27px / 4px -58px` (ic_btn0.png) |
| `.btn1` | 소형 버튼 | `min-width: 24px; padding: 6px 9px 4px; bg: #fff; box-shadow: #eeeff0 inset; border: 1px solid #c0c5cb; radius: 4px` |
| `.btn1.disabled` | — | `color: #8e9297; bg: #dedfe2; box-shadow: none; border-color: #a8aeb4` |
| `.btn1.ic-circle/excel/refresh` | sprite | `14px; bg-pos: 0 4px / 0 -26px / 18px 0 -56px` (ic_btn1.png) |
| `.btn2` | Primary (파란) | `padding: 6px 9px 4px; color: #fff; bg: #008fca; box-shadow: #007db9 inset; border: 1px solid #005c8b; radius: 4px` |
| `.btn3` | Secondary (회색) | `padding: 6px 9px 4px; color: #fff; bg: #676d7c; box-shadow: #676d7c inset; border: 1px solid #454545; radius: 4px` |

**페이지네이션 (.paging)**

| 요소 | 값 |
|------|-----|
| 컨테이너 | `margin: 10px 0; text-align: center` |
| 일반 번호 | `display: inline-block; padding: 3px 6px 2px` |
| 현재 (.current) | `font-weight: bold; color: #0c6dcc; text-decoration: underline` |
| 화살표 버튼 | `17px × 17px; text-indent: -9999px; bg: #fff; border: 1px solid #c0c5cb; radius: 2px` |
| 비활성 화살표 | `opacity: .4` |
| .prev/.next 여백 | `margin-right: 8px` / `margin-left: 8px` |
| sprite (ic_paging.png) | first: `3px 4px` / prev: `-20px 4px` / next: `-43px 4px` / last: `-71px 4px` |

---

### 6-3. 슬라이더 (jQuery UI Slider)

**필수 라이브러리:** `jquery.min.js` + `jquery-ui.min.js` + `jquery-ui.min.css`

| 요소 | 값 |
|------|-----|
| 트랙 | `background: #ccc; border-radius: 5px` · 수평: `height: 10px` · 수직: `width: 10px; display: inline-block` |
| 핸들 | `22px × 22px; background: #00a0e2; border-radius: 11px` · 수평: `top: -6px; margin-left: -11px` · 수직: `left: -6px; margin-bottom: -11px` |
| 포커스 내부 원 | `:focus:before` `10px × 10px; margin: 6px auto; background: #fff; border-radius: 5px` |
| 핸들 값 말풍선 `.val` | `37px × 14px; padding-top: 4px; font-weight: bold; color: #00a0e2; border: 1px solid #aaa` |
| range 활성영역 | `background: #00a0e2; border-radius: 5px` |
| 최소/최댓값 표시 | `.min/.max` `color: #858585` · 수평: `top: 20px` · 수직: `left: 20px` |

**초기화 옵션:**

| 종류 | 옵션 |
|------|------|
| 최솟값 기준 | `range: 'min'` |
| 최댓값 기준 | `range: 'max'` |
| 범위 선택 | `range: true, values: [20, 80]` |
| 수직 | `orientation: 'vertical'` |

```javascript
$('#slider-h').slider({
  range: 'min', min: 0, max: 100, value: 50,
  slide: function(event, ui) { $(this).find('.val').text(ui.value); }
});
```

---

### 6-4. 검색모듈 (Search Module)

#### 검색바 (기본)

| 요소 | 핵심 속성 |
|------|----------|
| `.search-bar` | `display: inline-block; background: #fff; border: 1px solid #166eca` |
| `> input[type=text]` | `width: 345px; height: 22px; border: none` |
| `> a` (검색 버튼) | `26px × 22px; vertical-align: middle; bg: ic_btn.png 5px 3px` |

#### 검색 헬퍼 공통

| 요소 | 핵심 속성 |
|------|----------|
| `.search-helper` | `position: absolute; background: #fff; border: 1px solid #c0c5cb` |
| 항목 패딩 | `padding: 6px 11px 3px` |
| `.selected` / hover | `background: #f0f0f0` |

#### 순간검색 (instant)

| 요소 | 핵심 속성 |
|------|----------|
| `.search-helper-specific` | `max-height: 203px; overflow-y: auto` |
| `span` | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` |
| `.title` | `font-weight: bold; color: #858585` |
| `.url` | `color: #858585` |

#### 자동완성 (autocomplete)

| 요소 | 핵심 속성 |
|------|----------|
| `.search-helper-auto` | `max-height: 223px; overflow-y: auto` |
| `em` (미매칭) | `color: #cecece` |

#### 검색어 랭킹 (ranking)

| 요소 | 핵심 속성 |
|------|----------|
| `.search-helper-rank a` | `padding-right: 29px` |
| `.fluc` (순위변동) | `position: absolute; right: 11px; top: 12px; 9px × 7px; bg: ic_rank.png` |
| `.ic-up` / `.ic-down` / `.ic-nc` | `bg-pos: 0 0` / `0 -30px` / `0 -60px` |

#### 상세검색 토글

| 요소 | 핵심 속성 |
|------|----------|
| `.btn-togg-detail` | `display: inline-block; padding: 6px 22px 4px 9px; bg: #fff; border: 1px solid #166eca` |
| `::after` (기본) | `position: absolute; right: 7px; top: 7px; 9px × 7px; bg: ic_btn.png 0 -30px` |
| `::after` (`.on`) | `bg-pos: 0 -60px` |

#### 상세검색 폼

| 요소 | 핵심 속성 |
|------|----------|
| `.search-detail` | `padding: 10px 0; background: #fff; border-bottom: 1px solid #e4e4e4` |
| `> table` | `display: inline-block; margin-right: 1px; vertical-align: middle; border-spacing: 0` |
| `table th` | `padding: 5px 0 5px 19px; padding-right: 9px; text-align: left` |
| `.btn-search` | `58px × 35px; padding-top: 23px; color: #fff; bg: #0d5fac; border-radius: 4px` |
| `.btn-search.single-line` | `height: 18px; padding-top: 6px` |

#### 폼 요소 기본 스타일

| 요소 | 핵심 속성 |
|------|----------|
| `select` | `height: 24px; padding: 2px; border: 1px solid #c0c5cb` |
| `input[type=text]` | `box-sizing: border-box; height: 24px; padding: 0 5px; line-height: 14px; border: 1px solid #c0c5cb` |
| `input[checkbox/radio]` | `14px × 14px; margin-top: -2px` |
| `textarea` | `box-sizing: border-box; padding: 5px; line-height: 16px; border: 1px solid #c0c5cb` |

---

### 6-5. 모달 대화상자 (Modal Dialog)

| 클래스 | 핵심 속성 |
|--------|----------|
| `.modal-back` | `position: fixed; z-index: 500; left/top: 0; width/height: 100%; background: rgba(0,0,0,0.2)` |
| `.modal-wrap` | `position: fixed; z-index: 500; left: 50%; top: 50%; margin-left: -251px` |
| `.modal-pop` | `width: 500px; background: #fff; border: 1px solid #555` |
| `.modal-header` | `min-height: 20px; padding: 8px 50px 12px 20px; color: #fff; background: #555` |
| `.modal-header h2` | `font-size: 16px; line-height: 20px; font-weight: normal; font-family: "맑은 고딕"` |
| `.modal-header .close` | `position: absolute; right: 0; top: 0; 40px × 40px; bg: modal_close.png 50% 50%` |
| `.modal-content` | `max-height: 570px; min-height: 100px; overflow-y: auto; padding: 20px 20px 0` |
| `.modal-content::after` | `display: block; height: 20px` (하단 여백) |
| `.btns-bottom` | `margin-top: 10px; text-align: center` |

#### 모달 내부 테이블 (type-a)

| 선택자 | 핵심 속성 |
|--------|----------|
| `table.type-a` | `border-collapse: collapse; width: 100%; border-top: 1px solid #828f9f` |
| `th, td` | `height: 24px; padding: 5px 8px; line-height: 18px; border-right/bottom: 1px solid #e4e4e4` |
| `th[rowspan]` | `border-left: 1px solid #e4e4e4` |
| `th:last-child`, `td:last-child` | `border-right: none; border-left: 1px solid #e4e4e4` |
| `thead th` / `tbody th` | `background: #eeeff0` / `text-align: left; background: #eeeff0` |

**HTML 구조 예시:**
```html
<div class="modal-back"></div>
<div class="modal-wrap">
  <div class="modal-pop">
    <div class="modal-header">
      <h2>대화상자 제목</h2>
      <a href="#" class="close">닫기</a>
    </div>
    <div class="modal-content">
      <!-- 내용 -->
      <div class="btns-bottom">
        <a href="#" class="btn2">확인</a>
        <a href="#" class="btn3">취소</a>
      </div>
    </div>
  </div>
</div>
```

---

### 6-6. 오류 안내 페이지 (Error Page)

| 선택자 | 핵심 속성 |
|--------|----------|
| `body.error` | `min-width: 800px; text-align: center; height: 100%` |
| `body.error::before` | `display: inline-block; height: 100%; margin-right: -4px; vertical-align: middle` |
| `#error-info` | `display: inline-block; width: 600px; padding: 40px 50px; background: #f2f2f2; border: 1px solid #d5d5d5` |
| `.logo` | `display: inline-block; margin-bottom: 20px` |
| `.summary` | `font-size: 20px; line-height: 30px; letter-spacing: -1px; color: #05507d; font-family: "맑은 고딕"` |
| `.detail` | `margin: 30px 0 40px; text-align: left; line-height: 20px` |
| `.detail strong` | `color: #0092de` |
| `.btns a` | `margin: 0 3px` |

**표준 오류 메시지 구조:**
```html
<body class="error">
  <div id="error-info">
    <a href="#" class="logo"><img src="img/logo_message.png" alt="Futurem"></a>
    <p class="summary">죄송합니다. 요청하신 페이지를 찾을 수 없습니다.</p>
    <div class="detail">
      <strong>404 Not Found</strong><br>
      찾으시는 페이지의 주소가 잘못 입력되었거나,<br>
      주소의 변경 혹은 삭제로 인해 이용하실 수 없습니다.
    </div>
    <div class="btns">
      <a href="/" class="btn2">홈으로</a>
      <a href="javascript:history.back()" class="btn1">이전 페이지</a>
    </div>
  </div>
</body>
```

---

## 7. 아이콘 스프라이트 목록

| 파일명 | 사용처 | 비고 |
|--------|--------|------|
| `img/ic_gnb.png` | GNB 메뉴 아이콘, 토글 버튼 | 스프라이트 시트 |
| `img/ic_lnb.png` | LNB 메뉴 아이콘, 확장 토글 | 스프라이트 시트 |
| `img/ic_btn0.png` | btn0 (O/X/달력 아이콘) | 스프라이트 시트 |
| `img/ic_btn1.png` | btn1 (원/엑셀/새로고침) | 스프라이트 시트 |
| `img/ic_btn.png` | 검색 아이콘, 상세검색 토글 | 스프라이트 시트 |
| `img/ic_togg.png` | Footer 사이트링크 드롭다운 토글 | 스프라이트 시트 |
| `img/ic_rank.png` | 검색 랭킹 순위변동 (↑↓–) | 스프라이트 시트 |
| `img/ic_paging.png` | 페이지네이션 화살표 | 스프라이트 시트 |
| `img/arr_slider.png` | 슬라이더 핸들 말풍선 화살표 | 수평/수직 |
| `img/modal_close.png` | 모달 닫기 버튼 | 단일 이미지 |
| `img/logo_ci.png` | Futurem CI 로고 | 166×16px |
| `img/logo_sys.png` | 시스템명 로고 | 가변 크기 |
| `img/mark_wac.png` | 웹접근성 인증마크 (Footer) | 단일 이미지 |
| `img/logo_message.png` | 오류 페이지 로고 | 단일 이미지 |
| `img/btn_datepicker.png` | 날짜 선택 버튼 | 단일 이미지 |

---

## 8. jQuery 인터랙션 패턴

| 패턴 | 트리거 | 동작 |
|------|--------|------|
| GNB 2depth 슬라이드 | `.gnb .togg` click | `.open` 토글 + `> ul` `slideToggle(200ms)` |
| 동적 콘텐츠 높이 | window resize | `#content` height = `$(window).height() - $('#header').outerHeight()` |
| LNB 드롭다운 | `#header h1 > a` click | h1에 `.on` 토글 + `.lnb` `slideToggle(200ms)` |
| Footer 사이트링크 | `.site-link .btn` click | `.opened` 토글 + `ul` `.toggle()` |

### 8-5. 상태 클래스 명세

| 클래스 | 의미 |
|--------|------|
| `.active` | 현재 선택·활성 상태 |
| `.on` | 열림/표시 상태 |
| `.open` | GNB/LNB 펼침 상태 |
| `.opened` | Footer 드롭다운 펼침 상태 |
| `.disabled` | 비활성 (클릭 불가) |
| `.selected` | 검색 헬퍼 키보드 선택 항목 |

---

## 9. 레이아웃 선택 가이드

| 조건 | 권장 레이아웃 |
|------|-------------|
| 사내 업무 시스템 (고정 폭 GNB) | **기본형 A** 또는 **기본형 B** |
| CI 로고를 상단 헤더에 표시 | **기본형 B** |
| 포털/공개 시스템 (유동 폭) | **보조형** |
| 메뉴가 2depth 이하, 항목 적음 | **보조형 GNB 일반형** |
| 메뉴가 3depth, 항목 보통 | **보조형 GNB Drop-Down형** |
| 메뉴가 3depth, 항목 많음 | **보조형 GNB Mega Drop-Down형** |
| 보조형 + 좌측 세부 메뉴 필요 | **보조형 LNB** 조합 |
| Footer 정책·저작권 필요 | **보조형 Footer** 추가 |
| 페이지별 세부 메뉴 (기본형) | **기본형 LNB** 조합 |




