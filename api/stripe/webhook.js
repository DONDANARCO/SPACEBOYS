import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { awardPoints } from "../../lib/fans.js";
import { docClient, getPartitionKeyName, getSortKeyName, getTableName } from "../../lib/db.js";
import { env } from "../../lib/env.js";
import { getStripe } from "../../lib/stripeClient.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const webhookSecret = env("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET missing");
    return res.status(500).send("Webhook not configured");
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers["stripe-signature"];
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const itemId = session.metadata?.itemId;
    const pk = getPartitionKeyName();
    const sk = getSortKeyName();

    try {
      await docClient.send(
        new PutCommand({
          TableName: getTableName(),
          Item: {
            [pk]: "ORDER",
            [sk]: session.id,
            type: "order",
            stripeSessionId: session.id,
            userId: userId || null,
            itemId,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email || session.customer_email,
            paymentStatus: session.payment_status,
            createdAt: new Date().toISOString(),
          },
        })
      );

      if (userId) {
        await awardPoints(userId, "merch");
      }
    } catch (err) {
      console.error("order fulfill error:", err);
      return res.status(500).json({ error: "Fulfillment failed" });
    }
  }

  return res.status(200).json({ received: true });
}
