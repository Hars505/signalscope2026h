import React, { useRef } from 'react';

/**
 * Spotlight Card component for Light Sage-Mint Aesthetic:
 * - Frosted white/mint translucent glass background allowing the atmospheric mint nebula and stars to shine through
 * - Dynamically tracks mouse coordinates relative to the card without triggering React re-renders
 * - Smooth upward shift (~1-2px) and illuminated emerald radial glow on hover
 */
export const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(22, 168, 98, 0.12)',
  radius = 360,
  ...props
}) => {
  const divRef = useRef(null);
  const spotlightRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!divRef.current || !spotlightRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const color = spotlightColor === 'rgba(22, 168, 98, 0.12)'
      ? (isDark ? 'rgba(33, 197, 138, 0.16)' : 'rgba(18, 168, 121, 0.12)')
      : spotlightColor;
    spotlightRef.current.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, ${color}, transparent 65%)`;
  };

  const handleMouseEnter = () => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = '1';
  };

  const handleMouseLeave = () => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative z-10 overflow-hidden rounded-2xl border border-[#A9DEC8]/50 dark:border-[rgba(141,232,197,0.12)] bg-white dark:bg-[#0B241A] shadow-[0_4px_24px_-2px_rgba(11,43,31,0.06)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-[#12A879]/40 dark:hover:border-[rgba(141,232,197,0.28)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-6px_rgba(18,168,121,0.18)] dark:hover:shadow-[0_12px_32px_-6px_rgba(33,197,138,0.25)] ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0 opacity-0"
      />
      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center">{children}</div>
    </div>
  );
};
