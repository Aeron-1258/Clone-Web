import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATIONS } from '../data/stations.js';
import { ROUTES } from '../data/routes.js';

let mapInstance = null;
let stationMarkers = {};
let currentSelectedStation = null;

// Route Polylines Data
const WATER_METRO_LINES = [
  // High Court <-> Vypin
  [[9.9825, 76.2755], [9.9850, 76.2620], [9.9868, 76.2442]],
  // High Court <-> Fort Kochi
  [[9.9825, 76.2755], [9.9760, 76.2610], [9.9678, 76.2435]],
  // Fort Kochi <-> Vypin
  [[9.9678, 76.2435], [9.9770, 76.2440], [9.9868, 76.2442]],
  // High Court <-> Bolgatty
  [[9.9825, 76.2755], [9.9830, 76.2670]],
  // High Court <-> South Chittoor
  [[9.9825, 76.2755], [9.9980, 76.2720], [10.0150, 76.2750], [10.0290, 76.2780]],
  // South Chittoor <-> Cheranalloor
  [[10.0290, 76.2780], [10.0400, 76.2810], [10.0480, 76.2840]],
  // Cheranalloor <-> Eloor
  [[10.0480, 76.2840], [10.0620, 76.2890], [10.0760, 76.2950]],
  // South Chittoor <-> Kadamakkudy
  [[10.0290, 76.2780], [10.0450, 76.2650], [10.0650, 76.2550]],
  // High Court <-> Willingdon Island
  [[9.9825, 76.2755], [9.9680, 76.2730], [9.9520, 76.2720]],
  // High Court <-> Mattancherry
  [[9.9825, 76.2755], [9.9670, 76.2650], [9.9572, 76.2588]],
  // Vyttila <-> Kakkanad
  [[9.9665, 76.3215], [9.9820, 76.3350], [9.9980, 76.3450], [10.0160, 76.3530]]
];

const METRO_RAIL_LINE = [
  [10.1098, 76.3496], // Aluva
  [10.0980, 76.3440], // Pulinchodu
  [10.0880, 76.3390], // Companypady
  [10.0780, 76.3350], // Ambattukavu
  [10.0680, 76.3310], // Muttom
  [10.0520, 76.3240], // Kalamassery
  [10.0420, 76.3200], // CUSAT
  [10.0330, 76.3150], // Pathadipalam
  [10.0240, 76.3080], // Edapally
  [10.0160, 76.3040], // Changampuzha Park
  [10.0070, 76.3020], // Palarivattom
  [9.9980, 76.3000],  // JLN Stadium
  [9.9920, 76.2950],  // Kaloor
  [9.9870, 76.2880],  // Lissie
  [9.9820, 76.2840],  // MG Road
  [9.9720, 76.2850],  // Maharajas
  [9.9650, 76.2910],  // Ernakulam South
  [9.9630, 76.3020],  // Kadavanthra
  [9.9640, 76.3120],  // Elamkulam
  [9.9665, 76.3215],  // Vyttila
  [9.9600, 76.3290],  // Thaikoodam
  [9.9540, 76.3380],  // Petta
  [9.9510, 76.3440],  // Vadakkekotta
  [9.9480, 76.3490],  // SN Junction
  [9.9450, 76.3540]   // Thripunithura
];

const PHASE2_PINK_LINE = [
  [9.9980, 76.3000],  // JLN Stadium
  [10.0050, 76.3120], // Palarivattom Jn
  [10.0120, 76.3240], // Chembumukku
  [10.0150, 76.3350], // Vazhakkala
  [10.0180, 76.3450], // Padamughal
  [10.0160, 76.3530], // Kakkanad Jn
  [10.0110, 76.3630], // Cochin SEZ
  [10.0090, 76.3700], // Chittethukara
  [10.0070, 76.3780], // KINFRA
  [10.0050, 76.3860]  // InfoPark
];

let waterMetroLayerGroup = null;
let metroRailLayerGroup = null;
let phase2LayerGroup = null;

