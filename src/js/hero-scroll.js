import {
  TOTAL_HERO_FRAMES,
  SOURCE_FRAME_WIDTH,
  SOURCE_FRAME_HEIGHT,
  SOURCE_ASPECT_RATIO,
  getHeroFrameUrl,
  getHeroFrameFallbacks
} from '../data/hero-frames.js';

/**
 * Premium Production-Ready Scroll-Driven Hero Animation Engine
 * Renders Kochi Water Metro 85-frame sequence onto high-DPI HTML5 Canvas.
 * Features:
 * - Fluid scroll-driven progression & smooth reverse scrubbing
 * - Apple-style dampened lerp physics with zero frame tearing
 * - Proportional object-fit: cover preservation across Mobile, Tablet, Laptop, Desktop
 * - Asynchronous GPU-accelerated frame preloading & zero-flicker caching
 * - Support for 100vh / 100dvh / 100svh mobile viewports & prefers-reduced-motion
 */
export function initHeroScroll() {
  const scrollSection = document.getElementById('home') || document.querySelector('.hero-scroll-section');
  const canvas = document.getElementById('hero-frame-canvas');
  const scrollPrompt = document.getElementById('hero-scroll-prompt');

  if (!scrollSection || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Frame Cache & State
  const frames = new Array(TOTAL_HERO_FRAMES);
  let isFirstFrameReady = false;
  let renderedFrameIndex = -1;
  let targetProgress = 0;
  let currentProgress = 0;
  let isTicking = false;
  let animationFrameId = null;

  // Layout Metrics
  let displayWidth = 0;
  let displayHeight = 0;
  let dpr = 1;
  let drawW = 0;
  let drawH = 0;
  let drawX = 0;
  let drawY = 0;

  /**
   * Recalculates canvas sizing and true object-fit: cover coordinates.
   * Handles devicePixelRatio, high-DPI Retina scaling, and dynamic viewports.
   */
  function updateDimensions() {
    displayWidth = window.innerWidth;
    displayHeight = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // True object-fit: cover scaling factor to prevent distortion or black bars
    const scale = Math.max(canvas.width / SOURCE_FRAME_WIDTH, canvas.height / SOURCE_FRAME_HEIGHT);
    drawW = Math.round(SOURCE_FRAME_WIDTH * scale);
    drawH = Math.round(SOURCE_FRAME_HEIGHT * scale);
    drawX = Math.round((canvas.width - drawW) / 2);
    drawY = Math.round((canvas.height - drawH) / 2);

    // Force repaint of the active frame with updated dimensions
    if (renderedFrameIndex >= 0) {
      const idx = renderedFrameIndex;
      renderedFrameIndex = -1;
      drawFrame(idx);
    }
  }

  /**
   * Finds nearest loaded frame if the target frame is still decoding
   */
  function getNearestLoadedFrame(targetIdx) {
    if (frames[targetIdx]?.complete && frames[targetIdx].naturalWidth > 0) {
      return frames[targetIdx];
    }
    for (let d = 1; d < TOTAL_HERO_FRAMES; d++) {
      const prev = targetIdx - d;
      if (prev >= 0 && frames[prev]?.complete && frames[prev].naturalWidth > 0) {
        return frames[prev];
      }
      const next = targetIdx + d;
      if (next < TOTAL_HERO_FRAMES && frames[next]?.complete && frames[next].naturalWidth > 0) {
        return frames[next];
      }
    }
    return null;
  }

  /**
   * Draws target frame onto the canvas surface with full cover
   */
  function drawFrame(index) {
    const img = getNearestLoadedFrame(index);
    if (!img) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    renderedFrameIndex = index;
  }

  /**
   * Loads an image with automatic fallback support
   */
  function loadImageWithFallbacks(index) {
    const img = new Image();
    img.decoding = 'async';
    const fallbacks = getHeroFrameFallbacks(index);
    let fallbackIdx = 0;

    img.onerror = () => {
      if (fallbackIdx < fallbacks.length) {
        img.src = fallbacks[fallbackIdx++];
      }
    };

    img.src = getHeroFrameUrl(index);
    return img;
  }

  /**
   * Progressive frame preloader: Frame 0 loaded immediately for instant paint,
   * then batches remaining frames smoothly in the background.
   */
  function preloadFrames() {
    // 1. Immediately request Frame 0
    const firstImg = loadImageWithFallbacks(0);
    frames[0] = firstImg;

    const onFirstFrameLoaded = () => {
      if (!isFirstFrameReady) {
        isFirstFrameReady = true;
        updateDimensions();
        drawFrame(0);
      }
    };

    if (firstImg.complete && firstImg.naturalWidth > 0) {
      onFirstFrameLoaded();
    } else {
      firstImg.onload = () => {
        if (firstImg.decode) {
          firstImg.decode().then(onFirstFrameLoaded).catch(onFirstFrameLoaded);
        } else {
          onFirstFrameLoaded();
        }
      };
    }

    // 2. Preload remaining frames progressively
    preloadRemainingFrames();
  }

  function preloadRemainingFrames() {
    let index = 1;
    const batchSize = 6;

    function loadNextBatch() {
      if (index >= TOTAL_HERO_FRAMES) return;
      const end = Math.min(index + batchSize, TOTAL_HERO_FRAMES);

      for (let i = index; i < end; i++) {
        if (frames[i]) continue;
        const img = loadImageWithFallbacks(i);
        frames[i] = img;

        if (img.decode) {
          img.decode().catch(() => {});
        }
      }

      index = end;
      if (index < TOTAL_HERO_FRAMES) {
        if (window.requestIdleCallback) {
          requestIdleCallback(loadNextBatch, { timeout: 80 });
        } else {
          setTimeout(loadNextBatch, 25);
        }
      }
    }

    setTimeout(loadNextBatch, 40);
  }

  /**
   * Computes normalized scroll progress within the hero section (0.0 to 1.0)
   */
  function calculateProgress() {
    const rect = scrollSection.getBoundingClientRect();
    const scrollDist = scrollSection.offsetHeight - window.innerHeight;
    if (scrollDist <= 0) return 0;
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / scrollDist));
  }

  /**
   * Renders the frame corresponding to currentProgress
   */
  function renderFrameAtCurrentProgress() {
    const frameIdx = Math.min(
      TOTAL_HERO_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_HERO_FRAMES - 1)))
    );

    if (frameIdx !== renderedFrameIndex) {
      drawFrame(frameIdx);
    }

    if (scrollPrompt) {
      scrollPrompt.style.opacity = currentProgress > 0.06 ? '0' : '1';
      scrollPrompt.style.pointerEvents = currentProgress > 0.06 ? 'none' : 'auto';
    }
  }

  /**
   * Main animation tick with Apple-style smooth lerp damping
   */
  function onTick() {
    if (prefersReducedMotion) {
      currentProgress = targetProgress;
      renderFrameAtCurrentProgress();
      isTicking = false;
      return;
    }

    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.0004) {
      // 0.22 damping factor for responsive, buttery continuous movement
      currentProgress += diff * 0.22;
      renderFrameAtCurrentProgress();
      animationFrameId = requestAnimationFrame(onTick);
    } else {
      currentProgress = targetProgress;
      renderFrameAtCurrentProgress();
      isTicking = false;
      animationFrameId = null;
    }
  }

  function scheduleUpdate() {
    if (!isTicking) {
      isTicking = true;
      animationFrameId = requestAnimationFrame(onTick);
    }
  }

  function onScroll() {
    targetProgress = calculateProgress();
    scheduleUpdate();
  }

  // Debounced resize handler
  let resizeTimeout = null;
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateDimensions();
      targetProgress = calculateProgress();
      currentProgress = targetProgress;
      renderFrameAtCurrentProgress();
    }, 50);
  }

  // Initial sizing & preloading
  updateDimensions();
  preloadFrames();
  targetProgress = calculateProgress();
  currentProgress = targetProgress;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(onResize, 100);
  }, { passive: true });

  scheduleUpdate();
}
