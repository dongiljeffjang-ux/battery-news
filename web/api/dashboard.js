// GET /dashboard → 인증된 경우에만 대시보드 HTML 반환, 아니면 로그인으로
import fs from "fs";
import path from "path";
import { isAuthed } from "./_auth.js";

export default function handler(req, res) {
  if (!isAuthed(req)) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
    return;
  }
  const html = fs.readFileSync(
    path.join(process.cwd(), "api", "_dashboard.html"), "utf-8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(html);
}
