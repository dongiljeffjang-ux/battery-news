const GITHUB_REPO = "dongiljeffjang-ux/battery-news";
const GITHUB_BRANCH = "main";
const MAX_DASHBOARD_ARTICLES = 1200;

export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const source = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/data/news.json`,
      { headers: { "User-Agent": "battery-news-dashboard" } },
    );
    if (!source.ok) return res.status(502).json({ error: "news_source_unavailable" });
    const data = await source.json();
    const articles = Array.isArray(data.articles) ? data.articles.slice(0, MAX_DASHBOARD_ARTICLES) : [];
    // CDN에 10분간 보관해 GitHub 원본을 매 방문마다 다시 읽지 않는다.
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({
      updated_at: data.updated_at,
      total_count: Array.isArray(data.articles) ? data.articles.length : articles.length,
      articles,
    });
  } catch (error) {
    return res.status(502).json({ error: "news_source_unavailable", detail: String(error) });
  }
}

