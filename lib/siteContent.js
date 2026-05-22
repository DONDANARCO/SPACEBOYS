import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, getPartitionKeyName, getSortKeyName, getTableName } from "./db.js";

export const DEFAULT_SITE_CONTENT = {
  hero: {
    eyebrow: "Est. 2019 — South Africa",
    titleLine1: "SPACE",
    titleLine2: "BOYS",
    subtitle:
      "A Record Label. A Movement. A Creative Universe.\nMusic, culture, fashion & live experiences — all under one platform.",
  },
  about: {
    title: "More Than\nA Label.",
    paragraph1:
      "SPACEBOYS is an independent record label and creative platform built around music, culture, and artistic freedom — without restrictive deals.",
    paragraph2:
      "We empower artists to record professional music, distribute their work independently, and connect with audiences on their own terms. No cages. No compromise.",
    paragraph3:
      "SPACEBOYS also helps artists build hosted artist profiles and portfolios — web-hosted sites that work like personal websites for your music, visuals, and story.",
  },
  featuredEvent: {
    title: "Introduction to Space Fest",
    date: "Saturday 20 June 2026",
    venue: "Venue TBA",
    rosterNote: "Full SPACEBOYS artist roster performing",
  },
  merch: [
    { id: "hoodie", name: "SPACEBOYS Hoodie", type: "Hoodies", price: "R 750", image: "assets/images/Merch/Hoodie.jpg", description: "Premium heavyweight hoodie with embroidered SPACEBOYS logo. Purple accent stitching. Unisex fit." },
    { id: "tee", name: "Classic Tee", type: "T-Shirts", price: "R 350", image: "assets/images/Merch/tee2.webp", description: "Soft cotton tee — Float Or Forever Stay Grounded print on back. Available in black and white." },
    { id: "cap", name: "SPCBYS Cap", type: "Hats", price: "R 280", image: "assets/images/Merch/caps.webp", description: "Structured cap with tonal embroidery. Limited run — once they're gone, they're gone." },
  ],
  updatedAt: null,
};

const CONFIG_PK = "CONFIG";
const CONFIG_SK = "site-content";

export async function getSiteContent() {
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();

  try {
    const res = await docClient.send(
      new GetCommand({
        TableName: getTableName(),
        Key: { [pk]: CONFIG_PK, [sk]: CONFIG_SK },
      })
    );
    if (res.Item?.data) {
      return { ...DEFAULT_SITE_CONTENT, ...res.Item.data, updatedAt: res.Item.updatedAt || res.Item.createdAt };
    }
  } catch (err) {
    console.error("getSiteContent:", err);
  }
  return DEFAULT_SITE_CONTENT;
}

export async function saveSiteContent(data) {
  const pk = getPartitionKeyName();
  const sk = getSortKeyName();
  const updatedAt = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: getTableName(),
      Item: {
        [pk]: CONFIG_PK,
        [sk]: CONFIG_SK,
        type: "site-content",
        data,
        updatedAt,
      },
    })
  );

  return { ...data, updatedAt };
}
