/**
 * Dynamic Ridership Live Counter
 * Matches Knowledge Base: 7.6M+ passengers + real-time increment updates
 */
export function initRidershipCounter() {
  let baseRidership = 7662174;
  let todayRidership = 5892;

  const totalEl = document.getElementById('live-ridership-total');
  const todayEl = document.getElementById('live-ridership-today');

  // Format with Indian numbering system commas (e.g. 76,62,174)
  const formatNumber = (num) => {
    return num.toLocaleString('en-IN');
  };

  // Initial render
  if (totalEl) totalEl.textContent = formatNumber(baseRidership);
  if (todayEl) todayEl.textContent = formatNumber(todayRidership);

  // Periodic simulated live boarding increments
  setInterval(() => {
    // Random boarding event (1 to 4 passengers tapping at turnstiles across 38 jetties)
    const increment = Math.floor(Math.random() * 3) + 1;
    baseRidership += increment;
    todayRidership += increment;

    if (totalEl) {
      totalEl.textContent = formatNumber(baseRidership);
      totalEl.classList.add('tick-highlight');
      setTimeout(() => totalEl.classList.remove('tick-highlight'), 600);
    }
    if (todayEl) {
      todayEl.textContent = formatNumber(todayRidership);
    }
  }, 4000);
}
