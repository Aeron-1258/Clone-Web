import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATIONS } from '../data/stations.js';
import { ROUTES } from '../data/routes.js';

let mapInstance = null;
let stationMarkers = {};
let currentSelectedStation = null;
let activeBoatMarker = null;
let boatAnimationInterval = null;
let departureTimerInterval = null;
let departureSecondsRemaining = 225; // 3m 45s
let currentFilterCategory = 'all';

// Official Kochi Water Metro Navigational Waterway Corridors
const WATER_METRO_LINES = [
  // High Court <-> Vypin
  [[9.9839, 76.2730], [9.9820, 76.2580], [9.9740, 76.2443]],
  // High Court <-> Fort Kochi
  [[9.9839, 76.2730], [9.9750, 76.2550], [9.9684, 76.2432]],
  // Fort Kochi <-> Vypin
  [[9.9684, 76.2432], [9.9710, 76.2438], [9.9740, 76.2443]],
  // High Court <-> Bolgatty
  [[9.9839, 76.2730], [9.9830, 76.2670]],
  // Bolgatty <-> Mulavukad
  [[9.9830, 76.2670], [9.9950, 76.2675], [10.0050, 76.2680]],
  // High Court <-> South Chittoor
  [[9.9839, 76.2730], [10.0050, 76.2680], [10.0220, 76.2710], [10.0384, 76.2697]],
  // South Chittoor <-> Cheranalloor
  [[10.0384, 76.2697], [10.0550, 76.2750], [10.0726, 76.2827]],
  // Cheranalloor <-> Eloor
  [[10.0726, 76.2827], [10.0735, 76.2827], [10.0741, 76.2828]],
  // South Chittoor <-> Eloor
  [[10.0384, 76.2697], [10.0550, 76.2750], [10.0741, 76.2828]],
  // South Chittoor <-> Kadamakkudy
  [[10.0384, 76.2697], [10.0520, 76.2600], [10.0650, 76.2550]],
  // High Court <-> Willingdon Island
  [[9.9839, 76.2730], [9.9700, 76.2710], [9.9647, 76.2631]],
  // High Court <-> Mattancherry
  [[9.9839, 76.2730], [9.9670, 76.2620], [9.9590, 76.2603]],
  // Mattancherry <-> Fort Kochi
  [[9.9590, 76.2603], [9.9630, 76.2520], [9.9684, 76.2432]],
  // Vyttila <-> Kakkanad
  [[9.9674, 76.3224], [9.9780, 76.3350], [9.9900, 76.3450], [9.9934, 76.3513]]
];

// Boat Cruise Loop Path (High Court -> Vypin -> Fort Kochi -> Mattancherry -> Willingdon -> High Court)
const BOAT_CRUISE_WAYPOINTS = [
  [9.9839, 76.2730], // High Court
  [9.9820, 76.2580],
  [9.9740, 76.2443], // Vypin
  [9.9710, 76.2438],
  [9.9684, 76.2432], // Fort Kochi
  [9.9630, 76.2520],
  [9.9590, 76.2603], // Mattancherry
  [9.9647, 76.2631], // Willingdon Island
  [9.9750, 76.2650],
  [9.9839, 76.2730]  // Back to High Court
];

