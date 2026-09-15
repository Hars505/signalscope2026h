import React from 'react';
import { motion } from 'framer-motion';
import { STAGES } from '../../hooks/useScan';
import { Cpu, Radio, Network, Sliders, CheckCircle2, Shield } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

export const ScanningBeam = ({ previewUrl, stageInfo }) => {
  const currentKey = stageInfo?.key || 'scanning';
  const progress = stageInfo?.progress || 25;

  const stageIcons = {
    uploading: <Shield className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />,
    scanning: <Cpu className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />,
    extracting: <Cpu className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />,
    frequency: <Radio className="w-4 h-4 text-teal-700 dark:text-teal-400" />,
    fusion: <Network className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />,
    calibrating: <Sliders className="w-4 h-4 text-emerald-800 dark:text-[#21C58A]" />,
    complete: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#21C58A]" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <SpotlightCard className="w-full p-7 sm:p-9 border-[#16A34A]/20 dark:border-[#1B6348] shadow-2xl">
        {/* Background emerald pulse */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Image with Scanning Beam Overlay */}
      <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0E2D21] border border-[#16A34A]/20 dark:border-[#1B6348] mb-6 flex items-center justify-center relative z-10 backdrop-blur-md shadow-inner">
        <img
          src={previewUrl}
          alt="Active forensics scan"
          className="w-full h-full object-contain filter contrast-105"
        />

        {/* High-tech grid overlay */}
        <div className="absolute inset-0 bg-stellar-grid opacity-35 pointer-events-none" />

        {/* Animated Scanning Beam in vibrant emerald */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#10A760] to-transparent shadow-[0_0_20px_4px_rgba(16,167,96,0.8)] animate-scanner pointer-events-none z-10" />

        {/* Corner Brackets */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-600/80 dark:border-[#21C58A]/80 pointer-events-none" />
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-600/80 dark:border-[#21C58A]/80 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-600/80 dark:border-[#21C58A]/80 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-600/80 dark:border-[#21C58A]/80 pointer-events-none" />

        {/* Live Frequency Wave Simulation Tag */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/90 dark:bg-[#0E2D21]/90 border border-emerald-500/40 dark:border-[#1B6348] text-[10px] font-mono text-emerald-800 dark:text-[#21C58A] backdrop-blur-md shadow-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#21C58A] animate-ping" />
          <span>FFT-2D RESOLVING</span>
        </div>
      </div>

      {/* Stage Progress & Information */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#103A2A] border border-emerald-200 dark:border-[#1B6348] animate-pulse text-emerald-700 dark:text-[#21C58A]">
              {stageIcons[currentKey] || <Cpu className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />}
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans flex items-center gap-2">
                {stageInfo?.label || 'Processing signals...'}
              </h4>
              <p className="text-xs text-[#3D5C49] dark:text-[#A8C7B8] mt-0.5">
                {stageInfo?.description || 'Evaluating multi-modal features'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-[#21C58A]">
              {progress}%
            </span>
          </div>
        </div>

        {/* Continuous Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0E2D21] overflow-hidden border border-[#16A34A]/15 dark:border-[#1B6348]">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#10A760] to-lime-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Step-by-step Mini Pipeline Nodes */}
        <div className="grid grid-cols-5 gap-1.5 pt-2">
          {STAGES.slice(1, 6).map((st) => {
            const isCompleted = progress >= st.progress;
            const isCurrent = currentKey === st.key;
            return (
              <div
                key={st.key}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'border-emerald-600 dark:border-[#21C58A] bg-emerald-100/70 dark:bg-[#103A2A] text-emerald-900 dark:text-[#E7F5EE] font-bold shadow-2xs'
                    : isCompleted
                    ? 'border-emerald-200 dark:border-[#1B6348] bg-emerald-50/50 dark:bg-[#0E2D21]/50 text-emerald-800 dark:text-[#A8C7B8]'
                    : 'border-slate-200 dark:border-[#1B6348]/60 bg-white/50 dark:bg-[#0B241A]/50 text-[#8DAA98] dark:text-[#769789]'
                }`}
              >
                <div className="text-[9px] font-mono uppercase tracking-wider truncate">
                  {st.key}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SpotlightCard>
    </motion.div>
  );
};
