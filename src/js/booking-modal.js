import { STATIONS } from '../data/stations.js';

/**
 * Dedicated Kochi Water Metro Ticket Booking Modal & Route Controller
 * Supports direct deep-linking via #book-tickets or /book-tickets
 */
export function initBookingModal() {
  const modalBackdrop = document.getElementById('ticket-booking-modal');
  const closeBtn = document.getElementById('booking-modal-close-btn');
  const fromSelect = document.getElementById('booking-from-select');
  const toSelect = document.getElementById('booking-to-select');
  const decrementBtn = document.getElementById('passengers-decrement');
  const incrementBtn = document.getElementById('passengers-increment');
  const passengerCountEl = document.getElementById('passenger-count-display');
  const fareTotalEl = document.getElementById('booking-total-fare');
  const whatsappBtn = document.getElementById('btn-proceed-whatsapp');

  if (!modalBackdrop) return;

  let passengerCount = 1;
  const waterMetroTerminals = STATIONS.filter(s => s.type === 'water-metro');

  // Populate Dropdowns
  if (fromSelect && toSelect) {
    const optionsHtml = waterMetroTerminals.map(s => `
      <option value="${s.id}">${s.name} (${s.mlName})</option>
    `).join('');

    fromSelect.innerHTML = optionsHtml;
    toSelect.innerHTML = optionsHtml;

    // Default: High Court to Vypin
    fromSelect.value = 'high-court';
    toSelect.value = 'vypin';
  }

  function calculateBaseFare(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return 20;
    // Typical Kochi Water Metro standard distance-based tariffs: ₹20, ₹30, ₹40
    const fromIndex = waterMetroTerminals.findIndex(s => s.id === fromId);
    const toIndex = waterMetroTerminals.findIndex(s => s.id === toId);
    const hopDistance = Math.abs(fromIndex - toIndex);
    if (hopDistance <= 1) return 20;
    if (hopDistance <= 3) return 30;
    return 40;
  }

  function updateFareAndLink() {
    const fromId = fromSelect?.value || 'high-court';
    const toId = toSelect?.value || 'vypin';
    const fromStation = waterMetroTerminals.find(s => s.id === fromId);
    const toStation = waterMetroTerminals.find(s => s.id === toId);

    const baseFare = calculateBaseFare(fromId, toId);
    const totalFare = baseFare * passengerCount;

    if (fareTotalEl) {
      fareTotalEl.textContent = `₹${totalFare}`;
    }

    if (whatsappBtn) {
      const msg = `Hi Kochi Water Metro! I would like to book ${passengerCount} ticket(s) from ${fromStation?.name || 'High Court'} to ${toStation?.name || 'Vypin'} (Total: ₹${totalFare}).`;
      whatsappBtn.href = `https://wa.me/919188957488?text=${encodeURIComponent(msg)}`;
    }
  }

  // Stepper Listeners
  decrementBtn?.addEventListener('click', () => {
    if (passengerCount > 1) {
      passengerCount--;
      if (passengerCountEl) passengerCountEl.textContent = passengerCount;
      updateFareAndLink();
    }
  });

  incrementBtn?.addEventListener('click', () => {
    if (passengerCount < 10) {
      passengerCount++;
      if (passengerCountEl) passengerCountEl.textContent = passengerCount;
      updateFareAndLink();
    }
  });

  fromSelect?.addEventListener('change', updateFareAndLink);
  toSelect?.addEventListener('change', updateFareAndLink);

  // Close handlers
  function closeModal() {
    modalBackdrop.classList.remove('open');
    if (window.location.hash === '#book-tickets') {
      history.pushState(null, '', window.location.pathname);
    }
  }

  closeBtn?.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Check URL on load & hashchange
  function checkUrlRoute() {
    if (window.location.hash === '#book-tickets' || window.location.pathname.endsWith('/book-tickets')) {
      openBookingModal();
    }
  }

  window.addEventListener('hashchange', checkUrlRoute);
  window.addEventListener('popstate', checkUrlRoute);
  checkUrlRoute();

  updateFareAndLink();
}

/**
 * Programmatically open the Ticket Booking Modal
 */
export function openBookingModal(originId, destinationId) {
  const modalBackdrop = document.getElementById('ticket-booking-modal');
  const fromSelect = document.getElementById('booking-from-select');
  const toSelect = document.getElementById('booking-to-select');

  if (originId && fromSelect) fromSelect.value = originId;
  if (destinationId && toSelect) toSelect.value = destinationId;

  modalBackdrop?.classList.add('open');

  // Update hash cleanly without reload
  if (window.location.hash !== '#book-tickets') {
    history.pushState(null, '', '#book-tickets');
  }
}
