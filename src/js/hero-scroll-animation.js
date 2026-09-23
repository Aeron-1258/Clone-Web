import { TOTAL_FRAMES, getHero2FrameUrl } from '../data/hero-frames-2.js';

/**
 * High-Performance Apple-Grade Cinematic Scroll Animation Engine
 * Renders 111 frames from /images/hero-section-2/ with object-fit: cover
 * Full-screen 100vw x 100vh edge-to-edge experience
 */
export function initHeroScrollAnimation() {
  const scrollTrack = document.getElementById('our-story');
  const stickyFrame = document.getElementById('hero-sticky-frame');
  const canvas = document.getElementById('hero-animation-canvas');
  const loader = document.getElementById('hero-anim-loader');

  if (!scrollTrack || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // Source aspect ratio (848x478)
  const SOURCE_WIDTH = 848;
  const SOURCE_HEIGHT = 478;
  const SOURCE_ASPECT = SOURCE_WIDTH / SOURCE_HEIGHT;

  // Motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cache & frames
  const frames = new Array(TOTAL_FRAMES);
  let isFirstFrameReady = false;
  let renderedIndex = -1;
  let targetProgress = 0;
  let currentProgress = 0;
  let animFrameId = null;

  // Layout dimensions
  let displayW = 0;
  let displayH = 0;
  let dpr = 1;
  let drawW = 0;
  let drawH = 0;
  let drawX = 0;
  let drawY = 0;

  // Progressive preloader
  function preloadFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = 'async';

      img.onload = () => {
        if (i === 0 && !isFirstFrameReady) {
          isFirstFrameReady = true;
          if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
              if (loader) loader.style.display = 'none';
            }, 300);
          }
          drawFrame(0);
        }
      };

      img.onerror = () => {
        // Fallback to PNG if WebP fails
        const fallback = getHero2FrameUrl(i, true);
        if (img.src !== fallback) {
          img.src = fallback;
        }
      };

      if (i < 20) {
        img.src = getHero2FrameUrl(i);
      } else {
        setTimeout(() => {
          img.src = getHero2FrameUrl(i);
        }, 30 + (i - 20) * 10);
      }

      frames[i] = img;
    }
  }

  // Update canvas sizing & aspect-ratio preserving coordinates
  function updateDimensions() {
    displayW = window.innerWidth;
    displayH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    // Account for fixed floating navbar (58px height + 16px top offset)
    const navbarOffset = displayW >= 992 ? 72 : 60;
    const availableH = Math.max(200, displayH - navbarOffset);
    const scale = Math.min(displayW / SOURCE_WIDTH, availableH / SOURCE_HEIGHT);

    drawW = Math.round(SOURCE_WIDTH * scale * dpr);
    drawH = Math.round(SOURCE_HEIGHT * scale * dpr);
    drawX = Math.round((canvas.width - drawW) / 2);
    drawY = Math.round((navbarOffset * dpr) + (availableH * dpr - drawH) / 2);

    renderedIndex = -1; // Force repaint
    const activeIndex = renderedIndex >= 0 ? renderedIndex : 0;
    drawFrame(activeIndex);
  }

  // Draw frame with object-fit: cover
  function drawFrame(index) {
    let img = frames[index];
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Find nearest cached frame
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        const prev = index - d;
        if (prev >= 0 && frames[prev]?.complete && frames[prev].naturalWidth > 0) {
          img = frames[prev];
          break;
        }
        const next = index + d;
        if (next < TOTAL_FRAMES && frames[next]?.complete && frames[next].naturalWidth > 0) {
          img = frames[next];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    renderedIndex = index;
  }

  // Calculate scroll progress within track
  function calculateProgress() {
    const rect = scrollTrack.getBoundingClientRect();
    const totalScrollDist = scrollTrack.offsetHeight - window.innerHeight;
    if (totalScrollDist <= 0) return 0;

    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / totalScrollDist));
  }

  // Animation render loop (60 FPS with lerp)
  function renderLoop() {
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) < 0.0008) {
      currentProgress = targetProgress;
    } else {
      currentProgress += diff * 0.28;
    }

    const frameIdx = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );

    if (frameIdx !== renderedIndex) {
      drawFrame(frameIdx);
    }

    if (currentProgress !== targetProgress) {
      animFrameId = requestAnimationFrame(renderLoop);
    } else {
      animFrameId = null;
    }
  }

  function onScroll() {
    if (prefersReducedMotion) return;
    targetProgress = calculateProgress();
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(renderLoop);
    }
  }

  // Window resize handler
  let resizeTimeout = null;
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateDimensions();
      targetProgress = calculateProgress();
      currentProgress = targetProgress;
      const frameIdx = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
      );
      drawFrame(frameIdx);
    }, 50);
  }

  // Initialize
  preloadFrames();
  updateDimensions();
  targetProgress = calculateProgress();
  currentProgress = targetProgress;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Initial draw
  drawFrame(0);
}
