import { isMasterSession } from "./_master_auth.js";

export const maxDuration = 60;
const SUPABASE_URL = "https://wpgiidlfjtimeellpzwk.supabase.co";
const SUPABASE_KEY = "sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL";
const responseText = (data) => data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text || "";

async function isAuthorized(req) {
  if (isMasterSession(req)) return true;
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email || "").toLowerCase().endsWith("@poscofuturem.com");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!(await isAuthorized(req))) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });
  const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 30) : [];
  if (!events.length) return res.status(400).json({ error: "events_required" });
  const evidence = events.map((event, index) => ({
    no: index + 1, date: String(event.published || "").slice(0, 10), title: String(event.title || "").slice(0, 240),
    summary: String(event.summary || "").slice(0, 360), region: String(event.region || "Global"),
    application: String(event.application || "Etc"), material: String(event.material || "Etc"),
    hashtags: Array.isArray(event.hashtags) ? event.hashtags.slice(0, 6) : [],
  }));
  const prompt = `아래는 배터리 소재사 관점으로 필터링된 시계열 이벤트입니다. 선택 범위: ${JSON.stringify(req.body?.scope || {})}. 제공된 사건만 근거로 한국어 분석 메모를 작성하세요. 기사에 없는 사실이나 수치를 만들지 마세요.

형식:
[한 줄 흐름]
[기간 중 전환점 3가지]
[밸류체인·경쟁사 영향]
[소재사 관점: 리스크 / 기회]
[다음 확인사항 3가지]
[근거 이벤트 번호]

또한 각 이벤트를 '굵직한 사건'인지 판정하세요. 투자·증설·공장, 특허·핵심기술, 제품 출시, 수주·공급계약·합작, 인수합병, 주요 실적·가동중단, 정책·규제, 원료 확보·재활용 설비처럼 사업의 방향을 바꾸는 사실만 굵직한 사건입니다. 단순 전망·주가·일반 해설은 제외하세요. 남기는 사건은 회사와 행동이 드러나는 40자 이내 한 줄 요약으로 작성하세요. 제목을 그대로 반복하지 말고, 여러 기사가 있으면 공통된 사건을 요약하세요.

이벤트:
${JSON.stringify(evidence)}`;
  const schema = {
    type: "object", additionalProperties: false, required: ["insight", "summaries"],
    properties: {
      insight: { type: "string", minLength: 20, maxLength: 2400 },
      summaries: {
        type: "array", minItems: events.length, maxItems: events.length,
        items: { type: "object", additionalProperties: false, required: ["index", "summary", "major"], properties: {
          index: { type: "integer", minimum: 0, maximum: events.length - 1 },
          summary: { type: "string", minLength: 5, maxLength: 45 },
          major: { type: "boolean" },
        } },
      },
    },
  };
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, input: prompt, text: { format: { type: "json_schema", name: "timeline_event_brief", strict: true, schema } }, max_output_tokens: 1500, store: false }) });
    const data = await response.json();
    const output = responseText(data);
    if (!response.ok || !output) return res.status(502).json({ error: "openai_request_failed", detail: data.error?.message || "" });
    const result = JSON.parse(output);
    if (!result.insight || !Array.isArray(result.summaries)) return res.status(502).json({ error: "invalid_ai_response" });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(result);
  } catch (error) { return res.status(502).json({ error: "openai_request_failed", detail: String(error) }); }
}

