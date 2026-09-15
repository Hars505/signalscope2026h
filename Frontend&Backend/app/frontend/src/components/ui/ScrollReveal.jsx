import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Section Transition System (Section 13):
 * 3 distinct reveal types:
 * - 'standard': opacity 0 -> 1, translateY 24px -> 0
 * - 'slide': opacity 0 -> 1, translateX 30px -> 0
 * - 'scale': opacity 0 -> 1, scale 0.97 -> 1
 */
export const ScrollReveal = ({
  children,
  className = '',
  variant = 'standard',
  direction = 'right',
  delay = 0,
  yOffset = 24,
  duration = 0.65,
  once = true,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  let initialStyle = { opacity: 0, y: yOffset };
  let animateTarget = { opacity: 1, y: 0 };

  if (variant === 'slide') {
    const xDist = direction === 'left' ? -30 : 30;
    initialStyle = { opacity: 0, x: xDist, y: 0 };
    animateTarget = { opacity: 1, x: 0, y: 0 };
  } else if (variant === 'scale') {
    initialStyle = { opacity: 0, scale: 0.97, y: 0 };
    animateTarget = { opacity: 1, scale: 1, y: 0 };
  }

  return (
    <motion.div
      initial={initialStyle}
      whileInView={animateTarget}
      viewport={{ once, margin: '-40px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ willChange: 'transform, opacity', ...(props.style || {}) }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