// 100% OFFICIAL KOCHI WATER METRO TERMINALS LIST (All 13 Water Terminals)
const WATER_METRO_TERMINALS = [
  { id: 'high-court', name: 'High Court', mlName: 'ഹൈക്കോടതി', code: 'HC', category: 'central', type: 'CENTRAL HUB', headway: '10 min', color: '#009999' },
  { id: 'vytilla', name: 'Vyttila Hub', mlName: 'വൈറ്റില', code: 'VH', category: 'central', type: 'MULTIMODAL HUB', headway: '15 min', color: '#0284c7' },
  { id: 'fort-kochi', name: 'Fort Kochi', mlName: 'ഫോർട്ട് കൊച്ചി', code: 'FK', category: 'heritage', type: 'HERITAGE QUARTER', headway: '15 min', color: '#059669' },
  { id: 'vypin', name: 'Vypin Island', mlName: 'വൈപ്പിൻ', code: 'VP', category: 'heritage', type: 'ISLAND GATEWAY', headway: '10 min', color: '#0d9488' },
  { id: 'bolgatty', name: 'Bolgatty Marina', mlName: 'ബോൾഗാട്ടി', code: 'BG', category: 'heritage', type: 'MARINA & RESORT', headway: '15 min', color: '#2563eb' },
  { id: 'mattancherry', name: 'Mattancherry', mlName: 'മട്ടാഞ്ചേരി', code: 'MC', category: 'heritage', type: 'SPICE QUARTER', headway: '20 min', color: '#d97706' },
  { id: 'willingdon-island', name: 'Willingdon Island', mlName: 'വെല്ലിംഗ്ടൺ', code: 'WI', category: 'central', type: 'PORT TERMINAL', headway: '20 min', color: '#4f46e5' },
  { id: 'kakkanad', name: 'Kakkanad', mlName: 'കാക്കനാട്', code: 'KK', category: 'north', type: 'IT CORRIDOR', headway: '15 min', color: '#7c3aed' },
  { id: 'south-chittoor', name: 'South Chittoor', mlName: 'സൗത്ത് ചിറ്റൂർ', code: 'SC', category: 'north', type: 'RIVERINE ISLAND', headway: '20 min', color: '#059669' },
  { id: 'cheranalloor', name: 'Cheranalloor', mlName: 'ചേരാനല്ലൂർ', code: 'CN', category: 'north', type: 'NORTH SUBURB', headway: '20 min', color: '#0891b2' },
  { id: 'eloor', name: 'Eloor', mlName: 'ഏലൂർ', code: 'EL', category: 'north', type: 'PERIYAR JETTY', headway: '25 min', color: '#16a34a' },
  { id: 'mulavukad', name: 'Mulavukad North', mlName: 'മുളവുകാട്', code: 'MV', category: 'heritage', type: 'ISLAND CONNECTOR', headway: '20 min', color: '#6366f1' },
  { id: 'kadamakkudy', name: 'Kadamakkudy Eco', mlName: 'കടമക്കുടി', code: 'KD', category: 'north', type: 'ECO ARCHIPELAGO', headway: '30 min', color: '#10b981' }
];

let waterMetroLayerGroup = null;
let liveVesselLayerGroup = null;
let currentTileLayer = null;

// High-Definition, Free, Watermark-Free Basemaps
const BASEMAP_TILES = {
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
};

export function initNetworkMap(onStationSelectForPlanner) {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  // 1. Initialize Leaflet Map centered at Kochi Water Metro Hub
  mapInstance = L.map('leaflet-map', {
    center: [9.985, 76.265],
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false
  });

  // 2. Add Topographic Basemap by default (Zero Watermarks, crisp waterways)
  currentTileLayer = L.tileLayer(BASEMAP_TILES.topo, {
    maxZoom: 19,
    subdomains: ['server']
  }).addTo(mapInstance);

  // Enable scroll zoom on click
  mapInstance.on('click', () => {
    mapInstance.scrollWheelZoom.enable();
  });

  // 3. Create Layer Groups
  waterMetroLayerGroup = L.layerGroup().addTo(mapInstance);
  liveVesselLayerGroup = L.layerGroup().addTo(mapInstance);

  // 4. Render Route Polylines
  renderRouteLines();

  // 5. Render Station Markers
  renderStationPins(onStationSelectForPlanner);

  // 6. Setup Live Cruising Electric Catamaran Simulation
  setupLiveBoatCruiser();

  // 7. Setup Live Departure Seconds Countdown Ticker & Audio Chime
  setupDepartureCountdown();
  setupPierChimeAudio();

  // 8. Setup Controls (Basemap Switcher, Layer Filter, Recenter)
  setupMapControls();

  // 9. Setup Complete 13 Water Metro Terminals Deck
  setupWaterMetroTerminalsDeck(onStationSelectForPlanner);

  // 10. Select Flagship Station (High Court Water Metro Terminal)
  const defaultStation = STATIONS.find(s => s.id === 'high-court') || STATIONS[0];
  selectStation(defaultStation, onStationSelectForPlanner, false);
}

