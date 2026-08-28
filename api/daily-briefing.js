import { isMasterSession } from "./_master_auth.js";

export const maxDuration = 60;

const SUPABASE_URL = "https://wpgiidlfjtimeellpzwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL";
const responseText = (data) => data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text || "";

async function hasCompanySession(req) {
  if (isMasterSession(req)) return true;
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email || "").toLowerCase().endsWith("@poscofuturem.com");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!(await hasCompanySession(req))) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });

  const articles = Array.isArray(req.body?.articles) ? req.body.articles.slice(0, 10) : [];
  if (!articles.length) return res.status(400).json({ error: "articles_required" });
  const evidence = articles.map((article, index) => ({
    no: index + 1,
    title: String(article.title || "").slice(0, 400),
    summary: String(article.summary || "").slice(0, 600),
    published: String(article.published || "").slice(0, 30),
    region: String(article.region || "Global").slice(0, 40),
    application: String(article.application || "Etc").slice(0, 40),
    hashtags: Array.isArray(article.hashtags) ? article.hashtags.slice(0, 10) : [],
  }));

  const prompt = `아래 TOP 10 뉴스만 근거로, POSCO Future M과 같은 배터리 소재사 임원에게 보내는 한국어 일일 보고서를 작성하세요. 기사에 없는 수치·사실·추정은 만들지 말고, 불확실하면 '기사 근거 부족'이라고 쓰세요. 회사명은 기사에 명시된 경우에만 언급하세요. 간결하고 실무적으로 작성하세요.\n\n형식:\n[경영진 한 줄 요약]\n[핵심 변화 3가지]\n[밸류체인 영향: 수요처/셀사/소재 경쟁/원료·재활용]\n[소재사 리스크와 기회]\n[오늘 확인할 액션 3가지]\n[근거 기사 번호]\n\nTOP 10 기사:\n${JSON.stringify(evidence)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, input: prompt, max_output_tokens: 900, store: false }),
    });
    const data = await response.json();
    const report = responseText(data);
    if (!response.ok || !report) return res.status(502).json({ error: "openai_request_failed", detail: data.error?.message || "" });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ report });
  } catch {
    return res.status(502).json({ error: "openai_request_failed" });
  }
}
