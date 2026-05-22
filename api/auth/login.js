import { getFanByEmail, getFanById, fanToPublic } from "../../lib/fans.js";
import { verifyPassword } from "../../lib/password.js";
import { createFanToken, setFanSessionCookie } from "../../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
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
