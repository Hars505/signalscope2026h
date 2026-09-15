import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Shield, Sparkles, Cpu, Eye, CheckCircle, ArrowRight } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

export const HorizontalPipelineSection = () => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth organic spring interpolation for horizontal physics (using numeric values)
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -55]);
  const smoothX = useSpring(rawX, {
    stiffness: 120,
    damping: 24,
    mass: 0.2,
  });
  const xTransform = useTransform(smoothX, (val) => `${val}%`);

  const panels = [
    {
      id: '01',
      title: 'Spatial Patch Attention',
      category: 'STAGE 01 / VI-TRANSFORMER',
      description:
        'Analyzes 16×16 spatial patch representations to detect inconsistent textures, abnormal edge boundaries, and local synthetic distortions that typical CNNs miss.',
      metricLabel: 'Tokens Evaluated',
      metricValue: '196 patches',
      submetric: 'Spatial consistency: 98.4%',
      badge: 'ViT-B/16 Backbone',
    },
    {
      id: '02',
      title: 'Spectral Frequency Residuals',
      category: 'STAGE 02 / 2D-FFT ANALYSIS',
      description:
        'Converts 2D spatial pixel arrays into frequency-domain energy distributions. Generative upsampling algorithms leave distinct periodic frequency artifacts.',
      metricLabel: 'Radial Energy Peak',
      metricValue: '+34.2 dB',
      submetric: 'Azimuthal symmetry delta: 0.18',
      badge: 'Fourier Transform',
    },
    {
      id: '03',
      title: 'Empirical Temperature Calibration',
      category: 'STAGE 03 / CALIBRATION',
      description:
        'Standard deep neural networks produce overconfident probabilities. SignalScope calibrates raw softmax logits using empirical Platt scaling for truthful verdicts.',
      metricLabel: 'Decision Threshold',
      metricValue: 'τ = 0.50',
      submetric: 'ECE (Expected Calibration Error): < 0.03',
      badge: 'Platt Scaling',
    },
    {
      id: '04',
      title: 'Human-Grounded Explainability',
      category: 'STAGE 04 / EXPLAINABILITY',
      description:
        'Synthesizes Grad-CAM spatial activation maps into readable, grounded forensic cues. Identifies specific suspect regions instead of opaque black-box verdicts.',
      metricLabel: 'Explainability Fidelity',
      metricValue: '100% Grounded',
      submetric: 'Grad-CAM Heatmap overlay enabled',
      badge: 'Grad-CAM + Attribution',
    },
  ];

  // If on mobile or user prefers reduced motion, render clean vertical cards stack
  if (isMobile || prefersReducedMotion) {
    return (
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#8DE8C5] mb-4 shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-[#12A879] dark:text-[#21C58A]" />
            <span>03 / INVESTIGATION PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight font-sans">
            Forensic Architecture in Motion
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {panels.map((panel, idx) => (
            <SpotlightCard
              key={panel.id}
              className="p-7 border-[#A9DEC8]/50 dark:border-[#1B6348]/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#12A879] dark:text-[#21C58A]">
                  {panel.category}
                </span>
                <span className="text-2xl font-extrabold font-mono text-[#71867C]/40">
                  {panel.id}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0B2B1F] dark:text-[#E7F5EE]">
                {panel.title}
              </h3>
              <p className="text-sm text-[#49665A] dark:text-[#A8C7B8] leading-relaxed">
                {panel.description}
              </p>
              <div className="pt-3 border-t border-[#A9DEC8]/30 dark:border-[#1B6348]/30 flex justify-between items-center text-xs font-mono">
                <span className="text-[#71867C] dark:text-[#769789]">{panel.metricLabel}</span>
                <span className="font-bold text-[#0B2B1F] dark:text-[#E7F5EE]">{panel.metricValue}</span>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>
    );
  }

  // Desktop horizontal scroll pipeline
  return (
    <section ref={containerRef} className="relative min-h-[260vh] py-12">
      {/* Sticky Full-Viewport Container */}
      <div className="sticky top-20 h-[80vh] flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#8DE8C5] mb-3 shadow-xs">
                <Cpu className="w-3.5 h-3.5 text-[#12A879] dark:text-[#21C58A]" />
                <span>03 / INVESTIGATION PIPELINE</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight font-sans">
                Forensic Architecture in Motion
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#71867C] dark:text-[#769789]">
              <span>SCROLL TO ADVANCE PIPELINE</span>
              <ArrowRight className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" />
            </div>
          </div>
        </div>

        {/* Horizontally Translated Panels Track */}
        <div className="w-full overflow-hidden pl-4 sm:pl-8 lg:pl-16">
          <motion.div
            style={{ x: xTransform, willChange: 'transform' }}
            className="flex gap-8 w-max will-change-transform pr-16"
          >
            {panels.map((panel) => (
              <div
                key={panel.id}
                className="w-[360px] sm:w-[420px] lg:w-[460px] shrink-0"
              >
                <SpotlightCard className="p-8 h-full flex flex-col justify-between border-[#A9DEC8]/60 dark:border-[#1B6348]/60 bg-white dark:bg-[#0B241A] shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#12A879] dark:text-[#21C58A] tracking-wider uppercase">
                        {panel.category}
                      </span>
                      <span className="text-3xl font-extrabold font-mono text-[#71867C]/30 dark:text-[#769789]/30">
                        {panel.id}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">
                      {panel.title}
                    </h3>

                    <p className="text-sm text-[#49665A] dark:text-[#A8C7B8] leading-relaxed">
                      {panel.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-[#A9DEC8]/40 dark:border-[#1B6348]/40 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-[#71867C] dark:text-[#769789]">
                        {panel.metricLabel}
                      </span>
                      <span className="font-bold text-[#0B2B1F] dark:text-[#E7F5EE]">
                        {panel.metricValue}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#12A879] dark:text-[#21C58A]">
                      {panel.submetric}
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalPipelineSection;
