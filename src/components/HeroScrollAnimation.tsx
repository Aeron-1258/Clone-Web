import React, { useEffect, useRef, useState, useCallback } from 'react';

interface HeroScrollAnimationProps {
  totalFrames?: number;
  folderPath?: string;
  scrollTrackHeight?: string;
  className?: string;
  onFirstFrameReady?: () => void;
}

export const HeroScrollAnimation: React.FC<HeroScrollAnimationProps> = ({
  totalFrames = 111,
  folderPath = '/images/hero-section-2/',
  scrollTrackHeight = '300vh',
  className = '',
  onFirstFrameReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(totalFrames).fill(null));
  const renderedIndexRef = useRef<number>(-1);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Source aspect ratio (848x478)
  const SOURCE_WIDTH = 848;
  const SOURCE_HEIGHT = 478;
  const SOURCE_ASPECT = SOURCE_WIDTH / SOURCE_HEIGHT;

  const getFrameUrl = useCallback(
    (index: number) => {
      const num = String(index + 1).padStart(3, '0');
      return `${folderPath}ezgif-frame-${num}.webp`;
    },
    [folderPath]
  );

  const getFallbackFrameUrl = useCallback(
    (index: number) => {
      const num = String(index + 1).padStart(3, '0');
      return `${folderPath}ezgif-frame-${num}.png`;
    },
    [folderPath]
  );

  // Preload all frames
  useEffect(() => {
    let isMounted = true;
    const frames = framesRef.current;

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.decoding = 'async';

      img.onload = () => {
        if (!isMounted) return;
        if (i === 0) {
          setIsLoading(false);
          onFirstFrameReady?.();
          drawFrame(0);
        }
      };

      img.onerror = () => {
        // Fallback to PNG if WebP fails
        img.src = getFallbackFrameUrl(i);
      };

      if (i < 15) {
        img.src = getFrameUrl(i);
      } else {
        setTimeout(() => {
          if (isMounted) img.src = getFrameUrl(i);
        }, 20 + (i - 15) * 8);
      }

      frames[i] = img;
    }

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [totalFrames, getFrameUrl, getFallbackFrameUrl, onFirstFrameReady]);

  // Canvas drawing with object-fit: cover
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const img = framesRef.current[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const w = canvas.width;
      const h = canvas.height;

      // Aspect-ratio preserving calculations (contain within canvas)
      const canvasAspect = w / h;
      let drawW: number, drawH: number;

      if (canvasAspect > SOURCE_ASPECT) {
        drawH = h;
        drawW = h * SOURCE_ASPECT;
      } else {
        drawW = w;
        drawH = w / SOURCE_ASPECT;
      }

      const drawX = Math.round((w - drawW) / 2);
      const drawY = Math.round((h - drawH) / 2);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      renderedIndexRef.current = frameIndex;
    },
    [SOURCE_ASPECT]
  );

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stage = canvas.parentElement || canvas;
    const rect = stage.getBoundingClientRect();
    const displayW = Math.round(rect.width) || Math.round(window.innerWidth * 0.65);
    const displayH = Math.round(rect.height) || Math.round(displayW / SOURCE_ASPECT);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);

    const frameIdx = renderedIndexRef.current >= 0 ? renderedIndexRef.current : 0;
    drawFrame(frameIdx);
  }, [drawFrame, SOURCE_ASPECT]);

  // Scroll & Animation Loop (60 FPS with lerp)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      drawFrame(0);
      return;
    }

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalScroll = container.offsetHeight - windowH;

      if (totalScroll <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScroll));
      targetProgressRef.current = progress;

      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    const animate = () => {
      // Lerp for cinematic Apple-style smooth scrubbing
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) < 0.0005) {
        currentProgressRef.current = targetProgressRef.current;
      } else {
        currentProgressRef.current += diff * 0.25;
      }

      const frameIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(currentProgressRef.current * (totalFrames - 1)))
      );

      if (frameIndex !== renderedIndexRef.current) {
        drawFrame(frameIndex);
      }

      if (currentProgressRef.current !== targetProgressRef.current) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        animFrameIdRef.current = null;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [totalFrames, drawFrame, handleResize]);

  return (
    <div
      ref={containerRef}
      className={`hero-scroll-track ${className}`}
      style={{
        position: 'relative',
        width: '100vw',
        minWidth: '100vw',
        height: scrollTrackHeight,
        margin: 0,
        padding: 0,
        background: '#ffffff',
      }}
    >
      <div
        className="hero-sticky-frame"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          boxSizing: 'border-box',
          padding: '2.5rem 1.5rem',
        }}
      >
        <div
          className="hero-anim-stage"
          style={{
            position: 'relative',
            width: 'min(65vw, calc(65vh * 848 / 478), 980px)',
            aspectRatio: `${SOURCE_WIDTH} / ${SOURCE_HEIGHT}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 55px rgba(0, 50, 70, 0.12), 0 6px 18px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 153, 153, 0.12)',
            background: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Kochi Water Metro Cinematic Frame Scroll Animation"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'contain',
              pointerEvents: 'none',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          />

          {/* Graceful loading indicator */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                zIndex: 10,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '3px solid rgba(0, 153, 153, 0.2)',
                  borderTopColor: '#009999',
                  animation: 'heroSpin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes heroSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroScrollAnimation;
