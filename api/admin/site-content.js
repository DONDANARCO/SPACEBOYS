import { getTokenFromRequest, verifyAdminToken } from "../../lib/adminAuth.js";
import { getSiteContent, saveSiteContent } from "../../lib/siteContent.js";

export default async function handler(req, res) {
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
      const body = req.body ?? {};
      const saved = await saveSiteContent(body);
      return res.status(200).json({ ok: true, content: saved });
    } catch (err) {
      console.error("admin site-content PUT:", err);
      return res.status(500).json({ error: "Unable to save content" });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