export function initNetworkMap(onStationSelectForPlanner) {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  // 1. Initialize Leaflet Map centered at Kochi
  mapInstance = L.map('leaflet-map', {
    center: [10.010, 76.300],
    zoom: 12,
    zoomControl: true,
    scrollWheelZoom: false, // Prevents unintended page scrolling
    attributionControl: false
  });

  // 2. High-speed, crisp CartoDB Voyager tiles (NO API key, clean pastel waterways & roads)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(mapInstance);

  // Enable scroll zoom on map click
  mapInstance.on('click', () => {
    mapInstance.scrollWheelZoom.enable();
  });

  // 3. Create Layer Groups
  waterMetroLayerGroup = L.layerGroup().addTo(mapInstance);
  metroRailLayerGroup = L.layerGroup().addTo(mapInstance);
  phase2LayerGroup = L.layerGroup().addTo(mapInstance);

  // 4. Render Route Polylines
  renderRouteLines();

  // 5. Render Station Markers
  renderStationPins(onStationSelectForPlanner);

  // 6. Setup Filter Dropdown
  const filterSelect = document.getElementById('map-network-filter');
  filterSelect?.addEventListener('change', (e) => {
    filterNetworkLayers(e.target.value);
  });

  // 7. Setup Quick-Selection Chips Bar
  setupQuickChips(onStationSelectForPlanner);

  // 8. Select default station (Aluva or High Court to showcase Picture 2 design immediately!)
  const defaultStation = STATIONS.find(s => s.id === 'aluva') || STATIONS[0];
  selectStation(defaultStation, onStationSelectForPlanner, false);
}

