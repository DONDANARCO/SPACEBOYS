export const POINT_RULES = {
  signup: { points: 50, label: "Welcome to SPACEBOYS" },
  rsvp: { points: 30, label: "RSVP — Introduction to Space Fest" },
  visit: { points: 10, label: "Daily site visit" },
  gallery: { points: 5, label: "Gallery explore" },
  social: { points: 5, label: "Social link visit" },
  merch: { points: 100, label: "Merch purchase" },
};

export function tierFromPoints(points) {
  if (points >= 250) return { id: "super", name: "Super Fan", next: null };
  if (points >= 150) return { id: "inner", name: "Inner Circle", next: 250 - points };
  if (points >= 50) return { id: "crew", name: "Space Crew", next: 150 - points };
  return { id: "new", name: "New Fan", next: 50 - points };
}

export function parsePriceToCents(priceLabel) {
  const n = parseInt(String(priceLabel).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n * 100 : 0;
}
