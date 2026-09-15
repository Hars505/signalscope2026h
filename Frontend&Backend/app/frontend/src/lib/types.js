/**
 * SignalScope constants and schema definitions in pure JavaScript
 */

export const VERDICT_LABELS = {
  AI_GENERATED: 'ai_generated',
  REAL: 'real',
};

export const SCAN_STAGES = [
  'idle',
  'uploading',
  'scanning',
  'extracting',
  'frequency',
  'fusion',
  'calibrating',
  'complete',
  'error',
];
