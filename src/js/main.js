import { initSplashScreen } from './splash.js';
import { initNavigation } from './nav.js';
import { initRidershipCounter } from './ridership.js';
import { initNetworkMap } from './map.js';
import { initJourneyPlanner, setPlannerOrigin } from './planner.js';
import { initTimetable } from './timetable.js';
import { initFanLayout } from './fan-layout.js';
import { initExplore3D } from './explore-3d.js';
import { initCardFlip } from './card-flip.js';
import { initVirtualTour } from './virtual-tour.js';
import { initSustainability } from './sustainability.js';

import { STATIONS } from '../data/stations.js';
import { NEWS_ITEMS } from '../data/news.js';
import { TENDERS, CAREERS, BOARD_OF_DIRECTORS } from '../data/careers-tenders.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Splash Screen
  initSplashScreen();

  // 2. Navigation & Bilingual support
  initNavigation((lang, dict) => {
    applyLanguageTranslations(dict);
  });

  // 3. Live Ridership Counter
  initRidershipCounter();

  // 4. Interactive Network Map
  initNetworkMap((stationId) => {
    setPlannerOrigin(stationId);
  });

  // 5. Smart Journey Planner
  initJourneyPlanner();

  // 6. Timetable Schedule Board
  initTimetable();

  // 7. 3D Fan Layout Transit Showcase
  initFanLayout();

  // 8. 3D Perspective Explore Kochi Carousel
  initExplore3D();

  // 9. 3D Kochi1 Card Flipper
  initCardFlip();

  // 10. 360° Virtual Tour
  initVirtualTour();

  // 11. Sustainability 3-Pillar Tabs
  initSustainability();

  // 12. Render Terminals Horizontal Carousel
  renderTerminalsCarousel();

  // 13. Render News & Media Grid
  renderNewsGrid();

  // 14. Render Tenders & Careers Portals
  renderTendersAndCareers();

  // 15. Render Board of Directors
  renderBoardOfDirectors();

  // 16. Global Modal handlers
  setupModalDismissals();
});

function renderTerminalsCarousel() {
  const container = document.getElementById('terminals-carousel-inner');
  if (!container) return;

  container.innerHTML = STATIONS.map(station => `
    <div class="terminal-card" data-station-id="${station.id}">
      <div class="terminal-card-img-wrap">
        <img 
          class="terminal-card-img" 
          src="https://cdn-dev.watermetro.co.in/kakkanad_station_c7f7508e20.jpg" 
          alt="${station.name} Terminal" 
          loading="lazy"
        />
        <span class="terminal-status-badge ${station.status}">
          ${station.status === 'operational' ? '🟢 Operational' : '🟡 Phase 2'}
        </span>
      </div>
      <div class="terminal-card-body">
        <span class="terminal-card-zone">${station.zone}</span>
        <h3 class="terminal-card-title">${station.name}</h3>
        <div style="font-size:0.85rem; color:var(--km-teal); font-weight:700; margin-bottom:0.5rem;">${station.mlName}</div>
        <p class="terminal-card-desc">${station.description}</p>
        <div class="terminal-card-footer">
          <span>Headway: ${station.headway}</span>
          <span style="display:flex; align-items:center; gap:4px;">
            Explore Jetty ➔
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // Click on card opens details
  container.querySelectorAll('.terminal-card').forEach(card => {
    card.addEventListener('click', () => {
      const stationId = card.getAttribute('data-station-id');
      const station = STATIONS.find(s => s.id === stationId);
      if (station) {
        setPlannerOrigin(station.id);
      }
    });
  });
}

function renderNewsGrid() {
  const container = document.getElementById('news-cards-grid');
  if (!container) return;

  container.innerHTML = NEWS_ITEMS.map(item => `
    <div class="news-card" style="background:#ffffff; border-radius:var(--radius-lg); border:1px solid var(--km-border); overflow:hidden; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; transition:transform 0.3s, box-shadow 0.3s; cursor:pointer;">
      <div style="height:200px; width:100%; position:relative; overflow:hidden;">
        <img src="${item.image}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.5s;" />
        <span style="position:absolute; top:12px; left:12px; background:rgba(255,255,255,0.92); padding:4px 10px; border-radius:var(--radius-pill); font-size:0.75rem; font-weight:700; color:var(--km-teal);">
          ${item.badge}
        </span>
      </div>
      <div style="padding:1.5rem; display:flex; flex-direction:column; flex:1;">
        <span style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-bottom:0.4rem;">${item.date} • ${item.readTime}</span>
        <h4 style="font-size:1.15rem; color:var(--km-navy); font-weight:800; line-height:1.4; margin-bottom:0.75rem; flex:1;">${item.title}</h4>
        <p style="font-size:0.9rem; color:var(--km-muted); line-height:1.5; margin-bottom:1rem;">${item.summary}</p>
        <span style="color:var(--km-teal); font-weight:700; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
          Read Full Release ➔
        </span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.news-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      openNewsModal(NEWS_ITEMS[i]);
    });
  });
}

