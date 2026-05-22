import { getMerchItem } from "../../lib/merchCatalog.js";
import { getStripe, getSiteOrigin } from "../../lib/stripeClient.js";
import { getFanUserIdFromRequest } from "../../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getFanUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Sign in to checkout and earn fan points" });
  }

  try {
    const { itemId, quantity = 1 } = req.body ?? {};
    const item = await getMerchItem(itemId);
    if (!item) return res.status(400).json({ error: "Invalid product" });

    const qty = Math.min(Math.max(1, Number(quantity) || 1), 10);
    const stripe = getStripe();
    const origin = getSiteOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: undefined,
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: item.currency,
            unit_amount: item.amountCents,
            product_data: {
              name: item.name,
              description: item.description?.slice(0, 200) || "SPACEBOYS merchandise",
              images: item.image ? [`${origin}/${item.image.replace(/^\//, "")}`] : undefined,
            },
          },
        },
      ],
      metadata: {
        userId,
        itemId: item.id,
        quantity: String(qty),
      },
      success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout-cancel.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("stripe checkout error:", err);
    return res.status(500).json({ error: "Unable to start checkout" });
  }
}
