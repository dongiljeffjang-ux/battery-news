import { isMasterSession } from "./_master_auth.js";

export const maxDuration = 60;
const SUPABASE_URL = "https://wpgiidlfjtimeellpzwk.supabase.co";
const SUPABASE_KEY = "sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL";
const responseText = (data) => data.output_text || data.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text || "";

async function isAuthorized(req) {
  if (isMasterSession(req)) return true;
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email || "").toLowerCase().endsWith("@poscofuturem.com");
}

async function askOpenAI(input, maxOutputTokens) {
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, input, max_output_tokens: maxOutputTokens, store: false }) });
  const data = await response.json();
  const text = responseText(data);
  if (!response.ok || !text) throw new Error(data.error?.message || "openai_request_failed");
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!(await isAuthorized(req))) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });
  const region = String(req.body?.region || "기타").slice(0, 30);
  const articles = Array.isArray(req.body?.articles) ? req.body.articles.slice(0, 35) : [];
  const evidence = articles.map((article, index) => ({ no: index + 1, title: String(article.title || "").slice(0, 240), summary: String(article.summary || "").slice(0, 360), published: String(article.published || "").slice(0, 20), source: String(article.source || ""), url: String(article.url || article.link || "").slice(0, 1200), hashtags: Array.isArray(article.hashtags) ? article.hashtags.slice(0, 6) : [] }));
  try {
    if (req.body?.mode === "chat") {
      const question = String(req.body?.question || "").slice(0, 1200);
      const report = String(req.body?.report || "").slice(0, 6500);
      const answer = await askOpenAI(`당신은 ${region} 권역 배터리 산업 분석 에이전트입니다. 아래 주간 보고서와 기사 근거 안에서만 답하세요. 근거가 없으면 '제공된 정보만으로는 판단하기 어렵습니다'라고 답하세요. 간결한 한국어로 답하세요.\n\n[주간 보고서]\n${report}\n\n[기사 근거]\n${JSON.stringify(evidence)}\n\n[사용자 질문]\n${question}`, 600);
      return res.status(200).json({ answer });
    }
    const prompt = `당신은 ${region} 권역 배터리 산업 분석 에이전트입니다. 아래 기사 근거만으로 이번 주 보고서를 한국어로 작성하세요. 가장 먼저 한 주간의 흐름을 종합해 방향성·연결된 변화·소재사 관점의 의미를 2~3문장으로 제시하세요. 그 뒤 정책·EV·ESS·소재 항목을 작성합니다. 근거가 없으면 '유의미한 기사 근거 부족'이라고 명시하세요. 기사에 없는 사실·수치·전망은 만들지 말고, 각 항목에서 실제 사용한 근거 기사 번호만 sources에 넣으세요.\n\n[기사 근거]\n${JSON.stringify(evidence)}`;
    const section = { type: "object", additionalProperties: false, required: ["summary", "sources"], properties: { summary: { type: "string", minLength: 5, maxLength: 900 }, sources: { type: "array", items: { type: "integer", minimum: 1, maximum: Math.max(evidence.length, 1) }, maxItems: 8 } } };
    const schema = { type: "object", additionalProperties: false, required: ["weekly_flow", "policy", "ev", "ess", "materials"], properties: { weekly_flow: section, policy: section, ev: section, ess: section, materials: section } };
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, input: prompt, text: { format: { type: "json_schema", name: "regional_weekly_report", strict: true, schema } }, max_output_tokens: 1300, store: false }) });
    const data = await response.json();
    const output = responseText(data);
    if (!response.ok || !output) throw new Error(data.error?.message || "openai_request_failed");
    const sections = JSON.parse(output);
    const labels = { weekly_flow: "이번 주 권역 흐름", policy: "배터리 관련 정책 주요 동향", ev: "EV 주요 동향", ess: "ESS 주요 동향", materials: "소재 주요 동향" };
    const report = Object.entries(labels).map(([key, label]) => `[${label}]\n${sections[key].summary}`).join("\n\n");
    return res.status(200).json({ report, sections, sources: evidence, article_count: evidence.length });
  } catch (error) { return res.status(502).json({ error: "regional_agent_failed", detail: String(error.message || error) }); }
}
