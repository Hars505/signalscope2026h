import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, Sliders, ArrowRight, Activity, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatConfidence, formatTimestamp } from '../../lib/utils';

/**
 * Calm count-up helper for primary statistical values (800ms, ease-out cubic)
 */
function AnimatedNumber({ value, duration = 750, formatFn = (n) => Math.round(n) }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = performance.now();
    let rafId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = end * ease;
      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(end);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return <>{formatFn(displayValue)}</>;
}

export const ConsoleStats = ({
  stats,
  recentItems,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (!isLoading && stats.total === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center p-10 rounded-3xl glass-panel spotlight-card border border-[#16A34A]/18 dark:border-[#1B6348] shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#103A2A] border border-emerald-200 dark:border-[#1B6348] flex items-center justify-center mx-auto mb-4 text-emerald-700 dark:text-[#21C58A] relative z-10">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#0D331E] dark:text-[#E7F5EE] mb-2 relative z-10">No Analysis Telemetry Yet</h3>
        <p className="text-sm text-[#3D5C49] dark:text-[#A8C7B8] mb-6 max-w-md mx-auto relative z-10">
          You haven't scanned any images yet. Upload your first image to begin generating real-time forensic statistics.
        </p>
        <div className="relative z-10">
          <Button onClick={() => navigate('/analyze')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Launch First Scan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="p-5 rounded-2xl glass-panel spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#3D5C49] dark:text-[#A8C7B8] mb-3 font-medium">
              <span className="text-xs font-mono uppercase tracking-wider">Total Evaluated</span>
              <Shield className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#0D331E] dark:text-[#E7F5EE] mb-1">
              <AnimatedNumber value={stats.total} />
            </div>
            <p className="text-[11px] text-[#688A75] dark:text-[#769789]">Telemetry logs recorded</p>
          </div>
        </div>

        {/* AI-Generated count */}
        <div className="p-5 rounded-2xl glass-panel spotlight-card border border-rose-200 dark:border-rose-800/60 shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#3D5C49] dark:text-[#A8C7B8] mb-3 font-medium">
              <span className="text-xs font-mono uppercase tracking-wider">Synthetic Detected</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-rose-700 dark:text-rose-400 mb-1">
              <AnimatedNumber value={stats.aiCount} />
            </div>
            <p className="text-[11px] text-[#688A75] dark:text-[#769789]">
              {stats.total > 0 ? `${((stats.aiCount / stats.total) * 100).toFixed(0)}% of scans` : '0%'}
            </p>
          </div>
        </div>

        {/* Real count */}
        <div className="p-5 rounded-2xl glass-panel spotlight-card border border-emerald-200 dark:border-[#1B6348] shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#3D5C49] dark:text-[#A8C7B8] mb-3 font-medium">
              <span className="text-xs font-mono uppercase tracking-wider">Likely Authentic</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#21C58A]" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-[#21C58A] mb-1">
              <AnimatedNumber value={stats.realCount} />
            </div>
            <p className="text-[11px] text-[#688A75] dark:text-[#769789]">
              {stats.total > 0 ? `${((stats.realCount / stats.total) * 100).toFixed(0)}% of scans` : '0%'}
            </p>
          </div>
        </div>

        {/* Average Calibrated Confidence */}
        <div className="p-5 rounded-2xl glass-panel spotlight-card border border-emerald-200 dark:border-[#1B6348] shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-[#3D5C49] dark:text-[#A8C7B8] mb-3 font-medium">
              <span className="text-xs font-mono uppercase tracking-wider">Mean Confidence</span>
              <Sliders className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-[#21C58A] mb-1">
              {stats.avgConfidence > 0 ? (
                <AnimatedNumber
                  value={stats.avgConfidence}
                  formatFn={(n) => formatConfidence(n)}
                />
              ) : (
                '—'
              )}
            </div>
            <p className="text-[11px] text-[#688A75] dark:text-[#769789]">Empirically calibrated probability</p>
          </div>
        </div>
      </div>

      {/* Recent Telemetry Stream */}
      <div className="rounded-2xl glass-panel spotlight-card p-6 border border-[#16A34A]/15 dark:border-[#1B6348] shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#16A34A]/12 dark:border-[#1B6348] mb-4 relative z-10">
          <div>
            <h3 className="text-base font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
              Recent Forensic Telemetry Log
            </h3>
            <p className="text-xs text-[#3D5C49] dark:text-[#A8C7B8]">
              Live chronological stream of image verifications
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/history')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            View Full Log
          </Button>
        </div>

        <div className="divide-y divide-[#16A34A]/10 dark:divide-[#1B6348]/60 relative z-10">
          {recentItems.slice(0, 5).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="py-3.5 flex items-center justify-between gap-4 hover:bg-emerald-50/50 dark:hover:bg-[#103A2A]/50 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-emerald-50 dark:bg-[#103A2A] border border-[#16A34A]/15 dark:border-[#1B6348] flex items-center justify-center shrink-0">
                  <img
                    src={item.thumbnail_url || item.image}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-full h-full object-cover"
                  />
                  <Shield className="w-5 h-5 text-emerald-600/40 dark:text-[#21C58A]/40 absolute" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#0D331E] dark:text-[#E7F5EE]">
                    Scan #{item.id}
                  </div>
                  <div className="text-[11px] text-[#3D5C49] dark:text-[#A8C7B8] flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-[#688A75] dark:text-[#769789]" />
                    <span>{formatTimestamp(item.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${
                    item.label === 'ai_generated'
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                      : 'bg-emerald-50 dark:bg-[#103A2A] text-emerald-800 dark:text-[#8DE8C5] border-emerald-300 dark:border-[#1B6348]'
                  }`}
                >
                  {item.label === 'ai_generated' ? 'Likely AI' : 'Likely Real'} (
                  {formatConfidence(item.confidence)})
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
