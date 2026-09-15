import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = forwardRef(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] focus:ring-[#12A879] dark:focus:ring-[#21C58A] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] group hover:-translate-y-[1px] hover:scale-[1.01]';

    const variants = {
      primary:
        'bg-[#12A879] hover:bg-[#0D9168] dark:bg-[#21C58A] dark:hover:bg-[#36D99B] text-white dark:text-[#06130E] font-semibold dark:font-bold shadow-[0_4px_16px_-2px_rgba(18,168,121,0.38)] dark:shadow-[0_0_24px_rgba(33,197,138,0.35)] border border-[#A9DEC8]/40 dark:border-[#8DE8C5]/30',
      secondary:
        'bg-white hover:bg-[#EEF5F0] dark:bg-[#0E2D21] dark:hover:bg-[#123426] text-[#0B2B1F] dark:text-[#E7F5EE] border border-[#A9DEC8] dark:border-[#1B6348] shadow-xs dark:shadow-sm font-medium',
      outline:
        'border border-[#A9DEC8] hover:border-[#12A879] dark:border-[#1B6348] dark:hover:border-[#21C58A] bg-[#DDF5EA]/40 hover:bg-[#DDF5EA] dark:bg-[#103A2A]/40 dark:hover:bg-[#103A2A] text-[#0B2B1F] dark:text-[#E7F5EE] font-medium',
      ghost:
        'text-[#49665A] hover:text-[#0B2B1F] dark:text-[#A8C7B8] dark:hover:text-[#E7F5EE] hover:bg-[#EEF5F0] dark:hover:bg-[#0E2D21] font-medium',
      danger:
        'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 focus:ring-rose-500 font-medium',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-lg',
      md: 'text-sm px-4.5 py-2.5 gap-2 rounded-xl',
      lg: 'text-base px-6 py-3.5 gap-2.5 rounded-2xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[3px]">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
