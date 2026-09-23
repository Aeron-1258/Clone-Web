import { ATTRACTIONS } from '../data/attractions.js';

let activeIndex = 1;

export function initExplore3D() {
  const gallery = document.querySelector('.explore-3d-gallery');
  const prevBtn = document.getElementById('explore-prev-btn');
  const nextBtn = document.getElementById('explore-next-btn');

  if (!gallery) return;

  renderExploreCards(gallery);
  updateCardTransforms();

  prevBtn?.addEventListener('click', () => {
    activeIndex = (activeIndex - 1 + ATTRACTIONS.length) % ATTRACTIONS.length;
    updateCardTransforms();
  });

  nextBtn?.addEventListener('click', () => {
    activeIndex = (activeIndex + 1) % ATTRACTIONS.length;
    updateCardTransforms();
  });

  // Touch swipe support
  let touchStartX = 0;
  gallery.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  gallery.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        activeIndex = (activeIndex + 1) % ATTRACTIONS.length;
      } else {
        activeIndex = (activeIndex - 1 + ATTRACTIONS.length) % ATTRACTIONS.length;
      }
      updateCardTransforms();
    }
  }, { passive: true });
}

function renderExploreCards(container) {
  container.innerHTML = ATTRACTIONS.map((att, idx) => `
    <div class="explore-3d-card" data-index="${idx}">
      <img src="${att.image}" alt="${att.alt || att.name}" loading="lazy" />
      
      <div class="explore-card-icons">
        <a href="${att.mapsUrl}" target="_blank" rel="noopener noreferrer" class="explore-icon-btn" title="Get Google Maps Directions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </a>
        <button class="explore-icon-btn btn-explore-info" data-index="${idx}" title="Attraction Details">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </button>
      </div>

      <div class="explore-card-footer-overlay">
        <span class="explore-card-name">${att.name}</span>
        <span class="explore-card-terminal">⚓ ${att.nearestTerminal}</span>
      </div>
    </div>
  `).join('');

  // Attach card click handlers
  const cards = container.querySelectorAll('.explore-3d-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.explore-icon-btn')) return;
      const idx = parseInt(card.getAttribute('data-index') || '0', 10);
      activeIndex = idx;
      updateCardTransforms();
    });
  });

  // Attach modal info triggers
  container.querySelectorAll('.btn-explore-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-index') || '0', 10);
      openAttractionModal(ATTRACTIONS[idx]);
    });
  });
}

function updateCardTransforms() {
  const cards = document.querySelectorAll('.explore-3d-card');
  const total = cards.length;
  const isMobile = window.innerWidth <= 768;
  const spacing = isMobile ? 180 : 250;

  cards.forEach((card, idx) => {
    // Relative offset from activeIndex
    let offset = idx - activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);

    if (absOffset > 3) {
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
      card.style.visibility = 'hidden';
      card.style.transform = `translateX(${offset * spacing}px) scale(0.7)`;
    } else {
      card.style.visibility = 'visible';
      card.style.pointerEvents = offset === 0 ? 'auto' : 'auto';
      card.style.opacity = String(Math.max(1 - absOffset * 0.25, 0.2));
      const rotY = offset * -9;
      const scale = offset === 0 ? 1.15 : Math.max(1 - absOffset * 0.1, 0.85);
      const zIndex = 30 - absOffset * 5;

      card.style.zIndex = String(zIndex);
      card.style.transform = `translateX(${offset * spacing}px) perspective(1000px) rotateY(${rotY}deg) scale(${scale})`;
      
      if (offset === 0) {
        card.style.boxShadow = '0 30px 60px rgba(0, 153, 153, 0.35)';
      } else {
        card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
      }
    }
  });
}

function openAttractionModal(att) {
  const modalBackdrop = document.getElementById('station-detail-modal');
  const modalBody = document.getElementById('station-modal-content');
  if (!modalBackdrop || !modalBody || !att) return;

  modalBody.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <span class="route-badge">${att.category}</span>
      <h2 style="font-size:1.8rem; margin:0.5rem 0 0.2rem; color:var(--km-navy);">${att.name}</h2>
      <h4 style="font-size:1.1rem; color:var(--km-teal);">${att.mlName}</h4>
      <p style="color:var(--km-teal-hover); font-style:italic; font-size:0.95rem; margin-top:4px;">“${att.tagline}”</p>
    </div>

    <div style="border-radius:var(--radius-md); overflow:hidden; margin-bottom:1.5rem; height:240px;">
      <img src="${att.image}" alt="${att.name}" style="width:100%; height:100%; object-fit:cover;" />
    </div>

    <p style="color:var(--km-slate); font-size:1rem; line-height:1.6; margin-bottom:1.5rem;">
      ${att.description}
    </p>

    <div style="background:var(--km-bg-light); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">
      <p style="font-size:0.95rem; color:var(--km-navy); font-weight:700; margin-bottom:0.5rem;">
        ⚓ Nearest Water Metro Terminal: <span style="color:var(--km-teal); font-weight:600;">${att.nearestTerminal}</span>
      </p>
      <p style="font-size:0.9rem; color:var(--km-slate);">
        🚇 Feeder Connection: ${att.metroFeeder}
      </p>
    </div>

    <div style="display:flex; gap:1rem;">
      <a href="${att.mapsUrl}" target="_blank" rel="noopener noreferrer" class="blob-btn" style="flex:1;">
        <span class="btn-text">Open Google Maps Navigation ➔</span>
      </a>
    </div>
  `;

  modalBackdrop.classList.add('open');
}
