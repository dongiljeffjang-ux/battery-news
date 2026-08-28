import crypto from "crypto";
import { setSession } from "./_master_auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const expected = process.env.MASTER_ACCESS_KEY || "";
  const secret = process.env.AUTH_SECRET || "";
  if (!expected || !secret) return res.status(500).json({ error: "server_not_configured" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const received = String(body.key || "");
  const a = Buffer.from(received), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "invalid_key" });
  setSession(res, secret);
  return res.status(200).json({ ok: true });
}

