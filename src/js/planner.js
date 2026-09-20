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

  // Calculate initial route
  calculateJourney('high-court', 'vypin');

  // Swap button
  swapBtn?.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    calculateJourney(fromSelect.value, toSelect.value);
  });

  // Calculate on button click or change
  calcBtn?.addEventListener('click', () => {
    calculateJourney(fromSelect.value, toSelect.value);
  });

  fromSelect.addEventListener('change', () => {
    calculateJourney(fromSelect.value, toSelect.value);
  });

  toSelect.addEventListener('change', () => {
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

  calculateJourney(fromSelect.value, toSelect.value);

  // Smooth scroll to planner section
  document.getElementById('journey-planner')?.scrollIntoView({ behavior: 'smooth' });
}

function calculateJourney(fromId, toId) {
  const resultPane = document.getElementById('planner-result-pane');
  if (!resultPane) return;

  if (fromId === toId) {
    resultPane.innerHTML = `
      <div style="text-align:center; padding: 2rem;">
        <h3 style="color:var(--km-cyan); margin-bottom: 0.5rem;">Same Origin & Destination</h3>
        <p style="color:#94a3b8;">Please choose a different destination terminal to calculate timetable and fare.</p>
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

  // Generate dynamic upcoming departures for next 3 hours
  const departures = generateUpcomingDepartures();

  resultPane.innerHTML = `
    <div class="result-header">
      <div>
        <span class="route-badge">${isDirect ? 'Direct Service' : 'Transfer via High Court / Vyttila'}</span>
        <h3 class="result-route-title">${fromStation?.name} ➔ ${toStation?.name}</h3>
        <div style="font-size:0.9rem; color:var(--km-cyan); margin-top:4px;">
          ${fromStation?.mlName} മുതൽ ${toStation?.mlName} വരെ
        </div>
      </div>
    </div>

    <div class="result-metrics-grid">
      <div class="result-metric-card">
        <div class="val">₹${fare}</div>
        <div class="lbl">Smart Fare / Single</div>
      </div>
      <div class="result-metric-card">
        <div class="val">${duration} <span style="font-size:1rem;">min</span></div>
        <div class="lbl">Est. Voyage Time</div>
      </div>
      <div class="result-metric-card">
        <div class="val">${distance} <span style="font-size:1rem;">km</span></div>
        <div class="lbl">Waterway Distance</div>
      </div>
    </div>

    <div class="upcoming-departures">
      <div class="departures-title">Next Upcoming Catamarans Today:</div>
      <div class="departure-chips">
        ${departures.map(d => `<span class="departure-chip">🕒 ${d}</span>`).join('')}
      </div>
    </div>

    <div class="kochi1-pass-hint">
      <strong>Kochi1 Card Benefit:</strong> Tap-in at the AFC turnstile with your Kochi1 Smart Card for an extra 10% to 33% discount on monthly travel passes and zero queue time.
    </div>

    <div style="display:flex; gap:1rem; margin-top:0.5rem;">
      <a href="https://wa.me/919188957488?text=Book%20Ticket%20from%20${encodeURIComponent(fromStation?.name || '')}%20to%20${encodeURIComponent(toStation?.name || '')}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="blob-btn" 
         style="flex:1;">
        <span class="btn-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
          Instant Ticket Reservation
        </span>
      </a>
    </div>
  `;

  // Highlight on SVG map
  highlightRouteOnMap(fromId, toId);
}

function generateUpcomingDepartures() {
  const now = new Date();
  const times = [];
  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Next boats spaced by 15 mins
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
