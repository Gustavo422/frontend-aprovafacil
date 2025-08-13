import { useQuery } from '@tanstack/react-query';
import type { ProgressoUsuarioSimulado } from '../api/contracts';
import { generateCorrelationId } from '../lib/correlation';
import { getProgressoBySlug } from '../api/fetchers';
import { simuladosKeys } from '@/src/providers/query-client';

export function useProgressoSimulado(slug: string) {
  return useQuery<ProgressoUsuarioSimulado | null, Error>({
    queryKey: simuladosKeys.progresso(slug),
    queryFn: () => getProgressoBySlug(slug),
    enabled: !!slug,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 2,
    meta: {
      endpoint: '/api/simulados/slug/[slug]/progresso',
      params: { slug },
      correlationId: generateCorrelationId(),
    },
  });
}