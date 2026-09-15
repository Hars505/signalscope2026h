import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'signalscope-modal-title' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#06130E]/60 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative flex max-h-[calc(100vh-2rem)] w-full ${maxWidth} flex-col bg-white dark:bg-[#0B241A] border border-[#A9DEC8]/70 dark:border-[rgba(141,232,197,0.18)] rounded-2xl shadow-2xl p-6 z-10 my-8 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#A9DEC8]/50 dark:border-[rgba(141,232,197,0.12)] mb-5">
              {title && (
                <h3 id="signalscope-modal-title" className="text-lg font-bold text-[#0B2B1F] dark:text-[#E7F5EE] flex items-center gap-2 font-sans">
                  {title}
                </h3>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#71867C] dark:text-[#769789] hover:text-[#0B2B1F] dark:hover:text-[#E7F5EE] hover:bg-[#EEF5F0] dark:hover:bg-[#103A2A] transition-colors ml-auto"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    ,
    document.body
  );
};
