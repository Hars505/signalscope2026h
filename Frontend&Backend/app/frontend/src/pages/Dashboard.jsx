import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { ConsoleStats } from '../components/dashboard/ConsoleStats';
import { ScrollReveal } from '../components/ui/ScrollReveal';

export const Dashboard = () => {
  const { stats, items, isLoading } = useHistory();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ScrollReveal>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#103A2A] border border-emerald-300/60 dark:border-[#1B6348] text-xs font-mono text-emerald-800 dark:text-[#8DE8C5] font-semibold mb-2 shadow-xs">
            OPERATIONAL TELEMETRY
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D331E] dark:text-[#E7F5EE] tracking-tight font-sans">
            Forensic Telemetry Console
          </h1>
          <p className="text-[#3D5C49] dark:text-[#A8C7B8] mt-1 text-sm">
            Real-time metrics computed directly from logged image evaluations. Zero interpolated benchmark figures.
          </p>
        </div>
      </ScrollReveal>

      <ConsoleStats
        stats={stats}
        recentItems={items}
        isLoading={isLoading}
      />
    </div>
  );
};
