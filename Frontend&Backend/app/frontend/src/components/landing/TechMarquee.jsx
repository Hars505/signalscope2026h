import React from 'react';

export const TechMarquee = () => {
  const items = [
    { name: 'PyTorch 2.4', label: 'Deep Learning Core' },
    { name: 'Vision Transformer', label: 'ViT-B/16 Patch Attention' },
    { name: '2D Fast Fourier', label: 'FFT Spectral Residuals' },
    { name: 'TIMM Model Zoo', label: 'Pretrained Encoders' },
    { name: 'Grad-CAM', label: 'Thermal Explainability' },
    { name: 'Temperature Scaling', label: 'Platt Calibration' },
    { name: 'OpenCV / PIL', label: 'Multi-Spectral Normalization' },
    { name: 'Django DRF', label: 'Modular Monolith API' },
  ];

  // Double the list for seamless infinite loop
  const list = [...items, ...items];

  return (
    <div className="w-full py-10 overflow-hidden relative border-y border-[#A9DEC8]/50 dark:border-[rgba(141,232,197,0.12)] bg-white/45 dark:bg-[#06130E]/60 backdrop-blur-sm">
      {/* Left/Right blur vignettes for smooth fade */}
      <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#F4F8F5] dark:from-[#06130E] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#F4F8F5] dark:from-[#06130E] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee space-x-8 hover:[animation-play-state:paused] will-change-transform">
        {list.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-[#0B241A] border border-[#A9DEC8]/70 dark:border-[#1B6348] hover:border-[#12A879] dark:hover:border-[#21C58A] transition-colors shadow-2xs"
          >
            <div className="w-2 h-2 rounded-full bg-[#12A879] dark:bg-[#21C58A] animate-pulse" />
            <span className="text-xs font-bold text-[#0B2B1F] dark:text-[#E7F5EE] tracking-wide font-mono">
              {item.name}
            </span>
            <span className="text-[10px] font-mono text-[#49665A] dark:text-[#A8C7B8]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
