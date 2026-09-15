export function cn(...inputs) {
  return inputs.flat().filter(Boolean).join(' ');
}

export function formatConfidence(confidence) {
  if (typeof confidence !== 'number') return '—';
  return `${(confidence * 100).toFixed(1)}%`;
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getVerdictMeta(label, confidence, threshold = 0.5) {
  const isBorderline = Math.abs(confidence - threshold) < 0.1;

  if (isBorderline) {
    return {
      title: 'Inconclusive Assessment',
      sublabel: 'Near decision threshold',
      colorClass: 'text-amber-800 dark:text-amber-300',
      bgClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-300/80 dark:border-amber-700/60',
      glowClass: 'shadow-glow-amber',
      accent: '#F59E0B',
      isBorderline: true,
      description: 'The model has low confidence in this assessment. We recommend treating this result as inconclusive and verifying through secondary forensic methods.'
    };
  }

  if (label === 'ai_generated') {
    return {
      title: 'Likely AI-Generated',
      sublabel: 'Synthetic artifacts detected',
      colorClass: 'text-rose-700 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/50 border-rose-300/80 dark:border-rose-700/60',
      glowClass: 'shadow-lg shadow-rose-500/10',
      accent: '#E11D48',
      isBorderline: false,
      description: 'High-probability indicator of synthetic generation patterns detected across spatial and frequency representations.'
    };
  }

  return {
    title: 'Likely Real',
    sublabel: 'Natural camera sensor signatures',
    colorClass: 'text-emerald-700 dark:text-[#21C58A]',
    bgClass: 'bg-emerald-50 dark:bg-[#103A2A] border-emerald-300/80 dark:border-[#1B6348]',
    glowClass: 'shadow-glow-emerald',
    accent: '#10A760',
    isBorderline: false,
    description: 'Image displays consistent spatial frequency spectra and physical illumination patterns typical of authentic camera sensors.'
  };
}
