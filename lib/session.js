import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env.js";

const COOKIE_NAME = "fan_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function secret() {
  const s = env("AUTH_SECRET") || env("ADMIN_PASSWORD");
  if (!s) throw new Error("AUTH_SECRET is not configured");
  return s;
}

export function createFanToken(userId) {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${userId}:${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyFanToken(token) {
  if (!token?.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  const [userId, expStr] = payload.split(":");
  if (!userId || Date.now() > Number(expStr)) return null;
  return userId;
}

export function getFanTokenFromRequest(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getFanUserIdFromRequest(req) {
  const token = getFanTokenFromRequest(req);
  if (!token) return null;
  return verifyFanToken(token);
}

export function setFanSessionCookie(res, token) {
  const secure = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SEC}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearFanSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
}
