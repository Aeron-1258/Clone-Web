/**
 * Integrated Multi-Modal Transit Arc Carousel
 * Re-creates the cinematic curved 3D fanned card layout with dynamic mode titles,
 * live circular positioning, and rich transportation editorial context.
 */

const TRANSIT_MODES = [
  {
    index: 0,
    mode: 'mybyk',
    line1: 'SMART',
    line2: 'CYCLES',
    desc: "Integrated public bicycle sharing stations powered by MYBYK provide flexible, health-conscious micro-mobility along scenic waterfront promenades, metro viaducts, and collegiate corridors. Commuters can effortlessly scan, unlock, and ride using the Kochi1 app, promoting zero-carbon urban living and active first-and-last-mile connectivity.",
    perks: [
      { icon: '💳', label: 'Kochi1 Card', value: 'First 30 minutes free for smart card holders' },
      { icon: '🚲', label: 'Micro-Mobility', value: '300+ smart IoT-enabled bicycles across 35 hubs' },
      { icon: '📍', label: 'Docking Hubs', value: 'Stationed at all Metro stations & Water terminals' }
    ]
  },
  {
    index: 1,
    mode: 'bus',
    line1: 'FEEDER',
    line2: 'E-BUS',
    desc: "Synchronized zero-emission electric feeder buses seamlessly bridge the first and last mile between metro stations, water terminals, and major commercial districts including Infopark and CIAL. Featuring real-time GPS tracking, onboard digital announcements, and unified Kochi1 smart card validation, they guarantee stress-free onward connectivity across the city.",
    perks: [
      { icon: '💳', label: 'Smart Card', value: 'Tap-to-pay via Kochi1 Card or UPI conductor ETM' },
      { icon: '🚌', label: 'AC Fleet', value: '100% electric low-floor buses with fast charging' },
      { icon: '⏱️', label: 'Frequency', value: 'Synchronized with boat & train arrival timings' }
    ]
  },
  {
    index: 2,
    mode: 'rail',
    line1: 'METRO',
    line2: 'RAIL',
    desc: "Kochi Metro is the high-tech backbone of the city's public transport system, pioneering fully integrated ticketing and GoA2 driverless-ready automation technology. Traversing 26 elevated stations covering 28 kms across the busiest urban corridors, the system delivers an ultra-frequent, climate-controlled, and energy-efficient commute that has transformed Kochi's daily passenger experience. With state-of-the-art safety features, stunning station architecture, and unparalleled punctuality; the metro rail redefines modern city travel, making it the fastest and most dependable transit corridor in the state.",
    perks: [
      { icon: '💳', label: 'Unified Smart Card', value: '20% instant fare rebate with Kochi1 Card' },
      { icon: '🔄', label: 'Direct Hub Walk', value: 'Physical cross-platform transfer at Vyttila Mobility Hub' },
      { icon: '⚡', label: '100% Green', value: 'Fully solar powered stations & regenerative braking' }
    ]
  },
  {
    index: 3,
    mode: 'water',
    line1: 'WATER',
    line2: 'METRO',
    desc: "Kochi Water Metro is India's first integrated water transit network, deploying 75+ state-of-the-art electric hybrid catamarans connecting 10 mainland and island terminals. Engineered by Cochin Shipyard with zero direct emissions, whisper-quiet electric propulsion, and climate-controlled panoramic passenger salons, the water metro revives Kochi's historic waterways as modern, eco-friendly transit highways.",
    perks: [
      { icon: '💳', label: 'Fare Discount', value: '20% discount on all routes with Kochi1 Card' },
      { icon: '🚢', label: 'Eco Fleet', value: '75+ battery-powered catamarans with twin electric pods' },
      { icon: '🌊', label: 'Accessible', value: 'Floating tidal pontoons with level wheelchair boarding' }
    ]
  },
  {
    index: 4,
    mode: 'auto',
    line1: 'METRO',
    line2: 'AUTO',
    desc: "KMRL's electrified first-and-last mile feeder autos operate from designated terminal bays under transparent, regulated prepaid fare structures. Integrated with mobile ticketing and digital cashless payments, they provide safe, round-the-clock door-to-door transit for island residents and metro commuters alike, eliminating fare haggling and ensuring reliable connectivity.",
    perks: [
      { icon: '💳', label: 'Cashless Travel', value: 'Digital UPI & Kochi1 smart card accepted' },
      { icon: '🚖', label: 'Prepaid Counters', value: 'Fixed government-regulated tariffs at all gates' },
      { icon: '🛡️', label: 'Safe & Verified', value: 'KMRL verified drivers & GPS monitored trips' }
    ]
  }
];

