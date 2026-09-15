import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { fetchScanDetail } from '../../lib/api';
import { ResultCard } from '../prediction/ResultCard';
import { Loader2, X } from 'lucide-react';

export const ScanDetailModal = ({
  scanId,
  isOpen,
  onClose,
}) => {
  const [scan, setScan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || scanId === null) {
      setScan(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchScanDetail(scanId);
        setScan(data);
      } catch (err) {
        setError(err?.message || 'Failed to load scan record.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [scanId, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={scan ? `Scan Report #${scan.id}` : 'Inspection Detail'}
      maxWidth="max-w-4xl"
    >
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-[#3D5C49] dark:text-[#A8C7B8] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-[#21C58A]" />
          <span className="text-xs font-mono">Loading telemetry record...</span>
        </div>
      )}

      {error && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-700/60 text-rose-800 dark:text-rose-200 text-xs shadow-xs">
            {error}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D331E] text-white hover:bg-[#14502F] transition-colors text-sm font-semibold"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}

      {!isLoading && scan && (
        <div className="space-y-4 pr-1">
          <ResultCard scan={scan} onReset={onClose} />
          <div className="flex justify-end border-t border-[#A9DEC8]/50 dark:border-[rgba(141,232,197,0.12)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#A9DEC8] dark:border-[#1B6348] text-[#0D331E] dark:text-[#E7F5EE] hover:bg-[#EEF5F0] dark:hover:bg-[#103A2A] transition-colors text-sm font-semibold"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
