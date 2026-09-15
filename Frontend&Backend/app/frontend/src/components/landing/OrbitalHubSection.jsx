import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ScrollReveal } from '../ui/ScrollReveal';
import { useNavigate } from 'react-router-dom';

export const OrbitalHubSection = () => {
  const navigate = useNavigate();

  const satellites = [
    { label: 'ViT Patches', x: -110, y: -70 },
    { label: 'FFT Residuals', x: 110, y: -70 },
    { label: 'Latent Upsampling', x: -130, y: 0 },
    { label: 'Grad-CAM Attention', x: 130, y: 0 },
    { label: 'Bayer Noise Profile', x: -100, y: 70 },
    { label: 'Temperature T', x: 100, y: 70 },
    { label: 'Cross-Attention Fusion', x: 0, y: -95 },
    { label: 'Boundary Consistency', x: 0, y: 95 },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with ScrollReveal */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0D331E] dark:text-[#E7F5EE] tracking-tight font-sans">
            Calibrated. Grounded.
          </h2>
          <p className="text-[#3D5C49] dark:text-[#A8C7B8] mt-3 text-sm sm:text-base leading-relaxed">
            Multi-spectral feature extraction isolates anomalies across spatial pixel patches and high-frequency Fourier bands with zero hallucinated certainty.
          </p>
        </ScrollReveal>

        {/* Grid Layout */}
        <div className="space-y-6">
          {/* Top Wide Card: Orbital Hub & Connected Nodes */}
          <ScrollReveal delay={0.1}>
            <SpotlightCard className="p-8 sm:p-12 border-[#16A34A]/15 dark:border-emerald-500/20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left text */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-500/30 text-xs font-mono text-emerald-800 dark:text-emerald-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    CORE ARCHITECTURE
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
                    Optimized for multi-spectral verification
                  </h3>

                  <p className="text-sm text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed">
                    Extract deep visual semantics and Fourier spectral roll-offs simultaneously. Cross-attention layers correlate patch artifacts with high-frequency residuals to detect unseen generative models.
                  </p>

                  <button
                    onClick={() => navigate('/about')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 pt-2 transition-colors group"
                  >
                    <span>Explore ML Architecture</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Right: Central Orbital Hub with connected nodes */}
                <div className="lg:col-span-7 flex items-center justify-center min-h-[300px] relative">
                  <div className="relative w-72 h-72 flex items-center justify-center">
                    {/* Subtle orbital concentric circle in sage/emerald */}
                    <div className="absolute w-60 h-60 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 animate-spin-slow will-change-transform" />
                    <div className="absolute w-44 h-44 rounded-full border border-teal-500/20 dark:border-teal-500/30" />

                    {/* Satellite Badges around center with asynchronous organic floating */}
                    {satellites.map((sat, i) => (
                      <motion.div
                        key={sat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: sat.x,
                          y: sat.y,
                        }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="absolute"
                      >
                        <div
                          className={`animate-float-${(i % 3) + 1} px-3 py-1 rounded-full bg-white dark:bg-[#071F14] border border-[#16A34A]/20 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400 text-[10px] font-mono text-[#0D331E] dark:text-emerald-200 shadow-xs whitespace-nowrap cursor-default transition-all hover:scale-105`}
                          style={{ animationDelay: `${-(i * 1.5)}s` }}
                        >
                          {sat.label}
                        </div>
                      </motion.div>
                    ))}

                  {/* Central Hub Core */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#60C342] to-[#10A760] border border-emerald-200/50 shadow-[0_0_30px_rgba(22,168,98,0.5)] flex items-center justify-center text-white">
                    <Shield className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
