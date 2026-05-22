import { createHmac, timingSafeEqual } from "crypto";

const INTEGRATION_PREFIX = "SPACEKAYSONKELLY_";

function env(name) {
  return process.env[`${INTEGRATION_PREFIX}${name}`] ?? process.env[name];
}

export function getAdminPassword() {
  return env("ADMIN_PASSWORD") || process.env.ADMIN_PASSWORD;
}

export function verifyPassword(input) {
  const expected = getAdminPassword();
  if (!expected || !input) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createAdminToken() {
  const secret = getAdminPassword();
  if (!secret) throw new Error("ADMIN_PASSWORD is not configured");
  const payload = `admin:${Date.now()}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || !token.includes(".")) return false;
  const secret = getAdminPassword();
  if (!secret) return false;
  const [payloadB64, sig] = token.split(".");
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function getTokenFromRequest(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers["x-admin-token"] || null;
}
