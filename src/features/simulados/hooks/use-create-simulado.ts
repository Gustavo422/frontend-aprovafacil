import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSimuladoInput, Simulado } from '../api/contracts';
import { createSimulado } from '../api/fetchers';
import { useConcurso } from '@/contexts/ConcursoContext';
import { simuladosKeys } from '@/src/providers/query-client';

export function useCreateSimulado() {
  const queryClient = useQueryClient();
  const { activeConcursoId } = useConcurso();

  return useMutation<Simulado, Error, CreateSimuladoInput>({
    mutationFn: (payload) => createSimulado(payload),
    onSuccess: (created) => {
      // Invalida lista por concurso e detalhe por slug recém-criado
      queryClient.invalidateQueries({ queryKey: simuladosKeys.list({ activeConcursoId }) });
      if (created?.slug) {
        queryClient.invalidateQueries({ queryKey: simuladosKeys.detail(created.slug, activeConcursoId) });
      }
    },
  });
}


