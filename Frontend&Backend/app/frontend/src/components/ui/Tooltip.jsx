import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const Tooltip = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs text-[#0B2B1F] dark:text-[#E7F5EE] bg-white dark:bg-[#0E2D21] border border-[#A9DEC8] dark:border-[#1B6348] rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-150 font-sans shadow-md',
            position === 'top' && '-top-9 left-1/2 -translate-x-1/2',
            position === 'bottom' && '-bottom-9 left-1/2 -translate-x-1/2'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
