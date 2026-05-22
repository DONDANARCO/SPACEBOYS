import { awardFanPoints, loadFanUser } from "./fan-auth.js";

async function tryAward(action) {
  const user = await loadFanUser();
  if (!user) return;
  await awardFanPoints(action);
}

document.addEventListener("DOMContentLoaded", () => {
  tryAward("visit");

  document.querySelectorAll("[data-lightbox]").forEach((el) => {
    el.addEventListener("click", () => tryAward("gallery"), { once: true });
  });

  document.querySelectorAll("[data-social-points]").forEach((el) => {
    el.addEventListener("click", () => tryAward("social"));
  });
});
