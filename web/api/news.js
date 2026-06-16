// GET /api/news  → 인증된 사용자에게만 누적 뉴스 JSON 반환
// 데이터는 GitHub 레포의 data/news.json 을 raw 로 읽어옴.
// 환경변수: GITHUB_REPO (예 "user/repo"), GITHUB_BRANCH (기본 main),
//           GITHUB_TOKEN (private 레포일 때만 필요)
import { isAuthed } from "./_auth.js";

export default async function handler(req, res) {
  if (!isAuthed(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;
  if (!repo) {
    res.status(500).json({ error: "GITHUB_REPO_not_set" });
    return;
  }

  const url = `https://raw.githubusercontent.com/${repo}/${branch}/data/news.json`;
  const headers = { "User-Agent": "battery-news-web" };
  if (token) headers.Authorization = `token ${token}`;

  try {
    const r = await fetch(url, { headers });
    if (!r.ok) {
      res.status(502).json({ error: "fetch_failed", status: r.status });
      return;
    }
    const data = await r.json();
    // 5분 캐시 (서버리스 비용/속도)
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "exception", detail: String(e) });
  }
}
