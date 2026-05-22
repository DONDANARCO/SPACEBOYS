import { getSiteContent } from "../lib/siteContent.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const content = await getSiteContent();
    return res.status(200).json(content);
  } catch (err) {
    console.error("site-content GET error:", err);
    return res.status(500).json({ error: "Unable to load site content" });
  }
}
