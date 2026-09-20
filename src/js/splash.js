/**
 * Splash Screen Transition
 * Inspired by corporate.kochimetro.org
 */
export function initSplashScreen() {
  const splashEl = document.getElementById('global-splash');
  if (!splashEl) return;

  const hideSplash = () => {
    splashEl.style.opacity = '0';
    splashEl.style.pointerEvents = 'none';
    setTimeout(() => {
      splashEl.style.display = 'none';
      document.documentElement.classList.add('hide-splash');
    }, 800);
  };

  // Auto-dismiss after 2 seconds
  const timer = setTimeout(hideSplash, 2200);

  // Click anywhere or skip button to instantly dismiss
  splashEl.addEventListener('click', () => {
    clearTimeout(timer);
    hideSplash();
  });
}
