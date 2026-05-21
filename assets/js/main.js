// Infinite auto-loop carousel
function initAutoCarousel(trackId, { intervalMs = 4500, selector = null } = {}) {
  const track = document.getElementById(trackId);
  if (!track || track.dataset.autoInit) return;
  track.dataset.autoInit = 'true';

  const cardSelector = selector || '.artist-card, .featured-card, .partner-slide';
  const originals = [...track.querySelectorAll(cardSelector)];
  if (!originals.length) return;

  originals.forEach((node) => track.appendChild(node.cloneNode(true)));

  let index = 0;
  let step = 0;
  let paused = false;
  const total = originals.length;

  function measure() {
    const first = track.children[0];
    step = first ? first.offsetWidth + 20 : 340;
  }

  function applyTransform(animate = true) {
    track.style.transition = animate ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    track.style.transform = `translateX(-${index * step}px)`;
  }

  function advance() {
    if (paused || !step) return;
    index += 1;
    applyTransform(true);
    if (index >= total) {
      track.addEventListener(
        'transitionend',
        () => {
          index = 0;
          applyTransform(false);
        },
        { once: true }
      );
    }
  }

  measure();
  applyTransform(false);
  window.addEventListener('resize', () => {
    measure();
    applyTransform(false);
  });

  const wrapper = track.closest('.carousel-wrapper');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', () => { paused = true; });
    wrapper.addEventListener('mouseleave', () => { paused = false; });
  }

  setInterval(advance, intervalMs);
}

