// Carousel
function initCarousel(trackId, prevId, nextId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  let index = 0;

  function getCardWidth() {
    const card = track.querySelector('.artist-card, .featured-card');
    return card ? card.offsetWidth + 20 : 340;
  }

  function slide(dir) {
    const cards = track.querySelectorAll('.artist-card, .featured-card');
    const maxIndex = Math.max(0, cards.length - 1);
    index = Math.max(0, Math.min(index + dir, maxIndex - 1));
    track.style.transform = `translateX(-${index * getCardWidth()}px)`;
  }

  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (prev) prev.addEventListener('click', () => slide(-1));
  if (next) next.addEventListener('click', () => slide(1));
}

initCarousel('carouselTrack', 'prevBtn', 'nextBtn');
initCarousel('featuredTrack', 'featuredPrev', 'featuredNext');

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
revealEls.forEach(el => observer.observe(el));

// Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
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

// Mobile nav
function toggleMobileNav() {
  document.getElementById('mobileNav')?.classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('mobileNav')?.classList.remove('open');
}

// Community gallery tabs
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const panels = document.querySelectorAll('.gallery-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.gallery;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => {
        p.hidden = p.dataset.gallery !== target;
      });
    });
  });
}

initGalleryTabs();
initPartnerTabs();

function initPartnerTabs() {
  const tabs = document.querySelectorAll('.partner-tab');
  const panels = document.querySelectorAll('.partner-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.partner;
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      panels.forEach(p => {
        p.hidden = p.dataset.partner !== target;
      });
    });
  });
}

// Nav highlight on homepage
if (document.querySelector('.nav-links')) {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === current);
    });
  });
}
