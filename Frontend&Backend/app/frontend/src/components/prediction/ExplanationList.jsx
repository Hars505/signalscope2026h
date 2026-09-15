import React from 'react';
import { HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ExplanationList = ({ explanations, label }) => {
  if (!explanations || explanations.length === 0) {
    return null;
  }

  const isAi = label === 'ai_generated';

  return (
    <div className="rounded-2xl glass-panel spotlight-card p-5 sm:p-6 border border-[#16A34A]/15 dark:border-[#1B6348]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#16A34A]/12 dark:border-[#1B6348] relative z-10">
        <HelpCircle className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />
        <h4 className="text-sm font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
          Why SignalScope Reached This Assessment
        </h4>
      </div>

      <div className="space-y-3 relative z-10">
        {explanations.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-white/80 dark:bg-[#0B241A]/80 border border-[#16A34A]/15 dark:border-[#1B6348] shadow-2xs"
          >
            <div className="mt-0.5 shrink-0">
              {isAi ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#21C58A]" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#3D5C49] dark:text-[#A8C7B8] leading-relaxed font-normal">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
