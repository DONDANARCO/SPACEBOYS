import { getSiteContent } from "./siteContent.js";
import { parsePriceToCents } from "./points.js";

const FALLBACK = {
  hoodie: { id: "hoodie", name: "SPACEBOYS Hoodie", priceLabel: "R 750", amountCents: 75000 },
  tee: { id: "tee", name: "Classic Tee", priceLabel: "R 350", amountCents: 35000 },
  cap: { id: "cap", name: "SPCBYS Cap", priceLabel: "R 280", amountCents: 28000 },
};

export async function getMerchItem(itemId) {
  const content = await getSiteContent();
  const fromSite = (content.merch || []).find((m) => m.id === itemId);
  const base = FALLBACK[itemId];
  if (!fromSite && !base) return null;

  const name = fromSite?.name || base.name;
  const priceLabel = fromSite?.price || base.priceLabel;
  const amountCents = parsePriceToCents(priceLabel) || base.amountCents;

  return {
    id: itemId,
    name,
    priceLabel,
    amountCents,
    currency: "zar",
    image: fromSite?.image || null,
    description: fromSite?.description || "",
  };
}
