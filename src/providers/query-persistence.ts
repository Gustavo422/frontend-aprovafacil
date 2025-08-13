import { dehydrate, hydrate, isServer, type Query, type QueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'rq-persist:simulados';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function shouldDehydrateQuery(query: Query<unknown, Error, unknown, readonly unknown[]>): boolean {
  const [root] = query.queryKey;
  return root === 'simulados' && query.state.status === 'success';
}

function load(): unknown | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(state: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function persistNow(queryClient: QueryClient): void {
  const dehydrated = dehydrate(queryClient, { shouldDehydrateQuery });
  save(dehydrated);
}

export function setupQueryPersistence(queryClient: QueryClient): void {
  if (!isBrowser() || isServer) return;

  const initial = load();
  if (initial) {
    try {
      hydrate(queryClient, initial);
    } catch {
      // fallback: ignore invalid cache
    }
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;
  const schedulePersist = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => persistNow(queryClient), 1000);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    schedulePersist();
  });

  const onVisibility = () => persistNow(queryClient);
  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onVisibility);
  window.addEventListener('beforeunload', onVisibility);

  // Expor cleanup via window para hot-reload
  (window as any).__APROVA_RQ_PERSIST_CLEANUP__?.();
  (window as any).__APROVA_RQ_PERSIST_CLEANUP__ = () => {
    unsubscribe?.();
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onVisibility);
    window.removeEventListener('beforeunload', onVisibility);
    if (timeout) clearTimeout(timeout);
  };
}


