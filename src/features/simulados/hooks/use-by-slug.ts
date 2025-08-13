import { useQuery } from '@tanstack/react-query';
import type { QuestaoSimulado, Simulado } from '../api/contracts';
import { useConcurso } from '@/contexts/ConcursoContext';
import { setActiveConcurso } from '@/src/lib/api';
import { useSimuladosRealtime } from './use-realtime';
import { generateCorrelationId } from '../lib/correlation';
import { getQuestoesBySlug, getSimuladoBySlug } from '../api/fetchers';
import { simuladosKeys } from '@/src/providers/query-client';

export function useBuscarSimuladoPorSlug(slug: string) {
  const { activeConcursoId } = useConcurso();

  // garantir sincronização do concurso ativo com o client global
  if (activeConcursoId) setActiveConcurso(activeConcursoId);

  const simuladoQuery = useQuery<Simulado | undefined>({
    queryKey: simuladosKeys.detail(slug, activeConcursoId),
    queryFn: () => getSimuladoBySlug(slug, activeConcursoId),
    enabled: !!slug,
    select: (s) =>
      s
        ? {
            id: s.id,
            slug: s.slug,
            titulo: s.titulo,
            descricao: s.descricao,
            tempo_minutos: s.tempo_minutos,
            numero_questoes: s.numero_questoes,
          } as Simulado
        : undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 2,
    meta: {
      endpoint: '/api/simulados/slug/[slug]',
      params: { slug },
      correlationId: generateCorrelationId(),
    },
  });

  const questoesQuery = useQuery<QuestaoSimulado[] | undefined>({
    queryKey: simuladosKeys.questoes(slug, activeConcursoId),
    queryFn: () => getQuestoesBySlug(slug, activeConcursoId),
    enabled: !!slug,
    select: (qs) =>
      (qs ?? []).map((q) => ({
        id: q.id,
        numero_questao: q.numero_questao,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        resposta_correta: q.resposta_correta,
        explicacao: q.explicacao,
        disciplina: q.disciplina ?? null,
        dificuldade: q.dificuldade ?? null,
      })) as QuestaoSimulado[],
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 2,
    meta: {
      endpoint: '/api/simulados/slug/[slug]/questoes',
      params: { slug },
      correlationId: generateCorrelationId(),
    },
  });

  // realtime: invalidações seletivas
  useSimuladosRealtime({ slug });

  return {
    simulado: simuladoQuery.data,
    questoes: questoesQuery.data,
    isLoading: simuladoQuery.isLoading || questoesQuery.isLoading,
    error: simuladoQuery.error || questoesQuery.error,
    refetch: async () => {
      await Promise.all([simuladoQuery.refetch(), questoesQuery.refetch()]);
    },
  } as const;
}


