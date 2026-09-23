import { STATIONS } from '../data/stations.js';
import { ROUTES } from '../data/routes.js';
import { highlightRouteOnMap } from './map.js';

export function initJourneyPlanner() {
  const fromSelect = document.getElementById('planner-from-select');
  const toSelect = document.getElementById('planner-to-select');
  const swapBtn = document.getElementById('planner-swap-btn');
  const calcBtn = document.getElementById('planner-calc-btn');

  if (!fromSelect || !toSelect) return;

  // Populate Dropdowns
  populateStationSelects(fromSelect, toSelect);

  // Set default selection (High Court -> Vypin)
  fromSelect.value = 'high-court';
  toSelect.value = 'vypin';

  // Setup Quick Route Preset Chips
  setupQuickRouteChips(fromSelect, toSelect);

  // Calculate initial route
  calculateJourney('high-court', 'vypin');

  // Swap button
  swapBtn?.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateActiveQuickChip(fromSelect.value, toSelect.value);
    calculateJourney(fromSelect.value, toSelect.value);
  });

  // Calculate on button click or change
  calcBtn?.addEventListener('click', () => {
    updateActiveQuickChip(fromSelect.value, toSelect.value);
    calculateJourney(fromSelect.value, toSelect.value);
  });

  fromSelect.addEventListener('change', () => {
    updateActiveQuickChip(fromSelect.value, toSelect.value);
    calculateJourney(fromSelect.value, toSelect.value);
  });

  toSelect.addEventListener('change', () => {
    updateActiveQuickChip(fromSelect.value, toSelect.value);
    calculateJourney(fromSelect.value, toSelect.value);
  });
}

function populateStationSelects(fromEl, toEl) {
  const optionsHtml = STATIONS.map(s => `
    <option value="${s.id}">${s.name} (${s.mlName}) ${s.status === 'planned' ? '— Phase 2' : ''}</option>
  `).join('');

  fromEl.innerHTML = optionsHtml;
  toEl.innerHTML = optionsHtml;
}

function setupQuickRouteChips(fromSelect, toSelect) {
  const chips = document.querySelectorAll('.quick-route-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const from = chip.getAttribute('data-from');
      const to = chip.getAttribute('data-to');
      if (from && to) {
        fromSelect.value = from;
        toSelect.value = to;
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        calculateJourney(from, to);
      }
    });
  });
}

