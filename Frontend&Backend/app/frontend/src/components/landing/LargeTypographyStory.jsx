import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Fingerprint, Eye, Activity } from 'lucide-react';

export const LargeTypographyStory = () => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll through this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Controlled horizontal typography translation with smooth spring
  const rawTextX = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -40]);
  const smoothTextX = useSpring(rawTextX, {
    stiffness: 100,
    damping: 24,
    mass: 0.2,
  });
  const textOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);

  const statementLines = [
    'SignalScope examines the high-frequency residuals',
    'and spatial patch inconsistencies invisible to human vision.',
    'Every generative model leaves an indelible forensic fingerprint.',
  ];

  return (
    <section
      ref={containerRef}
      className="relative py-28 sm:py-36 overflow-hidden border-y border-[#A9DEC8]/30 dark:border-[#1B6348]/30 bg-[#EEF5F0]/35 dark:bg-[#091B14]/35 backdrop-blur-xs"
    >
      {/* Background forensic ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-emerald-500/10 via-[#21C58A]/8 to-transparent blur-[110px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Premise Pill */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#8DE8C5] shadow-xs">
            <Fingerprint className="w-3.5 h-3.5 text-[#12A879] dark:text-[#21C58A]" />
            <span>01 / FORENSIC PREMISE</span>
          </div>
        </div>

        {/* Large Controlled Scroll-Driven Headline (Section 4) */}
        <div className="overflow-hidden py-4 text-center select-none">
          <motion.div
            style={{
              x: prefersReducedMotion ? 0 : smoothTextX,
              opacity: prefersReducedMotion ? 1 : textOpacity,
              willChange: 'transform, opacity',
            }}
            className="will-change-transform"
          >
            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#0B2B1F] dark:text-[#E7F5EE] font-sans uppercase leading-none whitespace-nowrap">
              EVERY IMAGE <br className="sm:hidden" />
              <span className="text-[#12A879] dark:text-[#21C58A]">LEAVES A SIGNAL.</span>
            </h2>
          </motion.div>
        </div>

        {/* Split-Text Progressive Statement Reveal (Section 5) */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto text-center space-y-3">
          {statementLines.map((line, index) => (
            <div key={index} className="overflow-hidden">
              <motion.p
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.11, // 110ms line stagger
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`text-base sm:text-xl lg:text-2xl font-medium tracking-tight ${
                  index === 0
                    ? 'text-[#0B2B1F] dark:text-[#E7F5EE]'
                    : index === 1
                    ? 'text-[#3D5C49] dark:text-[#A8C7B8]'
                    : 'text-[#12A879] dark:text-[#21C58A] font-semibold text-sm sm:text-base pt-2'
                }`}
              >
                {line}
              </motion.p>
            </div>
          ))}
        </div>

        {/* Supporting Analytical Indicators */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 border-t border-[#A9DEC8]/40 dark:border-[#1B6348]/40">
          <div className="flex items-center justify-center gap-2.5 text-xs font-mono text-[#49665A] dark:text-[#A8C7B8]">
            <Eye className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" />
            <span>Spatial Patch Discrepancy</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 text-xs font-mono text-[#49665A] dark:text-[#A8C7B8]">
            <Activity className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" />
            <span>2D-FFT Power Spectrum</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 text-xs font-mono text-[#49665A] dark:text-[#A8C7B8]">
            <Fingerprint className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" />
            <span>Calibrated Likelihood</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LargeTypographyStory;
