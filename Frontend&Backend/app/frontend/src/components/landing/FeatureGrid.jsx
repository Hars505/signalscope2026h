import React from 'react';
import { Eye, Waves, Sliders, ShieldCheck, Sparkles, FileSearch } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ScrollReveal } from '../ui/ScrollReveal';

export const FeatureGrid = () => {
  const steps = [
    { label: 'Pixels', desc: 'Raw RGB values & chromatic channels', icon: <Eye className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" /> },
    { label: 'Patterns', desc: 'Spatial texture gradients & edge continuity', icon: <Sparkles className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" /> },
    { label: 'Frequency Signals', desc: '2D-FFT periodic lattice signatures', icon: <Waves className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" /> },
    { label: 'Model Features', desc: 'Dense patch embeddings via ViT-B/16', icon: <Sliders className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" /> },
    { label: 'Evidence', desc: 'Grad-CAM attention heatmaps & visual cues', icon: <FileSearch className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" /> },
    { label: 'Likelihood', desc: 'Empirical calibrated confidence score', icon: <ShieldCheck className="w-4 h-4 text-[#12A879] dark:text-[#21C58A]" /> },
  ];

  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Visual Storytelling Glass Container with ScrollReveal */}
        <ScrollReveal>
          <SpotlightCard className="p-8 sm:p-14 border-[#A9DEC8]/50 dark:border-[rgba(141,232,197,0.14)] text-center mb-16 relative overflow-hidden">
            {/* Subtle atmospheric mint glow behind storytelling card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[100px] rounded-full pointer-events-none -z-10 animate-ambient-drift" />

          <div className="relative z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#12A879] dark:text-[#21C58A] font-bold mb-3 block">
              CORE PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight mb-5 font-sans">
              An image is more than what the eye sees.
            </h2>
            <p className="text-[#49665A] dark:text-[#A8C7B8] max-w-2xl mx-auto text-base sm:text-lg mb-12 leading-relaxed">
              Generative models can synthesize visual realism that fools the human eye, but they leave mathematical artifacts in frequency roll-off and spatial patch correlations.
            </p>

            {/* Stepped sequence banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {steps.map((step) => (
                <div
                  key={step.label}
                  className="p-4 rounded-xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] hover:border-[#12A879] dark:hover:border-[#21C58A] transition-all flex flex-col items-center text-center group hover:-translate-y-0.5 shadow-xs"
                >
                  <div className="p-2.5 rounded-lg bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] mb-3 group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-[#0B2B1F] dark:text-[#E7F5EE] mb-1.5 group-hover:text-[#12A879] dark:group-hover:text-[#21C58A] transition-colors font-sans">
                    {step.label}
                  </span>
                  <span className="text-[10px] text-[#49665A] dark:text-[#A8C7B8] leading-tight">
                    {step.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SpotlightCard>
        </ScrollReveal>
      </div>
    </section>
  );
};
