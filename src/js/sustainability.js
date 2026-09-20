/**
 * Sustainability 3-Pillar Interactive Tabs & Animated Metrics
 * Directly mirrors the sustainability architecture from corporate.kochimetro.org
 */
const SUST_DATA = {
  solar: {
    title: 'Solar Energy Grid',
    subtitle: 'Pioneering Clean Solar Energy Generation',
    desc: 'Kochi Metro and Water Metro lead urban sustainability in India with over 300 rooftop and depot solar PV installations. We harness solar energy to power stations, administrative hubs, terminal chargers, and vessel replenishment, eliminating over 10,000 tons of carbon emissions each year.',
    quote: '“Building a cleaner tomorrow, one journey at a time.”',
    metrics: [
      { val: '300+', lbl: 'Solar Installations' },
      { val: '60%', lbl: 'Power Sourced via Solar' },
      { val: '10,000+', lbl: 'Tons CO₂ Saved / Year' }
    ]
  },
  water: {
    title: 'Electric Water Mobility',
    subtitle: 'Zero-Emission Inland Catamaran Fleet',
    desc: 'Asia’s largest electric water transit system operates a dedicated fleet of 75+ advanced catamaran vessels powered by safe, high-density LiFePO4 battery banks. With specially engineered low-wake aluminium hulls, our boats navigate fragile waterways without causing embankment erosion.',
    quote: '“Quiet waters, clean skies, and effortless island connectivity.”',
    metrics: [
      { val: '75+', lbl: 'Electric Hybrid Vessels' },
      { val: '0', lbl: 'Direct Tailpipe Emissions' },
      { val: '33,000+', lbl: 'Island Residents Benefited' }
    ]
  },
  greening: {
    title: 'Backwater Conservation & Urban Flora',
    subtitle: 'Preserving Kerala’s Fragile Aquatic Ecosystem',
    desc: 'Alongside zero-emission boating, KWML actively deploys aquatic weed harvesting vessels to maintain clear navigation channels and water oxygenation across Vembanad lake estuary. We also maintain vertical garden greening pillars along metro viaducts and terminals.',
    quote: '“Living in harmony with God’s Own Country waterways.”',
    metrics: [
      { val: '76.2', lbl: 'Kilometres Restored' },
      { val: '100%', lbl: 'Rainwater Harvesting at Hubs' },
      { val: '40%', lbl: 'National Waterway 3 Share' }
    ]
  }
};

export function initSustainability() {
  const tabs = document.querySelectorAll('.sust-tab-btn');
  const titleEl = document.getElementById('sust-pillar-title');
  const subEl = document.getElementById('sust-pillar-subtitle');
  const descEl = document.getElementById('sust-pillar-desc');
  const quoteEl = document.getElementById('sust-pillar-quote');
  const metricsContainer = document.getElementById('sust-metrics-cards');

  if (!tabs.length) return;

  const updatePillar = (key) => {
    const data = SUST_DATA[key];
    if (!data) return;

    if (titleEl) titleEl.textContent = data.title;
    if (subEl) subEl.textContent = data.subtitle;
    if (descEl) descEl.textContent = data.desc;
    if (quoteEl) quoteEl.textContent = data.quote;

    if (metricsContainer) {
      metricsContainer.innerHTML = data.metrics.map((m, i) => `
        <div class="sust-metric-card ${i === 1 ? 'active' : ''}">
          <div class="accent-bar"></div>
          <div class="metric-val">${m.val}</div>
          <div class="metric-lbl">${m.lbl}</div>
        </div>
      `).join('');
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-pillar') || 'solar';
      updatePillar(key);
    });
  });

  // Initial load
  updatePillar('solar');
}
