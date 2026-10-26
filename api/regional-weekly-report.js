import { isMasterSession } from "./_master_auth.js";

const SUPABASE_URL = "https://wpgiidlfjtimeellpzwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_eV-VylNYTd2nypay_auzvQ_m_tBijyL";

async function isAuthorized(req) {
  if (isMasterSession(req)) return true;
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email || "").toLowerCase().endsWith("@poscofuturem.com");
}

function serverHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key ? { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } : null;
}

export default async function handler(req, res) {
  if (!(await isAuthorized(req))) return res.status(401).json({ error: "unauthorized" });
  const headers = serverHeaders();
  if (!headers) return res.status(503).json({ error: "supabase_service_key_not_configured" });
  const region = String(req.query?.region || req.body?.region || "").slice(0, 20);
  const weekStart = String(req.query?.week_start || req.body?.week_start || "").slice(0, 10);
  if (!region || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return res.status(400).json({ error: "region_and_week_start_required" });
  if (req.method === "GET") {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/regional_weekly_reports?region=eq.${encodeURIComponent(region)}&week_start=eq.${weekStart}&select=*&limit=1`, { headers });
    const rows = await response.json();
    if (!response.ok) return res.status(502).json({ error: "regional_report_load_failed", detail: rows.message || "" });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ report: rows[0] || null });
  }
  if (req.method === "POST") {
    const report = req.body?.report;
    const eagleReview = req.body?.eagle_review;
    const sources = Array.isArray(req.body?.sources) ? req.body.sources.slice(0, 40) : [];
    if (!report || !eagleReview) return res.status(400).json({ error: "report_and_eagle_review_required" });
    const payload = { region, week_start: weekStart, report, eagle_review: eagleReview, sources, ai_model: "gpt-5.6-luna" };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/regional_weekly_reports?on_conflict=region,week_start`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(payload) });
    const saved = await response.json();
    if (!response.ok) return res.status(502).json({ error: "regional_report_save_failed", detail: saved.message || "" });
    return res.status(200).json({ report: saved[0] });
  }
  return res.status(405).json({ error: "method_not_allowed" });
}

