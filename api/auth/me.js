import { getFanById, fanToPublic } from "../../lib/fans.js";
import { getFanUserIdFromRequest } from "../../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getFanUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Not signed in" });
  }

  try {
    const fan = await getFanById(userId);
    if (!fan) return res.status(401).json({ error: "Not signed in" });
    return res.status(200).json({ user: fanToPublic(fan) });
  } catch (err) {
    console.error("auth me error:", err);
    return res.status(500).json({ error: "Unable to load profile" });
  }
}
