import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { buildItem, docClient, getTableName } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, subject, message } = req.body ?? {};
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    await docClient.send(
      new PutCommand({
        TableName: getTableName(),
        Item: buildItem("contact", {
          name: name.trim(),
          email: email.trim(),
          subject: subject?.trim() || "General Inquiry",
          message: message?.trim() || "",
        }),
      })
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact API error:", err);
    return res.status(500).json({ error: "Unable to save message" });
  }
}
