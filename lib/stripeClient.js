import Stripe from "stripe";
import { env } from "./env.js";

let stripe;

export function getStripe() {
  if (!stripe) {
    const key = env("STRIPE_SECRET_KEY");
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getSiteOrigin(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  if (host) return `${proto}://${host}`;
  return env("SITE_URL") || "https://spaceboys-one.vercel.app";
}
