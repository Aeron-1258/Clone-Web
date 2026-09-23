import { ATTRACTIONS } from '../data/attractions.js';

export function initExploreCarousel() {
  const track = document.getElementById('explore-carousel-track');
  const viewport = document.getElementById('explore-carousel-viewport');
  const prevBtn = document.getElementById('explore-dest-prev');
  const nextBtn = document.getElementById('explore-dest-next');

  if (!track || !viewport) return;

  // Render cards with 3 sets for perfectly seamless infinite loop
  renderCarouselTrack(track);

  // Motion state variables
  let translateX = 0;
  let targetSpeed = 48; // pixels per second (RIGHT -> LEFT cruise)
  let currentSpeed = 0; // starts at 0 and smoothly accelerates
  let isHovered = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTranslate = 0;
  let lastTime = null;
  let singleSetWidth = 0;
  let nudgeVelocity = 0;

  // Calculate single set width (17 cards * (cardWidth + gap))
  function calculateSetWidth() {
    const cards = track.querySelectorAll('.explore-dest-card');
    if (cards.length >= ATTRACTIONS.length) {
      const firstCard = cards[0];
      const secondCard = cards[1];
      if (firstCard && secondCard) {
        const cardSpacing = secondCard.offsetLeft - firstCard.offsetLeft;
        singleSetWidth = cardSpacing * ATTRACTIONS.length;
      }
    }
    if (!singleSetWidth || singleSetWidth <= 0) {
      singleSetWidth = (230 + 20) * ATTRACTIONS.length; // 4250px fallback
    }
  }

  // Initial calculation after render
  setTimeout(calculateSetWidth, 100);
  window.addEventListener('resize', calculateSetWidth);

  // Main high-performance animation loop
  function animateCarousel(now) {
    if (!lastTime) lastTime = now;
    const delta = Math.min((now - lastTime) / 1000, 0.1); // in seconds
    lastTime = now;

    if (!isDragging) {
      // Determine desired speed: if hovered, slow/stop smoothly; otherwise cruise
      const desiredSpeed = isHovered ? 0 : targetSpeed;

      // Smooth acceleration / deceleration easing (natural website-carousel feel)
      currentSpeed += (desiredSpeed - currentSpeed) * Math.min(delta * 4, 1);

      // Apply nudge impulse from navigation buttons
      if (Math.abs(nudgeVelocity) > 0.5) {
        translateX += nudgeVelocity * delta;
        nudgeVelocity *= Math.pow(0.08, delta); // smooth deceleration
      }

      // Continuous movement: RIGHT -> LEFT
      translateX -= currentSpeed * delta;

      // Infinite loop wrap: seamless jump when a full set has cycled
      if (singleSetWidth > 0) {
        while (translateX <= -singleSetWidth) {
          translateX += singleSetWidth;
        }
        while (translateX > 0) {
          translateX -= singleSetWidth;
        }
      }

      track.style.transform = `translate3d(${translateX}px, 0, 0)`;
    }

    requestAnimationFrame(animateCarousel);
  }

  requestAnimationFrame(animateCarousel);

  // Hover slow-down / pause
  viewport.addEventListener('mouseenter', () => { isHovered = true; });
  viewport.addEventListener('mouseleave', () => { isHovered = false; });

  // Stationary Navigation Buttons (<- and ->)
  // Clicking -> moves cards from RIGHT to LEFT faster (advance forward)
  nextBtn?.addEventListener('click', () => {
    const cardStep = 250;
    nudgeVelocity -= 650; // smooth impulse toward left
  });

  // Clicking <- moves cards backward toward RIGHT
  prevBtn?.addEventListener('click', () => {
    const cardStep = 250;
    nudgeVelocity += 650; // smooth impulse toward right
  });

  // Pointer drag / swipe support
  viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.card-action-icon')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartTranslate = translateX;
    viewport.style.cursor = 'grabbing';
    track.style.transition = 'none';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    translateX = dragStartTranslate + diff;
    if (singleSetWidth > 0) {
      while (translateX <= -singleSetWidth) translateX += singleSetWidth;
      while (translateX > 0) translateX -= singleSetWidth;
    }
    track.style.transform = `translate3d(${translateX}px, 0, 0)`;
  });

  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.cursor = 'grab';
    lastTime = performance.now();
  });

  // Card click & modal handler
  setupCardInteractions(track);
}

function renderCarouselTrack(container) {
  // Triple the items to ensure seamless wrapping without any visible gaps
  const repeatedAttractions = [...ATTRACTIONS, ...ATTRACTIONS, ...ATTRACTIONS];

  container.innerHTML = repeatedAttractions.map((att, idx) => `
    <div class="explore-dest-card" data-att-id="${att.id}" data-index="${idx}">
      <img class="dest-card-img" src="${att.image}" alt="${att.alt || att.name}" loading="lazy" />
      <div class="dest-card-bottom-gradient"></div>

      <!-- Top-Right Action Circular Icons -->
      <div class="dest-card-top-icons">
        <a href="${att.mapsUrl}" target="_blank" rel="noopener noreferrer" class="card-action-icon" title="View Directions on Google Maps" aria-label="Directions to ${att.name}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </a>
        <button class="card-action-icon btn-card-details" data-att-id="${att.id}" title="Attraction Details" aria-label="Details about ${att.name}" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>

      <!-- Bottom Overlay: Destination Name in White -->
      <div class="dest-card-caption">
        <h3 class="dest-card-title">${att.name}</h3>
        <span class="dest-card-terminal">⚓ ${att.nearestTerminal}</span>
      </div>
    </div>
  `).join('');
}

function setupCardInteractions(track) {
  track.querySelectorAll('.btn-card-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-att-id');
      const attraction = ATTRACTIONS.find(a => a.id === id);
      if (attraction) {
        openAttractionModal(attraction);
      }
    });
  });

  track.querySelectorAll('.explore-dest-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-icon')) return;
      const id = card.getAttribute('data-att-id');
      const attraction = ATTRACTIONS.find(a => a.id === id);
      if (attraction) {
        openAttractionModal(attraction);
      }
    });
  });
}

function openAttractionModal(attraction) {
  // Reuse or create modal
  let modal = document.getElementById('explore-attraction-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'explore-attraction-modal';
    modal.className = 'explore-modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="explore-modal-dialog">
      <button class="explore-modal-close" id="btn-close-explore-modal" aria-label="Close modal">&times;</button>
      <div class="explore-modal-hero">
        <img src="${attraction.image}" alt="${attraction.alt || attraction.name}" />
        <div class="explore-modal-hero-gradient"></div>
        <div class="explore-modal-hero-badge">${attraction.category}</div>
      </div>
      <div class="explore-modal-body">
        <div class="explore-modal-header">
          <h3 class="explore-modal-title">${attraction.name}</h3>
          <span class="explore-modal-ml">${attraction.mlName || ''}</span>
        </div>
        <p class="explore-modal-tagline">${attraction.tagline}</p>
        <p class="explore-modal-desc">${attraction.description}</p>
        <div class="explore-modal-meta">
          <div class="modal-meta-row">
            <span class="meta-label">Nearest Water Metro Pier:</span>
            <span class="meta-val">⚓ ${attraction.nearestTerminal}</span>
          </div>
          <div class="modal-meta-row">
            <span class="meta-label">Transit Connection:</span>
            <span class="meta-val">⚡ ${attraction.metroFeeder || 'Direct passenger walkway'}</span>
          </div>
        </div>
        <div class="explore-modal-actions">
          <a href="${attraction.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-modal-gmaps">
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const closeBtn = document.getElementById('btn-close-explore-modal');
  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
