function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function dataKey(key: string): string {
  return `simulados:data:${key}`;
}

function tsKey(key: string): string {
  return `simulados:data:ts:${key}`;
}

export function getCachedJson<T>(key: string): { data: T | null; updatedAtMs: number | null } {
  if (!isBrowser()) return { data: null, updatedAtMs: null };
  try {
    const raw = localStorage.getItem(dataKey(key));
    const ts = localStorage.getItem(tsKey(key));
    if (!raw) return { data: null, updatedAtMs: ts ? Number(ts) : null };
    const parsed = JSON.parse(raw) as T;
    return { data: parsed, updatedAtMs: ts ? Number(ts) : null };
  } catch {
    return { data: null, updatedAtMs: null };
  }
}

export function setCachedJson<T>(key: string, value: T, updatedAtMs?: number): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(dataKey(key), JSON.stringify(value));
    if (typeof updatedAtMs === 'number') localStorage.setItem(tsKey(key), String(updatedAtMs));
    else localStorage.removeItem(tsKey(key));
  } catch {
    // ignore
  }
}



