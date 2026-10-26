# 퓨처엠 SSO 인증 연동 가이드

## 1. 문서 목적
이 문서는 퓨처엠 SSO 3.0 기반으로 Legacy 시스템을 연동할 때 필요한 구현 절차와 인증 방식별(HTTP 토큰, Header, Edge, EP-Lite) 개발 포인트를 정리한 실무용 가이드입니다.

## 2. 적용 범위
- SWP 연동
  - HTTP 인증 토큰 방식
  - Header 인증 방식
  - Edge 브라우저 연계 HTTP 인증 토큰 방식
- EP-Lite 연동
  - HTTP 인증 토큰 방식
  - Header 인증 방식

## 3. 공통 연동 개념
1. 사용자가 포털(SWP/EP-Lite)에서 로그인한다.
2. 대상 시스템 호출 시 `redirect` URL을 통해 SSO 인증 토큰(`ssoToken`)이 전달된다.
3. 대상 시스템은 SSO 검증 URL(`isValidSSO.jsp` 또는 `isValidONESSO.jsp`)에 토큰 유효성 검증을 요청한다.
4. 검증 결과 문자열을 파싱해 사용자 세션/권한을 생성한다.
5. 검증 실패 시 로그인 페이지 또는 오류 페이지로 이동시킨다.

## 4. 사전 준비 사항

### 4.1 네트워크/인프라
- 대상 시스템 대표 IP/Port 또는 도메인 정보를 SSO/EP 담당자에게 전달
- SSO 시스템 -> 대상 시스템 구간 방화벽 오픈 확인
- 필요 시 hosts/DNS 등록
- NAT IP 사용 필요(방화벽 정책 반영)

### 4.2 Header 방식 추가 준비
- WebSEAL 정션(Junction) 구성이 선행되어야 함
- 정션 설정 완료 후, 포털에서 정션 경유로 대상 시스템 접근 테스트

## 5. 공통 파라미터
SSO 연동 페이지에서 일반적으로 아래 파라미터를 수신합니다.

- `ssoToken`: SSO 인증 토큰
- `domainName`: SSO 도메인(검증 URL 구성 시 사용)
- `LANG`: 사용자 언어
- `TIMEZONE`: 사용자 타임존

## 6. SWP 연동 가이드

### 6.1 HTTP 인증 토큰 방식

#### 6.1.1 주요 URL
- Redirect URL(개발):
  - `http://uswpsso.Futurem.net/idms/U61/jsp/redirect.jsp?redir_url=`
- Redirect URL(운영):
  - `http://swpsso.Futurem.net/idms/U61/jsp/redirect.jsp?redir_url=`
- 유효성 검증 URL:
  - `http://{domainName}/idms/U61/jsp/isValidSSO.jsp`

#### 6.1.2 호출 규칙
- 대상 시스템 URL에 파라미터가 없는 경우:
  - `...redirect.jsp?redir_url=http://legacy-system/path`
- 대상 시스템 URL에 파라미터가 있는 경우:
  - `redir_url` 뒤 URL 전체를 인코딩해 전달

#### 6.1.3 서버 검증 요청 규칙
- 요청 헤더에 인증 쿠키 설정
  - `Cookie: SWP-H-SESSION-ID={ssoToken}`
- 검증 결과가 `Unauthenticated` 또는 `error`이면 실패 처리

#### 6.1.4 구현 예시(의사코드)
```text
1) ssoToken, domainName, LANG, TIMEZONE 수신
2) ssoToken 공백 -> '+' 치환(필요 시)
3) GET http://{domainName}/idms/U61/jsp/isValidSSO.jsp
   Header: Cookie=SWP-H-SESSION-ID={ssoToken}
4) 응답 문자열 파싱(',' 구분)
5) 사용자 세션 생성
6) 실패 시 오류 메시지 출력/로그인 페이지 이동
```

### 6.2 Header 인증 방식

#### 6.2.1 개요
- IBM TAM(WebSEAL) 정션 기반 방식
- SSO 시스템이 전달한 Request Header에서 사용자 속성을 읽어 로그인 처리

#### 6.2.2 구현 포인트
- 코드 예시:
  - `String attr = request.getHeader("속성명");`
- 속성명은 시스템마다 다를 수 있으므로, 반드시 SSO 속성 정의서 기준으로 매핑
- 장점: 패스워드 동기화 불필요
- 유의: 도메인/정션 경로 전환, 소스 수정 필요

