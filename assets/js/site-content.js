function setText(el, value) {
  if (!el || value == null) return;
  if (el.dataset.contentHtml === "true") {
    el.innerHTML = String(value).replace(/\n/g, "<br>");
  } else {
    el.textContent = value;
  }
}

function applySiteContent(content) {
  if (!content) return;

  const eyebrow = document.querySelector("[data-content='hero.eyebrow']");
  if (eyebrow && content.hero?.eyebrow) {
    eyebrow.innerHTML = `<span></span> ${content.hero.eyebrow}`;
  }
  const title = document.querySelector("[data-content='hero.title']");
  if (title && content.hero) {
    title.innerHTML = `${content.hero.titleLine1 || "SPACE"}<span class="hollow">${content.hero.titleLine2 || "BOYS"}</span>`;
  }
  setText(document.querySelector("[data-content='hero.subtitle']"), content.hero?.subtitle);

  const aboutTitle = document.querySelector("[data-content='about.title']");
  if (aboutTitle && content.about?.title) {
    aboutTitle.innerHTML = String(content.about.title).replace(/\n/g, "<br>");
  }
  setText(document.querySelector("[data-content='about.p1']"), content.about?.paragraph1);
  setText(document.querySelector("[data-content='about.p2']"), content.about?.paragraph2);
  setText(document.querySelector("[data-content='about.p3']"), content.about?.paragraph3);

  const event = content.featuredEvent;
  if (event) {
    setText(document.querySelector("[data-content='event.title']"), event.title);
    setText(document.querySelector("[data-content='event.venue']"), event.venue);
    setText(document.querySelector("[data-content='event.roster']"), event.rosterNote);
    setText(document.querySelector("[data-content='event.date']"), event.date);
  }

  if (Array.isArray(content.merch)) {
    content.merch.forEach((item, i) => {
      const card = document.querySelector(`[data-merch-index="${i}"]`);
      if (!card) return;
      const img = card.querySelector("[data-merch-image]");
      const name = card.querySelector("[data-merch-name]");
      const type = card.querySelector("[data-merch-type]");
      const price = card.querySelector("[data-merch-price]");
      const desc = card.querySelector("[data-merch-desc]");
      if (img && item.image) img.src = item.image;
      if (name) name.textContent = item.name || "";
      if (type) type.textContent = item.type || "";
      if (price) price.textContent = item.price || "";
      if (desc) desc.textContent = item.description || "";
    });
  }
}

async function loadSiteContent() {
  try {
    const res = await fetch("/api/site-content");
    if (!res.ok) return;
    const content = await res.json();
    applySiteContent(content);
  } catch {
    /* static defaults remain */
  }
}

loadSiteContent();
