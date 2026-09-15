import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Disclaimer = () => {
  return (
    <div className="p-4 rounded-xl bg-white/80 dark:bg-[#0B241A]/80 border border-[#16A34A]/15 dark:border-[#1B6348] text-xs text-[#3D5C49] dark:text-[#A8C7B8] flex items-start gap-3 shadow-2xs">
      <AlertCircle className="w-4 h-4 text-[#688A75] dark:text-[#769789] mt-0.5 shrink-0" />
      <p className="leading-relaxed">
        <strong className="text-[#0D331E] dark:text-[#E7F5EE]">Responsible AI Notice:</strong> This is an automated likelihood assessment, not a definitive judgement. Results should be verified by human experts for critical decisions.
      </p>
    </div>
  );
};