### 6.3 Edge 브라우저 연계 방식(HTTP 토큰)

#### 6.3.1 적용 시나리오
- EP를 IE로 사용 중, 앱 호출은 Edge에서 실행되는 환경

#### 6.3.2 유의사항
- 브라우저 간 세션 공유 불가
- Edge에서 실행된 시스템이 다시 다른 시스템을 호출할 때 제약 발생 가능
- 토큰 검증 및 서버 세션 생성 로직을 더 엄격하게 구성 필요

## 7. EP-Lite 연동 가이드

### 7.1 HTTP 인증 토큰 방식

#### 7.1.1 주요 URL
- Redirect URL:
  - `http://tone.Futurem.net/idms/webapps/jsp/one/one_redirect.jsp?redir_url=`
- 유효성 검증 URL:
  - `http://{domainName}/idms/webapps/jsp/one/isValidONESSO.jsp`

#### 7.1.2 서버 검증 요청 규칙
- 요청 헤더에 인증 쿠키 설정
  - `Cookie: PD-ID={ssoToken}`
- 검증 결과를 `,` 구분자로 파싱해 사용자 세션/권한 생성

#### 7.1.3 구현 예시(의사코드)
```text
1) ssoToken, domainName, LANG, TIMEZONE 수신
2) ssoToken 공백 -> '+' 치환(필요 시)
3) GET http://{domainName}/idms/webapps/jsp/one/isValidONESSO.jsp
   Header: Cookie=PD-ID={ssoToken}
4) 응답 파싱 후 사용자 세션 생성
5) 실패 시 로그인 페이지 이동
```

### 7.2 Header 인증 방식
- WebSEAL 정션 기반 구조는 SWP Header 방식과 동일
- 대상 시스템에서 Request Header를 읽어 사용자 로그인 처리
- 테스트 절차:
  1. 대상 시스템 정보 전달
  2. 방화벽 오픈 확인
  3. 정션 설정
  4. EP-Lite에서 정션 경유 호출
  5. Header 사용자 정보 추출 및 SSO 성공 확인

## 8. 사용자 정보 항목

### 8.1 SWP 사용자 정보 항목
| 코드 | 의미 |
|---|---|
| `iv-user` | ID |
| `sp_empno` | 사번 |
| `companyCode` | 회사코드 |
| `sn` | 사번(보조 항목) |
| `seealso` | 부서명 |
| `departmentNumber` | 부서코드 |
| `jobtitle` | 직책 |
| `companyname` | 회사명 |
| `displayname` | 영문성명 |
| `mail` | 메일주소 |
| `inoutside` | 사내/외 구분 (`I`, `IVD`, `OVD`) |
| `sp_user_timezone` | 타임존 |
| `sp_user_language` | 언어 |
| `lastaccessip` | 최종 접속 IP |
| `lastaccessdate` | 최종 접속 일시 |
| `sp_agenttype` | 접속분류 (`P`: PC, `M`: 모바일) |

### 8.2 EP-Lite 사용자 정보 항목
| 코드 | 의미 |
|---|---|
| `iv-user` | 계정 |
| `sp_empno` | 사번 |
| `companyCode` | 회사코드 |
| `sp_user_timezone` | 타임존 |
| `sp_user_language` | 언어 |
| `inoutside` | 사내/외 구분 |

## 9. 언어별 샘플 코드

아래 샘플은 슬라이드의 언어별 예시를 문서형으로 정리한 코드입니다.

- SWP
  - 검증 URL: `http://{domainName}/idms/U61/jsp/isValidSSO.jsp`
  - 쿠키: `SWP-H-SESSION-ID={ssoToken}`
- EP-Lite
  - 검증 URL: `http://{domainName}/idms/webapps/jsp/one/isValidONESSO.jsp`
  - 쿠키: `PD-ID={ssoToken}`

