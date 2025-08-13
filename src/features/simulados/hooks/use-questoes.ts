import { useQuery } from '@tanstack/react-query';
import type { QuestaoSimulado } from '../api/contracts';
import { useSimuladosRealtime } from './use-realtime';
import { generateCorrelationId } from '../lib/correlation';
import { getQuestoesBySlug } from '../api/fetchers';
import { simuladosKeys } from '@/src/providers/query-client';

export function useQuestoesDoSimulado(slug: string, activeConcursoId?: string | null) {
  useSimuladosRealtime({ slug });
  return useQuery<QuestaoSimulado[], Error>({
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
}


