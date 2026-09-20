/**
 * Hero Section Frame Manifest & URL Resolver
 * 85 Frame sequence under public/images/herosection/
 */

// Generate filenames array: ezgif-frame-001 to ezgif-frame-085
export const TOTAL_HERO_FRAMES = 85;

export const HERO_FRAME_FILENAMES = Array.from({ length: TOTAL_HERO_FRAMES }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  return `ezgif-frame-${num}`;
});

// Quick synchronous WebP detection
let isWebpSupported = true;
try {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    isWebpSupported = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
} catch {
  isWebpSupported = true;
}

/**
 * Get frame image path with format optimization (WebP by default with PNG fallback)
 * @param {number} index 0-indexed frame number
 * @param {boolean} forcePng If true, forces fallback to PNG
 * @returns {string} Relative URL path
 */
export function getHeroFrameUrl(index, forcePng = false) {
  const safeIndex = Math.max(0, Math.min(index, TOTAL_HERO_FRAMES - 1));
  const baseName = HERO_FRAME_FILENAMES[safeIndex];
  const ext = (isWebpSupported && !forcePng) ? 'webp' : 'png';
  return `/images/herosection/${baseName}.${ext}`;
}
