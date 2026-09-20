import { TOTAL_HERO_FRAMES, getHeroFrameUrl } from '../data/hero-frames.js';

/**
 * High-Performance Cross-Platform Scroll-Driven Hero Canvas Engine
 * Renders Kochi Water Metro frame sequence at native source resolution (3392x1912)
 * with zero unnecessary smoothing/resampling for razor-sharp clarity across all screens.
 */
export function initHeroScroll() {
  const scrollSection = document.getElementById('hero-scroll-section');
  const canvas = document.getElementById('hero-frame-canvas');
  if (!scrollSection || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const scrollPrompt = document.getElementById('hero-scroll-prompt');
  const stepItems = document.querySelectorAll('.hero-steps-indicator .step-item');

  // Native source frame dimensions
  const SOURCE_FRAME_WIDTH = 3392;
  const SOURCE_FRAME_HEIGHT = 1912;

  // Initialize canvas internal backing-store to native frame resolution
  canvas.width = SOURCE_FRAME_WIDTH;
  canvas.height = SOURCE_FRAME_HEIGHT;
  ctx.imageSmoothingEnabled = false;

  // Motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Frame Cache
  const frames = new Array(TOTAL_HERO_FRAMES);
  let renderedFrameIndex = -1;
  let targetProgress = 0;
  let currentProgress = 0;
  let isTicking = false;
  let animationFrameId = null;

  // Track layout metrics
  let sectionTop = 0;
  let sectionScrollDist = 0;

  function updateMetrics() {
    const rect = scrollSection.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    sectionTop = rect.top + scrollTop;
    sectionScrollDist = Math.max(1, scrollSection.offsetHeight - window.innerHeight);
  }

  // Ensure canvas backing-store maintains native source resolution without downsampling
  function setCanvasInternalResolution(width = SOURCE_FRAME_WIDTH, height = SOURCE_FRAME_HEIGHT) {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      // Resizing canvas resets 2D context properties, re-disable smoothing
      ctx.imageSmoothingEnabled = false;
      renderedFrameIndex = -1; // Force repaint
    }
  }

  // Responsive handler: updates metrics and re-renders while preserving native backing-store
  function resizeCanvas() {
    updateMetrics();
    const currentImg = frames[renderedFrameIndex >= 0 ? renderedFrameIndex : 0] || frames[0];
    const sw = currentImg?.naturalWidth || SOURCE_FRAME_WIDTH;
    const sh = currentImg?.naturalHeight || SOURCE_FRAME_HEIGHT;
    setCanvasInternalResolution(sw, sh);
    renderCurrentFrame();
  }

  // Find nearest loaded frame if the target index is still buffering
  function getNearestLoadedFrame(targetIdx) {
    if (frames[targetIdx]?.complete && frames[targetIdx].naturalWidth > 0) {
      return frames[targetIdx];
    }
    // Search outward for closest cached frame
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

  // Draw frame at 1:1 native resolution into full-resolution canvas backing store
  function drawFrame(index) {
    const img = getNearestLoadedFrame(index);
    if (!img) return;

    const sourceWidth = img.naturalWidth || SOURCE_FRAME_WIDTH;
    const sourceHeight = img.naturalHeight || SOURCE_FRAME_HEIGHT;

    // Ensure backing-store matches source frame actual resolution
    if (canvas.width !== sourceWidth || canvas.height !== sourceHeight) {
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      ctx.imageSmoothingEnabled = false;
    } else if (ctx.imageSmoothingEnabled) {
      ctx.imageSmoothingEnabled = false;
    }

    // Direct 1:1 pixel transfer: no software scaling or dual interpolation blur
    ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight);
    renderedFrameIndex = index;
  }

  function renderCurrentFrame() {
    const frameIdx = Math.min(
      TOTAL_HERO_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_HERO_FRAMES - 1)))
    );

    if (frameIdx !== renderedFrameIndex) {
      drawFrame(frameIdx);
    }

    // Update floating timeline stepper
    if (stepItems.length > 0) {
      if (currentProgress < 0.5) {
        stepItems[0]?.classList.add('active');
        stepItems[1]?.classList.remove('active');
      } else {
        stepItems[0]?.classList.remove('active');
        stepItems[1]?.classList.add('active');
      }
    }

    // Fade scroll prompt indicator
    if (scrollPrompt) {
      if (currentProgress > 0.06) {
        scrollPrompt.classList.add('faded');
      } else {
        scrollPrompt.classList.remove('faded');
      }
    }
  }

  // Physics animation loop: Damped Lerp for ultra-smooth 60/120fps motion
  function onTick() {
    if (prefersReducedMotion) {
      currentProgress = targetProgress;
      renderCurrentFrame();
      isTicking = false;
      return;
    }

    // Snappy damping factor: 0.22 gives instant responsiveness with silky inertia
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.0008) {
      currentProgress += diff * 0.22;
      renderCurrentFrame();
      animationFrameId = requestAnimationFrame(onTick);
    } else {
      currentProgress = targetProgress;
      renderCurrentFrame();
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

  // Scroll event handler with passive listener
  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const relativeY = scrollY - sectionTop;

    if (sectionScrollDist <= 0) {
      targetProgress = 0;
    } else {
      targetProgress = Math.min(1, Math.max(0, relativeY / sectionScrollDist));
    }

    scheduleUpdate();
  }

  // Eager frame preloading: immediate paint of Frame 0 + concurrent preload & decode of all 85 frames
  function preloadFrames() {
    // 1. Immediately request Frame 0 for instant initial paint
    const firstImg = new Image();
    firstImg.src = getHeroFrameUrl(0);
    frames[0] = firstImg;

    const onFirstFrameLoaded = () => {
      if (firstImg.naturalWidth > 0 && firstImg.naturalHeight > 0) {
        setCanvasInternalResolution(firstImg.naturalWidth, firstImg.naturalHeight);
      }
      drawFrame(0);
    };

    if (firstImg.complete && firstImg.naturalWidth > 0) {
      onFirstFrameLoaded();
    } else {
      firstImg.onload = onFirstFrameLoaded;
      firstImg.onerror = () => {
        firstImg.src = getHeroFrameUrl(0, true);
        firstImg.onload = onFirstFrameLoaded;
      };
    }

    // 2. Preload and decode all remaining frames concurrently so scrolling has zero intermediate fallback
    preloadAllFrames();
  }

  function preloadAllFrames() {
    for (let i = 1; i < TOTAL_HERO_FRAMES; i++) {
      if (frames[i]) continue;
      const img = new Image();
      const frameNum = i;
      img.src = getHeroFrameUrl(frameNum);
      frames[frameNum] = img;

      // Asynchronous background GPU bitmap decoding
      if (img.decode) {
        img.decode().catch(() => {});
      }

      img.onerror = () => {
        const fallback = new Image();
        fallback.src = getHeroFrameUrl(frameNum, true);
        if (fallback.decode) fallback.decode().catch(() => {});
        frames[frameNum] = fallback;
      };
    }
  }

  // Event Listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
  }, { passive: true });

  // Initial sizing & paint
  updateMetrics();
  preloadFrames();
}
