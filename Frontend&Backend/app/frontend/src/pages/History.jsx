import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { HistoryTable } from '../components/history/HistoryTable';
import { ScrollReveal } from '../components/ui/ScrollReveal';

export const History = () => {
  const {
    items,
    isLoading,
    searchQuery,
    setSearchQuery,
    verdictFilter,
    setVerdictFilter,
    sortBy,
    setSortBy,
    refresh,
  } = useHistory();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ScrollReveal>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#103A2A] border border-emerald-300/60 dark:border-[#1B6348] text-xs font-mono text-emerald-800 dark:text-[#8DE8C5] font-semibold mb-2 shadow-xs">
            SCAN AUDIT TRAIL
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D331E] dark:text-[#E7F5EE] tracking-tight font-sans">
            Historical Telemetry Log
          </h1>
          <p className="text-[#3D5C49] dark:text-[#A8C7B8] mt-1 text-sm">
            Chronological record of processed image scans, calibrated probabilities, and forensic explanations.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <HistoryTable
          items={items}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          verdictFilter={verdictFilter}
          setVerdictFilter={setVerdictFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onRefresh={refresh}
        />
      </ScrollReveal>
    </div>
  );
};
