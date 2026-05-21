import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, getTableName } from "../lib/db.js";

/** GET /api/entries — list items from DynamoDB (same pattern as the Vercel guide Scan). */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await docClient.send(
      new ScanCommand({
        TableName: getTableName(),
        Limit: 50,
      })
    );

    return res.status(200).json({ items: response.Items ?? [] });
  } catch (err) {
    console.error("entries API error:", err);
    return res.status(500).json({ error: "Unable to read from database" });
  }
}
