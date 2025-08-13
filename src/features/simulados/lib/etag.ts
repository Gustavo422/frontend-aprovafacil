// Lightweight ETag/Last-Modified storage for client-side revalidation
// Safe for SSR: guards window access

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function makeKey(key: string): string {
  return `simulados:etag:${key}`;
}

function makeLmKey(key: string): string {
  return `simulados:lastmod:${key}`;
}

export function getETag(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(makeKey(key));
  } catch {
    return null;
  }
}

export function setETag(key: string, value: string | null | undefined): void {
  if (!isBrowser()) return;
  try {
    const k = makeKey(key);
    if (!value) localStorage.removeItem(k);
    else localStorage.setItem(k, value);
  } catch {
    // ignore
  }
}

export function getLastModified(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(makeLmKey(key));
  } catch {
    return null;
  }
}

export function setLastModified(key: string, value: string | null | undefined): void {
  if (!isBrowser()) return;
  try {
    const k = makeLmKey(key);
    if (!value) localStorage.removeItem(k);
    else localStorage.setItem(k, value);
  } catch {
    // ignore
  }
}


