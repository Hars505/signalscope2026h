import React, { useEffect, useRef } from 'react';

/**
 * MouseGlow: An elegant, subtle radial glow that smoothly follows the cursor.
 * - Soft mint/emerald light illuminating surrounding celestial space.
 * - Gentle lerp interpolation (no jitter, completely smooth).
 * - Hidden on touch devices.
 */
export const MouseGlow = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let animId = null;
    let isRunning = false;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;

    const animate = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      if (glowRef.current && currentX > -500) {
        glowRef.current.style.transform = `translate3d(${Math.round(currentX - 250)}px, ${Math.round(currentY - 250)}px, 0)`;
        glowRef.current.style.opacity = '1';
      } else if (glowRef.current) {
        glowRef.current.style.opacity = '0';
      }

      const diff = Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
      if (diff > 0.4) {
        animId = requestAnimationFrame(animate);
      } else {
        isRunning = false;
        animId = null;
      }
    };

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(animate);
      }
    };

    const onMouseLeave = () => {
      targetX = -1000;
      targetY = -1000;
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none -z-10 transition-opacity duration-300"
      style={{
        background:
          'radial-gradient(circle, rgba(18, 168, 121, 0.08) 0%, rgba(33, 197, 138, 0.03) 45%, transparent 70%)',
        filter: 'blur(60px)',
        opacity: 0,
        willChange: 'transform',
      }}
    />
  );
};
