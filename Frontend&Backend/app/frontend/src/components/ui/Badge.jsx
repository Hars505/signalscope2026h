import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({
  className = '',
  variant = 'emerald',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    indigo: 'bg-[#DDF5EA] dark:bg-[#103A2A] text-[#0B2B1F] dark:text-[#E7F5EE] border-[#A9DEC8] dark:border-[#1B6348]',
    cyan: 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border-teal-300/70 dark:border-teal-700/60',
    violet: 'bg-[#DDF5EA] dark:bg-[#103A2A] text-[#0B2B1F] dark:text-[#8DE8C5] border-[#A9DEC8] dark:border-[#1B6348]',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60',
    emerald: 'bg-[#DDF5EA] dark:bg-[#103A2A] text-[#0B2B1F] dark:text-[#8DE8C5] border-[#A9DEC8] dark:border-[#1B6348]',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-rose-300/70 dark:border-rose-700/60',
    slate: 'bg-[#EEF5F0] dark:bg-[#0E2D21] text-[#49665A] dark:text-[#A8C7B8] border-[#A9DEC8]/70 dark:border-[rgba(141,232,197,0.18)]',
  };

  const dotColors = {
    indigo: 'bg-emerald-500',
    cyan: 'bg-teal-500',
    violet: 'bg-emerald-600',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors shadow-xs',
        variants[variant] || variants.emerald,
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant] || dotColors.emerald)} />}
      {children}
    </span>
  );
};
