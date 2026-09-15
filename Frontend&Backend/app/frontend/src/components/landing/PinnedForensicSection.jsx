import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  ShieldCheck,
  Grid,
  Activity,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

export const PinnedForensicSection = () => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Steps definition for the forensic investigation flow
  const steps = [
    {
      num: '01',
      title: 'Original Image Ingestion',
      category: 'RAW TELEMETRY',
      tagline: 'Standardizing spatial pixel geometry & metadata',
      desc: 'The input image is ingested, stripped of adversarial metadata artifacts, and normalized to 224×224 resolution across standard sRGB color space.',
      icon: <Layers className="w-5 h-5" />,
      accent: '#12A879',
    },
    {
      num: '02',
      title: 'Spatial Patch Attention',
      category: 'VISION TRANSFORMER',
      tagline: 'Decomposing 16×16 patch consistency',
      desc: 'ViT-B/16 extracts spatial self-attention maps across 196 image tokens, identifying unnatural local textures, warping, and boundary blending artifacts.',
      icon: <Grid className="w-5 h-5" />,
      accent: '#21C58A',
    },
    {
      num: '03',
      title: 'Frequency-Domain Signal',
      category: '2D-FFT SPECTRAL ANALYSIS',
      tagline: 'Measuring high-frequency power residuals',
      desc: 'Fast Fourier Transform decomposes image energy into radial frequency spectra. Upsampling artifacts in diffusion and GAN architectures leave distinct grid-line anomalies.',
      icon: <Activity className="w-5 h-5" />,
      accent: '#36D99B',
    },
    {
      num: '04',
      title: 'Calibrated Probability',
      category: 'UNCERTAINTY ESTIMATION',
      tagline: 'Temperature scaling for truthful confidence',
      desc: 'Softmax logits are calibrated via Platt scaling (τ = 0.50). Scores near the decision boundary are flagged as borderline to prevent false-positive overconfidence.',
      icon: <Gauge className="w-5 h-5" />,
      accent: '#F59E0B',
    },
    {
      num: '05',
      title: 'Explainable Forensic Verdict',
      category: 'GROUNDED VERIFICATION',
      tagline: 'Grad-CAM heatmaps & generator attribution',
      desc: 'SignalScope outputs a calibrated verdict ("Likely AI-Generated" or "Likely Real"), highlighted with visual attention heatmaps and grounded forensic evidence.',
      icon: <ShieldCheck className="w-5 h-5" />,
      accent: '#12A879',
    },
  ];

  const activeStepRef = useRef(0);

  // Update active step index only when changed based on scroll progress (0.0 to 1.0)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      const idx = Math.min(Math.floor(v * steps.length), steps.length - 1);
      if (idx !== activeStepRef.current) {
        activeStepRef.current = idx;
        setActiveStepIndex(idx);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, steps.length]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[140vh] md:min-h-[260vh] py-16 sm:py-24"
    >
      {/* Sticky Viewport Container on Desktop */}
      <div className="md:sticky md:top-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* LEFT COLUMN: Editorial Statement & Dynamic Step Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#8DE8C5] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#12A879] dark:text-[#21C58A]" />
              <span>02 / FORENSIC DECOMPOSITION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight font-sans leading-[1.12]">
              Evidence unfolds <br />
              <span className="text-[#12A879] dark:text-[#21C58A]">
                as you investigate.
              </span>
            </h2>

            {/* Active Step Progress Indicator (Section 16) */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                {steps.map((s, i) => {
                  const isActive = activeStepIndex === i;
                  return (
                    <button
                      key={s.num}
                      onClick={() => setActiveStepIndex(i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-300 ${
                        isActive
                          ? 'bg-[#12A879] text-white dark:bg-[#21C58A] dark:text-[#06130E] font-bold shadow-xs scale-105'
                          : 'bg-[#EEF5F0] dark:bg-[#0E2D21] text-[#71867C] dark:text-[#769789] hover:text-[#0B2B1F] dark:hover:text-[#E7F5EE]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white dark:bg-[#06130E]' : 'bg-current'}`} />
                      <span>{s.num}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Narrative Card */}
              <motion.div
                key={activeStepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: 'transform, opacity' }}
                className="p-6 rounded-2xl bg-white dark:bg-[#0B241A] border border-[#A9DEC8]/70 dark:border-[#1B6348]/70 shadow-lg space-y-3 will-change-transform relative z-10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#12A879] dark:text-[#21C58A] font-bold">
                    {steps[activeStepIndex].category}
                  </span>
                  <span className="text-xs font-mono text-[#71867C] dark:text-[#769789]">
                    STAGE {steps[activeStepIndex].num} / 05
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">
                  {steps[activeStepIndex].title}
                </h3>

                <p className="text-xs font-mono text-[#49665A] dark:text-[#A8C7B8] font-medium">
                  {steps[activeStepIndex].tagline}
                </p>

                <p className="text-sm text-[#49665A] dark:text-[#A8C7B8] leading-relaxed pt-1">
                  {steps[activeStepIndex].desc}
                </p>
              </motion.div>
            </div>
          </div>

          {/* RIGHT COLUMN: Dynamic Forensic Visualization Display (Section 7) */}
          <div className="lg:col-span-7">
            <SpotlightCard className="p-6 sm:p-8 border-[#A9DEC8]/60 dark:border-[#1B6348]/60 shadow-2xl relative z-10 overflow-hidden bg-white dark:bg-[#0B241A]">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#A9DEC8]/40 dark:border-[#1B6348]/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#12A879] dark:bg-[#21C58A] animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#E7F5EE]">
                    LIVE FORENSIC RENDER
                  </span>
                </div>
                <span className="text-xs font-mono text-[#71867C] dark:text-[#769789]">
                  MODE: INTERACTIVE DEEP SCAN
                </span>
              </div>

              {/* Central Graphic Transformation Canvas */}
              <div className="relative aspect-4/3 sm:aspect-16/10 rounded-xl overflow-hidden bg-[#EEF5F0] dark:bg-[#071912] border border-[#A9DEC8]/50 dark:border-[#1B6348]/50 flex items-center justify-center p-6">
                
                {/* Visual State 1: Ingestion / Normal Image */}
                {activeStepIndex === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-4"
                  >
                    <div className="relative w-48 h-40 rounded-lg border-2 border-dashed border-[#12A879]/50 flex items-center justify-center bg-white/60 dark:bg-[#0E2D21]/60 shadow-inner">
                      <Layers className="w-12 h-12 text-[#12A879] dark:text-[#21C58A] opacity-80" />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#12A879] text-white">
                        RAW RGB
                      </div>
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0B2B1F] text-[#8DE8C5]">
                        224×224 px
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#E7F5EE]">
                        Input Normalization Complete
                      </div>
                      <div className="text-[11px] font-mono text-[#71867C] dark:text-[#769789]">
                        SHA-256 fingerprint verified · Color channel balance: calibrated
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Visual State 2: Spatial ViT-B/16 Patch Analysis */}
                {activeStepIndex === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex flex-col items-center justify-center p-4 space-y-3"
                  >
                    {/* Simulated 14x14 ViT Patch Grid */}
                    <div className="relative grid grid-cols-7 gap-1.5 p-3 rounded-lg bg-black/5 dark:bg-black/40 border border-[#12A879]/30">
                      {Array.from({ length: 28 }).map((_, i) => {
                        const isAnomalous = [5, 11, 12, 18, 19, 23].includes(i);
                        return (
                          <div
                            key={i}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xs border transition-all duration-300 flex items-center justify-center ${
                              isAnomalous
                                ? 'border-rose-500 bg-rose-500/25 dark:bg-rose-500/35 animate-pulse text-rose-500 text-[9px] font-mono font-bold'
                                : 'border-[#12A879]/30 bg-[#12A879]/10 dark:bg-[#12A879]/20'
                            }`}
                          >
                            {isAnomalous && '!'}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        Patch Variance Spike (6 tokens)
                      </span>
                      <span className="text-[#71867C] dark:text-[#769789]">
                        196 / 196 Tokens Scanned
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Visual State 3: 2D-FFT Frequency Spectrum */}
                {activeStepIndex === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4"
                  >
                    <div className="relative w-44 h-44 rounded-full border-2 border-[#12A879]/40 flex items-center justify-center bg-black/10 dark:bg-black/50">
                      {/* Concentric rings representing Fourier frequency bands */}
                      <div className="absolute w-32 h-32 rounded-full border border-dashed border-[#12A879]/50 animate-spin" style={{ animationDuration: '24s' }} />
                      <div className="absolute w-20 h-20 rounded-full border border-[#21C58A]/60" />
                      <div className="absolute w-8 h-8 rounded-full bg-[#12A879]/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#12A879] dark:bg-[#21C58A]" />
                      </div>
                      {/* High-frequency spike markers */}
                      <div className="absolute top-3 right-6 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <div className="absolute bottom-4 left-6 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#E7F5EE]">
                        High-Frequency Grid Artifacts Identified
                      </div>
                      <div className="text-[11px] font-mono text-[#49665A] dark:text-[#A8C7B8]">
                        Azimuthal power anomaly: +34.2 dB in upper quadrant
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Visual State 4: Calibrated Probability Meter */}
                {activeStepIndex === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex flex-col items-center justify-center p-6 space-y-5"
                  >
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#49665A] dark:text-[#A8C7B8]">Likelihood Score</span>
                        <span className="font-bold text-[#12A879] dark:text-[#21C58A]">88.5%</span>
                      </div>
                      <div className="w-full h-3.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '88.5%' }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-rose-500 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#71867C] dark:text-[#769789]">
                        <span>Real (0.0)</span>
                        <span className="font-bold text-[#0B2B1F] dark:text-[#E7F5EE]">τ = 0.50</span>
                        <span>Synthetic (1.0)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-[11px] font-mono text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Temperature scaled: Raw 94.2% → Calibrated 88.5%</span>
                    </div>
                  </motion.div>
                )}

                {/* Visual State 5: Final Grounded Verdict */}
                {activeStepIndex === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold text-sm shadow-md">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Likely AI-Generated (88.5%)</span>
                    </div>

                    <div className="text-center space-y-2 max-w-sm">
                      <div className="text-xs font-mono font-semibold text-[#0B2B1F] dark:text-[#E7F5EE]">
                        Attribution: Latent Diffusion Family
                      </div>
                      <p className="text-[11px] text-[#49665A] dark:text-[#A8C7B8] leading-relaxed">
                        Cross-attention spatial patches and high-frequency spectral residuals corroborate synthetic generator artifacts.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-800 dark:text-[#8DE8C5] bg-[#DDF5EA] dark:bg-[#103A2A] px-3 py-1 rounded-full border border-[#A9DEC8] dark:border-[#1B6348]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Audit Trail Authenticated</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sub-footer Telemetry Stats */}
              <div className="mt-5 pt-4 border-t border-[#A9DEC8]/30 dark:border-[#1B6348]/30 flex flex-wrap items-center justify-between text-xs font-mono text-[#71867C] dark:text-[#769789]">
                <div className="flex items-center gap-3">
                  <span>LATENCY: 420ms</span>
                  <span>CONFIDENCE BOUND: ±2.8%</span>
                </div>
                <div className="text-[#12A879] dark:text-[#21C58A] font-semibold">
                  SCROLL PROGRESS: {Math.round((activeStepIndex + 1) * 20)}%
                </div>
              </div>
            </SpotlightCard>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PinnedForensicSection;
