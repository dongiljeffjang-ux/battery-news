// 로컬 개발 서버 — Vercel 서버리스 핸들러를 Express로 래핑
// GitLab 배포 시 이 파일을 기준으로 컨테이너화
import "dotenv/config";
import express from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static(__dir)); // index.html, office.html, timeline.html, assets/

// Vercel 핸들러를 Express 미들웨어로 변환하는 어댑터
function adapt(handlerModule) {
  return async (req, res) => {
    try {
      const mod = await handlerModule();
      await mod.default(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: String(err) });
    }
  };
}

// ─── API 라우트 ───
app.get("/api/news",                  adapt(() => import("./api/news.js")));
app.post("/api/master-login",         adapt(() => import("./api/master-login.js")));
app.post("/api/master-logout",        adapt(() => import("./api/master-logout.js")));
app.get("/api/master-session",        adapt(() => import("./api/master-session.js")));
app.post("/api/ai-top10",             adapt(() => import("./api/ai-top10.js")));
app.post("/api/daily-briefing",       adapt(() => import("./api/daily-briefing.js")));
app.get("/api/timeline-events",       adapt(() => import("./api/timeline-events.js")));
app.post("/api/timeline-insight",     adapt(() => import("./api/timeline-insight.js")));
app.post("/api/regional-agent",       adapt(() => import("./api/regional-agent.js")));
app.post("/api/regional-weekly-report", adapt(() => import("./api/regional-weekly-report.js")));
app.post("/api/team-lead-agent",      adapt(() => import("./api/team-lead-agent.js")));

// SPA 폴백 — 정적 파일이 없는 경로는 index.html
app.use((req, res) => {
  res.sendFile(join(__dir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Battery News  →  http://localhost:${PORT}\n`);
});
