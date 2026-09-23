/**
 * Kochi Water Metro - First Hero Section Frame Manifest & URL Resolver
 * Sequence frames located under: public/images/herosection/ and public/images/hero/
 * Exactly 85 frames available: frame_001.jpg / frame_001.png / ezgif-frame-001.png to 085
 */

export const TOTAL_HERO_FRAMES = 85;
export const SOURCE_FRAME_WIDTH = 848;
export const SOURCE_FRAME_HEIGHT = 478;
export const SOURCE_ASPECT_RATIO = SOURCE_FRAME_WIDTH / SOURCE_FRAME_HEIGHT;

export const HERO_FRAME_FILENAMES = Array.from({ length: TOTAL_HERO_FRAMES }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  return `frame_${num}`;
});

/**
 * Resolves the primary URL for an animation frame (0-indexed: 0 to 84).
 * Returns fast-loading optimized JPEG, which falls back to PNG seamlessly if needed.
 * @param {number} index Frame index (0 to 84)
 * @returns {string} Public asset URL
 */
export function getHeroFrameUrl(index) {
  const safeIndex = Math.max(0, Math.min(index, TOTAL_HERO_FRAMES - 1));
  const num = String(safeIndex + 1).padStart(3, '0');
  return `/images/herosection/frame_${num}.jpg`;
}

/**
 * Returns fallback URLs for a given frame index
 * @param {number} index 
 * @returns {string[]}
 */
export function getHeroFrameFallbacks(index) {
  const safeIndex = Math.max(0, Math.min(index, TOTAL_HERO_FRAMES - 1));
  const num = String(safeIndex + 1).padStart(3, '0');
  return [
    `/images/hero/frame_${num}.jpg`,
    `/images/herosection/frame_${num}.png`,
    `/images/herosection/ezgif-frame-${num}.png`,
    `/images/hero/ezgif-frame-${num}.png`
  ];
}
