import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { formatBytes, formatTimestamp } from '../../lib/utils';

export const MetadataViewer = ({ scan }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl glass-panel spotlight-card border border-[#16A34A]/15 dark:border-[#1B6348] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-emerald-50/50 dark:hover:bg-[#103A2A]/50 transition-colors relative z-10"
      >
        <div className="flex items-center gap-2.5 text-xs font-mono text-[#0D331E] dark:text-[#E7F5EE] font-semibold">
          <FileCode className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />
          <span>Image & Telemetry Metadata</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#3D5C49] dark:text-[#A8C7B8]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#3D5C49] dark:text-[#A8C7B8]" />
        )}
      </button>

      {isOpen && (
        <div className="p-5 pt-2 border-t border-[#16A34A]/12 dark:border-[#1B6348] bg-white/60 dark:bg-[#0B241A]/60 text-xs font-mono relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[#688A75] dark:text-[#769789] block mb-1">Scan Identifier:</span>
              <span className="text-[#0D331E] dark:text-[#E7F5EE] font-bold">#{scan.id}</span>
            </div>

            {scan.image_width && scan.image_height && (
              <div>
                <span className="text-[#688A75] dark:text-[#769789] block mb-1">Input Dimensions:</span>
                <span className="text-[#0D331E] dark:text-[#E7F5EE]">
                  {scan.image_width} × {scan.image_height} px
                </span>
              </div>
            )}

            <div>
              <span className="text-[#688A75] dark:text-[#769789] block mb-1">Decision Threshold:</span>
              <span className="text-[#0D331E] dark:text-[#E7F5EE] font-medium">τ = {scan.threshold_used}</span>
            </div>

            <div>
              <span className="text-[#688A75] dark:text-[#769789] block mb-1">Timestamp:</span>
              <span className="text-[#0D331E] dark:text-[#E7F5EE]">{formatTimestamp(scan.created_at)}</span>
            </div>

            {scan.file_size && (
              <div>
                <span className="text-[#688A75] dark:text-[#769789] block mb-1">Payload Size:</span>
                <span className="text-[#0D331E] dark:text-[#E7F5EE]">{formatBytes(scan.file_size)}</span>
              </div>
            )}

            {scan.filename && (
              <div>
                <span className="text-[#688A75] dark:text-[#769789] block mb-1">Source Filename:</span>
                <span className="text-[#0D331E] dark:text-[#E7F5EE] truncate block font-sans" title={scan.filename}>
                  {scan.filename}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