export function initFanLayout() {
  const cards = document.querySelectorAll('.fan-arc-card');
  const titleContainer = document.getElementById('integrated-mode-title');
  const paragraphEl = document.getElementById('fan-editorial-paragraph');
  const perksEl = document.getElementById('fan-perks-row');

  if (!cards.length) return;

  let activeIndex = 2; // Default active: Kochi Metro Rail (matching user reference)
  const totalCards = cards.length;

  // Responsive geometry parameters based on viewport
  function getLayoutConfig() {
    const w = window.innerWidth;
    if (w < 640) {
      return {
        stepX: 75,
        stepY: 14,
        stepRot: 7,
        centerScale: 1.04,
        wingScale: 0.82,
        farWingScale: 0.70,
        centerY: -14
      };
    } else if (w < 1024) {
      return {
        stepX: 135,
        stepY: 18,
        stepRot: 8,
        centerScale: 1.06,
        wingScale: 0.90,
        farWingScale: 0.82,
        centerY: -20
      };
    } else {
      return {
        stepX: 185,
        stepY: 22,
        stepRot: 8.5,
        centerScale: 1.08,
        wingScale: 0.95,
        farWingScale: 0.88,
        centerY: -26
      };
    }
  }

  function updateLayout(animate = true) {
    const cfg = getLayoutConfig();

    cards.forEach((card, i) => {
      // Calculate circular offset from activeIndex
      let diff = i - activeIndex;
      if (diff > totalCards / 2) diff -= totalCards;
      if (diff < -totalCards / 2) diff += totalCards;

      const isCenter = diff === 0;
      const absDiff = Math.abs(diff);

      let x = 0;
      let y = 0;
      let rot = 0;
      let scale = 1;
      let zIndex = 10;
      let opacity = 1;

      if (isCenter) {
        x = 0;
        y = cfg.centerY;
        rot = 0;
        scale = cfg.centerScale;
        zIndex = 25;
        opacity = 1;
      } else if (absDiff === 1) {
        x = diff * cfg.stepX;
        y = cfg.stepY;
        rot = diff * cfg.stepRot;
        scale = cfg.wingScale;
        zIndex = 18;
        opacity = 0.95;
      } else {
        x = diff * cfg.stepX * 1.95;
        y = cfg.stepY * 2.2;
        rot = diff * cfg.stepRot * 1.9;
        scale = cfg.farWingScale;
        zIndex = 10;
        opacity = 0.82;
      }

      card.style.transition = animate
        ? 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease, box-shadow 0.5s ease, border-color 0.4s ease'
        : 'none';

      card.style.transform = `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`;
      card.style.zIndex = zIndex;
      card.style.opacity = opacity;

      if (isCenter) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Mode Pills Active State
    const pills = document.querySelectorAll('.mode-pill-btn');
    pills.forEach((pill, idx) => {
      if (idx === activeIndex) {
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
      } else {
        pill.classList.remove('active');
        pill.setAttribute('aria-selected', 'false');
      }
    });

    // Update Text Content
    const activeMode = TRANSIT_MODES[activeIndex];
    if (activeMode) {
      if (titleContainer) {
        titleContainer.style.opacity = '0';
        titleContainer.style.transform = 'translateY(-8px)';
        setTimeout(() => {
          titleContainer.innerHTML = `
            <span class="title-line title-line-1">${activeMode.line1}</span>
            <span class="title-line title-line-2">${activeMode.line2}</span>
          `;
          titleContainer.style.opacity = '1';
          titleContainer.style.transform = 'translateY(0)';
        }, 180);
      }

      if (paragraphEl) {
        paragraphEl.style.opacity = '0';
        paragraphEl.style.transform = 'translateY(6px)';
        setTimeout(() => {
          paragraphEl.textContent = activeMode.desc;
          paragraphEl.style.opacity = '1';
          paragraphEl.style.transform = 'translateY(0)';
        }, 200);
      }

      if (perksEl && activeMode.perks) {
        perksEl.innerHTML = activeMode.perks.map(p => `
          <span class="fan-perk-item">
            ${p.icon} <strong>${p.label}:</strong> ${p.value}
          </span>
        `).join('');
      }
    }
  }

  function setActiveIndex(newIndex) {
    if (newIndex < 0) {
      activeIndex = totalCards - 1;
    } else if (newIndex >= totalCards) {
      activeIndex = 0;
    } else {
      activeIndex = newIndex;
    }
    updateLayout(true);
  }

  // Initial layout render
  updateLayout(false);

  // Card click & keyboard interaction
  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      setActiveIndex(index);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveIndex(index);
      }
    });
  });

  // Mode selector pills interaction
  const pillBtns = document.querySelectorAll('.mode-pill-btn');
  pillBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      setActiveIndex(index);
    });
  });

  // Prev / Next Navigation Arrows
  const prevBtn = document.getElementById('fan-prev-btn');
  const nextBtn = document.getElementById('fan-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      setActiveIndex(activeIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      setActiveIndex(activeIndex + 1);
    });
  }

  // Keyboard arrow navigation on section
  const section = document.getElementById('integrated-network');
  if (section) {
    section.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(activeIndex + 1);
      }
    });
  }

  // Touch Swipe on mobile
  const stage = document.getElementById('fan-arc-stage');
  if (stage) {
    let touchStartX = 0;
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) {
          setActiveIndex(activeIndex + 1);
        } else {
          setActiveIndex(activeIndex - 1);
        }
      }
    }, { passive: true });
  }

  // Window resize debounced
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => updateLayout(false), 150);
  });
}
