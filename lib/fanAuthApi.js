import { createFan, getFanByEmail, getFanById, fanToPublic, awardPoints, getFanById as getFan } from "./fans.js";
import { verifyPassword } from "./password.js";
import {
  createFanToken,
  setFanSessionCookie,
  clearFanSessionCookie,
  getFanUserIdFromRequest,
} from "./session.js";
import { env } from "./env.js";

function authConfigured() {
  return !!(env("AUTH_SECRET") || env("ADMIN_PASSWORD"));
}

export async function handleFanSignup(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!authConfigured()) {
    return res.status(503).json({
      error: "Fan sign-in is not configured. Add AUTH_SECRET in Vercel environment variables.",
    });
  }
  try {
    const { name, email, password } = req.body ?? {};
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ error: "Name, email, and password (8+ chars) required" });
    }
    const fan = await createFan({ name, email, password });
    const token = createFanToken(fan.userId);
    setFanSessionCookie(res, token);
    return res.status(200).json({ ok: true, user: fanToPublic(fan), token });
  } catch (err) {
    if (err.code === "EMAIL_EXISTS") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("signup error:", err);
    return res.status(500).json({ error: "Unable to create account" });
  }
}

export async function handleFanLogin(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!authConfigured()) {
    return res.status(503).json({
      error: "Fan sign-in is not configured. Add AUTH_SECRET in Vercel environment variables.",
    });
  }
  try {
    const { email, password } = req.body ?? {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const index = await getFanByEmail(email);
    if (!index?.userId) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const fan = await getFanById(index.userId);
    if (!fan || !verifyPassword(password, fan.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = createFanToken(fan.userId);
    setFanSessionCookie(res, token);
    return res.status(200).json({ ok: true, user: fanToPublic(fan), token });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Unable to sign in" });
  }
}

export async function handleFanLogout(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  clearFanSessionCookie(res);
  return res.status(200).json({ ok: true });
}

export async function handleFanMe(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const userId = getFanUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Not signed in" });
  }
  try {
    const fan = await getFan(userId);
    if (!fan) return res.status(401).json({ error: "Not signed in" });
    return res.status(200).json({ user: fanToPublic(fan) });
  } catch (err) {
    console.error("auth me error:", err);
    return res.status(500).json({ error: "Unable to load profile" });
  }
}

export async function handleFanPoints(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const userId = getFanUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to earn points" });
  }
  const DAILY = new Set(["visit", "gallery", "social"]);
  try {
    const { action } = req.body ?? {};
    if (!action) return res.status(400).json({ error: "Action required" });
    const result = await awardPoints(userId, action, { oncePerDay: DAILY.has(action) });
    const fan = await getFan(userId);
    return res.status(200).json({ ...result, user: fanToPublic(fan) });
  } catch (err) {
    console.error("points award error:", err);
    return res.status(500).json({ error: "Unable to award points" });
  }
}
