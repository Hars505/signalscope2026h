import { useState, useCallback } from 'react';
import { submitImageAnalysis } from '../lib/api';

export const STAGES = [
  { key: 'uploading', label: 'Uploading image...', description: 'Securing payload and computing image SHA-256 fingerprint', progress: 15 },
  { key: 'scanning', label: 'Scanning image...', description: 'Normalizing resolution to 224×224 and pre-processing color spaces', progress: 32 },
  { key: 'extracting', label: 'Extracting visual signals...', description: 'Running Vision Transformer (ViT-B/16) spatial feature extractor', progress: 52 },
  { key: 'frequency', label: 'Analyzing frequency patterns...', description: 'Computing 2D Fast Fourier Transform (FFT) high-frequency power spectrum', progress: 70 },
  { key: 'fusion', label: 'Fusing model features...', description: 'Cross-attention fusion of spatial anomalies with spectral residuals', progress: 88 },
  { key: 'calibrating', label: 'Calibrating prediction...', description: 'Applying empirical temperature scaling to softmax probability logits', progress: 96 },
  { key: 'complete', label: 'Analysis complete', description: 'Generating grounded explanation and Grad-CAM attention heatmap', progress: 100 },
];

export function useScan() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [stage, setStage] = useState('idle');
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectFile = useCallback((file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Image file is too large (max 10MB). Please select a compressed image.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    setStage('idle');
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setStage('idle');
    setStageIndex(-1);
    setResult(null);
    setError(null);
  }, [previewUrl]);

  const executeAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setError(null);
    setResult(null);

    setStage('uploading');
    setStageIndex(0);

    const stagesSequence = [
      'scanning',
      'extracting',
      'frequency',
      'fusion',
      'calibrating',
    ];

    const apiPromise = submitImageAnalysis(selectedFile, caption);

    try {
      for (let i = 0; i < stagesSequence.length; i++) {
        await new Promise((r) => setTimeout(r, 450));
        setStage(stagesSequence[i]);
        setStageIndex(i + 1);
      }

      const scanData = await apiPromise;

      setStage('complete');
      setStageIndex(STAGES.length - 1);
      await new Promise((r) => setTimeout(r, 300));
      setResult(scanData);
    } catch (err) {
      setStage('error');
      setError(err?.message || 'We could not analyze this image. Please try again.');
    }
  }, [selectedFile, caption]);

  return {
    selectedFile,
    previewUrl,
    caption,
    setCaption,
    stage,
    currentStageInfo: stageIndex >= 0 && stageIndex < STAGES.length ? STAGES[stageIndex] : null,
    result,
    error,
    handleSelectFile,
    handleClear,
    executeAnalysis,
  };
}
