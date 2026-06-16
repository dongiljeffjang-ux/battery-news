// POST /api/login  { password }  → 성공 시 서명 쿠키 설정
import { issueToken, COOKIE } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const sitePw = process.env.SITE_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "";
  if (!sitePw || !secret) {
    res.status(500).json({ error: "server_not_configured" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = (body && body.password) || "";

  // 타이밍 안전 비교
  const a = Buffer.from(String(password));
  const b = Buffer.from(sitePw);
  const ok = a.length === b.length &&
    (await import("crypto")).timingSafeEqual(a, b);

  if (!ok) {
    res.status(401).json({ error: "invalid_password" });
    return;
  }

  const token = issueToken(secret);
  res.setHeader("Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 3600}`);
  res.status(200).json({ ok: true });
}
