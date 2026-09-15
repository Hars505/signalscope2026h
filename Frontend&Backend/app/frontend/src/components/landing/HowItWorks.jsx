import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Cpu, Search, CheckCircle } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ScrollReveal } from '../ui/ScrollReveal';

export const HowItWorks = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload',
      desc: 'Upload an image for analysis. Supports JPEG, PNG, and WEBP formats up to 10MB.',
      icon: <Upload className="w-5 h-5 text-[#12A879] dark:text-[#21C58A]" />,
      accent: 'group-hover:border-[#12A879]/50 dark:group-hover:border-[#21C58A]/50',
    },
    {
      step: '02',
      title: 'Analyze',
      desc: 'SignalScope normalizes image resolution and decomposes RGB data into multi-channel tensor inputs.',
      icon: <Cpu className="w-5 h-5 text-[#12A879] dark:text-[#21C58A]" />,
      accent: 'group-hover:border-[#12A879]/50 dark:group-hover:border-[#21C58A]/50',
    },
    {
      step: '03',
      title: 'Inspect',
      desc: 'The system examines spatial patch representations alongside high-frequency 2D-FFT spectral distributions.',
      icon: <Search className="w-5 h-5 text-[#12A879] dark:text-[#21C58A]" />,
      accent: 'group-hover:border-[#12A879]/50 dark:group-hover:border-[#21C58A]/50',
    },
    {
      step: '04',
      title: 'Decide',
      desc: 'Receive a calibrated likelihood assessment with visual Grad-CAM thermal heatmaps and grounded cues.',
      icon: <CheckCircle className="w-5 h-5 text-[#12A879] dark:text-[#21C58A]" />,
      accent: 'group-hover:border-[#12A879]/50 dark:group-hover:border-[#21C58A]/50',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with ScrollReveal */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] text-xs font-mono text-[#0B2B1F] dark:text-[#8DE8C5] mb-4 backdrop-blur-md shadow-xs font-semibold">
            METHODOLOGY
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-tight font-sans">
            How SignalScope Evaluates Images
          </h2>
          <p className="text-[#49665A] dark:text-[#A8C7B8] mt-4 text-base leading-relaxed">
            From file ingestion to calibrated likelihood verification in four transparent steps.
          </p>
        </ScrollReveal>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <SpotlightCard
                className={`p-7 flex flex-col justify-between h-full group border-[#A9DEC8]/50 dark:border-[rgba(141,232,197,0.14)] ${item.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-2xl font-extrabold font-mono text-[#71867C] dark:text-[#769789] group-hover:text-[#12A879] dark:group-hover:text-[#21C58A] transition-colors">
                      {item.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] shadow-xs">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#0B2B1F] dark:text-[#E7F5EE] mb-2.5 group-hover:text-[#12A879] dark:group-hover:text-[#21C58A] transition-colors font-sans">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#49665A] dark:text-[#A8C7B8] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#A9DEC8]/30 dark:border-[rgba(141,232,197,0.12)] flex items-center text-xs font-mono text-[#71867C] dark:text-[#769789] group-hover:text-[#49665A] dark:group-hover:text-[#A8C7B8] transition-colors">
                  <span>Phase {item.step} Execution</span>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
