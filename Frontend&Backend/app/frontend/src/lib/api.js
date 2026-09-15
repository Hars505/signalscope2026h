import { createMockScanResult, INITIAL_MOCK_HISTORY } from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const LOCAL_HISTORY_CACHE_VERSION = '2026-09-15-history-purge-v2';
const LOCAL_HISTORY_VERSION_KEY = 'signalscope_history_version';
const PURGED_HISTORY_IDS = new Set([26, 27, 28, 30, 33, 34, 36, 37]);

// Mock mode determination (env flag or manual user toggle via localStorage)
export function isMockModeEnabled() {
  const manualPreference = localStorage.getItem('signalscope_use_mock');
  if (manualPreference !== null) {
    return manualPreference === 'true';
  }
  return import.meta.env.VITE_USE_MOCK_API === 'true';
}

export function setMockModePreference(enabled) {
  localStorage.setItem('signalscope_use_mock', String(enabled));
}

function resetLocalHistoryCacheIfNeeded() {
  if (localStorage.getItem(LOCAL_HISTORY_VERSION_KEY) === LOCAL_HISTORY_CACHE_VERSION) {
    return;
  }

  localStorage.removeItem('signalscope_history_items');
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('signalscope_scan_')) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(LOCAL_HISTORY_VERSION_KEY, LOCAL_HISTORY_CACHE_VERSION);
}

// Local history store helper. The cache version clears records from before the
// server-side history was permanently deleted and renumbered.
function getLocalHistory({ seed = false } = {}) {
  try {
    resetLocalHistoryCacheIfNeeded();
    const raw = localStorage.getItem('signalscope_history_items');
    if (!raw) {
      const initial = seed ? INITIAL_MOCK_HISTORY : [];
      localStorage.setItem('signalscope_history_items', JSON.stringify(initial));
      return initial;
    }
    const history = JSON.parse(raw);
    const filtered = history.filter((item) => !PURGED_HISTORY_IDS.has(Number(item.id)));
    if (filtered.length !== history.length) {
      localStorage.setItem('signalscope_history_items', JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return seed ? INITIAL_MOCK_HISTORY : [];
  }
}

function appendLocalMockHistory(detail) {
  try {
    if (PURGED_HISTORY_IDS.has(Number(detail.id))) {
      localStorage.removeItem(`signalscope_scan_${detail.id}`);
      return;
    }
    const list = getLocalHistory();
    const newItem = {
      id: detail.id,
      label: detail.label,
      confidence: detail.confidence,
      image: detail.image,
      thumbnail_url: detail.thumbnail_url || detail.image,
      created_at: detail.created_at,
    };
    const updated = [newItem, ...list];
    localStorage.setItem('signalscope_history_items', JSON.stringify(updated.slice(0, 50)));
    localStorage.setItem(`signalscope_scan_${detail.id}`, JSON.stringify(detail));
  } catch (err) {
    console.warn('Failed to cache mock history to localStorage:', err);
  }
}

/**
 * Health check to see if Django backend is reachable
 */
export async function checkBackendStatus() {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BASE_URL}/api/docs/schema/`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error('Bad response');
    const latency = Math.round(performance.now() - start);
    return { online: true, url: BASE_URL, latency };
  } catch {
    return { online: false, url: BASE_URL };
  }
}

/**
 * Upload an image and execute calibrated ML analysis
 */
export async function submitImageAnalysis(file, caption, onUploadProgress) {
  if (isMockModeEnabled()) {
    // Simulate realistic inference processing time
    await new Promise((r) => setTimeout(r, 800));
    const result = await createMockScanResult(file, caption);
    appendLocalMockHistory(result);
    return result;
  }

  const formData = new FormData();
  formData.append('image', file);
  if (caption && caption.trim().length > 0) {
    formData.append('caption', caption.trim());
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/api/scan/`);
      
      if (onUploadProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onUploadProgress({ loaded: e.loaded, total: e.total });
          }
        };
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject({ response: { data: err }, status: xhr.status });
          } catch (e) {
            reject(new Error('Upload failed'));
          }
        }
      };
      
      xhr.onerror = () => reject({ code: 'ERR_NETWORK' });
      xhr.send(formData);
    });
    if (data.image && data.image.startsWith('/')) {
      data.image = `${BASE_URL}${data.image}`;
    }
    if (data.heatmap_url && data.heatmap_url.startsWith('/')) {
      data.heatmap_url = `${BASE_URL}${data.heatmap_url}`;
    }
    if (data.thumbnail_url && data.thumbnail_url.startsWith('/')) {
      data.thumbnail_url = `${BASE_URL}${data.thumbnail_url}`;
    }

    appendLocalMockHistory(data);
    return data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      throw new Error(
        'Unable to connect to SignalScope backend. Verify Django is running on ' +
          BASE_URL +
          ' or switch to Mock API mode.'
      );
    }
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      'Inference service failed. Please try a different image.';
    throw new Error(message);
  }
}

/**
 * Fetch scan history list
 */
export async function fetchScanHistory(page = 1) {
  if (isMockModeEnabled()) {
    await new Promise((r) => setTimeout(r, 200));
    const all = getLocalHistory({ seed: true });
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      count: all.length,
      next: end < all.length ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: all.slice(start, end),
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/history/?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    const results = data.results.map((item) => ({
      ...item,
      image: item.image?.startsWith('/') ? `${BASE_URL}${item.image}` : item.image,
      thumbnail_url: item.thumbnail_url?.startsWith('/') ? `${BASE_URL}${item.thumbnail_url}` : item.thumbnail_url,
    }));
    return {
      ...data,
      results,
    };
  } catch {
    const local = getLocalHistory();
    return {
      count: local.length,
      next: null,
      previous: null,
      results: local,
    };
  }
}

/**
 * Fetch detailed scan result by ID
 */
export async function fetchScanDetail(id) {
  if (isMockModeEnabled()) {
    const cached = localStorage.getItem(`signalscope_scan_${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    const history = getLocalHistory({ seed: true });
    const found = history.find((h) => h.id === id);
    if (found) {
      return {
        id: found.id,
        label: found.label,
        confidence: found.confidence,
        threshold_used: 0.5,
        image: found.image,
        thumbnail_url: found.thumbnail_url,
        heatmap_url: found.label === 'ai_generated' ? found.image : null,
        created_at: found.created_at,
        explanation: ['Cached assessment record retrieved from local telemetry log.'],
        generator_attribution: found.label === 'ai_generated' ? 'diffusion-family' : null,
      };
    }
    throw new Error('Scan record not found in telemetry storage.');
  }

  try {
    const response = await fetch(`${BASE_URL}/api/history/${id}/`);
    if (!response.ok) {
      const error = new Error('Request failed');
      error.response = { status: response.status };
      throw error;
    }
    const data = await response.json();
    if (data.image && data.image.startsWith('/')) {
      data.image = `${BASE_URL}${data.image}`;
    }
    if (data.heatmap_url && data.heatmap_url.startsWith('/')) {
      data.heatmap_url = `${BASE_URL}${data.heatmap_url}`;
    }
    return data;
  } catch (error) {
    // Guest scans are cached locally when the upload succeeds. Django
    // correctly protects server-side history, so use that cache on 401.
    if (error.response?.status === 401) {
      const cached = localStorage.getItem(`signalscope_scan_${id}`);
      if (cached) {
        return JSON.parse(cached);
      }
      throw new Error(
        'This scan requires authentication. Sign in to inspect server-side history.'
      );
    }
    throw error;
  }
}
