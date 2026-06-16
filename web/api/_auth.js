// 공유 인증 유틸: HMAC 서명 쿠키 검증
// 환경변수 SITE_PASSWORD(접속 비밀번호), AUTH_SECRET(서명키) 필요.
import crypto from "crypto";

const COOKIE = "bn_auth";

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

// 로그인 성공 시 발급할 쿠키 값 생성 (7일 유효)
export function issueToken(secret) {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (sign(payload, secret) !== sig) return false;
  return Number(payload) > Date.now();
}

export function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(
    raw.split(";").map((c) => {
      const i = c.indexOf("=");
      return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
    }).filter((p) => p[0])
  );
}

export function isAuthed(req) {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) return false;
  const token = parseCookies(req)[COOKIE];
  return verifyToken(token, secret);
}

export { COOKIE };
