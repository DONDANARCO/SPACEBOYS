import { createFan, fanToPublic } from "../../lib/fans.js";
import { createFanToken, setFanSessionCookie } from "../../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
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
