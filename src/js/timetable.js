import { STATIONS } from '../data/stations.js';
import { ROUTES } from '../data/routes.js';

export function initTimetable() {
  const terminalFilter = document.getElementById('timetable-terminal-filter');
  const tableBody = document.getElementById('timetable-rows');

  if (!terminalFilter || !tableBody) return;

  // Populate options
  terminalFilter.innerHTML = `
    <option value="all">All Operational Terminals</option>
    ${STATIONS.filter(s => s.status === 'operational').map(s => `
      <option value="${s.id}">${s.name} (${s.mlName})</option>
    `).join('')}
  `;

  renderTimetableRows(tableBody, 'all');

  terminalFilter.addEventListener('change', () => {
    renderTimetableRows(tableBody, terminalFilter.value);
  });
}

function renderTimetableRows(container, selectedStationId) {
  let activeRoutes = ROUTES.filter(r => r.status === 'operational');

  if (selectedStationId !== 'all') {
    activeRoutes = activeRoutes.filter(r => r.stations.includes(selectedStationId));
  }

  const statuses = [
    { text: 'On Time', class: 'status-on-time', icon: '🟢' },
    { text: 'Boarding', class: 'status-boarding', icon: '🟡' },
    { text: 'Arriving in 4m', class: 'status-arriving', icon: '🟢' }
  ];

  container.innerHTML = activeRoutes.map((route, i) => {
    const fromStation = STATIONS.find(s => s.id === route.stations[0]);
    const toStation = STATIONS.find(s => s.id === route.stations[1]);
    const status = statuses[i % statuses.length];

    return `
      <tr style="border-bottom: 1px solid var(--km-border); transition: background 0.2s;">
        <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--km-navy);">
          ${route.name}
          <div style="font-size: 0.8rem; color: var(--km-teal); font-weight: 600;">${route.mlName}</div>
        </td>
        <td style="padding: 1rem 1.25rem; color: var(--km-slate); font-weight: 600;">
          ${route.firstBoat} – ${route.lastBoat}
        </td>
        <td style="padding: 1rem 1.25rem; color: var(--km-slate);">
          ${route.headway}
        </td>
        <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--km-teal);">
          ₹${route.fare}
        </td>
        <td style="padding: 1rem 1.25rem;">
          <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:var(--radius-pill); font-size:0.8rem; font-weight:700; background:rgba(0,153,153,0.1); color:var(--km-teal);">
            ${status.icon} ${status.text}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}
