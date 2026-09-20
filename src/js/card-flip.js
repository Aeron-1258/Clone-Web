/**
 * Kochi1 Card 3D Perspective Flipper
 * Directly mirrors the interactive card component from corporate.kochimetro.org
 */
export function initCardFlip() {
  const flipper = document.querySelector('.kochi1-card-flipper');
  const cardPerspective = document.querySelector('.kochi1-card-perspective');

  if (!flipper || !cardPerspective) return;

  // Toggle on click
  cardPerspective.addEventListener('click', () => {
    flipper.classList.toggle('flipped');
  });

  // Dynamic 3D tilt tracking mouse
  cardPerspective.addEventListener('mousemove', (e) => {
    const rect = cardPerspective.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    if (!flipper.classList.contains('flipped')) {
      flipper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  });

  cardPerspective.addEventListener('mouseleave', () => {
    if (!flipper.classList.contains('flipped')) {
      flipper.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
  });
}
