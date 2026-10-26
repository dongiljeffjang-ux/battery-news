import crypto from "crypto";

const COOKIE = "bn_master";
const MAX_AGE = 12 * 60 * 60;

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(raw.split(";").map((part) => {
    const i = part.indexOf("=");
    return i < 0 ? [] : [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))];
  }).filter((pair) => pair.length));
}

export function issueToken(secret) {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${sign(exp, secret)}`;
}

export function isMasterSession(req) {
  const secret = process.env.AUTH_SECRET || "";
  const token = parseCookies(req)[COOKIE];
  if (!secret || !token) return false;
  const [exp, signature] = token.split(".");
  if (!exp || !signature) return false;
  const expected = sign(exp, secret);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && Number(exp) > Date.now();
}

export function setSession(res, secret) {
  res.setHeader("Set-Cookie", `${COOKIE}=${issueToken(secret)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`);
}

export { COOKIE };

