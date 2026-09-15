import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, AlertCircle, Sparkles } from 'lucide-react';

export const Dropzone = ({ onFileSelect, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
    e.target.value = '';
  };

  const loadPresetSample = async (type) => {
    try {
      const url =
        type === 'synthetic'
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80';
      const filename = type === 'synthetic' ? 'sample_synthetic_render.jpg' : 'sample_camera_photo.jpg';

      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      onFileSelect(file);
    } catch (err) {
      console.error('Failed to load sample image', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {/* Soft emerald atmospheric nebula behind upload card with calm breathing glow (6-8s) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/15 blur-[90px] rounded-full pointer-events-none -z-10 animate-breathe" />

      {/* Upload Zone Card */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image by dropping a file or browsing"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`group relative p-10 sm:p-14 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-xl ${
          isDragOver
            ? 'border-emerald-500 dark:border-[#21C58A] bg-emerald-50 dark:bg-[#103A2A] shadow-[0_0_30px_rgba(22,168,98,0.25)] dark:shadow-[0_0_30px_rgba(33,197,138,0.25)] scale-[1.01]'
            : 'border-[#16A34A]/25 dark:border-[#1B6348] hover:border-emerald-500 dark:hover:border-[#21C58A] bg-white/75 dark:bg-[#0B241A]/90 hover:bg-white dark:hover:bg-[#0E2D21] shadow-xl hover:-translate-y-[2px]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center relative z-10">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isDragOver
                ? 'bg-emerald-500/20 dark:bg-[#21C58A]/20 text-emerald-800 dark:text-[#21C58A] scale-110'
                : 'bg-emerald-50 dark:bg-[#103A2A] border border-emerald-200 dark:border-[#1B6348] text-emerald-700 dark:text-[#21C58A] group-hover:-translate-y-1 group-hover:scale-105 shadow-xs'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#0D331E] dark:text-[#E7F5EE] mb-2 font-sans">
            {isDragOver ? 'Release to inspect file' : 'Drop image here'}
          </h3>
          <p className="text-sm text-[#3D5C49] dark:text-[#A8C7B8] mb-7">
            or <span className="text-emerald-700 dark:text-[#36D99B] hover:text-emerald-800 dark:hover:text-[#8DE8C5] font-semibold underline underline-offset-4">browse files</span> from your computer
          </p>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0E2D21] border border-[#16A34A]/15 dark:border-[#1B6348] text-xs font-mono text-[#3D5C49] dark:text-[#A8C7B8] shadow-2xs">
            <span>JPG • JPEG • PNG • WEBP</span>
            <span>•</span>
            <span>Max 10 MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-700/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#3D5C49] dark:text-[#A8C7B8] px-2">
        <span className="flex items-center gap-1.5 font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#21C58A]" />
          Quick Test Images:
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadPresetSample('synthetic');
            }}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E2D21] hover:bg-emerald-50 dark:hover:bg-[#103A2A] border border-[#16A34A]/15 dark:border-[#1B6348] text-[#0D331E] dark:text-[#E7F5EE] transition-colors shadow-2xs font-medium"
          >
            Sample Synthetic (Diffusion)
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadPresetSample('authentic');
            }}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0E2D21] hover:bg-emerald-50 dark:hover:bg-[#103A2A] border border-[#16A34A]/15 dark:border-[#1B6348] text-[#0D331E] dark:text-[#E7F5EE] transition-colors shadow-2xs font-medium"
          >
            Sample Authentic (DSLR)
          </button>
        </div>
      </div>
    </div>
  );
};
