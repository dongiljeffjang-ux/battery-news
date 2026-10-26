import { isMasterSession } from "./_master_auth.js";

export const maxDuration = 60;
const SUPABASE_URL = "https://wpgiidlfjtimeellpzwk.supabase.co";
const SUPABASE_KEY = "sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL";
const outputText = data => data.output_text || data.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text || "";

async function isAuthorized(req) {
  if (isMasterSession(req)) return true;
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email || "").toLowerCase().endsWith("@poscofuturem.com");
}

async function ask(input, maxOutputTokens, format) {
  const body = { model: "gpt-5.6-terra", reasoning: { effort: "low" }, input, max_output_tokens: maxOutputTokens, store: false };
  if (format) body.text = { format };
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify(body) });
  const data = await response.json();
  const text = outputText(data);
  if (!response.ok || !text) throw new Error(data.error?.message || "openai_request_failed");
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!(await isAuthorized(req))) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });
  const reports = Array.isArray(req.body?.reports) ? req.body.reports.slice(0, 6).map(item => ({ region: String(item.region || "").slice(0, 20), report: String(item.report || "").slice(0, 5000), sources: Array.isArray(item.sources) ? item.sources.slice(0, 25).map(source => ({ id: String(source.id || "").slice(0, 30), title: String(source.title || "").slice(0, 220), summary: String(source.summary || "").slice(0, 300), source: String(source.source || "").slice(0, 100), url: String(source.url || "").slice(0, 1200) })) : [] })) : [];
  if (!reports.length) return res.status(400).json({ error: "reports_required" });
  try {
    if (req.body?.mode === "chat") {
      const question = String(req.body?.question || "").slice(0, 1200);
      const review = String(req.body?.review || "").slice(0, 9000);
      const answer = await ask(`당신은 배터리 산업 권역 분석실의 팀장 에이전트입니다. 아래 팀장 검증 보고서와 각 권역 보고서 근거 안에서만 답하세요. 단정이 어려우면 불확실성을 먼저 밝히세요. 사용자가 묻는 주장에 반대 근거·누락 변수도 함께 간결히 답하세요.\n\n[팀장 검증]\n${review}\n\n[권역 보고서]\n${JSON.stringify(reports)}\n\n[질문]\n${question}`, 700);
      return res.status(200).json({ answer });
    }
    const prompt = `당신은 배터리 산업 권역 분석실의 팀장 에이전트입니다. 아래 6개 권역 주간 보고서를 검토하세요. 각 권역에 대해 1) 핵심 주장(한 문장), 2) 반대 근거 또는 누락 변수(한 문장), 3) 판단 강도(높음/보통/낮음)를 작성하세요. 기사에 없는 사실을 만들지 말고, 실제 사용한 근거 id만 sources에 넣으세요. 마지막으로 전 권역을 가로지르는 공통 리스크·확인할 질문을 2개 이내로 작성하세요.\n\n[권역 보고서와 근거]\n${JSON.stringify(reports)}`;
    const item = { type: "object", additionalProperties: false, required: ["region", "claim", "challenge", "confidence", "sources"], properties: { region: { type: "string" }, claim: { type: "string", maxLength: 220 }, challenge: { type: "string", maxLength: 260 }, confidence: { type: "string", enum: ["높음", "보통", "낮음"] }, sources: { type: "array", items: { type: "string" }, maxItems: 6 } } };
    const schema = { type: "object", additionalProperties: false, required: ["headline", "reviews", "cross_region_checks"], properties: { headline: { type: "string", maxLength: 350 }, reviews: { type: "array", items: item, minItems: 1, maxItems: 6 }, cross_region_checks: { type: "array", items: { type: "string", maxLength: 220 }, maxItems: 2 } } };
    const text = await ask(prompt, 1600, { type: "json_schema", name: "team_lead_review", strict: true, schema });
    const review = JSON.parse(text);
    const sources = reports.flatMap(report => report.sources);
    return res.status(200).json({ review, sources });
  } catch (error) { return res.status(502).json({ error: "team_lead_agent_failed", detail: String(error.message || error) }); }
}