function renderRouteLines() {
  // Water Metro Blue/Cyan Routes (dashed with glowing outline)
  WATER_METRO_LINES.forEach(latlngs => {
    // Underlay glow
    L.polyline(latlngs, {
      color: '#0284c7',
      weight: 6,
      opacity: 0.4,
      lineCap: 'round'
    }).addTo(waterMetroLayerGroup);

    // Primary route line
    L.polyline(latlngs, {
      color: '#0284c7',
      weight: 4,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(waterMetroLayerGroup);
  });

  // Kochi Metro Rail Phase 1 Line (Teal dashed line like Picture 2)
  L.polyline(METRO_RAIL_LINE, {
    color: '#009999',
    weight: 8,
    opacity: 0.35,
    lineCap: 'round'
  }).addTo(metroRailLayerGroup);

  L.polyline(METRO_RAIL_LINE, {
    color: '#009999',
    weight: 5,
    opacity: 0.95,
    dashArray: '10, 8',
    lineCap: 'round'
  }).addTo(metroRailLayerGroup);

  // Phase 2 Pink Line (Magenta / Pink dashed line towards InfoPark Kakkanad)
  L.polyline(PHASE2_PINK_LINE, {
    color: '#ec4899',
    weight: 7,
    opacity: 0.35,
    lineCap: 'round'
  }).addTo(phase2LayerGroup);

  L.polyline(PHASE2_PINK_LINE, {
    color: '#ec4899',
    weight: 4.5,
    opacity: 0.95,
    dashArray: '6, 6',
    lineCap: 'round'
  }).addTo(phase2LayerGroup);
}

function renderStationPins(onStationSelectForPlanner) {
  STATIONS.forEach(station => {
    let iconHtml = '';

    if (station.type === 'water-metro') {
      iconHtml = `
        <div class="custom-station-pin" title="${station.name} (${station.mlName})">
          <div class="pin-inner-boat">⚓</div>
        </div>
      `;
    } else if (station.type === 'metro-rail') {
      iconHtml = `
        <div class="custom-station-pin" title="${station.name} (${station.mlName})">
          <div class="pin-inner-metro"></div>
        </div>
      `;
    } else {
      iconHtml = `
        <div class="custom-station-pin" title="${station.name} (${station.mlName})">
          <div class="pin-inner-pink"></div>
        </div>
      `;
    }

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'station-div-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([station.lat, station.lng], { icon: customIcon });

    // Target layer group based on type
    if (station.type === 'water-metro') {
      marker.addTo(waterMetroLayerGroup);
    } else if (station.type === 'metro-rail') {
      marker.addTo(metroRailLayerGroup);
    } else {
      marker.addTo(phase2LayerGroup);
    }

    // Hover or Click selects the station!
    marker.on('click', () => {
      selectStation(station, onStationSelectForPlanner, true);
    });

    marker.on('mouseover', () => {
      selectStation(station, onStationSelectForPlanner, false);
    });

    stationMarkers[station.id] = marker;
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

  // Update Station Details Card (Right column, exact design from Picture 2)
  renderStationCard(station, onStationSelectForPlanner);

  // Update active chip below map
  document.querySelectorAll('.network-chip').forEach(chip => {
    if (chip.getAttribute('data-station-id') === station.id) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function renderStationCard(station, onStationSelectForPlanner) {
  const bannerEl = document.getElementById('station-card-banner');
  const mlBannerText = document.getElementById('banner-ml-text');
  const enBannerText = document.getElementById('banner-en-text');
  const badgeText = document.getElementById('banner-badge-text');

  const mainName = document.getElementById('station-main-name');
  const subName = document.getElementById('station-sub-name');
  const timingsText = document.getElementById('station-timings-text');
  const nearbyText = document.getElementById('station-nearby-text');
  const badgesContainer = document.getElementById('station-meta-badges');
  const feederText = document.getElementById('station-feeder-text');
  const gmapsBtn = document.getElementById('btn-view-gmaps');
  const planBtn = document.getElementById('btn-plan-from-station');

  if (bannerEl) {
    bannerEl.style.backgroundColor = station.bannerColor || '#a3e635';
  }
  if (mlBannerText) mlBannerText.textContent = station.mlName;
  if (enBannerText) enBannerText.textContent = station.name;
  if (badgeText) badgeText.textContent = station.badgeText || 'METRO';

  if (mainName) mainName.textContent = station.name;
  if (subName) subName.textContent = station.mlName;
  if (timingsText) timingsText.textContent = station.timings || '06:00 AM - 10:30 PM';
  if (nearbyText) nearbyText.textContent = station.nearby || station.description;

  if (badgesContainer) {
    badgesContainer.innerHTML = `
      <span class="station-pill-badge highlight">⏱️ ${station.headway}</span>
      <span class="station-pill-badge">🎫 Fare: ${station.fareEstimate || '₹20 - ₹40'}</span>
      <span class="station-pill-badge">⚓ ${station.zone}</span>
    `;
  }

  if (feederText) {
    feederText.innerHTML = `<strong>Feeder Integration:</strong> ${station.feeder || 'Direct walking access'}`;
  }

  if (gmapsBtn) {
    gmapsBtn.href = station.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(station.name + ' Kochi')}`;
  }

  if (planBtn) {
    planBtn.onclick = () => {
      if (typeof onStationSelectForPlanner === 'function') {
        onStationSelectForPlanner(station.id);
      }
    };
  }
}

function filterNetworkLayers(filterVal) {
  if (!mapInstance) return;

  if (filterVal === 'all') {
    mapInstance.addLayer(waterMetroLayerGroup);
    mapInstance.addLayer(metroRailLayerGroup);
    mapInstance.addLayer(phase2LayerGroup);
  } else if (filterVal === 'water-metro') {
    mapInstance.addLayer(waterMetroLayerGroup);
    mapInstance.removeLayer(metroRailLayerGroup);
    mapInstance.removeLayer(phase2LayerGroup);
  } else if (filterVal === 'metro-rail') {
    mapInstance.removeLayer(waterMetroLayerGroup);
    mapInstance.addLayer(metroRailLayerGroup);
    mapInstance.removeLayer(phase2LayerGroup);
  } else if (filterVal === 'phase2') {
    mapInstance.removeLayer(waterMetroLayerGroup);
    mapInstance.removeLayer(metroRailLayerGroup);
    mapInstance.addLayer(phase2LayerGroup);
  }
}

function setupQuickChips(onStationSelectForPlanner) {
  const chipsContainer = document.getElementById('network-quick-chips');
  if (!chipsContainer) return;

  const keyChips = [
    { id: 'aluva', label: 'Aluva (Metro)', color: '#a3e635' },
    { id: 'high-court', label: 'High Court (Water Metro)', color: '#009999' },
    { id: 'vytilla', label: 'Vyttila Mobility Hub', color: '#0284c7' },
    { id: 'fort-kochi', label: 'Fort Kochi Heritage', color: '#059669' },
    { id: 'kakkanad-infopark', label: 'InfoPark (Phase 2)', color: '#ec4899' },
    { id: 'edapally', label: 'Edapally / LuLu Mall', color: '#8b5cf6' },
    { id: 'vypin', label: 'Vypin Beach', color: '#0d9488' },
    { id: 'mattancherry', label: 'Mattancherry Palace', color: '#d97706' },
    { id: 'kadamakkudy', label: 'Kadamakkudy Eco', color: '#10b981' }
  ];

  chipsContainer.innerHTML = keyChips.map(chip => `
    <button class="network-chip ${chip.id === 'aluva' ? 'active' : ''}" data-station-id="${chip.id}">
      <span class="chip-dot" style="color:${chip.color};"></span>
      <span>${chip.label}</span>
    </button>
  `).join('');

  chipsContainer.querySelectorAll('.network-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const stationId = btn.getAttribute('data-station-id');
      const station = STATIONS.find(s => s.id === stationId);
      if (station) {
        selectStation(station, onStationSelectForPlanner, true);
      }
    });
  });
}

export function highlightRouteOnMap(originId, destId) {
  const fromStation = STATIONS.find(s => s.id === originId);
  const toStation = STATIONS.find(s => s.id === destId);

  if (fromStation && toStation && mapInstance) {
    mapInstance.fitBounds([
      [fromStation.lat, fromStation.lng],
      [toStation.lat, toStation.lng]
    ], { padding: [50, 50], maxZoom: 14 });

    selectStation(fromStation, null, false);
  }
}
