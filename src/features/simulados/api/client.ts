import { getBackendUrl } from '@/lib/api-utils';
import { extractAuthToken } from '@/lib/auth-utils';
import type { ApiEnvelope, ListarSimuladosQuery, ProgressoUsuarioSimulado, QuestaoSimulado, Simulado, CreateSimuladoInput } from './contracts';

async function doGet<T>(request: Request, path: string, query?: string): Promise<ApiEnvelope<T>> {
  const token = extractAuthToken(request);
  const { isValid, url, error } = getBackendUrl(path, query);
  if (!isValid) return { success: false, error } as ApiEnvelope<T>;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json();
  return json as ApiEnvelope<T>;
}

export const simuladosApi = {
  listar: (request: Request, params: ListarSimuladosQuery = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.append(k, String(v));
    });
    const qs = search.toString();
    return doGet<Simulado[]>(request, '/api/simulados', qs ? `?${qs}` : undefined);
  },

  detalhePorSlug: (request: Request, slug: string) =>
    doGet<Simulado>(request, `/api/simulados/slug/${slug}`),

  questoesPorSlug: (request: Request, slug: string) =>
    doGet<QuestaoSimulado[]>(request, `/api/simulados/slug/${slug}/questoes`),

  progressoPorSlug: (request: Request, slug: string) =>
    doGet<ProgressoUsuarioSimulado | null>(request, `/api/simulados/slug/${slug}/progresso`),
  
  criar: async (request: Request, payload: CreateSimuladoInput) => {
    const token = extractAuthToken(request);
    const { isValid, url, error } = getBackendUrl(`/api/simulados`);
    if (!isValid) return { success: false, error } as ApiEnvelope<Simulado>;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json as ApiEnvelope<Simulado>;
  },
};


