import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { PipelineVisualizer } from './PipelineVisualizer';
import { TechMarquee } from './TechMarquee';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Scroll-linked transformation (Section 3)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Smooth scroll transformations with spring physics
  const rawHeadlineScale = useTransform(scrollYProgress, [0, 0.35, 0.8], [1, 0.96, 0.92]);
  const rawContentOpacity = useTransform(scrollYProgress, [0, 0.3, 0.75], [1, 0.85, 0]);
  const rawContentY = useTransform(scrollYProgress, [0, 0.35, 0.8], [0, -16, -55]);
  const rawBgGlowParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const headlineScale = useSpring(rawHeadlineScale, { stiffness: 120, damping: 24, mass: 0.2 });
  const contentOpacity = useSpring(rawContentOpacity, { stiffness: 120, damping: 24, mass: 0.2 });
  const contentY = useSpring(rawContentY, { stiffness: 120, damping: 24, mass: 0.2 });
  const bgGlowParallax = useSpring(rawBgGlowParallax, { stiffness: 100, damping: 24, mass: 0.2 });

  return (
    <section ref={heroRef} className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
      {/* Large Atmospheric Mint Radial Glow with pure GPU-accelerated parallax */}
      <motion.div
        className="absolute top-1/4 left-1/2 w-[950px] h-[480px] bg-gradient-to-t from-emerald-400/15 via-green-300/10 dark:from-emerald-500/20 dark:via-emerald-400/10 to-transparent blur-[90px] rounded-full pointer-events-none -z-10"
        style={{
          x: '-50%',
          y: prefersReducedMotion ? 0 : bgGlowParallax,
          willChange: 'transform',
        }}
      />

      <motion.div
        style={{
          scale: prefersReducedMotion ? 1 : headlineScale,
          opacity: prefersReducedMotion ? 1 : contentOpacity,
          y: prefersReducedMotion ? 0 : contentY,
          willChange: 'transform, opacity',
        }}
        className="max-w-4xl mx-auto text-center px-4 sm:px-6 relative z-10 will-change-transform"
      >
        {/* Eyebrow Badge: floating glass pill (0ms) */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-xs font-semibold text-[#0B2B1F] dark:text-[#8DE8C5] mb-8 shadow-xs backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#12A879] dark:text-[#21C58A] animate-pulse" />
          <span>Calibrated AI Image Authenticity Engine</span>
          <ArrowRight className="w-3 h-3 text-[#12A879] dark:text-[#21C58A] ml-0.5" />
        </motion.div>

        {/* Large Headline matching reference (100ms) */}
        <motion.h1
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-[#0B2B1F] dark:text-[#E7F5EE] mb-8 font-sans leading-[1.08]"
        >
          See beyond <br />
          <span className="text-[#0B2B1F] dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-[#21C58A] dark:to-[#8DE8C5]">
            the pixels.
          </span>
        </motion.h1>

        {/* Short Description (200ms) */}
        <motion.p
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-[#49665A] dark:text-[#A8C7B8] max-w-2xl mx-auto mb-12 leading-relaxed font-normal"
        >
          SignalScope uses spatial and frequency-domain signals to assess whether an image is real or AI-generated.
        </motion.p>

        {/* Primary (300ms) and Secondary CTA (360ms) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              onClick={() => navigate('/analyze')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto text-base px-8 py-4 bg-[#12A879] hover:bg-[#0D9168] dark:bg-[#21C58A] dark:hover:bg-[#36D99B] text-white dark:text-[#06130E] dark:font-bold shadow-[0_10px_25px_-5px_rgba(18,168,121,0.45)] dark:shadow-[0_0_30px_rgba(33,197,138,0.4)] border border-[#A9DEC8]/50 dark:border-[#8DE8C5]/30 font-semibold"
            >
              Analyze an Image
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/about')}
              leftIcon={<Compass className="w-5 h-5 text-[#49665A] dark:text-[#A8C7B8]" />}
              className="w-full sm:w-auto text-base px-7 py-4"
            >
              Explore the Technology
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Hero ML Pipeline Visualizer with generous margin and translucent cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 mb-20">
        <PipelineVisualizer />
      </div>

      {/* Continuous Marquee Ticker */}
      <div className="relative z-10">
        <TechMarquee />
      </div>
    </section>
  );
};