### 9.1 Java (Servlet)
```java
String ssoToken = request.getParameter("ssoToken");
String domainName = request.getParameter("domainName");
String lang = request.getParameter("LANG");
String timezone = request.getParameter("TIMEZONE");

// SWP 예시 (EP-Lite는 URL만 isValidONESSO.jsp로 변경)
String checkUrl = "http://" + domainName + "/idms/U61/jsp/isValidSSO.jsp";
ssoToken = (ssoToken == null) ? "" : ssoToken.trim().replace(" ", "+");

HttpURLConnection conn = (HttpURLConnection) new URL(checkUrl).openConnection();
conn.setRequestMethod("GET");
conn.setRequestProperty("Cookie", "SWP-H-SESSION-ID=" + ssoToken); // EP-Lite: PD-ID

String result = new String(conn.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
if (result.contains("Unauthenticated") || result.contains("error")) {
    response.sendRedirect("/login");
    return;
}

String[] values = result.split(",");
String userId = values.length > 0 ? values[0] : "";
request.getSession(true).setAttribute("userId", userId);
```

### 9.2 ASP (Classic ASP / VBScript)
```vb
Dim ssoToken, domainName, lang, timezone, ssoURL
Dim httpObj, resultText

ssoToken   = Trim(Request.Form("ssoToken"))
domainName = Trim(Request.Form("domainName"))
lang       = Trim(Request.Form("LANG"))
timezone   = Trim(Request.Form("TIMEZONE"))
ssoToken   = Replace(ssoToken, " ", "+")

' SWP 예시 (EP-Lite는 /idms/webapps/jsp/one/isValidONESSO.jsp)
ssoURL = "http://" & domainName & "/idms/U61/jsp/isValidSSO.jsp"

Set httpObj = Server.CreateObject("WinHttp.WinHttpRequest.5.1")
httpObj.Open "GET", ssoURL, False
httpObj.SetRequestHeader "Content-Type", "application/x-www-form-urlencoded"
httpObj.SetRequestHeader "Cookie", "SWP-H-SESSION-ID=" & ssoToken  ' EP-Lite: PD-ID
httpObj.Send

If httpObj.Status <> 200 Then
    response.write "<script>alert('통합인증에 실패했습니다.');self.close();</script>"
Else
    resultText = httpObj.ResponseText
    If InStr(resultText, "Unauthenticated") > 0 Or InStr(resultText, "error") > 0 Then
        response.write "<script>alert('통합인증에 실패했습니다. 다시 로그인 하십시오.');self.close();</script>"
    Else
        ' resultText를 "," 기준으로 파싱하여 세션 생성
    End If
End If
Set httpObj = Nothing
```

### 9.3 PHP
```php
<?php
$ssoToken   = trim($_POST['ssoToken'] ?? '');
$domainName = trim($_POST['domainName'] ?? '');
$lang       = trim($_POST['LANG'] ?? '');
$timezone   = trim($_POST['TIMEZONE'] ?? '');
$ssoToken   = str_replace(' ', '+', $ssoToken);

// SWP 예시 (EP-Lite: /idms/webapps/jsp/one/isValidONESSO.jsp)
$url = "http://{$domainName}/idms/U61/jsp/isValidSSO.jsp";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/x-www-form-urlencoded",
        "Cookie: SWP-H-SESSION-ID={$ssoToken}" // EP-Lite: PD-ID
    ],
    CURLOPT_TIMEOUT => 10,
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || $result === false || str_contains($result, "Unauthenticated") || str_contains($result, "error")) {
    header("Location: /login");
    exit;
}

$parts = explode(",", $result);
$userId = $parts[0] ?? "";
// TODO: 사용자 세션 생성
```

### 9.4 Python (FastAPI)
```python
import requests
from fastapi import FastAPI, Form
from fastapi.responses import RedirectResponse, JSONResponse

app = FastAPI()

SWP_REDIRECT_URL = "http://uswpsso.Futurem.net/idms/U61/jsp/redirect.jsp?redir_url="
SWP_VALID_CHECK_URL = "http://{domainName}/idms/U61/jsp/isValidSSO.jsp"
EP_VALID_CHECK_URL = "http://{domainName}/idms/webapps/jsp/one/isValidONESSO.jsp"

@app.get("/login")
def login():
    return RedirectResponse(url=SWP_REDIRECT_URL + "https%3A%2F%2Fmyapp.example.com%2Fsso%2Fcallback")

@app.post("/sso/callback")
def callback(
    ssoToken: str = Form(...),
    domainName: str = Form(...),
    LANG: str = Form(default="ko"),
    TIMEZONE: str = Form(default="Asia/Seoul"),
):
    token = ssoToken.strip().replace(" ", "+")

    # SWP 예시 (EP-Lite 사용 시 EP_VALID_CHECK_URL로 변경)
    check_url = SWP_VALID_CHECK_URL.format(domainName=domainName)
    headers = {"Cookie": f"SWP-H-SESSION-ID={token}"}  # EP-Lite: PD-ID
    r = requests.get(check_url, headers=headers, timeout=10)

    if r.status_code != 200 or "Unauthenticated" in r.text or "error" in r.text:
        return RedirectResponse(url="/login")

    values = [v.strip() for v in r.text.split(",")]
    return JSONResponse({"ok": True, "userId": values[0] if values else ""})
```

