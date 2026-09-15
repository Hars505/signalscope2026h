import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatBytes } from '../../lib/utils';
import { SpotlightCard } from '../ui/SpotlightCard';
import { ImageDepthHover } from '../ui/ImageDepthHover';

export const ImagePreview = ({
  file,
  previewUrl,
  caption,
  setCaption,
  onClear,
  onStartAnalysis,
  isLoading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <SpotlightCard className="w-full p-7 sm:p-9 border-[#16A34A]/15 dark:border-[#1B6348] shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#16A34A]/12 dark:border-[#1B6348] mb-6 relative z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#103A2A] text-emerald-700 dark:text-[#21C58A] border border-emerald-200 dark:border-[#1B6348]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h4 className="text-sm font-semibold text-[#0D331E] dark:text-[#E7F5EE] truncate max-w-xs sm:max-w-md font-sans">
                {file.name}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono text-[#3D5C49] dark:text-[#A8C7B8]">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span className="uppercase">{file.type.replace('image/', '')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClear}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-[#688A75] dark:text-[#769789] hover:text-[#0D331E] dark:hover:text-[#E7F5EE] hover:bg-emerald-50 dark:hover:bg-[#103A2A] transition-colors"
            title="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0E2D21] border border-[#16A34A]/15 dark:border-[#1B6348] mb-6 flex items-center justify-center relative z-10 backdrop-blur-md shadow-inner">
          <ImageDepthHover className="w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Candidate for forensic analysis"
              className="w-full h-full object-contain"
            />
          </ImageDepthHover>
        </div>

      <div className="mb-6 relative z-10">
        <label className="block text-xs font-mono text-[#0D331E] dark:text-[#E7F5EE] mb-2 flex items-center gap-1.5 font-semibold">
          <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-[#21C58A]" />
          Contextual Claim / Caption (Optional):
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. 'Photo taken at a press briefing in London, September 2026'"
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0E2D21] border border-[#16A34A]/20 dark:border-[#1B6348] text-sm text-[#0D331E] dark:text-[#E7F5EE] placeholder-[#8DAA98] dark:placeholder-[#769789] focus:outline-none focus:border-emerald-600 dark:focus:border-[#21C58A] focus:ring-1 focus:ring-emerald-600 dark:focus:ring-[#21C58A] transition-all font-sans shadow-2xs"
          disabled={isLoading}
        />
        <p className="text-[11px] text-[#688A75] dark:text-[#769789] mt-1.5">
          Used by multimodal semantic consistency checks if enabled on the backend.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 relative z-10">
        <Button
          variant="ghost"
          size="md"
          onClick={onClear}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Change Image
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={onStartAnalysis}
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="w-full sm:w-auto px-8 bg-gradient-to-r from-[#60C342] to-[#10A760] dark:from-[#21C58A] dark:to-[#12A879] text-white dark:text-[#06130E] dark:font-bold shadow-[0_10px_25px_-5px_rgba(22,168,98,0.45)] dark:shadow-[0_0_30px_rgba(33,197,138,0.4)] font-semibold"
        >
          Start Forensics Scan
        </Button>
      </div>
    </SpotlightCard>
    </motion.div>
  );
};
