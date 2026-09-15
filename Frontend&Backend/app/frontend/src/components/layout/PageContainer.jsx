import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const PageContainer = ({
  children,
  className = '',
  maxWidth = 'max-w-7xl',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-transparent">
      {/* Main Page Content Container */}
      <motion.main
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 ${maxWidth} ${className}`}
      >
        {children}
      </motion.main>
    </div>
  );
};
