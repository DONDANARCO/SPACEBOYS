import { createAdminToken, verifyPassword } from "../../lib/adminAuth.js";

export default async function handler(req, res) {
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
    return res.status(500).json({ error: "Login unavailable" });
  }
}
