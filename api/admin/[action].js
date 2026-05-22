import { createAdminToken, verifyPassword, getTokenFromRequest, verifyAdminToken } from "../../lib/adminAuth.js";
import { getSiteContent, saveSiteContent } from "../../lib/siteContent.js";

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { password } = req.body ?? {};
    if (!verifyPassword(password)) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const token = createAdminToken();
    return res.status(200).json({ ok: true, token });
  } catch (err) {
    console.error("admin login error:", err);
    return res.status(500).json({ error: "Login unavailable — set ADMIN_PASSWORD in Vercel" });
  }
}

async function handleContent(req, res) {
  const token = getTokenFromRequest(req);
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method === "GET") {
    try {
      const content = await getSiteContent();
      return res.status(200).json(content);
    } catch (err) {
      console.error("admin site-content GET:", err);
      return res.status(500).json({ error: "Unable to load content" });
    }
  }
  if (req.method === "PUT") {
    try {
      const saved = await saveSiteContent(req.body ?? {});
      return res.status(200).json({ ok: true, content: saved });
    } catch (err) {
      console.error("admin site-content PUT:", err);
      return res.status(500).json({ error: "Unable to save content" });
    }
  }
  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}

const routes = {
  login: handleLogin,
  "site-content": handleContent,
};

export default async function handler(req, res) {
  const action = req.query.action;
  const fn = routes[action];
  if (!fn) return res.status(404).json({ error: "Unknown admin action" });
  return fn(req, res);
}
