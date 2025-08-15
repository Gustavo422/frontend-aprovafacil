import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useConcursoQuery } from '@/hooks/useConcursoQuery';
import apiClient from '@/lib/api';

// Tipos para questões semanais
export interface QuestaoSemanal {
  id: string;
  numero_semana: number;
  ano: number;
  titulo: string;
  descricao?: string;
  questoes: Questao[];
  criado_em: string;
  atualizado_em: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  disciplina: string;
  assunto: string;
  nivel_dificuldade: 'facil' | 'medio' | 'dificil';
}

export interface SemanaAtual {
  questao_semanal: QuestaoSemanal | null;
  questoes: Questao[];
  historico: ProgressoSemana[];
  status: {
    semana_atual: number;
    inicio_semana_em: string;
    fim_semana_em: string;
    modo_desbloqueio: 'strict' | 'accelerated';
    tempo_restante?: number; // em segundos, apenas para modo strict
  };
}

export interface ProgressoSemana {
  id: string;
  usuario_id: string;
  questoes_semanais_id: string;
  numero_semana: number;
  ano: number;
  concluido_em: string;
  pontuacao: number;
  total_questoes: number;
  tempo_minutos: number;
  respostas: Array<{
    questao_id: string;
    resposta_selecionada: number;
    correta: boolean;
    tempo_segundos: number;
  }>;
}

export interface RoadmapItem {
  numero_semana: number;
  status: 'done' | 'current' | 'locked' | 'available';
  liberaEm?: string; // ISO string, apenas para status 'locked'
  titulo?: string;
  progresso?: {
    concluido: boolean;
    pontuacao?: number;
    tempo_minutos?: number;
  };
}

export interface HistoricoResponse {
  success: boolean;
  data: ProgressoSemana[];
  pagination: {
    nextCursor: string | null;
    limit: number;
    total: number;
  };
}

export interface ConcluirSemanaInput {
  numero_semana: number;
  respostas: Array<{
    questao_id: string;
    resposta_selecionada: number;
    tempo_segundos: number;
    correta?: boolean; // Opcional no input, será calculado no backend
  }>;
  pontuacao?: number;
  tempo_minutos?: number;
}

export interface ConcluirSemanaResponse {
  success: boolean;
  data: {
    progresso: ProgressoSemana;
    proxima_semana?: {
      numero_semana: number;
      liberaEm?: string;
    };
  };
  metadata?: {
    tempo_total_segundos: number;
    acertos: number;
    acuracia: number;
    ranking_posicao?: number;
  };
}

/**
 * Hook principal para questões semanais
 * Fornece todos os métodos necessários para gerenciar o estado das questões semanais
 */
