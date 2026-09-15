import React, { useState } from 'react';
import { Layers, Sliders } from 'lucide-react';
import { ImageDepthHover } from '../ui/ImageDepthHover';

export const HeatmapViewer = ({ originalImage, heatmapUrl }) => {
  const [activeTab, setActiveTab] = useState('overlay');
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);

  if (!heatmapUrl) {
    return (
      <div className="rounded-2xl glass-panel spotlight-card p-6 border border-[#16A34A]/15 dark:border-[#1B6348] text-center">
        <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0E2D21] border border-[#16A34A]/15 dark:border-[#1B6348] mb-4 flex items-center justify-center">
          <ImageDepthHover className="w-full h-full flex items-center justify-center">
            <img
              src={originalImage}
              alt="Original input"
              className="w-full h-full object-contain"
            />
          </ImageDepthHover>
        </div>
        <p className="text-xs text-[#3D5C49] dark:text-[#A8C7B8]">
          No anomalous Grad-CAM activation heatmap generated for this image (expected for natural camera imagery).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-panel spotlight-card p-5 sm:p-6 border border-[#16A34A]/15 dark:border-[#1B6348]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#16A34A]/12 dark:border-[#1B6348] mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700 dark:text-[#21C58A]" />
          <h4 className="text-sm font-bold text-[#0D331E] dark:text-[#E7F5EE] font-sans">
            Grad-CAM Forensic Attention Viewer
          </h4>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-[#0E2D21] p-1 rounded-xl border border-[#16A34A]/15 dark:border-[#1B6348] shadow-2xs">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'original'
                ? 'bg-emerald-100 dark:bg-[#103A2A] text-[#0D331E] dark:text-[#E7F5EE] border border-emerald-300 dark:border-[#1B6348] font-semibold shadow-2xs'
                : 'text-[#3D5C49] dark:text-[#A8C7B8] hover:text-[#0D331E] dark:hover:text-[#E7F5EE]'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'heatmap'
                ? 'bg-emerald-100 dark:bg-[#103A2A] text-[#0D331E] dark:text-[#E7F5EE] border border-emerald-300 dark:border-[#1B6348] font-semibold shadow-2xs'
                : 'text-[#3D5C49] dark:text-[#A8C7B8] hover:text-[#0D331E] dark:hover:text-[#E7F5EE]'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setActiveTab('overlay')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'overlay'
                ? 'bg-emerald-100 dark:bg-[#103A2A] text-[#0D331E] dark:text-[#E7F5EE] border border-emerald-300 dark:border-[#1B6348] font-semibold shadow-2xs'
                : 'text-[#3D5C49] dark:text-[#A8C7B8] hover:text-[#0D331E] dark:hover:text-[#E7F5EE]'
            }`}
          >
            Overlay
          </button>
        </div>
      </div>

      <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0E2D21] border border-[#16A34A]/15 dark:border-[#1B6348] mb-4 relative z-10 shadow-inner">
        <ImageDepthHover className="w-full h-full relative">
          {(activeTab === 'original' || activeTab === 'overlay') && (
            <img
              src={originalImage}
              alt="Original input"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {(activeTab === 'heatmap' || activeTab === 'overlay') && (
            <img
              src={heatmapUrl}
              alt="Grad-CAM anomaly heatmap"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-150 ${
                activeTab === 'heatmap' ? 'opacity-100' : ''
              }`}
              style={{
                opacity: activeTab === 'overlay' ? overlayOpacity : 1,
                mixBlendMode: activeTab === 'overlay' ? 'multiply' : 'normal',
              }}
            />
          )}
        </ImageDepthHover>
      </div>

      {activeTab === 'overlay' && (
        <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-xl bg-white dark:bg-[#0E2D21] border border-[#16A34A]/15 dark:border-[#1B6348] text-xs text-[#3D5C49] dark:text-[#A8C7B8] relative z-10 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-700 dark:text-[#21C58A]" />
            <span>Heatmap Blend Opacity:</span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 dark:accent-[#21C58A] cursor-pointer"
            />
            <span className="font-mono text-[#0D331E] dark:text-[#E7F5EE] font-bold w-9 text-right">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#3D5C49] dark:text-[#A8C7B8] mt-3 leading-relaxed relative z-10">
        Warm red and yellow regions indicate spatial receptive fields where the model extracted significant synthetic artifact signals or frequency-domain distortions.
      </p>
    </div>
  );
};
