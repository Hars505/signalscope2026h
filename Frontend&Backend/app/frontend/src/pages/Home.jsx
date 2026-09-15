import React from 'react';
import { Hero } from '../components/landing/Hero';
import { PinnedForensicSection } from '../components/landing/PinnedForensicSection';
import { HorizontalPipelineSection } from '../components/landing/HorizontalPipelineSection';
import { RadarFeatureSection } from '../components/landing/RadarFeatureSection';
import { OrbitalHubSection } from '../components/landing/OrbitalHubSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { motion } from 'framer-motion';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Hero with entrance reveal & scroll-linked transformation */}
      <Hero />

      {/* 2. Scroll-Pinned Forensic Investigation Pipeline (Sections 6, 7 & 16) */}
      <PinnedForensicSection />

      {/* 4. Horizontal Scroll Architecture Story (Sections 8, 9 & 20) */}
      <HorizontalPipelineSection />

      {/* 5. Concentric Radar Target & Interactive Feature Tabs */}
      <ScrollReveal variant="standard">
        <RadarFeatureSection />
      </ScrollReveal>

      {/* 6. Orbital Hub with connected nodes & Waveform */}
      <ScrollReveal variant="slide" direction="left">
        <OrbitalHubSection />
      </ScrollReveal>

      {/* 7. How It Works 4-step methodology */}
      <ScrollReveal variant="scale">
        <HowItWorks />
      </ScrollReveal>

      {/* Visual Storytelling Grid */}
      <ScrollReveal variant="standard">
        <FeatureGrid />
      </ScrollReveal>

      {/* 10. Final CTA Conclusion Transition (Section 18) */}
      <div className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 relative">
        <ScrollReveal
          variant="scale"
          className="p-8 sm:p-14 rounded-3xl glass-panel glow-border border border-[#16A34A]/25 text-center relative z-10 overflow-hidden shadow-xl bg-white dark:bg-[#0B241A]"
        >
          {/* Luminous emerald bottom glow behind card content */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[220px] bg-gradient-to-t from-emerald-500/20 to-transparent blur-[80px] rounded-full pointer-events-none -z-10 animate-ambient-drift" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#103A2A] border border-emerald-300/80 dark:border-[#1B6348] flex items-center justify-center mx-auto mb-6 text-emerald-700 dark:text-[#21C58A] shadow-[0_0_20px_rgba(22,168,98,0.3)]"
            >
              <ShieldCheck className="w-7 h-7" />
            </motion.div>

            <motion.h2
              initial={{ scale: 0.96, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl font-extrabold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight mb-4 font-sans"
            >
              See beyond the pixels.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="text-[#3D5C49] dark:text-[#A8C7B8] max-w-xl mx-auto text-sm sm:text-base mb-8 leading-relaxed"
            >
              Upload any image to decompose its spatial pixel structures and 2D-FFT frequency spectra with calibrated confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/analyze')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="px-9 py-4 text-base bg-[#12A879] hover:bg-[#0D9168] dark:bg-[#21C58A] dark:hover:bg-[#36D99B] text-white dark:text-[#06130E] dark:font-bold shadow-[0_10px_25px_-5px_rgba(18,168,121,0.45)] dark:shadow-[0_0_30px_rgba(33,197,138,0.4)] font-semibold"
              >
                Analyze an Image
              </Button>
            </motion.div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Home;
