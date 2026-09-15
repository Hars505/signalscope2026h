/**
 * Generates an in-memory realistic Grad-CAM style heatmap overlay from an image file
 * using HTML5 Canvas radial gradients and jet-colormap simulations.
 */
export async function generateSyntheticHeatmap(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = img.naturalWidth || 512;
      const height = img.naturalHeight || 512;
      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(url);
        return;
      }

      // Fill with dark thermal base
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, width, height);

      // Create realistic Grad-CAM activation hot-spots
      const spots = [
        { x: width * 0.45, y: height * 0.42, r: width * 0.28, intensity: 1.0 },
        { x: width * 0.62, y: height * 0.55, r: width * 0.22, intensity: 0.85 },
        { x: width * 0.32, y: height * 0.68, r: width * 0.18, intensity: 0.65 },
        { x: width * 0.75, y: height * 0.30, r: width * 0.15, intensity: 0.5 },
      ];

      for (const spot of spots) {
        const rad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r);
        // Jet-style / Turbo thermal colormap
        rad.addColorStop(0, `rgba(244, 63, 94, ${0.9 * spot.intensity})`);
        rad.addColorStop(0.3, `rgba(245, 158, 11, ${0.75 * spot.intensity})`);
        rad.addColorStop(0.6, `rgba(16, 185, 129, ${0.5 * spot.intensity})`);
        rad.addColorStop(0.85, `rgba(6, 182, 212, ${0.25 * spot.intensity})`);
        rad.addColorStop(1, 'rgba(10, 13, 24, 0)');

        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const heatmapDataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(heatmapDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(url);
    };

    img.src = url;
  });
}

/**
 * Seed historical scans stored in localStorage for offline testing and history page
 */
export const INITIAL_MOCK_HISTORY = [
  {
    id: 101,
    label: 'ai_generated',
    confidence: 0.912,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
  },
  {
    id: 102,
    label: 'real',
    confidence: 0.948,
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=200&q=80',
    created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  },
  {
    id: 103,
    label: 'ai_generated',
    confidence: 0.835,
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=200&q=80',
    created_at: new Date(Date.now() - 3600 * 1000 * 42).toISOString(),
  },
];

export async function createMockScanResult(file, caption) {
  const isAiLikely =
    file.name.toLowerCase().includes('ai') ||
    file.name.toLowerCase().includes('synth') ||
    file.name.toLowerCase().includes('fake') ||
    Math.random() > 0.45;

  const confidence = isAiLikely
    ? 0.78 + Math.random() * 0.18
    : 0.82 + Math.random() * 0.15;

  const objectUrl = URL.createObjectURL(file);
  const heatmapUrl = isAiLikely ? await generateSyntheticHeatmap(file) : null;

  const explanation = isAiLikely
    ? [
        'Fourier transform reveals abnormal high-frequency periodic grid peaks characteristic of latent upsampling.',
        'Spatial feature map displays subtle edge discontinuity and unnatural specular reflections.',
        'Local texture entropy deviates from natural optical sensor noise distributions.',
      ]
    : [
        'Spatial frequency power spectrum matches standard 1/f natural scene decay curves.',
        'Consistent optical chromatic aberration and sensor Bayer-pattern micro-noise present.',
        'Specular highlight geometry obeys physical directional illumination bounds.',
      ];

  const degradation_tests = [
    { id: 1, transform_type: 'JPEG Recompression (Q=75)', confidence_after: Number((confidence * 0.97).toFixed(3)) },
    { id: 2, transform_type: 'Gaussian Blur (σ=1.0)', confidence_after: Number((confidence * 0.95).toFixed(3)) },
    { id: 3, transform_type: 'Bilinear Downscale (0.5x)', confidence_after: Number((confidence * 0.96).toFixed(3)) },
  ];

  return {
    id: Date.now(),
    label: isAiLikely ? 'ai_generated' : 'real',
    confidence: Number(confidence.toFixed(3)),
    threshold_used: 0.5,
    image: objectUrl,
    thumbnail_url: objectUrl,
    heatmap_url: heatmapUrl,
    explanation,
    generator_attribution: isAiLikely ? 'diffusion-family' : null,
    image_width: 1024,
    image_height: 1024,
    created_at: new Date().toISOString(),
    degradation_tests,
    file_size: file.size,
    mime_type: file.type,
    filename: file.name,
  };
}