function initManualCarousel(trackId, prevId, nextId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  let index = 0;
  const maxOriginal = () => {
    const cards = track.querySelectorAll('.artist-card, .featured-card');
    return Math.max(0, Math.floor(cards.length / 2) - 1);
  };

  function getCardWidth() {
    const card = track.querySelector('.artist-card, .featured-card');
    return card ? card.offsetWidth + 20 : 340;
  }

  function slide(dir) {
    const max = maxOriginal();
    index = Math.max(0, Math.min(index + dir, max));
    track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${index * getCardWidth()}px)`;
  }

  document.getElementById(prevId)?.addEventListener('click', () => slide(-1));
  document.getElementById(nextId)?.addEventListener('click', () => slide(1));
}

initAutoCarousel('carouselTrack', { intervalMs: 4000, selector: '.artist-card' });
initManualCarousel('carouselTrack', 'prevBtn', 'nextBtn');
initAutoCarousel('partnersTrack', { intervalMs: 3500, selector: '.partner-slide' });
initAutoCarousel('featuredTrack', { intervalMs: 5000, selector: '.featured-card' });

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach((el) => observer.observe(el));

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    toast.innerHTML = '<span class="toast-icon">★</span><span id="toastMsg"></span>';
    document.body.appendChild(toast);
  }
  const msgEl = document.getElementById('toastMsg');
  if (!msgEl) return;
  msgEl.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function handleJoin(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('[name="name"]')?.value?.trim();
  const email = form.querySelector('[name="email"]')?.value?.trim();
  if (!name || !email) return;

  try {
    await postJson('/api/subscribe', { name, email });
    showToast('★ Welcome to the SPACEBOYS community!');
    form.reset();
  } catch {
    showToast('Could not join right now. Please try again.');
  }
}

async function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('[name="name"]')?.value?.trim();
  const email = form.querySelector('[name="email"]')?.value?.trim();
  const subject = form.querySelector('[name="subject"]')?.value?.trim();
  const message = form.querySelector('[name="message"]')?.value?.trim();
  if (!name || !email) return;

  try {
    await postJson('/api/contact', { name, email, subject, message });
    showToast('Message sent. We\'ll be in touch.');
    form.reset();
  } catch {
    showToast('Could not send message. Please try again.');
  }
}

async function handleRsvp(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('[name="name"]')?.value?.trim();
  const email = form.querySelector('[name="email"]')?.value?.trim();
  if (!name || !email) return;

  try {
    await postJson('/api/rsvp', {
      name,
      email,
      event: form.dataset.event || 'introduction-to-space-fest-2026',
    });
    showToast('★ You\'re on the list for Introduction to Space Fest!');
    form.reset();
    closeRsvpModal();
  } catch {
    showToast('Could not save RSVP. Please try again.');
  }
}

function openRsvpModal() {
  const modal = document.getElementById('rsvpModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  const firstInput = modal.querySelector('input[name="name"]');
  requestAnimationFrame(() => firstInput?.focus());
}

function closeRsvpModal() {
  const modal = document.getElementById('rsvpModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function initRsvpModal() {
  if (document.body.dataset.rsvpInit) return;
  document.body.dataset.rsvpInit = 'true';

  let modal = document.getElementById('rsvpModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rsvpModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'rsvpModalTitle');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-backdrop" data-rsvp-close></div>
      <div class="modal-panel">
        <button type="button" class="modal-close" data-rsvp-close aria-label="Close">&times;</button>
        <div class="section-tag">RSVP</div>
        <h2 class="modal-title" id="rsvpModalTitle">Introduction to Space Fest</h2>
        <p class="modal-sub">Saturday 20 June 2026 · Venue TBA · Full SPACEBOYS roster</p>
        <form class="community-form rsvp-form" data-event="introduction-to-space-fest-2026">
          <input type="text" name="name" placeholder="Full Name" required autocomplete="name" />
          <input type="email" name="email" placeholder="Email Address" required autocomplete="email" />
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:16px;">Confirm RSVP →</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.querySelector('.rsvp-form')?.addEventListener('submit', handleRsvp);
  modal.querySelectorAll('[data-rsvp-close]').forEach((el) => {
    el.addEventListener('click', closeRsvpModal);
  });

  document.querySelectorAll('[data-rsvp-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openRsvpModal();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('rsvpModal')?.classList.contains('open')) {
      closeRsvpModal();
    }
  });
}

window.openRsvpModal = openRsvpModal;
window.closeRsvpModal = closeRsvpModal;
window.handleRsvp = handleRsvp;

function toggleMobileNav() {
  document.getElementById('mobileNav')?.classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('mobileNav')?.classList.remove('open');
}

function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const panels = document.querySelectorAll('.gallery-panel');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.gallery;
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach((p) => {
        p.hidden = p.dataset.gallery !== target;
      });
    });
  });
}

// Clickable gallery / photo lightbox
function initLightbox() {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  let items = [];
  let current = 0;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.id = 'lightbox';
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-prev" aria-label="Previous">←</button>
    <button type="button" class="lightbox-next" aria-label="Next">→</button>
    <div class="lightbox-stage">
      <img class="lightbox-img" src="" alt="" />
      <p class="lightbox-caption"></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lightbox-img');
  const capEl = overlay.querySelector('.lightbox-caption');

  function showAt(i) {
    current = (i + items.length) % items.length;
    const item = items[current];
    imgEl.src = item.src;
    imgEl.alt = item.alt;
    capEl.textContent = item.alt || '';
  }

  function open(group, startIndex) {
    items = [...document.querySelectorAll(`[data-lightbox="${group}"]`)].map((el) => ({
      src: el.dataset.fullSrc || el.querySelector('img')?.src || el.src,
      alt: el.querySelector('img')?.alt || el.getAttribute('aria-label') || '',
    }));
    showAt(startIndex);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    imgEl.removeAttribute('src');
  }

  triggers.forEach((el, i) => {
    el.addEventListener('click', () => {
      const group = el.dataset.lightbox;
      const siblings = [...document.querySelectorAll(`[data-lightbox="${group}"]`)];
      open(group, siblings.indexOf(el));
    });
  });

  overlay.querySelector('.lightbox-close').addEventListener('click', close);
  overlay.querySelector('.lightbox-prev').addEventListener('click', () => showAt(current - 1));
  overlay.querySelector('.lightbox-next').addEventListener('click', () => showAt(current + 1));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') showAt(current - 1);
    if (e.key === 'ArrowRight') showAt(current + 1);
  });
}

initGalleryTabs();
initLightbox();
initRsvpModal();

if (new URLSearchParams(window.location.search).get('rsvp')) {
  openRsvpModal();
}

if (document.querySelector('.nav-links')) {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((sec) => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === current);
    });
  });
}