function openNewsModal(news) {
  const modalBackdrop = document.getElementById('station-detail-modal');
  const modalBody = document.getElementById('station-modal-content');
  if (!modalBackdrop || !modalBody || !news) return;

  modalBody.innerHTML = `
    <span class="route-badge">${news.badge}</span>
    <h2 style="font-size:1.6rem; color:var(--km-navy); margin:0.5rem 0; line-height:1.3;">${news.title}</h2>
    <div style="font-size:0.85rem; color:var(--km-slate); margin-bottom:1rem;">
      Published on ${news.date} by ${news.author}
    </div>
    <div style="height:240px; border-radius:var(--radius-md); overflow:hidden; margin-bottom:1.5rem;">
      <img src="${news.image}" alt="${news.title}" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <p style="color:var(--km-slate); font-size:1.05rem; line-height:1.8; margin-bottom:1.5rem;">
      ${news.summary}
    </p>
    <div style="background:var(--km-bg-light); padding:1rem; border-radius:var(--radius-md); font-size:0.9rem; color:var(--km-muted);">
      For media inquiries, interview requests, or commercial leasing terms, please email: 
      <strong style="color:var(--km-teal);">customercare@watermetro.co.in</strong>
    </div>
  `;

  modalBackdrop.classList.add('open');
}

function renderTendersAndCareers() {
  const tendersContainer = document.getElementById('tenders-list-table');
  const careersContainer = document.getElementById('careers-list-grid');

  if (tendersContainer) {
    tendersContainer.innerHTML = TENDERS.map(t => `
      <tr style="border-bottom: 1px solid var(--km-border);">
        <td style="padding: 1rem; font-weight:700; color:var(--km-teal);">${t.refId}</td>
        <td style="padding: 1rem; color:var(--km-navy); font-weight:600;">${t.title}</td>
        <td style="padding: 1rem; color:var(--km-slate); font-size:0.88rem;">${t.submissionDeadline}</td>
        <td style="padding: 1rem;">
          <span style="padding:4px 8px; border-radius:var(--radius-pill); font-size:0.75rem; font-weight:700; background:rgba(0,153,153,0.1); color:var(--km-teal);">
            ${t.status}
          </span>
        </td>
        <td style="padding: 1rem;">
          <button class="btn-download-tender" style="color:var(--km-teal); font-weight:700; font-size:0.85rem; border:1px solid var(--km-teal); padding:4px 10px; border-radius:var(--radius-sm); background:transparent; cursor:pointer;">
            Download RFP 📥
          </button>
        </td>
      </tr>
    `).join('');
  }

  if (careersContainer) {
    careersContainer.innerHTML = CAREERS.map(c => `
      <div style="background:#ffffff; border:1px solid var(--km-border); border-radius:var(--radius-md); padding:1.5rem; box-shadow:var(--shadow-sm); display:flex; flex-direction:column;">
        <span style="font-size:0.75rem; color:var(--km-teal); font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">
          ${c.refId} • ${c.department}
        </span>
        <h4 style="font-size:1.2rem; color:var(--km-navy); font-weight:800; margin:0.4rem 0;">${c.title}</h4>
        <p style="font-size:0.85rem; color:var(--km-slate); margin-bottom:1rem; flex:1;">${c.qualification}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--km-border); padding-top:0.75rem;">
          <span style="font-size:0.8rem; color:#94a3b8;">Deadline: <strong>${c.deadline}</strong></span>
          <button class="blob-btn" style="padding:0.4rem 1rem; font-size:0.85rem;" onclick="alert('Application portal for ${c.title} (Ref: ${c.refId}) is active. Please submit CV to customercare@watermetro.co.in')">
            <span class="btn-text">Apply Now</span>
          </button>
        </div>
      </div>
    `).join('');
  }
}

function renderBoardOfDirectors() {
  const container = document.getElementById('directors-grid');
  if (!container) return;

  container.innerHTML = BOARD_OF_DIRECTORS.map(dir => `
    <div style="background:#ffffff; border:1px solid var(--km-border); border-radius:var(--radius-md); padding:1.5rem; text-align:center; box-shadow:var(--shadow-sm);">
      <div style="width:70px; height:70px; border-radius:50%; background:var(--km-teal-light); color:var(--km-teal); font-size:1.8rem; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">
        ${dir.name.charAt(0)}
      </div>
      <h4 style="font-size:1.15rem; color:var(--km-navy); font-weight:800; margin-bottom:0.25rem;">${dir.name}</h4>
      <div style="font-size:0.85rem; color:var(--km-teal); font-weight:700; margin-bottom:0.4rem;">${dir.role}</div>
      <p style="font-size:0.82rem; color:var(--km-slate); line-height:1.4;">${dir.designation}</p>
    </div>
  `).join('');
}

function setupModalDismissals() {
  const modalBackdrop = document.getElementById('station-detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn?.addEventListener('click', () => {
    modalBackdrop?.classList.remove('open');
  });

  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.remove('open');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalBackdrop?.classList.remove('open');
    }
  });
}

function applyLanguageTranslations(dict) {
  // Update UI texts across sections
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keyPath = el.getAttribute('data-i18n')?.split('.');
    if (!keyPath) return;

    let value = dict;
    for (const key of keyPath) {
      value = value?.[key];
    }
    if (value && typeof value === 'string') {
      el.textContent = value;
    }
  });
}
