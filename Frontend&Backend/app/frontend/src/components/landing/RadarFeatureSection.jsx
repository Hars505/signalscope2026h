import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Radio, Sliders, Zap } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ScrollReveal } from '../ui/ScrollReveal';

export const RadarFeatureSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      title: 'Spatial Vision Transformer',
      subtitle: 'ViT-B/16 Patch Self-Attention',
      desc: 'Divides images into 16×16 non-overlapping patches to identify non-local structural deformities, mismatched shadows, and unnatural boundary blending.',
      icon: <Cpu className="w-5 h-5" />,
      centerIcon: <Zap className="w-7 h-7 text-emerald-600" />,
      tag: 'ViT-B/16 Core',
      metric: '768-dim Patches',
    },
    {
      id: 1,
      title: '2D-FFT Spectral Decomposition',
      subtitle: 'Fourier High-Frequency Residuals',
      desc: 'Transforms 2D RGB data into frequency-domain power distributions. Detects the periodic high-frequency grid artifacts imprinted by generative latent upsampling.',
      icon: <Radio className="w-5 h-5" />,
      centerIcon: <Radio className="w-7 h-7 text-teal-600" />,
      tag: 'Spectral Analysis',
      metric: 'Azimuthal Power',
    },
    {
      id: 2,
      title: 'Temperature Scaling Calibration',
      subtitle: 'Empirically Tuned Probability',
      desc: 'Optimizes a post-hoc validation parameter T to rescale neural network logits, eliminating over-confidence and aligning prediction scores with true empirical accuracy.',
      icon: <Sliders className="w-5 h-5" />,
      centerIcon: <Sliders className="w-7 h-7 text-emerald-700" />,
      tag: 'Calibrated Scaling',
      metric: 'T = 1.42 Parameter',
    },
  ];

  const current = tabs[activeTab];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Switchable Tabs with ScrollReveal */}
          <ScrollReveal className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block">
              THE FORENSIC FIRST PLATFORM
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0D331E] dark:text-[#E7F5EE] tracking-tight font-sans leading-tight">
              Verify authenticity with multi-spectral intelligence
            </h2>

            <p className="text-[#3D5C49] dark:text-[#A8C7B8] text-sm sm:text-base leading-relaxed max-w-lg">
              Deconstruct images across spatial pixel structures and 2D frequency spectra to detect subtle synthetic fingerprints that bypass single-layer detectors.
            </p>

            {/* 3 Interactive Tab Buttons */}
            <div className="space-y-3 pt-4">
              {tabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.title}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full p-4 rounded-2xl text-left transition-all duration-300 flex items-center justify-between border ${
                      isActive
                        ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 shadow-[0_4px_20px_rgba(22,168,98,0.15)] text-[#0D331E] dark:text-[#E7F5EE]'
                        : 'border-[#16A34A]/15 dark:border-emerald-500/15 bg-white/70 dark:bg-[#071F14]/50 hover:bg-white dark:hover:bg-[#071F14]/80 text-[#3D5C49] dark:text-emerald-300/80 hover:text-[#0D331E] dark:hover:text-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#3D5C49] dark:text-emerald-400'
                        }`}
                      >
                        {tab.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
                          {tab.title}
                        </div>
                        <div className="text-xs text-[#3D5C49] dark:text-emerald-400/70 font-mono">
                          {tab.subtitle}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                        isActive
                          ? 'border-emerald-600/40 dark:border-emerald-400/50 text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70'
                          : 'border-[#16A34A]/15 dark:border-emerald-500/20 text-[#3D5C49] dark:text-emerald-400/70'
                      }`}
                    >
                      {tab.metric}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Right Column: Concentric Radar Animation with ScrollReveal */}
          <ScrollReveal delay={0.15} className="lg:col-span-6 flex items-center justify-center">
            <SpotlightCard className="p-8 sm:p-10 w-full max-w-lg border-[#16A34A]/20 dark:border-emerald-500/25 flex flex-col items-center justify-center">
              {/* Radar Target Background */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mx-auto">
                {/* Concentric Coordinate Rings in sage/emerald */}
                <div className="absolute inset-0 rounded-full border border-emerald-600/15 dark:border-emerald-500/20" />
                <div className="absolute inset-6 rounded-full border border-emerald-600/20 dark:border-emerald-500/25" />
                <div className="absolute inset-14 rounded-full border border-emerald-600/25 dark:border-emerald-500/30" />
                <div className="absolute inset-22 rounded-full border border-emerald-600/30 dark:border-emerald-500/35" />
                <div className="absolute inset-28 rounded-full border border-emerald-600/40 dark:border-emerald-500/45" />

                {/* Rotating Radar Sweep Line */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none animate-spin-slow will-change-transform">
                  <div className="w-1/2 h-1/2 bg-gradient-to-tr from-transparent via-emerald-500/20 to-lime-500/35 origin-bottom-right" />
                </div>

                {/* Subtle Grid Lines */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-600/20 dark:bg-emerald-500/25" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-600/20 dark:bg-emerald-500/25" />

                {/* Pulsing Concentric Ripple */}
                <motion.div
                  className="absolute inset-8 rounded-full border border-emerald-500/40 dark:border-emerald-400/50"
                  animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Central Floating Active Core Badge */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0, rotate: 15 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 w-20 h-20 rounded-2xl bg-white dark:bg-[#071F14] border-2 border-emerald-500 shadow-[0_0_30px_rgba(22,168,98,0.35)] flex items-center justify-center backdrop-blur-md"
                  >
                    {current.centerIcon}
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dynamic Description Below Radar */}
              <div className="text-center mt-6 max-w-sm mx-auto flex flex-col items-center justify-center">
                <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400 font-bold block mb-1">
                  Active Mode: {current.tag}
                </span>
                <p className="text-xs text-[#3D5C49] dark:text-emerald-300/80 leading-relaxed text-center">
                  {current.desc}
                </p>
              </div>
            </SpotlightCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