function updateActiveQuickChip(from, to) {
  const chips = document.querySelectorAll('.quick-route-chip');
  chips.forEach(chip => {
    const f = chip.getAttribute('data-from');
    const t = chip.getAttribute('data-to');
    if (f === from && t === to) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

export function setPlannerOrigin(stationId) {
  const fromSelect = document.getElementById('planner-from-select');
  const toSelect = document.getElementById('planner-to-select');
  if (!fromSelect || !toSelect) return;

  fromSelect.value = stationId;
  // If destination matches, choose a different connected terminal
  if (fromSelect.value === toSelect.value) {
    const station = STATIONS.find(s => s.id === stationId);
    if (station && station.connections.length > 0) {
      toSelect.value = station.connections[0];
    }
  }

  updateActiveQuickChip(fromSelect.value, toSelect.value);
  calculateJourney(fromSelect.value, toSelect.value);

  // Smooth scroll to planner section
  document.getElementById('journey-planner')?.scrollIntoView({ behavior: 'smooth' });
}

function calculateJourney(fromId, toId) {
  const resultPane = document.getElementById('planner-result-pane');
  if (!resultPane) return;

  if (fromId === toId) {
    resultPane.innerHTML = `
      <div style="text-align:center; padding: 3rem 1.5rem;">
        <div style="font-size:3rem; margin-bottom:1rem;">⚓</div>
        <h3 style="color:var(--km-cyan); margin-bottom: 0.5rem; font-size:1.3rem;">Same Origin & Destination Selected</h3>
        <p style="color:#94a3b8; max-width:400px; margin:0 auto;">Please choose a different destination terminal to calculate live voyage schedule, waterway simulation, and distance-based fare.</p>
      </div>
    `;
    return;
  }

  const fromStation = STATIONS.find(s => s.id === fromId);
  const toStation = STATIONS.find(s => s.id === toId);

  // Look for direct route
  let matchingRoute = ROUTES.find(r => 
    (r.stations[0] === fromId && r.stations[1] === toId) ||
    (r.stations[1] === fromId && r.stations[0] === toId)
  );

  let fare = 20;
  let duration = 15;
  let distance = 4.2;
  let headway = '15 mins';
  let isDirect = true;

  if (matchingRoute) {
    fare = matchingRoute.fare;
    duration = matchingRoute.durationMin;
    distance = matchingRoute.distanceKm;
    headway = matchingRoute.headway;
  } else {
    // Calculated estimation for multi-hop or general connection
    isDirect = false;
    fare = 35;
    duration = 28;
    distance = 8.6;
    headway = '15-20 mins';
  }

  // Generate dynamic upcoming departures
  const departures = generateUpcomingDepartures();

  resultPane.innerHTML = `
    <div class="result-header">
      <div class="result-header-text">
        <div class="route-badge-row">
          <span class="route-badge ${isDirect ? 'badge-direct' : 'badge-transfer'}">
            <span class="badge-dot"></span>
            ${isDirect ? 'Direct Waterway Corridor' : 'Transfer via High Court / Vyttila'}
          </span>
          <span class="vessel-badge">⚡ MV 309 CP • Electric Hybrid</span>
        </div>
        <h3 class="result-route-title">${fromStation?.name} ➔ ${toStation?.name}</h3>
        <div class="result-ml-title">
          ${fromStation?.mlName || ''} മുതൽ ${toStation?.mlName || ''} വരെ
        </div>
      </div>
    </div>

    <!-- ====================================================
         CREATIVE ANIMATED WATERWAY VOYAGE SIMULATOR
         (Features official transparent Kochi Water Metro Catamaran)
         ==================================================== -->
    <div class="voyage-waterway-visualizer" id="voyage-waterway-visualizer">
      <div class="waterway-top-meta">
        <div class="waterway-status-tag">
          <span class="waterway-live-dot"></span>
          <span>LIVE VOYAGE SIMULATION</span>
        </div>
        <div class="waterway-boat-id">Kochi Water Metro • Zero Direct Emission</div>
      </div>

      <div class="waterway-scene">
        <!-- Flowing Backwater Waves Layer -->
        <div class="waterway-waves-flow"></div>
        <div class="waterway-current-lines"></div>

        <!-- Left Pier (Origin) -->
        <div class="waterway-pier pier-origin">
          <div class="pier-post">
            <span class="pier-beacon-light origin"></span>
            <div class="pier-roof"></div>
            <div class="pier-pontoon"></div>
          </div>
          <div class="pier-info-box">
            <span class="pier-label">ORIGIN TERMINAL</span>
            <span class="pier-station-name">${fromStation?.name}</span>
            <span class="pier-gate-tag">Gate 01 • Departure</span>
          </div>
        </div>

        <!-- Animated Cruising Kochi Water Metro Catamaran -->
        <div class="cruising-catamaran-wrap" id="cruising-catamaran-wrap">
          <div class="boat-bubble-hud">
            <span class="hud-speed">⚡ 8.4 kts</span>
            <span class="hud-status">Eco-Cruising</span>
          </div>
          <div class="boat-hull-container">
            <img src="/assets/kochi-water-metro-boat-transparent.png" 
                 alt="Kochi Water Metro Electric Catamaran" 
                 class="boat-transparent-asset" />
            <!-- Propeller Wake Foam & Bow Ripple -->
            <div class="boat-propeller-wake">
              <span class="wake-stream stream-1"></span>
              <span class="wake-stream stream-2"></span>
            </div>
            <div class="boat-bow-spray"></div>
          </div>
        </div>

        <!-- Navigational Channel Buoys with blinking lights -->
        <div class="nav-buoy buoy-green" style="left: 36%;" title="Starboard Fairway Marker">
          <span class="buoy-light-blink green"></span>
          <span class="buoy-cone"></span>
        </div>
        <div class="nav-buoy buoy-red" style="left: 64%;" title="Port Fairway Marker">
          <span class="buoy-light-blink red"></span>
          <span class="buoy-can"></span>
        </div>

        <!-- Right Pier (Destination) -->
        <div class="waterway-pier pier-destination">
          <div class="pier-post">
            <span class="pier-beacon-light dest"></span>
            <div class="dest-ping-halo"></div>
            <div class="pier-roof"></div>
            <div class="pier-pontoon"></div>
          </div>
          <div class="pier-info-box">
            <span class="pier-label">DESTINATION</span>
            <span class="pier-station-name">${toStation?.name}</span>
            <span class="pier-gate-tag">Pontoon Berth Ready</span>
          </div>
        </div>
      </div>

      <!-- Waterway Environmental Telemetry Footer -->
      <div class="waterway-env-footer">
        <div class="env-item">
          <span class="env-icon">🌊</span>
          <span>Vembanad Waterway: <strong>Calm Waters</strong></span>
        </div>
        <div class="env-item">
          <span class="env-icon">⚡</span>
          <span>Energy Consumption: <strong>1.8 kWh/km</strong></span>
        </div>
        <div class="env-item eco">
          <span class="env-icon">🌱</span>
          <span>Direct Carbon Footprint: <strong>0.00 kg CO₂</strong></span>
        </div>
      </div>
    </div>

    <!-- 4-Metric Grid -->
    <div class="result-metrics-grid">
      <div class="result-metric-card">
        <div class="val">₹${fare}</div>
        <div class="lbl">Smart Fare / Single</div>
        <div class="sub-lbl">Kochi1 Card: ₹${Math.max(16, Math.round(fare * 0.8))}</div>
      </div>
      <div class="result-metric-card">
        <div class="val">${duration} <span style="font-size:0.95rem;">min</span></div>
        <div class="lbl">Est. Voyage Time</div>
        <div class="sub-lbl">Saves 30+ mins vs road</div>
      </div>
      <div class="result-metric-card">
        <div class="val">${distance} <span style="font-size:0.95rem;">km</span></div>
        <div class="lbl">Waterway Distance</div>
        <div class="sub-lbl">Scenic backwaters</div>
      </div>
      <div class="result-metric-card eco-card">
        <div class="val" style="color:#22c55e;">0.0 <span style="font-size:0.95rem;">kg</span></div>
        <div class="lbl">Direct CO₂ Output</div>
        <div class="sub-lbl">100% Clean Electric</div>
      </div>
    </div>

    <!-- Departures Schedule Chips -->
    <div class="upcoming-departures">
      <div class="departures-header-row">
        <div class="departures-title">Next Upcoming Catamarans Today:</div>
        <span class="departures-headway-pill">Headway: ${headway}</span>
      </div>
      <div class="departure-chips">
        ${departures.map((d, i) => `
          <span class="departure-chip ${i === 0 ? 'chip-next-boarding' : ''}">
            <span class="chip-clock-icon">🕒</span>
            <span class="chip-time">${d}</span>
            <span class="chip-status-tag">${i === 0 ? 'Boarding' : 'Scheduled'}</span>
          </span>
        `).join('')}
      </div>
    </div>

    <!-- Kochi1 Smart Card Advantage -->
    <div class="kochi1-pass-hint">
      <div class="pass-hint-icon">💳</div>
      <div class="pass-hint-text">
        <strong>Kochi1 Smart Card Benefit:</strong> Tap-and-go at AFC turnstiles for an extra 10% to 33% discount on monthly travel passes with zero ticketing queue time.
      </div>
    </div>

    <!-- Action Buttons Row: WhatsApp Reservation + Map Route Sync -->
    <div class="planner-actions-row">
      <a href="https://wa.me/919188957488?text=Book%20Ticket%20from%20${encodeURIComponent(fromStation?.name || '')}%20to%20${encodeURIComponent(toStation?.name || '')}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="blob-btn btn-reserve-ticket" 
         style="flex: 1.3;">
        <span class="btn-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
          Instant Ticket Reservation
        </span>
      </a>

      <button class="btn-view-map-sync" id="btn-planner-view-map" title="View this route highlighted on the live interactive network map">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
        <span>View on Live Map</span>
      </button>
    </div>
  `;

  // Attach event listener for View on Live Map button
  const viewMapBtn = document.getElementById('btn-planner-view-map');
  if (viewMapBtn) {
    viewMapBtn.addEventListener('click', () => {
      highlightRouteOnMap(fromId, toId);
      const mapSection = document.getElementById('network-map');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Highlight route on map
  highlightRouteOnMap(fromId, toId);
}

function generateUpcomingDepartures() {
  const now = new Date();
  const times = [];
  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Next boats spaced by 12-15 mins
  for (let i = 1; i <= 4; i++) {
    const departureMinutes = currentMinutes + (i * 12);
    const hours = Math.floor(departureMinutes / 60) % 24;
    const mins = departureMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMin = mins < 10 ? `0${mins}` : mins;
    times.push(`${displayHour}:${displayMin} ${ampm}`);
  }

  return times;
}
