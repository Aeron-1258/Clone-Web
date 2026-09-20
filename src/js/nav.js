import { I18N } from '../data/i18n.js';

export let currentLang = 'en';

export function initNavigation(onLanguageChange) {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const langBtn = document.querySelector('.lang-switch-btn');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll detection for sticky navbar styling
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  toggleBtn?.addEventListener('click', () => {
    const isOpen = navMenu?.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close mobile menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu?.classList.remove('open');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    });
  });

  // Language Switcher
  langBtn?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ml' : 'en';
    const langLabel = langBtn.querySelector('.lang-label');
    if (langLabel) {
      langLabel.textContent = currentLang === 'en' ? 'മലയാളം' : 'English';
    }
    document.documentElement.lang = currentLang;
    if (typeof onLanguageChange === 'function') {
      onLanguageChange(currentLang, I18N[currentLang]);
    }
  });
}
