import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Simulado } from '../api/contracts';
import { useDebounce } from '@/src/hooks/useOptimizedState';

type UseSimuladosSearchOptions = {
  items: Simulado[];
  query: string;
  limit?: number;
};

export function useSimuladosSearch({ items, query, limit = 8 }: UseSimuladosSearchOptions) {
  const debounced = useDebounce(query, 200);
  const fuse = useMemo(() => new Fuse(items ?? [], {
    keys: ['titulo'],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [items]);

  const results = useMemo(() => {
    const q = (debounced ?? '').trim();
    if (!q) return [] as Simulado[];
    return fuse.search(q).map((r) => r.item).slice(0, limit);
  }, [debounced, fuse, limit]);

  return results;
}


