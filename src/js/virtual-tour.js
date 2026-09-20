/**
 * 360° Virtual Tour Simulator
 * Lets visitors explore the electric catamaran interior, cockpit, and pontoon
 */
const SCENES = {
  cockpit: {
    title: 'Electric Catamaran Cockpit & Navigation Bridge',
    subtitle: 'Twin electric propulsion throttle, AIS radar telemetry, and dual rudder joystick',
    image: 'https://cdn-dev.watermetro.co.in/explore_01_e1ce727d00.jpg',
    hotspots: [
      { x: 30, y: 50, title: 'LiFePO4 Telemetry', desc: 'Monitors 2x 100kWh marine battery banks and energy consumption in real-time.' },
      { x: 50, y: 40, title: 'Electronic Chart Display', desc: 'GPS-synchronized depth sounding and navigational buoy tracking.' },
      { x: 70, y: 55, title: 'Steering & Thrusters', desc: 'Precision bow-thruster joystick for pinpoint zero-emission jetty docking.' }
    ]
  },
  cabin: {
    title: 'Air-Conditioned Commuter Cabin',
    subtitle: '100-seat capacity, panoramic backwater windows, and wheelchair access bays',
    image: 'https://cdn-dev.watermetro.co.in/boat0001_7dd6617bec.png',
    hotspots: [
      { x: 25, y: 60, title: 'Panoramic Glazing', desc: 'Low-E UV filtered curved glass windows providing 270° views of backwaters.' },
      { x: 50, y: 50, title: 'Accessible Passenger Bays', desc: 'Dedicated wheelchair berths with secure docking clamps and seatbelts.' },
      { x: 75, y: 65, title: 'Ergonomic Seating', desc: 'Lightweight marine composite seating with under-seat life jackets.' }
    ]
  },
  pontoon: {
    title: 'Floating Pontoon & AFC Turnstiles',
    subtitle: 'Tidal self-adjusting floating gangways and rapid NFC Kochi1 card turnstiles',
    image: 'https://cdn-dev.watermetro.co.in/explore_02_663dd7db0c.jpg',
    hotspots: [
      { x: 35, y: 45, title: 'Floating Gangway', desc: 'Articulated pontoon that moves smoothly with high and low tides.' },
      { x: 65, y: 55, title: 'Automatic AFC Gates', desc: 'Contactless QR and Kochi1 card readers with 0.2 second validation speed.' }
    ]
  }
};

let currentScene = 'cockpit';
let isTourPanning = false;
let tourPanX = 0;
let tourStartX = 0;

export function initVirtualTour() {
  const container = document.getElementById('tour-viewer-canvas');
  const tabs = document.querySelectorAll('.tour-tab-btn');
  const hotspotsContainer = document.getElementById('tour-hotspots-layer');

  if (!container) return;

  renderScene(currentScene);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentScene = tab.getAttribute('data-scene') || 'cockpit';
      renderScene(currentScene);
    });
  });

  // Pan interaction
  container.addEventListener('mousedown', (e) => {
    isTourPanning = true;
    tourStartX = e.clientX - tourPanX;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isTourPanning) return;
    tourPanX = e.clientX - tourStartX;
    // Limit pan range
    tourPanX = Math.max(Math.min(tourPanX, 120), -120);
    const bgImg = document.getElementById('tour-bg-image');
    if (bgImg) {
      bgImg.style.transform = `scale(1.15) translateX(${tourPanX}px)`;
    }
  });

  window.addEventListener('mouseup', () => {
    isTourPanning = false;
  });
}

function renderScene(sceneKey) {
  const scene = SCENES[sceneKey];
  const titleEl = document.getElementById('tour-scene-title');
  const subEl = document.getElementById('tour-scene-desc');
  const bgImg = document.getElementById('tour-bg-image');
  const hotspotsLayer = document.getElementById('tour-hotspots-layer');

  if (titleEl) titleEl.textContent = scene.title;
  if (subEl) subEl.textContent = scene.subtitle;
  if (bgImg) {
    bgImg.src = scene.image;
    bgImg.style.transform = 'scale(1.15) translateX(0px)';
    tourPanX = 0;
  }

  if (hotspotsLayer) {
    hotspotsLayer.innerHTML = scene.hotspots.map((h, i) => `
      <div class="tour-hotspot-pin" style="left:${h.x}%; top:${h.y}%;" data-index="${i}">
        <span class="hotspot-pulse"></span>
        <button class="hotspot-btn" title="${h.title}">+</button>
        <div class="hotspot-card">
          <strong>${h.title}</strong>
          <p>${h.desc}</p>
        </div>
      </div>
    `).join('');

    // Attach pin hover / clicks
    hotspotsLayer.querySelectorAll('.tour-hotspot-pin').forEach(pin => {
      pin.addEventListener('click', (e) => {
        pin.classList.toggle('active');
      });
    });
  }
}
