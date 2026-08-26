// GET /api/logout → 쿠키 만료 후 로그인 페이지로
import { COOKIE } from "./_auth.js";

export default function handler(req, res) {
  res.setHeader("Set-Cookie",
    `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  res.statusCode = 302;
  res.setHeader("Location", "/");
  res.end();
}
