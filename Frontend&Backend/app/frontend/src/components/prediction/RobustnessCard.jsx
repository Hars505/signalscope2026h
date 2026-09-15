import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { formatConfidence } from '../../lib/utils';

export const RobustnessCard = ({ tests }) => {
  if (!tests || tests.length === 0) return null;

  return (
    <div className="rounded-2xl glass-panel spotlight-card p-5 sm:p-6 border border-[#16A34A]/15 dark:border-[#1B6348]">
      <div className="flex items-center justify-between pb-3 border-b border-[#16A34A]/12 dark:border-[#1B6348] mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#21C58A]" />
          <h4 className="text-sm font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
            Adversarial & Degradation Stability
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#3D5C49] dark:text-[#A8C7B8]">Module C Verification</span>
      </div>

      <p className="text-xs text-[#3D5C49] dark:text-[#A8C7B8] mb-4 leading-relaxed relative z-10">
        Tests whether the verdict remains invariant under standard social media compression and optical blurring.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {tests.map((t) => (
          <div
            key={t.id}
            className="p-3 rounded-xl bg-white/80 dark:bg-[#0B241A]/80 border border-[#16A34A]/15 dark:border-[#1B6348] flex flex-col justify-between shadow-2xs"
          >
            <span className="text-xs font-semibold text-[#0D331E] dark:text-[#E7F5EE] mb-2 truncate" title={t.transform_type}>
              {t.transform_type}
            </span>
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#16A34A]/12 dark:border-[#1B6348]">
              <span className="text-[#3D5C49] dark:text-[#A8C7B8]">Post-test:</span>
              <span className="text-emerald-700 dark:text-[#21C58A] font-bold">{formatConfidence(t.confidence_after)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
