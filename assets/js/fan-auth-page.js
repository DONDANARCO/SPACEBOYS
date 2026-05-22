import { fanLogin, fanSignup } from "./fan-auth.js";

const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect") || "fan-dashboard.html";

function status(msg, ok = true) {
  const el = document.getElementById("authStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = ok ? "auth-status auth-status--ok" : "auth-status auth-status--err";
}

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    document.getElementById("loginForm").hidden = !isLogin;
    document.getElementById("signupForm").hidden = isLogin;
  });
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await fanLogin({
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value,
    });
    window.location.href = redirect;
  } catch (err) {
    status(err.message, false);
  }
});

document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await fanSignup({
      name: document.getElementById("signupName").value,
      password: document.getElementById("signupPassword").value,
      email: document.getElementById("signupEmail").value,
    });
    window.location.href = redirect;
  } catch (err) {
    status(err.message, false);
  }
});
