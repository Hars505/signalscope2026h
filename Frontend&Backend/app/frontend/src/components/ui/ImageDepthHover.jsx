import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Reusable ImageDepthHover component:
 * Adds tactile depth parallax to image containers on hover.
 * Cursor position translates image content slightly (±4px) with subtle scale (1 -> 1.022).
 * Smoothly interpolates and returns to center on leave. Zero layout shift.
 */
export const ImageDepthHover = ({
  children,
  className = '',
  maxOffset = 4,
  hoverScale = 1.022,
}) => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0, scale: 1 });

  const handleMouseMove = useCallback(
    (e) => {
      if (prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Normalized coordinates from -1 to 1 (0,0 is center)
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const clampedX = Math.max(-1, Math.min(1, normX));
      const clampedY = Math.max(-1, Math.min(1, normY));

      setOffset({
        x: clampedX * maxOffset,
        y: clampedY * maxOffset,
        scale: hoverScale,
      });
    },
    [maxOffset, hoverScale, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0, scale: 1 });
  }, []);

  if (prefersReducedMotion) {
    return <div className={`relative overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        animate={{
          x: offset.x,
          y: offset.y,
          scale: offset.scale,
        }}
        transition={{
          type: 'spring',
          damping: 24,
          stiffness: 220,
          mass: 0.6,
        }}
        className="w-full h-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ImageDepthHover;
