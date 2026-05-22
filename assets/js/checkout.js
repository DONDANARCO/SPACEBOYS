import { fanFetch, loadFanUser } from "./fan-auth.js";

async function startCheckout(itemId, btn) {
  const user = await loadFanUser();
  if (!user) {
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  const label = btn?.textContent;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Redirecting…";
  }

  try {
    const res = await fanFetch("/api/stripe-checkout", {
      method: "POST",
      body: JSON.stringify({ itemId, quantity: 1 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");
    window.location.href = data.url;
  } catch (err) {
    alert(err.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = label || "Buy Now";
    }
  }
}

document.querySelectorAll("[data-checkout]").forEach((btn) => {
  btn.addEventListener("click", () => {
    startCheckout(btn.dataset.checkout, btn);
  });
});
