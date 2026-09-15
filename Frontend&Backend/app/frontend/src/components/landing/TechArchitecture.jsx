import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Binary, Sliders, Cpu, Sparkles, Network } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ScrollReveal } from '../ui/ScrollReveal';

export const TechArchitecture = () => {
  const pipelineNodes = [
    {
      title: '1. Ingestion & Preprocessing',
      subtitle: 'Resolution & Format Normalization',
      desc: 'Input image is normalized to standard RGB channels, orientation corrected via EXIF flags, and resized to 224×224 tensor representations.',
      icon: <Layers className="w-5 h-5 text-emerald-700" />,
      badge: 'Input Prep',
    },
    {
      title: '2. Spatial Vision Encoder',
      subtitle: 'ViT-B/16 Patch Self-Attention',
      desc: 'Extracts deep visual semantic representations and flags patch-level edge discontinuities, unnatural specular glints, and semantic inconsistencies.',
      icon: <Cpu className="w-5 h-5 text-teal-700" />,
      badge: 'Spatial Domain',
    },
    {
      title: '3. Frequency Domain Spectral Features',
      subtitle: '2D Fast Fourier Transform (FFT)',
      desc: 'Transforms image into frequency space to expose high-frequency periodic lattice artifacts and abnormal spectral roll-off caused by generative upsampling.',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      badge: 'Spectral Residuals',
    },
    {
      title: '4. Feature Fusion Layer',
      subtitle: 'Cross-Domain Residual Merging',
      desc: 'Joint representation combining patch embeddings with spectral power distributions into a unified forensic latent vector.',
      icon: <Network className="w-5 h-5 text-green-700" />,
      badge: 'Fusion Core',
    },
    {
      title: '5. Binary Detection Head',
      subtitle: 'Linear Classifier & Logit Generation',
      desc: 'Maps the fused vector into uncalibrated binary detection logits representing synthetic vs. authentic camera signatures.',
      icon: <Binary className="w-5 h-5 text-rose-700" />,
      badge: 'Inference',
    },
    {
      title: '6. Temperature Scaling Calibration',
      subtitle: 'Platt Scaling / Temperature Parameter T',
      desc: 'Scales raw logits by an empirical validation factor T so the output confidence accurately matches true empirical precision.',
      icon: <Sliders className="w-5 h-5 text-emerald-700" />,
      badge: 'Probability Calibration',
    },
  ];

  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/80 border border-accent-border/60 text-xs font-mono text-emerald-800 dark:text-accent mb-4 backdrop-blur-md shadow-xs font-semibold">
            DEEP LEARNING ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight font-sans">
            The Multi-Branch Verification Pipeline
          </h2>
          <p className="text-foreground-secondary mt-4 text-base leading-relaxed">
            How SignalScope deconstructs visual media through spatial and spectral dimensions before calculating calibrated probabilities.
          </p>
        </ScrollReveal>

        {/* Interactive Flow Architecture */}
        <div className="relative flex flex-col items-center">
          <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-accent/50 via-teal-500/30 to-accent/40 hidden md:block" />

          <div className="w-full space-y-7">
            {pipelineNodes.map((node, i) => (
              <motion.div
                key={node.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col md:flex-row items-center gap-6 ${
                  i % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Node Box with transparent SpotlightCard */}
                <div className="w-full md:w-1/2">
                  <SpotlightCard className="p-6 sm:p-7 border-accent-border/30 dark:border-accent-border/40">
                    <div className="flex items-center justify-between gap-4 mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-accent-soft border border-accent-border/60 text-accent">
                          {node.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors font-sans">
                            {node.title}
                          </h3>
                          <div className="text-xs font-mono text-foreground-secondary mt-0.5">{node.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-accent-soft text-accent border border-accent-border/60 font-medium whitespace-nowrap">
                        {node.badge}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary leading-relaxed">
                      {node.desc}
                    </p>
                  </SpotlightCard>
                </div>

                {/* Center Node Indicator */}
                <div className="w-7 h-7 rounded-full bg-surface-elevated border-2 border-accent flex items-center justify-center text-xs font-mono font-bold text-accent shadow-sm z-10 hidden md:flex">
                  {i + 1}
                </div>

                {/* Empty column for balance */}
                <div className="hidden md:block w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
