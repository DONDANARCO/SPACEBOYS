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

async function parseFanResponse(res, fallbackError) {
  let data = {};
  try {
    data = await res.json();
  } catch {
    if (res.status === 404) {
      throw new Error("Fan sign-in API is not live yet. Redeploy the site on Vercel after the latest code push.");
    }
    throw new Error(fallbackError);
  }
  if (!res.ok) throw new Error(data.error || fallbackError);
  return data;
}

export async function loadFanUser() {
  const res = await fanFetch("/api/fans/me");
  if (!res.ok) return null;
  const data = await parseFanResponse(res, "Not signed in");
  return data.user;
}

export async function fanSignup({ name, email, password }) {
  const res = await fanFetch("/api/fans/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  const data = await parseFanResponse(res, "Signup failed");
  if (data.token) setFanToken(data.token);
  return data.user;
}

export async function fanLogin({ email, password }) {
  const res = await fanFetch("/api/fans/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await parseFanResponse(res, "Login failed");
  if (data.token) setFanToken(data.token);
  return data.user;
}

export async function fanLogout() {
  await fanFetch("/api/fans/logout", { method: "POST" });
  setFanToken(null);
}

export async function awardFanPoints(action) {
  const res = await fanFetch("/api/fans/points", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
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
