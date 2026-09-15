import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

          setIsVisible(scrollY > 280);

          if (scrollHeight > 0) {
            const progress = Math.min(Math.max((scrollY / scrollHeight) * 100, 0), 100);
            setScrollProgress(progress);
          } else {
            setScrollProgress(0);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SVG circle calculations for progress ring
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 24 }}
          transition={{ type: 'spring', stiffness: 350, damping: 24 }}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50"
        >
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/90 dark:bg-[#0E2D21] backdrop-blur-xl border border-[#A9DEC8] dark:border-[#1B6348] shadow-[0_6px_24px_rgba(18,168,121,0.22)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.7)] hover:shadow-[0_0_30px_rgba(33,197,138,0.45)] hover:border-[#12A879] dark:hover:border-[#21C58A] hover:-translate-y-1 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#12A879]/50"
          >
            {/* SVG Radial Progress Indicator */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
              viewBox="0 0 48 48"
            >
              {/* Background Track Ring */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-[#12A879]/20 dark:text-[#21C58A]/20"
              />
              {/* Dynamic Animated Progress Ring */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-[#12A879] dark:text-[#21C58A] transition-[stroke-dashoffset] duration-100 ease-out"
              />
            </svg>

            {/* Glowing Center Pulse */}
            <div className="absolute inset-2 rounded-full bg-emerald-500/10 dark:bg-[#21C58A]/15 group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />

            {/* Centered Arrow Icon with smooth hover float */}
            <ArrowUp className="w-5 h-5 text-[#0B2B1F] dark:text-[#21C58A] group-hover:text-[#12A879] dark:group-hover:text-[#8DE8C5] group-hover:-translate-y-0.5 transition-all duration-200 relative z-10" />

            {/* Tooltip on hover */}
            <span className="absolute -top-9 px-2.5 py-1 rounded-md bg-[#0B2B1F] dark:bg-[#0E2D21] text-white dark:text-[#E7F5EE] text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-md border border-[#A9DEC8]/40 dark:border-[#1B6348]">
              Back to Top
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
