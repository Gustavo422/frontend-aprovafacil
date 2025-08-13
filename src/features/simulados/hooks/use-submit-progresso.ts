import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simuladosKeys } from '@/src/providers/query-client';
import type { ProgressoUsuarioSimulado } from '../api/contracts';
import { useConcurso } from '@/contexts/ConcursoContext';

type SubmitPayload = {
  answers: Record<number, string>;
  score: number;
  timeTaken: number; // minutos
};

/**
 * Envia o resultado do simulado e atualiza otimistamente o progresso do usuário.
 */
export function useSubmitProgressoSimulado(slug: string) {
  const queryClient = useQueryClient();
  const { activeConcursoId } = useConcurso();

  return useMutation<unknown, Error, SubmitPayload, { previous: ProgressoUsuarioSimulado | null | undefined }>({
    mutationFn: async (payload: SubmitPayload) => {
      const res = await fetch(`/api/simulados/slug/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message = 'Erro ao salvar progresso';
        try {
          const errJson = await res.json();
          message = errJson?.error || message;
        } catch {}
        throw new Error(message);
      }
      return res.json();
    },
    onMutate: async ({ score, timeTaken, answers }) => {
      await queryClient.cancelQueries({ queryKey: simuladosKeys.progresso(slug) });
      const previous = queryClient.getQueryData<ProgressoUsuarioSimulado | null>(simuladosKeys.progresso(slug));
      // Update otimista
      const optimistic: ProgressoUsuarioSimulado = {
        id: previous?.id ?? 'optimistic',
        usuario_id: previous?.usuario_id ?? 'me',
        simulado_id: previous?.simulado_id ?? 'unknown',
        pontuacao: score,
        tempo_gasto_minutos: timeTaken,
        respostas: answers,
        concluido_em: new Date().toISOString(),
        is_concluido: true,
      };
      queryClient.setQueryData(simuladosKeys.progresso(slug), optimistic);
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(simuladosKeys.progresso(slug), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: simuladosKeys.progresso(slug) });
      queryClient.invalidateQueries({ queryKey: simuladosKeys.detail(slug, activeConcursoId) });
      queryClient.invalidateQueries({ queryKey: simuladosKeys.list({ activeConcursoId }) });
    },
  });
}


