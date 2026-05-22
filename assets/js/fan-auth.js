const FAN_TOKEN_KEY = "spaceboys_fan_token";

export function getFanToken() {
  return localStorage.getItem(FAN_TOKEN_KEY);
}

export function setFanToken(token) {
  if (token) localStorage.setItem(FAN_TOKEN_KEY, token);
  else localStorage.removeItem(FAN_TOKEN_KEY);
}

export function fanAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getFanToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fanFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: { ...fanAuthHeaders(), ...options.headers },
  });
}

export async function loadFanUser() {
  const res = await fanFetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function fanSignup({ name, email, password }) {
  const res = await fanFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  if (data.token) setFanToken(data.token);
  return data.user;
}

export async function fanLogin({ email, password }) {
  const res = await fanFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  if (data.token) setFanToken(data.token);
  return data.user;
}

export async function fanLogout() {
  await fanFetch("/api/auth/logout", { method: "POST" });
  setFanToken(null);
}

export async function awardFanPoints(action) {
  const res = await fanFetch("/api/points/award", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  return data;
}

export function updateNavFanState(user) {
  const signIn = document.getElementById("navFanSignIn");
  const hub = document.getElementById("navFanHub");
  if (!signIn || !hub) return;
  if (user) {
    signIn.hidden = true;
    hub.hidden = false;
    hub.textContent = user.name?.split(" ")[0] || "Fan Hub";
  } else {
    signIn.hidden = false;
    hub.hidden = true;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await loadFanUser();
  updateNavFanState(user);
  window.spaceboysFan = user;
});
