import {
  TOTAL_HERO2_FRAMES,
  SOURCE_CONTENT_X,
  SOURCE_CONTENT_Y,
  SOURCE_FRAME_WIDTH,
  SOURCE_FRAME_HEIGHT,
  getHero2FrameUrl
} from '../data/hero-frames-2.js';
import { openBookingModal } from './booking-modal.js';

/**
 * Scroll-Driven Frame Sequence Engine for Blank Page Section ("Connecting Kochi")
 * 
 * Direct frame-by-frame implementation:
 * - Exact 100 frames (/assets/animation/frame_00000.jpg to frame_00099.jpg)
 * - Masks/crops outer background & shadow at frame-rendering level (135, 145, 1650, 800)
 * - Renders directly onto the existing #blank-page section without any cards or boxes
 * - Pure scroll-driven progression: frame 00000 -> frame 00099
 * - Freeze on exact frame immediately when scrolling stops (no autoplay, no drift)
 * - Reverse animation when user scrolls upward
 * - Release sticky when frame 00099 is reached to flow into next section
 * - Interactive action hotspots wired to booking modal and journey planner
 */
export function initHeroScroll2() {
  const scrollSection = document.getElementById('blank-page') || document.getElementById('water-metro-scroll');
  const canvas = document.getElementById('animation-canvas');

  if (!scrollSection || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NATIVE_WIDTH = SOURCE_FRAME_WIDTH || 1650;
  const NATIVE_HEIGHT = SOURCE_FRAME_HEIGHT || 800;
  const SX = SOURCE_CONTENT_X || 135;
  const SY = SOURCE_CONTENT_Y || 145;

  // Frame Cache
  const frames = new Array(TOTAL_HERO2_FRAMES);
  let isFirstFrameReady = false;
  let renderedFrameIndex = -1;

  // Scroll & Animation State
  let targetProgress = 0;
  let currentProgress = 0;
  let animationFrameId = null;
  let isTicking = false;

  function setupCanvas() {
    canvas.width = NATIVE_WIDTH;
    canvas.height = NATIVE_HEIGHT;
  }

  /**
   * Retrieves the nearest cached frame if target frame is still decoding
   */
  function getNearestLoadedFrame(targetIdx) {
    if (frames[targetIdx]?.complete && frames[targetIdx].naturalWidth > 0) {
      return frames[targetIdx];
    }
    for (let d = 1; d < TOTAL_HERO2_FRAMES; d++) {
      const prev = targetIdx - d;
      if (prev >= 0 && frames[prev]?.complete && frames[prev].naturalWidth > 0) {
        return frames[prev];
      }
      const next = targetIdx + d;
      if (next < TOTAL_HERO2_FRAMES && frames[next]?.complete && frames[next].naturalWidth > 0) {
        return frames[next];
      }
    }
    return null;
  }

  /**
   * Draws the frame content directly onto the canvas,
   * cleanly cropping out the frame's outer beige margin and drop shadow
   */
  function drawFrame(index) {
    const img = getNearestLoadedFrame(index);
    if (!img) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Draw content region: (SX, SY, NATIVE_WIDTH, NATIVE_HEIGHT) -> (0, 0, NATIVE_WIDTH, NATIVE_HEIGHT)
    ctx.drawImage(img, SX, SY, NATIVE_WIDTH, NATIVE_HEIGHT, 0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
    renderedFrameIndex = index;
  }

  /**
   * Progressive preloader: loads Frame 0 immediately for instant paint,
   * then progressively preloads remaining 99 frames in small background batches
   */
  function preloadFrames() {
    // 1. Immediately load frame 0 for instant initial paint
    const firstImg = new Image();
    firstImg.decoding = 'async';
    firstImg.src = getHero2FrameUrl(0);
    frames[0] = firstImg;

    const onFirstFrameLoaded = () => {
      if (!isFirstFrameReady) {
        isFirstFrameReady = true;
        setupCanvas();
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
      if (index >= TOTAL_HERO2_FRAMES) return;
      const end = Math.min(index + batchSize, TOTAL_HERO2_FRAMES);

      for (let i = index; i < end; i++) {
        if (frames[i]) continue;
        const img = new Image();
        img.decoding = 'async';
        img.src = getHero2FrameUrl(i);
        frames[i] = img;

        if (img.decode) {
          img.decode().catch(() => {});
        }
      }

      index = end;
      if (index < TOTAL_HERO2_FRAMES) {
        if (window.requestIdleCallback) {
          requestIdleCallback(loadNextBatch, { timeout: 80 });
        } else {
          setTimeout(loadNextBatch, 25);
        }
      }
    }

    setTimeout(loadNextBatch, 50);
  }

  /**
   * Computes normalized scroll progress within the sticky blank section (0.0 to 1.0)
   */
  function calculateProgress() {
    const rect = scrollSection.getBoundingClientRect();
    const containerHeight = scrollSection.offsetHeight - window.innerHeight;
    if (containerHeight <= 0) return 0;

    const scrollPosition = -rect.top;
    return Math.max(0, Math.min(1, scrollPosition / containerHeight));
  }

  /**
   * Renders the frame corresponding to currentProgress
   */
  function renderFrameAtCurrentProgress() {
    const frameIdx = Math.min(
      TOTAL_HERO2_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_HERO2_FRAMES - 1)))
    );

    if (frameIdx !== renderedFrameIndex) {
      drawFrame(frameIdx);
    }
  }

  /**
   * High-performance lerp animation tick
   */
  function onTick() {
    if (prefersReducedMotion) {
      currentProgress = targetProgress;
      renderFrameAtCurrentProgress();
      isTicking = false;
      return;
    }

    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.0006) {
      currentProgress += diff * 0.28; // Ultra-responsive, smooth scroll tracking
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

  function onResize() {
    setupCanvas();
    targetProgress = calculateProgress();
    currentProgress = targetProgress;
    renderFrameAtCurrentProgress();
  }

  // Action Hotspot Listeners
  const bookBtn = document.getElementById('hero2-book-tickets-btn');
  const planBtn = document.getElementById('hero2-plan-journey-btn');

  bookBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openBookingModal();
  });

  planBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('timetable-section') || document.getElementById('network-map');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Initialize
  setupCanvas();
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