function renderRouteLines() {
  // Water Metro Routes (Glowing deep cyan/blue aquatic corridors)
  WATER_METRO_LINES.forEach(latlngs => {
    // Underlay glow
    L.polyline(latlngs, {
      color: '#0284c7',
      weight: 7,
      opacity: 0.35,
      lineCap: 'round'
    }).addTo(waterMetroLayerGroup);

    // Primary route line (Crisp dashed marine line)
    L.polyline(latlngs, {
      color: '#009999',
      weight: 4,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(waterMetroLayerGroup);
  });
}

function renderStationPins(onStationSelectForPlanner) {
  waterMetroLayerGroup.clearLayers();

  STATIONS.forEach(station => {
    const iconHtml = `
      <div class="custom-station-pin" title="${station.name} (${station.mlName}) - Water Metro Terminal">
        <div class="pin-inner-boat">⚓</div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'station-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([station.lat, station.lng], { icon: customIcon });
    marker.addTo(waterMetroLayerGroup);

    marker.on('click', () => {
      selectStation(station, onStationSelectForPlanner, true);
    });

    marker.on('mouseover', () => {
      selectStation(station, onStationSelectForPlanner, false);
    });

    stationMarkers[station.id] = marker;
  });
}

/**
 * Live Animated Electric Catamaran Cruise Simulation
 */
function setupLiveBoatCruiser() {
  if (!mapInstance) return;

  const boatIcon = L.divIcon({
    html: `
      <div class="animated-cruising-boat">
        <div class="boat-wake-ripple"></div>
        <div class="boat-icon-badge" title="Electric Hybrid Catamaran Muziris-01">⛴️</div>
      </div>
    `,
    className: 'boat-marker-div',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const startPt = BOAT_CRUISE_WAYPOINTS[0];
  activeBoatMarker = L.marker(startPt, { icon: boatIcon, zIndexOffset: 1500 });
  activeBoatMarker.addTo(liveVesselLayerGroup);

  activeBoatMarker.bindTooltip(`
    <div style="font-size:0.82rem; line-height:1.4; padding:2px 4px;">
      <strong style="color:#009999;">⚡ Muziris-01 (Cruising)</strong><br/>
      Route: High Court ➔ Vypin ➔ Fort Kochi<br/>
      Speed: <strong>8.2 knots</strong> | Battery: <strong>94% (Electric)</strong>
    </div>
  `, { direction: 'top', offset: [0, -14] });

  let waypointIndex = 0;
  let t = 0;

  if (boatAnimationInterval) clearInterval(boatAnimationInterval);

  boatAnimationInterval = setInterval(() => {
    t += 0.015;
    if (t >= 1) {
      t = 0;
      waypointIndex = (waypointIndex + 1) % (BOAT_CRUISE_WAYPOINTS.length - 1);
    }

    const p1 = BOAT_CRUISE_WAYPOINTS[waypointIndex];
    const p2 = BOAT_CRUISE_WAYPOINTS[waypointIndex + 1];

    const currentLat = p1[0] + (p2[0] - p1[0]) * t;
    const currentLng = p1[1] + (p2[1] - p1[1]) * t;

    activeBoatMarker.setLatLng([currentLat, currentLng]);
  }, 100);
}

/**
 * Setup Live Departure Seconds Countdown & Dynamic Navigation Track Bar
 */
function setupDepartureCountdown() {
  if (departureTimerInterval) clearInterval(departureTimerInterval);

  const countdownEl = document.getElementById('countdown-val');
  const trackBarFill = document.getElementById('track-bar-fill');
  const trackVesselDot = document.getElementById('track-vessel-dot');
  const trackStatus = document.getElementById('track-transit-status');

  departureTimerInterval = setInterval(() => {
    departureSecondsRemaining--;
    if (departureSecondsRemaining <= 0) {
      departureSecondsRemaining = 900; // Reset to 15 minutes
    }

    // 1. Digital Monospace Countdown
    if (countdownEl) {
      const mins = Math.floor(departureSecondsRemaining / 60);
      const secs = departureSecondsRemaining % 60;
      countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // 2. Animated Vessel Route Track Progress
    const totalDuration = 900;
    const progressPercent = Math.min(94, Math.max(6, ((totalDuration - departureSecondsRemaining) / totalDuration) * 100));

    if (trackBarFill) {
      trackBarFill.style.width = `${progressPercent}%`;
    }
    if (trackVesselDot) {
      trackVesselDot.style.left = `${progressPercent}%`;
    }

    // 3. Dynamic Vessel Status
    if (trackStatus) {
      if (departureSecondsRemaining <= 60) {
        trackStatus.textContent = 'Arriving Pier 1';
        trackStatus.style.color = '#4ade80';
      } else {
        trackStatus.textContent = 'Cruising at 8.4 kts';
        trackStatus.style.color = '#38bdf8';
      }
    }
  }, 1000);
}

/**
 * Setup Audio Chime & Announcement Toast Notification
 */
function setupPierChimeAudio() {
  const chimeBtn = document.getElementById('btn-pier-chime');
  const toastBox = document.getElementById('departure-announcement-toast');
  const toastText = document.getElementById('toast-announcement-text');

  if (!chimeBtn) return;

  chimeBtn.addEventListener('click', () => {
    // 1. Play Soft Pleasant Nautical Dual Chime via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Primary tone (C5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.1);

      // Harmony tone (G5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.3);
      gain2.gain.setValueAtTime(0, now + 0.3);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.34);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 1.6);
    } catch (e) {
      console.log('AudioContext not available:', e);
    }

    // 2. Button Visual Animation
    chimeBtn.classList.add('chiming');
    setTimeout(() => chimeBtn.classList.remove('chiming'), 500);

    // 3. Display Live Announcement Toast
    if (toastBox && toastText && currentSelectedStation) {
      const targetDest = currentSelectedStation.connections && currentSelectedStation.connections.length > 0
        ? (STATIONS.find(s => s.id === currentSelectedStation.connections[0])?.name || 'Vypin')
        : 'Next Destination';

      toastText.textContent = `Attention: KWML Muziris-01 now boarding at Pier Gate 1 for ${targetDest}. Please tap your Kochi1 Card.`;
      toastBox.style.display = 'flex';

      setTimeout(() => {
        toastBox.style.display = 'none';
      }, 5000);
    }
  });
}

/**
 * Map Controls (Basemap switcher, Network Filter, Recenter)
 */
function setupMapControls() {
  // 1. Map Basemap Style Switcher
  document.querySelectorAll('.map-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const styleKey = btn.getAttribute('data-map-style');
      if (BASEMAP_TILES[styleKey] && mapInstance) {
        if (currentTileLayer) {
          mapInstance.removeLayer(currentTileLayer);
        }
        currentTileLayer = L.tileLayer(BASEMAP_TILES[styleKey], {
          maxZoom: 19,
          subdomains: ['server']
        }).addTo(mapInstance);

        document.querySelectorAll('.map-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // 2. Recenter Map on Kochi Waters
  document.getElementById('btn-recenter-map')?.addEventListener('click', () => {
    if (mapInstance) {
      mapInstance.flyTo([9.985, 76.265], 13, { duration: 0.8 });
    }
  });

  // 3. Network Filter Dropdown
  const filterSelect = document.getElementById('map-network-filter');
  filterSelect?.addEventListener('change', (e) => {
    filterNetworkLayers(e.target.value);
  });
}

export function selectStation(station, onStationSelectForPlanner, panToMarker = true) {
  currentSelectedStation = station;

  // Pan map smoothly if requested
  if (panToMarker && mapInstance) {
    mapInstance.flyTo([station.lat, station.lng], Math.max(mapInstance.getZoom(), 13), {
      duration: 0.8
    });
  }

  // Highlight active pin marker
  document.querySelectorAll('.custom-station-pin').forEach(el => el.classList.remove('pin-active'));
  const marker = stationMarkers[station.id];
  if (marker && marker.getElement()) {
    marker.getElement().querySelector('.custom-station-pin')?.classList.add('pin-active');
  }

  // Update Station Details Card (Image 1 layout)
  renderStationCard(station, onStationSelectForPlanner);

  // Update active pill in horizontal chips deck (Images 2 & 3 layout)
  document.querySelectorAll('.station-chip-pill').forEach(pill => {
    if (pill.getAttribute('data-station-id') === station.id) {
      pill.classList.add('active');
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } else {
      pill.classList.remove('active');
    }
  });
}

function renderStationCard(station, onStationSelectForPlanner) {
  // Elements
  const bannerMl = document.getElementById('station-banner-ml');
  const bannerEn = document.getElementById('station-banner-en');
  const mainName = document.getElementById('station-main-name');
  const subName = document.getElementById('station-sub-name');
  const timingsText = document.getElementById('station-timings-text');
  const nearbyText = document.getElementById('station-nearby-text');
  const gmapsBtn = document.getElementById('btn-view-gmaps');

  // 1. Top Banner (Malayalam Left, English Right, Lime background)
  if (bannerMl) bannerMl.textContent = station.mlName || 'ഹൈക്കോടതി';
  if (bannerEn) bannerEn.textContent = station.name || 'High Court';

  // 2. Station Heading & Malayalam Subtitle
  if (mainName) mainName.textContent = station.name;
  if (subName) subName.textContent = station.mlName;

  // 3. Info Row 1: Operating Timings
  if (timingsText) {
    timingsText.textContent = station.timings || '07:00 AM - 08:00 PM';
  }

  // 4. Info Row 2: Nearby Landmarks
  if (nearbyText) {
    nearbyText.textContent = station.nearby || station.description || 'Waterfront Promenade';
  }

  // 5. Full-width Google Maps Action Button
  if (gmapsBtn) {
    gmapsBtn.href = station.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(station.name + ' Water Metro Terminal Kochi')}`;
  }
}

function filterNetworkLayers(filterVal) {
  if (!mapInstance) return;

  const filteredStations = filterVal === 'all'
    ? STATIONS
    : STATIONS.filter(s => {
        if (filterVal === 'central') return ['high-court', 'vytilla', 'willingdon-island', 'bolgatty'].includes(s.id);
        if (filterVal === 'heritage') return ['fort-kochi', 'vypin', 'mattancherry', 'mulavukad-north'].includes(s.id);
        if (filterVal === 'north') return ['south-chittoor', 'cheranalloor', 'eloor', 'kakkanad', 'kadamakkudy'].includes(s.id);
        return true;
      });

  // Fit bounds to filtered stations if specific category selected
  if (filterVal !== 'all' && filteredStations.length > 0) {
    const validMarkers = filteredStations.map(s => stationMarkers[s.id]).filter(Boolean);
    if (validMarkers.length > 0) {
      const group = L.featureGroup(validMarkers);
      mapInstance.flyToBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14, duration: 0.8 });
    }
  } else {
    mapInstance.flyTo([9.985, 76.265], 13, { duration: 0.8 });
  }

  // Filter the horizontal pill chips
  renderHorizontalChips(filterVal);
}

let onStationSelectGlobal = null;

function renderHorizontalChips(filterCat = 'all') {
  const container = document.getElementById('network-chips-scroll');
  if (!container) return;

  const filtered = filterCat === 'all'
    ? STATIONS
    : STATIONS.filter(s => {
        if (filterCat === 'central') return ['high-court', 'vytilla', 'willingdon-island', 'bolgatty'].includes(s.id);
        if (filterCat === 'heritage') return ['fort-kochi', 'vypin', 'mattancherry', 'mulavukad-north'].includes(s.id);
        if (filterCat === 'north') return ['south-chittoor', 'cheranalloor', 'eloor', 'kakkanad', 'kadamakkudy'].includes(s.id);
        return true;
      });

  container.innerHTML = filtered.map(st => `
    <button class="station-chip-pill ${currentSelectedStation?.id === st.id ? 'active' : ''}" data-station-id="${st.id}" type="button">
      ${st.name}
    </button>
  `).join('');

  // Attach click listeners to pill chips
  container.querySelectorAll('.station-chip-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const stationId = btn.getAttribute('data-station-id');
      const station = STATIONS.find(s => s.id === stationId);
      if (station) {
        selectStation(station, onStationSelectGlobal, true);
      }
    });
  });

  // Update scrollbar thumb after render
  setTimeout(updateScrollThumb, 50);
}

