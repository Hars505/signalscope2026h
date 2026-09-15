import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Cpu, Radio, Network, CheckCircle2 } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

export const PipelineVisualizer = () => {
  return (
    <SpotlightCard className="w-full max-w-4xl mx-auto p-6 sm:p-10 border-[#16A34A]/15 shadow-xl">
      {/* Subtle emerald radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      {/* Header telemetry tag */}
      <div className="flex items-center justify-between pb-6 border-b border-[#A9DEC8]/40 dark:border-[rgba(141,232,197,0.12)] mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#12A879] dark:bg-[#21C58A] animate-ping" />
          <span className="text-xs font-mono text-[#12A879] dark:text-[#21C58A] font-bold uppercase tracking-wider">
            Active Multi-Branch Architecture
          </span>
        </div>
      </div>

      {/* Pipeline Diagram */}
      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Step 1: Input Image Node */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] shadow-sm backdrop-blur-md group hover:border-[#12A879] dark:hover:border-[#21C58A] transition-colors">
            <div className="p-1.5 rounded-lg bg-[#DDF5EA] dark:bg-[#103A2A] text-[#12A879] dark:text-[#21C58A]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">Input Query Image</div>
              <div className="text-[10px] font-mono text-[#49665A] dark:text-[#A8C7B8]">Normalized RGB Tensor (224×224)</div>
            </div>
          </div>
          <div className="w-px h-6 bg-gradient-to-b from-[#12A879]/60 to-[#A9DEC8] dark:to-[#1B6348]" />
        </motion.div>

        {/* Fork Split to Dual Domain Analysis */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-4 sm:gap-8 relative">
          {/* Left Branch: Spatial Domain */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center"
          >
            <div className="w-full p-4 rounded-2xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] hover:border-[#12A879] dark:hover:border-[#21C58A] transition-all flex flex-col items-center text-center backdrop-blur-md shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] flex items-center justify-center text-[#12A879] dark:text-[#21C58A] mb-2">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-xs font-bold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">Spatial Branch</div>
              <div className="text-[11px] font-mono text-[#12A879] dark:text-[#21C58A] font-semibold mt-0.5">ViT-B/16 Encoder</div>
              <div className="text-[10px] text-[#49665A] dark:text-[#A8C7B8] mt-2 leading-tight">
                Patch self-attention for semantic anomalies & boundary artifacts
              </div>
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-[#12A879]/40 to-[#21C58A]/40" />
          </motion.div>

          {/* Right Branch: Frequency Domain */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center"
          >
            <div className="w-full p-4 rounded-2xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] hover:border-[#12A879] dark:hover:border-[#21C58A] transition-all flex flex-col items-center text-center backdrop-blur-md shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#DDF5EA] dark:bg-[#103A2A] border border-[#A9DEC8] dark:border-[#1B6348] flex items-center justify-center text-[#12A879] dark:text-[#21C58A] mb-2">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-xs font-bold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">Frequency Branch</div>
              <div className="text-[11px] font-mono text-[#12A879] dark:text-[#21C58A] font-semibold mt-0.5">2D-FFT Spectrum</div>
              <div className="text-[10px] text-[#49665A] dark:text-[#A8C7B8] mt-2 leading-tight">
                Radially-averaged power spectrum identifying latent upsample peaks
              </div>
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-[#21C58A]/40 to-[#12A879]/40" />
          </motion.div>
        </div>

        {/* Convergence: Feature Fusion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center w-full max-w-sm"
        >
          <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#0E2D21] border border-[#A9DEC8]/70 dark:border-[#1B6348] flex items-center justify-center gap-3 backdrop-blur-md shadow-xs">
            <Network className="w-5 h-5 text-[#12A879] dark:text-[#21C58A]" />
            <div>
              <div className="text-xs font-bold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">Multi-Modal Fusion Layer</div>
              <div className="text-[10px] font-mono text-[#49665A] dark:text-[#A8C7B8]">Cross-Attention Latent Projection</div>
            </div>
          </div>
          <div className="w-px h-6 bg-gradient-to-b from-[#12A879]/40 to-[#12A879]" />
        </motion.div>

        {/* Final Decision & Calibrated Probability */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-[#DDF5EA] dark:bg-[#103A2A] border-2 border-[#12A879]/40 dark:border-[#21C58A]/50 shadow-sm"
        >
          <div className="p-1.5 rounded-lg bg-[#12A879]/20 text-[#12A879] dark:text-[#21C58A]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0B2B1F] dark:text-[#E7F5EE] font-sans">Calibrated Likelihood Score</div>
            <div className="text-[10px] font-mono text-[#12A879] dark:text-[#8DE8C5] font-semibold">
              Isotonic Regression Calibrated (ECE &lt; 0.035) • Grounded Attention Map
            </div>
          </div>
        </motion.div>
      </div>
    </SpotlightCard>
  );
};
