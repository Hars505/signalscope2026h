import React from 'react';
import { Cpu } from 'lucide-react';

export const AttributionChip = ({ attribution }) => {
  if (!attribution) return null;

  return (
    <div className="p-4 rounded-2xl glass-panel spotlight-card border border-[#16A34A]/20 dark:border-[#1B6348] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 relative z-10">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#103A2A] text-emerald-700 dark:text-[#21C58A] border border-emerald-200 dark:border-[#1B6348]">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-[#3D5C49] dark:text-[#A8C7B8] uppercase tracking-wider block font-medium">
            Possible Generator Family
          </span>
          <span className="text-sm font-bold text-[#0D331E] dark:text-[#E7F5EE] font-mono capitalize">
            {attribution.replace('-', ' ')}
          </span>
        </div>
      </div>
      <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#103A2A] border border-emerald-300 dark:border-[#1B6348] text-xs font-mono text-emerald-800 dark:text-[#8DE8C5] relative z-10 font-semibold shadow-2xs">
        Latent Fingerprint
      </div>
    </div>
  );
};
