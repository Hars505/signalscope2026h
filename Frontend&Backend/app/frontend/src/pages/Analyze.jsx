import React from 'react';
import { useScan } from '../hooks/useScan';
import { Dropzone } from '../components/upload/Dropzone';
import { ImagePreview } from '../components/upload/ImagePreview';
import { ScanningBeam } from '../components/analysis/ScanningBeam';
import { ResultCard } from '../components/prediction/ResultCard';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/ui/ScrollReveal';

export const Analyze = () => {
  const {
    selectedFile,
    previewUrl,
    caption,
    setCaption,
    stage,
    currentStageInfo,
    result,
    error,
    handleSelectFile,
    handleClear,
    executeAnalysis,
  } = useScan();

  const isScanning = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header with ScrollReveal */}
      <ScrollReveal className="text-center max-w-2xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#103A2A] border border-emerald-300/60 dark:border-[#1B6348] text-xs font-mono text-emerald-800 dark:text-[#8DE8C5] font-semibold mb-3 shadow-xs">
          FORENSIC VERIFICATION ENGINE
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0D331E] dark:text-[#E7F5EE] tracking-tight font-sans">
          Image Authenticity Analysis
        </h1>
        <p className="text-[#3D5C49] dark:text-[#A8C7B8] mt-2 text-sm sm:text-base leading-relaxed">
          Upload an image to inspect spatial patch consistency, high-frequency residuals, and calibrated synthetic probability.
        </p>
      </ScrollReveal>

      {/* Main Analysis Workflow */}
      <div className="pt-4">
        {!selectedFile && !result && (
          <Dropzone onFileSelect={handleSelectFile} error={error} />
        )}

        {selectedFile && previewUrl && !isScanning && !result && (
          <ImagePreview
            file={selectedFile}
            previewUrl={previewUrl}
            caption={caption}
            setCaption={setCaption}
            onClear={handleClear}
            onStartAnalysis={executeAnalysis}
          />
        )}

        {isScanning && previewUrl && (
          <ScanningBeam
            previewUrl={previewUrl}
            stageInfo={currentStageInfo}
          />
        )}

        {stage === 'error' && (
          <div className="max-w-xl mx-auto p-6 rounded-2xl glass-panel spotlight-card border border-rose-300 dark:border-rose-700/60 text-center space-y-4 shadow-md bg-white dark:bg-[#0B241A]">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-1">Analysis Could Not Complete</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                {error || 'An unexpected error occurred during inference execution.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={handleClear}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={executeAnalysis}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retry Analysis
              </Button>
            </div>
          </div>
        )}

        {result && (
          <ResultCard
            scan={result}
            onReset={handleClear}
          />
        )}
      </div>
    </div>
  );
};