export function useWeeklyQuestions() {
  const queryClient = useQueryClient();

  // Query para obter a semana atual
  const getAtual = useConcursoQuery<SemanaAtual>({
    endpoint: '/api/questoes-semanais/atual',
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
  });

  // Query para obter o roadmap completo
  const getRoadmap = useConcursoQuery<RoadmapItem[]>({
    endpoint: '/api/questoes-semanais/roadmap',
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Query para obter o histórico
  // Hook para obter o histórico
  const useHistorico = (cursor?: string, limit = 10) => {
    return useConcursoQuery<HistoricoResponse>({
      endpoint: `/api/questoes-semanais/historico${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`,
      staleTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    });
  };

  // Mutation para concluir uma semana com estado otimista
  const concluirSemana = useMutation<ConcluirSemanaResponse, Error, ConcluirSemanaInput>({
    mutationFn: async (input: ConcluirSemanaInput) => {
      const response = await apiClient.post(`/api/questoes-semanais/${input.numero_semana}/concluir`, {
        respostas: input.respostas,
        pontuacao: input.pontuacao,
        tempo_minutos: input.tempo_minutos,
      });
      return response.data;
    },
    onMutate: async (input) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['concurso-query', '/api/questoes-semanais/atual'] });
      await queryClient.cancelQueries({ queryKey: ['concurso-query', '/api/questoes-semanais/roadmap'] });

      // Snapshot do valor anterior
      const previousAtual = queryClient.getQueryData(['concurso-query', '/api/questoes-semanais/atual']);
      const previousRoadmap = queryClient.getQueryData(['concurso-query', '/api/questoes-semanais/roadmap']);

      // Estado otimista para a semana atual
      if (previousAtual) {
        queryClient.setQueryData(['concurso-query', '/api/questoes-semanais/atual'], (old: SemanaAtual | undefined) => {
          if (!old) return old;
          
          // Criar progresso otimista
          const progressoOtimista: ProgressoSemana = {
            id: `temp-${Date.now()}`,
            usuario_id: 'current-user', // Será substituído pelo backend
            questoes_semanais_id: old.questao_semanal?.id || '',
            numero_semana: input.numero_semana,
            ano: new Date().getFullYear(),
            concluido_em: new Date().toISOString(),
            pontuacao: input.pontuacao || 0,
            total_questoes: old.questoes.length,
            tempo_minutos: input.tempo_minutos || 0,
            respostas: input.respostas.map(r => ({
              ...r,
              correta: r.correta || false
            })),
          };

          return {
            ...old,
            historico: [progressoOtimista, ...old.historico],
          };
        });
      }

      // Estado otimista para o roadmap
      if (previousRoadmap) {
        queryClient.setQueryData(['concurso-query', '/api/questoes-semanais/roadmap'], (old: RoadmapItem[] | undefined) => {
          if (!old) return old;
          
          return old.map(item => {
            if (item.numero_semana === input.numero_semana) {
              return {
                ...item,
                status: 'done' as const,
                progresso: {
                  concluido: true,
                  pontuacao: input.pontuacao || 0,
                  tempo_minutos: input.tempo_minutos || 0,
                },
              };
            }
            return item;
          });
        });
      }

      // Retornar contexto para rollback
      return { previousAtual, previousRoadmap } as const;
    },
    onError: (err, input, context) => {
      // Rollback em caso de erro
      if (context && typeof context === 'object' && 'previousAtual' in context && context.previousAtual) {
        queryClient.setQueryData(['concurso-query', '/api/questoes-semanais/atual'], context.previousAtual);
      }
      if (context && typeof context === 'object' && 'previousRoadmap' in context && context.previousRoadmap) {
        queryClient.setQueryData(['concurso-query', '/api/questoes-semanais/roadmap'], context.previousRoadmap);
      }
      
      console.error('Erro ao concluir semana:', err);
    },
    onSettled: () => {
      // Revalidar dados após conclusão
      queryClient.invalidateQueries({ queryKey: ['concurso-query', '/api/questoes-semanais/atual'] });
      queryClient.invalidateQueries({ queryKey: ['concurso-query', '/api/questoes-semanais/roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['concurso-query', '/api/questoes-semanais/historico'] });
    },
  });

  return {
    // Queries
    getAtual,
    getRoadmap,
    useHistorico,
    
    // Mutations
    concluirSemana,
    
    // Utilitários
    isLoading: getAtual.isLoading || getRoadmap.isLoading,
    isError: getAtual.isError || getRoadmap.isError,
    error: getAtual.error || getRoadmap.error,
    
    // Estado do concurso
    hasConcurso: getAtual.hasConcurso,
    concursoId: getAtual.concursoId,
    isLoadingConcurso: getAtual.isLoadingConcurso,
  };
}

// Hooks individuais para uso específico (mantidos para compatibilidade)

export function useConcluirSemana() {
  const { concluirSemana } = useWeeklyQuestions();
  return concluirSemana;
}

export function useRoadmap() {
  const { getRoadmap } = useWeeklyQuestions();
  return getRoadmap;
}

export function useHistorico(cursor?: string, limit = 10) {
  const { useHistorico: useHistoricoHook } = useWeeklyQuestions();
  return useHistoricoHook(cursor, limit);
}

export function useSemanaAtual() {
  const { getAtual } = useWeeklyQuestions();
  return getAtual;
}


