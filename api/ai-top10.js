import { isMasterSession } from "./_master_auth.js";

export const maxDuration = 60;

const SUPABASE_URL = "https://wpgiidlfjtimeellpzwk.supabase.co";
const SUPABASE_KEY = "sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL";
const responseText = (data) => data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text || "";

async function isAuthorized(req) {
  if (isMasterSession(req)) return true;
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email || "").toLowerCase().endsWith("@poscofuturem.com");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!(await isAuthorized(req))) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });

  const articles = Array.isArray(req.body?.articles) ? req.body.articles.slice(0, 25) : [];
  if (articles.length < 10) return res.status(400).json({ error: "at_least_10_articles_required" });
  const candidates = articles.map((article, index) => ({
    index,
    title: String(article.title || "").slice(0, 350),
    summary: String(article.summary || "").slice(0, 480),
    published: String(article.published || "").slice(0, 30),
    region: String(article.region || "Global").slice(0, 40),
    application: String(article.application || "Etc").slice(0, 40),
    material: String(article.material || "Etc").slice(0, 40),
    hashtags: Array.isArray(article.hashtags) ? article.hashtags.slice(0, 8) : [],
  }));

  const prompt = `배터리 양극재 소재사 실무자의 관점에서 아래 후보 뉴스 중 오늘 반드시 확인할 10건을 선정하세요.
평가 기준은 ① 고객사·셀사 수요 영향 ② 경쟁 소재사 움직임 ③ 원료·가격·공급망 영향 ④ 기술·제품 변화 ⑤ 정책·규제 영향입니다.
서로 같은 사건을 다룬 중복 기사는 하나만 선택하세요. 기사에 없는 내용을 추정하지 마세요.
importance는 1~100 정수, reason은 선정 이유를 한국어 한 문장으로 작성하세요.

후보 기사:
${JSON.stringify(candidates)}`;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["rankings"],
    properties: {
      rankings: {
        type: "array",
        minItems: 10,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["index", "importance", "reason"],
          properties: {
            index: { type: "integer", minimum: 0, maximum: articles.length - 1 },
            importance: { type: "integer", minimum: 1, maximum: 100 },
            reason: { type: "string", minLength: 5, maxLength: 180 },
          },
        },
      },
    },
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        reasoning: { effort: "low" },
        input: prompt,
        text: { format: { type: "json_schema", name: "battery_top10", strict: true, schema } },
        max_output_tokens: 1200,
        store: false,
      }),
    });
    const data = await response.json();
    const output = responseText(data);
    if (!response.ok || !output) return res.status(502).json({ error: "openai_request_failed", detail: data.error?.message || "" });
    const parsed = JSON.parse(output);
    const seen = new Set();
    const rankings = parsed.rankings.filter((item) => Number.isInteger(item.index) && !seen.has(item.index) && seen.add(item.index)).slice(0, 10);
    if (rankings.length !== 10) return res.status(502).json({ error: "invalid_ai_ranking" });
    return res.status(200).json({ model: "gpt-5.6-luna", rankings });
  } catch (error) {
    return res.status(502).json({ error: "openai_request_failed", detail: String(error) });
  }
}