function updateScrollThumb() {
  const scrollContainer = document.getElementById('network-chips-scroll');
  const trackBar = document.getElementById('chips-track-bar');
  const thumb = document.getElementById('chips-track-thumb');
  if (!scrollContainer || !trackBar || !thumb) return;

  const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
  if (maxScroll > 0) {
    const ratio = scrollContainer.scrollLeft / maxScroll;
    const maxThumbTravel = trackBar.clientWidth - thumb.clientWidth;
    thumb.style.transform = `translateX(${ratio * maxThumbTravel}px)`;
  } else {
    thumb.style.transform = 'translateX(0px)';
  }
}

/**
 * Setup Horizontal Quick Chips Bar (Images 2 & 3 Layout)
 */
function setupWaterMetroTerminalsDeck(onStationSelectForPlanner) {
  onStationSelectGlobal = onStationSelectForPlanner;
  const scrollContainer = document.getElementById('network-chips-scroll');
  const leftBtn = document.getElementById('chips-scroll-left');
  const rightBtn = document.getElementById('chips-scroll-right');
  const trackBar = document.getElementById('chips-track-bar');

  // Initial render of all pills
  renderHorizontalChips('all');

  // Left and Right arrow navigation controls
  leftBtn?.addEventListener('click', () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -220, behavior: 'smooth' });
    }
  });

  rightBtn?.addEventListener('click', () => {
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 220, behavior: 'smooth' });
    }
  });

  // Track bar click to scrub
  trackBar?.addEventListener('click', (e) => {
    if (!scrollContainer) return;
    const rect = trackBar.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    scrollContainer.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
  });

  // Scroll listener to sync thumb
  scrollContainer?.addEventListener('scroll', updateScrollThumb);
  window.addEventListener('resize', updateScrollThumb);
}

export function highlightRouteOnMap(originId, destId) {
  const fromStation = STATIONS.find(s => s.id === originId);
  const toStation = STATIONS.find(s => s.id === destId);

  if (fromStation && toStation && mapInstance) {
    mapInstance.fitBounds([
      [fromStation.lat, fromStation.lng],
      [toStation.lat, toStation.lng]
    ], { padding: [60, 60], maxZoom: 14 });

    selectStation(fromStation, null, false);
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 200);
  }
}

