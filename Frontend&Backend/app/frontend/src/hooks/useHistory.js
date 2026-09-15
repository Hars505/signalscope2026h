import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchScanHistory } from '../lib/api';

export function useHistory() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchScanHistory(1);
      setItems(response.results);
    } catch (err) {
      setError(err?.message || 'Failed to retrieve scan history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (verdictFilter !== 'all' && item.label !== verdictFilter) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchLabel = item.label.toLowerCase().includes(q);
          const matchId = String(item.id).includes(q);
          return matchLabel || matchId;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'confidence') {
          return b.confidence - a.confidence;
        }
        return 0;
      });
  }, [items, verdictFilter, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const total = items.length;
    const aiCount = items.filter((i) => i.label === 'ai_generated').length;
    const realCount = items.filter((i) => i.label === 'real').length;
    const avgConfidence =
      total > 0
        ? Number((items.reduce((acc, curr) => acc + curr.confidence, 0) / total).toFixed(3))
        : 0;

    return {
      total,
      aiCount,
      realCount,
      avgConfidence,
    };
  }, [items]);

  return {
    items: filteredItems,
    rawCount: items.length,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    verdictFilter,
    setVerdictFilter,
    sortBy,
    setSortBy,
    stats,
    refresh: loadHistory,
  };
}
