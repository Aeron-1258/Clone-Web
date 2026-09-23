/**
 * Hero Section 2 ("Connecting Kochi") Frame Manifest & URL Resolver
 * 100 Frame sequence under public/assets/animation/
 * Filename format: frame_00000.jpg to frame_00099.jpg
 * Content cropped bounds excluding outer beige gradient and shadow:
 * SX: 135, SY: 145, SW: 1650, SH: 800
 */

export const TOTAL_HERO2_FRAMES = 100;
export const TOTAL_FRAMES = 100;

export const SOURCE_CONTENT_X = 135;
export const SOURCE_CONTENT_Y = 145;
export const SOURCE_FRAME_WIDTH = 1650;
export const SOURCE_FRAME_HEIGHT = 800;
export const SOURCE_ASPECT_RATIO = SOURCE_FRAME_WIDTH / SOURCE_FRAME_HEIGHT;

export const HERO2_FRAME_FILENAMES = Array.from({ length: TOTAL_HERO2_FRAMES }, (_, i) => {
  const num = String(i).padStart(5, '0');
  return `frame_${num}`;
});

/**
 * Resolves the URL for a specific animation frame (0-indexed: 0 to 99)
 * Supports both /assets/animation/ and fallback /images/herosection2/
 * @param {number} index Frame index
 * @returns {string} Path to the image frame
 */
export function getHero2FrameUrl(index) {
  const safeIndex = Math.max(0, Math.min(index, TOTAL_HERO2_FRAMES - 1));
  const num = String(safeIndex).padStart(5, '0');
  return `/assets/animation/frame_${num}.jpg`;
}
