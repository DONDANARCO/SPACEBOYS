import { fanLogout, loadFanUser } from "./fan-auth.js";

async function init() {
  const user = await loadFanUser();
  if (!user) {
    window.location.href = "login.html?redirect=fan-dashboard.html";
    return;
  }

  document.getElementById("fanWelcome").textContent = `Welcome back, ${user.name}.`;
  document.getElementById("fanPoints").textContent = String(user.points);
  document.getElementById("fanTier").textContent = user.tier;
  document.getElementById("fanReferral").textContent = user.referralCode;

  const hint = document.getElementById("fanPointsHint");
  if (user.pointsToNext) {
    hint.textContent = `${user.pointsToNext} points to next tier`;
  } else {
    hint.textContent = "Super Fan — top tier unlocked";
  }

  document.getElementById("copyReferral")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(user.referralCode);
      hint.textContent = "Referral code copied!";
    } catch {
      hint.textContent = user.referralCode;
    }
  });

  document.getElementById("fanLogoutBtn")?.addEventListener("click", async () => {
    await fanLogout();
    window.location.href = "login.html";
  });
}

init();
