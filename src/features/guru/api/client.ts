import { getBackendUrl } from '@/lib/api-utils';
import { extractAuthToken } from '@/lib/auth-utils';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export async function apiGet<T>(request: Request, path: string, query?: string): Promise<ApiResponse<T>> {
  const token = extractAuthToken(request);
  const { isValid, url, error } = getBackendUrl(path, query);
  if (!isValid) return { success: false, error };

  const correlationId = generateCorrelationId();

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-correlation-id': correlationId,
    },
  });
  const json = await res.json();
  return { ...(json as ApiResponse<T>) };
}

function generateCorrelationId(): string {
  // Leve, sem dependências externas
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `guru-${time}-${rand}`;
}


