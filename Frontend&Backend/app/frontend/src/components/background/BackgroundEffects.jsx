import React, { useEffect, useRef } from 'react';
import { StarField } from './StarField';
import { MouseGlow } from './MouseGlow';

/**
 * Global dedicated fixed background container:
 * position: fixed; inset: 0; pointer-events: none; z-index: 0;
 */
export const BackgroundEffects = () => {
  const glowTopRef = useRef(null);
  const glowMidRef = useRef(null);
  const glowBottomRef = useRef(null);
  const gridRef = useRef(null);
  const starsRef = useRef(null);

  useEffect(() => {
    // Disable if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Disable on mobile / touch-first devices to preserve clean UX
    const isMobileDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    if (isMobileDevice) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;
    let lastTime = performance.now();

    // Responsive scaling: Desktop = 1.0, Tablet = 0.5, Mobile = 0
    const getScale = () => {
      if (window.innerWidth < 768) return 0;
      if (window.innerWidth < 1024) return 0.5;
      return 1.0;
    };

    const updateParallax = (now) => {
      // Delta-time based smooth exponential easing (frame-rate independent)
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const lerpFactor = 1 - Math.exp(-5.5 * dt);
      currentX += (targetX - currentX) * lerpFactor;
      currentY += (targetY - currentY) * lerpFactor;

      const scale = getScale();

      // Layer 1: Background grid — maximum movement: 2–4px
      const gridX = currentX * 3.5 * scale;
      const gridY = currentY * 2.2 * scale;

      // Layer 2: Soft green ambient glow — maximum movement: 4–7px
      const glowX = currentX * 6.5 * scale;
      const glowY = currentY * 4.2 * scale;

      // Layer 3: Stars / particles / sparkles — maximum movement: 6–10px
      const starsX = currentX * 9.5 * scale;
      const starsY = currentY * 6.5 * scale;

      // Direct GPU transform updates via refs (silky smooth, zero DOM style invalidation)
      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${gridX.toFixed(2)}px, ${gridY.toFixed(2)}px, 0)`;
      }
      if (glowTopRef.current) {
        glowTopRef.current.style.transform = `translate3d(${glowX.toFixed(2)}px, ${glowY.toFixed(2)}px, 0)`;
      }
      if (glowMidRef.current) {
        glowMidRef.current.style.transform = `translate3d(${glowX.toFixed(2)}px, ${glowY.toFixed(2)}px, 0)`;
      }
      if (glowBottomRef.current) {
        glowBottomRef.current.style.transform = `translate3d(${glowX.toFixed(2)}px, ${glowY.toFixed(2)}px, 0)`;
      }
      if (starsRef.current) {
        starsRef.current.style.transform = `translate3d(${starsX.toFixed(2)}px, ${starsY.toFixed(2)}px, 0)`;
      }

      // Continue animating until settled at target (or back at 0, 0)
      const delta = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
      if (delta > 0.0005 || targetX !== 0 || targetY !== 0) {
        rafId = requestAnimationFrame(updateParallax);
      } else {
        // Idle at exact rest
        currentX = 0;
        currentY = 0;
        if (gridRef.current) gridRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        if (glowTopRef.current) glowTopRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        if (glowMidRef.current) glowMidRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        if (glowBottomRef.current) glowBottomRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        if (starsRef.current) starsRef.current.style.transform = 'translate3d(0px, 0px, 0)';
        rafId = null;
      }
    };

    const startLoop = () => {
      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    const handleMouseMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 0 || h <= 0) return;

      // Normalize mouse coordinates relative to viewport: -1 to +1 (center = 0, 0)
      const rawX = (e.clientX / w) * 2 - 1;
      const rawY = (e.clientY / h) * 2 - 1;

      targetX = Math.max(-1, Math.min(1, rawX));
      targetY = Math.max(-1, Math.min(1, rawY));

      startLoop();
    };

    // When cursor leaves the browser window, smoothly glide back to initial origin (0, 0)
    const handleMouseLeave = (e) => {
      if (!e || !e.relatedTarget) {
        targetX = 0;
        targetY = 0;
        startLoop();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('blur', () => {
      targetX = 0;
      targetY = 0;
      startLoop();
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-50"
      style={{ zIndex: -50 }}
      aria-hidden="true"
    >
      {/* Layer 0: Celestial Base */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          backgroundColor: '#F4F8F5',
          backgroundImage:
            'radial-gradient(ellipse 110% 85% at 50% -5%, #DDF5EA 0%, #EEF5F0 38%, #F4F8F5 75%)',
        }}
      />

      {/* Layer 1: Atmospheric Nebula behind hero */}
      <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] pointer-events-none">
        <div
          ref={glowTopRef}
          className="w-full h-full rounded-full animate-ambient-drift"
          style={{
            background:
              'radial-gradient(circle at 50% 36%, rgba(169, 222, 200, 0.40) 0%, rgba(221, 245, 234, 0.25) 30%, rgba(238, 245, 240, 0.12) 55%, transparent 75%)',
            filter: 'blur(80px)',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Secondary Atmosphere around mid-page */}
      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[950px] h-[580px] pointer-events-none">
        <div
          ref={glowMidRef}
          className="w-full h-full rounded-full animate-ambient-drift"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(169, 222, 200, 0.25) 0%, rgba(221, 245, 234, 0.12) 42%, transparent 70%)',
            filter: 'blur(80px)',
            willChange: 'transform',
            animationDelay: '-8s',
            animationDuration: '26s',
          }}
        />
      </div>

      {/* Lower Mid-page Atmospheric Horizon Glow */}
      <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none">
        <div
          ref={glowBottomRef}
          className="w-full h-full rounded-full animate-ambient-drift"
          style={{
            background:
              'radial-gradient(ellipse at 50% 65%, rgba(169, 222, 200, 0.28) 0%, rgba(221, 245, 234, 0.15) 45%, transparent 75%)',
            filter: 'blur(80px)',
            willChange: 'transform',
            animationDelay: '-14s',
            animationDuration: '29s',
          }}
        />
      </div>

      {/* Layer 2: Technical Grid & Forensic Dot Matrix Texture with silky smooth parallax */}
      <div
        ref={gridRef}
        className="absolute -inset-6 bg-stellar-grid bg-stellar-dots opacity-80 pointer-events-none"
        style={{
          transform: 'translate3d(0px, 0px, 0)',
          willChange: 'transform',
        }}
      />

      {/* Layer 3: Animated Star Field (continuous organic drift with silky smooth parallax) */}
      <div
        ref={starsRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: 'translate3d(0px, 0px, 0)',
          willChange: 'transform',
        }}
      >
        <StarField />
      </div>

      {/* Layer 4: Mouse-reactive atmospheric glow (soft emerald/mint, smooth lerp) */}
      <MouseGlow />
    </div>
  );
};
