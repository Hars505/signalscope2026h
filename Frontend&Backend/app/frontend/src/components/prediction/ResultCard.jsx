import React from 'react';
import { motion } from 'framer-motion';
import { getVerdictMeta } from '../../lib/utils';
import { ConfidenceMeter } from './ConfidenceMeter';
import { HeatmapViewer } from './HeatmapViewer';
import { ExplanationList } from './ExplanationList';
import { AttributionChip } from './AttributionChip';
import { RobustnessCard } from './RobustnessCard';
import { MetadataViewer } from './MetadataViewer';
import { Disclaimer } from './Disclaimer';
import { Button } from '../ui/Button';
import { RotateCcw, AlertTriangle, CheckCircle2, Share2 } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

export const ResultCard = ({ scan, onReset }) => {
  const meta = getVerdictMeta(scan.label, scan.confidence, scan.threshold_used);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto space-y-8 relative"
    >
      {/* Atmospheric ambient glow behind prediction result */}
      <div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[110px] rounded-full pointer-events-none -z-10 opacity-20"
        style={{ backgroundColor: meta.accent }}
      />

      {/* Top Main Verdict SpotlightCard */}
      <SpotlightCard className="p-7 sm:p-10 border-[#16A34A]/18 shadow-xl">
        {meta.isBorderline && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 relative z-10 backdrop-blur-md shadow-xs"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-0.5 font-sans">Borderline Assessment</span>
              The model's confidence is close to the threshold (τ = {scan.threshold_used}). Treat this verdict as inconclusive and examine secondary signals.
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-7 space-y-4">
            {/* Threshold Tag */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#0E2D21] border border-[#16A34A]/15 dark:border-[#1B6348] text-xs font-mono text-[#3D5C49] dark:text-[#A8C7B8] backdrop-blur-md shadow-2xs font-medium"
            >
              {scan.label === 'ai_generated' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#21C58A]" />
              )}
              <span>Decision Threshold: τ = {scan.threshold_used}</span>
            </motion.div>

            {/* Verdict Headline (1. Verdict) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${meta.colorClass} font-sans`}>
                {meta.title}
              </h2>
              <p className="text-sm font-semibold text-[#3D5C49] dark:text-[#A8C7B8] mt-1.5 font-sans">
                {meta.sublabel}
              </p>
            </motion.div>

            {/* Supporting Information (3. Supporting cues) */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed max-w-lg"
            >
              {meta.description}
            </motion.p>

            {/* Attribution */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <AttributionChip attribution={scan.generator_attribution} />
            </motion.div>
          </div>

          {/* 2. Confidence Meter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 flex justify-center"
          >
            <ConfidenceMeter
              confidence={scan.confidence}
              label={scan.label}
              accentColor={meta.accent}
              size={190}
            />
          </motion.div>
        </div>
      </SpotlightCard>

      {/* Heatmap Attention Viewer with glass styling */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <HeatmapViewer
          originalImage={scan.image}
          heatmapUrl={scan.heatmap_url}
        />
      </motion.div>

      {/* Grounded Explanation Panel */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ExplanationList
          explanations={scan.explanation}
          label={scan.label}
        />
      </motion.div>

      {/* Robustness Assessment (Module C) */}
      <RobustnessCard tests={scan.degradation_tests} />

      {/* Collapsible Metadata Panel */}
      <MetadataViewer scan={scan} />

      {/* Responsible AI Mandatory Disclaimer */}
      <Disclaimer />

      {/* Action Footer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
      >
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Analysis link copied to clipboard!');
          }}
          leftIcon={<Share2 className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Share Telemetry Link
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="w-full sm:w-auto px-8 bg-gradient-to-r from-[#60C342] to-[#10A760] dark:from-[#21C58A] dark:to-[#12A879] text-white dark:text-[#06130E] dark:font-bold shadow-[0_10px_25px_-5px_rgba(22,168,98,0.45)] dark:shadow-[0_0_30px_rgba(33,197,138,0.4)] font-semibold"
        >
          Analyze Another Image
        </Button>
      </motion.div>
    </motion.div>
  );
};