### 9.5 ASP.NET (C#)
```csharp
using System.Net;
using System.IO;

string ssoToken = (Request.Form["ssoToken"] ?? "").Trim().Replace(" ", "+");
string domainName = (Request.Form["domainName"] ?? "").Trim();
string lang = (Request.Form["LANG"] ?? "").Trim();
string timezone = (Request.Form["TIMEZONE"] ?? "").Trim();

// SWP 예시 (EP-Lite는 isValidONESSO.jsp + Cookie를 PD-ID로 변경)
string requestUrl = $"http://{domainName}/idms/U61/jsp/isValidSSO.jsp";

HttpWebRequest req = (HttpWebRequest)WebRequest.Create(requestUrl);
req.Method = "GET";
req.ContentType = "application/x-www-form-urlencoded";
req.Headers.Set("Cookie", "SWP-H-SESSION-ID=" + ssoToken); // EP-Lite: PD-ID

string resultValue = "";
using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
using (Stream stream = resp.GetResponseStream())
using (StreamReader reader = new StreamReader(stream))
{
    resultValue = reader.ReadToEnd();
}

if (string.IsNullOrEmpty(resultValue) ||
    resultValue.Contains("Unauthenticated") ||
    resultValue.Contains("error"))
{
    Response.Redirect("/login");
    return;
}

string[] values = resultValue.Split(',');
string userId = values.Length > 0 ? values[0] : "";
Session["userId"] = userId;
```

## 10. 예외 처리 가이드

### 10.1 주요 예외
- `java.net.UnknownHostException`: 도메인 호출 오류
- `java.net.ConnectException`: 대상 시스템 연결 오류
- `java.net.SocketException`: 소켓/연결 오류

### 10.2 처리 원칙
- 네트워크/방화벽/DNS를 우선 점검
- SSO 연동 담당자 + 네트워크 담당자 합동으로 원인 확인
- 장애 로그에 아래 정보를 반드시 남김
  - 호출 URL
  - 수신 파라미터 존재 여부(`ssoToken`, `domainName`)
  - HTTP 상태코드
  - 실패 메시지 원문

## 11. 테스트 체크리스트
- [ ] 포털 로그인 상태에서 redirect URL 호출 시 대상 시스템 진입 성공
- [ ] 대상 시스템 파라미터 포함 URL 인코딩 처리 정상
- [ ] 토큰 검증 API 호출 성공(HTTP 200)
- [ ] `Unauthenticated`/`error` 실패 분기 동작 확인
- [ ] 사용자 세션 생성 및 권한 매핑 확인
- [ ] Header 방식의 경우 속성명 매핑 정확성 확인
- [ ] 브라우저(특히 Edge 연계)별 재현 테스트 완료

## 12. FAQ / 운영 문의
- 앱을 EP/EP-Lite에 등록하는 절차는 포털 담당자에게 문의
- 앱 내 인사정보 연동은 SSO 범위가 아니므로 별도 담당과 협의
- 사용자 권한(업무별 접근권한) 정책은 운영 담당자와 협의
- 방화벽 오픈이 선행되지 않으면 SSO 통신 불가

---

## 부록 A. 구현 시 권장사항
- 검증 API 호출은 서버-서버 통신으로만 처리
- 클라이언트(브라우저)에 토큰 검증 로직 노출 금지
- 토큰/사용자정보 로그 마스킹 적용
- 연동 초기에는 디버그 로그를 상세히 남기고 안정화 후 축소

## 부록 B. 문서 관리
- 기준 문서: `D:\Workspace\futurem-sso\퓨처엠_SSO_연동_가이드.md` 통합본
- 본 문서: 슬라이드 설명 제거 후 실무 절차 중심으로 재구성




