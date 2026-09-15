import React, { useState } from 'react';
import { formatConfidence, formatTimestamp } from '../../lib/utils';
import { Search, Clock, Eye, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { ScanDetailModal } from './ScanDetailModal';
import { Button } from '../ui/Button';

export const HistoryTable = ({
  items,
  isLoading,
  searchQuery,
  setSearchQuery,
  verdictFilter,
  setVerdictFilter,
  sortBy,
  setSortBy,
  onRefresh,
}) => {
  const [selectedScanId, setSelectedScanId] = useState(null);

  return (
    <div className="space-y-6">
      {/* Search, Filters, and Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] shadow-sm">
        <div className="relative flex-1 z-10">
          <Search className="w-4 h-4 text-[#8DAA98] dark:text-[#769789] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or verdict..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0E2D21] border border-[#16A34A]/20 dark:border-[#1B6348] rounded-xl text-sm text-[#0D331E] dark:text-[#E7F5EE] placeholder-[#8DAA98] dark:placeholder-[#769789] focus:outline-none focus:border-emerald-600 dark:focus:border-[#21C58A] font-sans shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-[#0E2D21] p-1 rounded-xl border border-[#16A34A]/15 dark:border-[#1B6348] shrink-0 z-10 shadow-2xs">
          {['all', 'ai_generated', 'real'].map((filter) => (
            <button
              key={filter}
              onClick={() => setVerdictFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                verdictFilter === filter
                  ? 'bg-emerald-100 dark:bg-[#103A2A] text-[#0D331E] dark:text-[#E7F5EE] border border-emerald-300 dark:border-[#1B6348] font-semibold shadow-2xs'
                  : 'text-[#3D5C49] dark:text-[#A8C7B8] hover:text-[#0D331E] dark:hover:text-[#E7F5EE]'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'ai_generated' ? 'Synthetic' : 'Authentic'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-[#0E2D21] border border-[#16A34A]/20 dark:border-[#1B6348] text-xs font-mono text-[#0D331E] dark:text-[#E7F5EE] py-2 px-3 rounded-xl focus:outline-none focus:border-emerald-600 dark:focus:border-[#21C58A] shadow-2xs"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="confidence">Highest Confidence</option>
          </select>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            isLoading={isLoading}
            className="p-2 text-[#3D5C49] dark:text-[#A8C7B8] hover:text-[#0D331E] dark:hover:text-[#E7F5EE]"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] shadow-sm">
          <p className="text-[#3D5C49] dark:text-[#A8C7B8] text-sm mb-2 relative z-10">No matching telemetry records found.</p>
          <span className="text-xs text-[#688A75] dark:text-[#769789] relative z-10">Try adjusting your filters or search terms.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedScanId(item.id)}
              className="p-4 rounded-2xl glass-panel glass-panel-hover spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] cursor-pointer flex flex-col justify-between group shadow-xs"
            >
              <div className="relative z-10">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-emerald-50/50 dark:bg-[#103A2A]/50 border border-[#16A34A]/15 dark:border-[#1B6348] mb-3.5 flex items-center justify-center">
                  <img
                    src={item.thumbnail_url || item.image}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-1"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-600/30 dark:text-[#21C58A]/30">
                    <span className="text-xs font-mono">Scan Preview</span>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#0E2D21]/90 backdrop-blur-md border border-[#16A34A]/20 dark:border-[#1B6348] text-[10px] font-mono text-[#0D331E] dark:text-[#E7F5EE] font-bold shadow-2xs z-10">
                    #{item.id}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      item.label === 'ai_generated'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                        : 'bg-emerald-50 dark:bg-[#103A2A] text-emerald-800 dark:text-[#8DE8C5] border-emerald-300 dark:border-[#1B6348]'
                    }`}
                  >
                    {item.label === 'ai_generated' ? (
                      <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#21C58A]" />
                    )}
                    {item.label === 'ai_generated' ? 'Likely AI' : 'Likely Real'}
                  </span>

                  <span className="text-xs font-mono font-bold text-[#0D331E] dark:text-[#E7F5EE]">
                    {formatConfidence(item.confidence)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#16A34A]/10 dark:border-[#1B6348]/60 flex items-center justify-between text-xs text-[#3D5C49] dark:text-[#A8C7B8] relative z-10">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#688A75] dark:text-[#769789]">
                  <Clock className="w-3 h-3 text-[#688A75] dark:text-[#769789]" />
                  {formatTimestamp(item.created_at)}
                </span>
                <span className="text-emerald-700 dark:text-[#21C58A] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                  Inspect <Eye className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScanDetailModal
        scanId={selectedScanId}
        isOpen={selectedScanId !== null}
        onClose={() => setSelectedScanId(null)}
      />
    </div>
  );
};
