const TOKEN_KEY = "spaceboys_admin_token";

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function showStatus(msg, ok = true) {
  const el = document.getElementById("adminStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = ok ? "admin-status admin-status--ok" : "admin-status admin-status--err";
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showPanel(panel) {
  document.getElementById("loginPanel").hidden = panel !== "login";
  document.getElementById("adminPanel").hidden = panel !== "admin";
}

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById("adminPassword").value;
  try {
    const { token } = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      return data;
    });
    setToken(token);
    showPanel("admin");
    document.getElementById("logoutBtn").hidden = false;
    await loadEditor();
    showStatus("Signed in.");
  } catch (err) {
    showStatus(err.message, false);
  }
}

function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  document.getElementById("logoutBtn").hidden = true;
  showPanel("login");
}

function fillForm(content) {
  document.getElementById("heroEyebrow").value = content.hero?.eyebrow || "";
  document.getElementById("heroSubtitle").value = content.hero?.subtitle || "";
  document.getElementById("aboutTitle").value = content.about?.title || "";
  document.getElementById("aboutP1").value = content.about?.paragraph1 || "";
  document.getElementById("aboutP2").value = content.about?.paragraph2 || "";
  document.getElementById("aboutP3").value = content.about?.paragraph3 || "";
  document.getElementById("eventTitle").value = content.featuredEvent?.title || "";
  document.getElementById("eventDate").value = content.featuredEvent?.date || "";
  document.getElementById("eventVenue").value = content.featuredEvent?.venue || "";
  document.getElementById("eventRoster").value = content.featuredEvent?.rosterNote || "";

  (content.merch || []).forEach((item, i) => {
    document.getElementById(`merchName${i}`).value = item.name || "";
    document.getElementById(`merchType${i}`).value = item.type || "";
    document.getElementById(`merchPrice${i}`).value = item.price || "";
    document.getElementById(`merchImage${i}`).value = item.image || "";
    document.getElementById(`merchDesc${i}`).value = item.description || "";
  });

  const updated = document.getElementById("lastUpdated");
  if (updated) updated.textContent = content.updatedAt ? `Last saved: ${content.updatedAt}` : "";
}

function readForm() {
  const merch = [0, 1, 2].map((i) => ({
    id: ["hoodie", "tee", "cap"][i],
    name: document.getElementById(`merchName${i}`).value.trim(),
    type: document.getElementById(`merchType${i}`).value.trim(),
    price: document.getElementById(`merchPrice${i}`).value.trim(),
    image: document.getElementById(`merchImage${i}`).value.trim(),
    description: document.getElementById(`merchDesc${i}`).value.trim(),
  }));

  return {
    hero: {
      eyebrow: document.getElementById("heroEyebrow").value.trim(),
      titleLine1: "SPACE",
      titleLine2: "BOYS",
      subtitle: document.getElementById("heroSubtitle").value.trim(),
    },
    about: {
      title: document.getElementById("aboutTitle").value.trim(),
      paragraph1: document.getElementById("aboutP1").value.trim(),
      paragraph2: document.getElementById("aboutP2").value.trim(),
      paragraph3: document.getElementById("aboutP3").value.trim(),
    },
    featuredEvent: {
      title: document.getElementById("eventTitle").value.trim(),
      date: document.getElementById("eventDate").value.trim(),
      venue: document.getElementById("eventVenue").value.trim(),
      rosterNote: document.getElementById("eventRoster").value.trim(),
    },
    merch,
  };
}

async function loadEditor() {
  const content = await api("/api/admin/site-content");
  fillForm(content);
}

async function handleSave(e) {
  e.preventDefault();
  try {
    const data = readForm();
    const res = await api("/api/admin/site-content", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    fillForm(res.content);
    showStatus("Site content saved. Changes appear on the live site immediately.");
  } catch (err) {
    showStatus(err.message, false);
  }
}

document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
document.getElementById("contentForm")?.addEventListener("submit", handleSave);
document.getElementById("logoutBtn")?.addEventListener("click", logout);

if (getToken()) {
  showPanel("admin");
  document.getElementById("logoutBtn").hidden = false;
  loadEditor().catch(() => {
    logout();
    showStatus("Session expired. Sign in again.", false);
  });
} else {
  showPanel("login");
}
