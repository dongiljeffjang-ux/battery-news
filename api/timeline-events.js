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

  if (req.method === "GET") {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/timeline_events?select=*&status=eq.active&order=event_date.desc&limit=500`, { headers });
    const events = await response.json();
    if (!response.ok) return res.status(502).json({ error: "timeline_load_failed", detail: events.message || "" });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ events });
  }

  if (req.method === "POST") {
    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 30) : [];
    if (!events.length) return res.status(400).json({ error: "events_required" });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/timeline_events?on_conflict=event_key`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(events),
    });
    const saved = await response.json();
    if (!response.ok) return res.status(502).json({ error: "timeline_save_failed", detail: saved.message || "" });
    return res.status(200).json({ events: saved });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}

