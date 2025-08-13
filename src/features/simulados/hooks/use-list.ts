import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListarSimuladosQuery, Simulado, PaginatedSimulados } from '../api/contracts';
import { useConcurso } from '@/contexts/ConcursoContext';
import { useSimuladosRealtime } from './use-realtime';
import { generateCorrelationId } from '../lib/correlation';
import { listSimulados } from '../api/fetchers';
import { simuladosKeys } from '@/src/providers/query-client';

export function useListarSimulados(filters: Omit<ListarSimuladosQuery, 'concurso_id'> = {}) {
  const { activeConcursoId } = useConcurso();
  useSimuladosRealtime({ concurso_id: activeConcursoId ?? undefined });

  return useQuery<PaginatedSimulados, Error>({
    queryKey: simuladosKeys.list({ activeConcursoId, filters }),
    queryFn: () => listSimulados(activeConcursoId, filters),
    // select: projetar apenas campos usados na UI
    select: (payload) => ({
      items: (payload?.items ?? []).map((s) => ({
        id: s.id,
        slug: s.slug,
        titulo: s.titulo,
        descricao: s.descricao,
        dificuldade: s.dificuldade,
        numero_questoes: s.numero_questoes,
        tempo_minutos: s.tempo_minutos,
        criado_em: s.criado_em,
        status: s.status,
      })) as Simulado[],
      pagination: payload?.pagination,
    }),
    placeholderData: keepPreviousData,
    meta: {
      endpoint: '/api/simulados',
      params: { activeConcursoId, ...filters },
      correlationId: generateCorrelationId(),
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 2,
  });
}


