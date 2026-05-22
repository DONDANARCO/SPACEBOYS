import { awardPoints, fanToPublic, getFanById } from "../../lib/fans.js";
import { getFanUserIdFromRequest } from "../../lib/session.js";

const DAILY_ACTIONS = new Set(["visit", "gallery", "social"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getFanUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to earn points" });
  }

  try {
    const { action } = req.body ?? {};
    if (!action) return res.status(400).json({ error: "Action required" });

    const result = await awardPoints(userId, action, {
      oncePerDay: DAILY_ACTIONS.has(action),
    });

    const fan = await getFanById(userId);
    return res.status(200).json({
      ...result,
      user: fanToPublic(fan),
    });
  } catch (err) {
    console.error("points award error:", err);
    return res.status(500).json({ error: "Unable to award points" });
  }
}
