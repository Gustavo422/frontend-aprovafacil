import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApostilaRepository } from '@/lib/repositories/apostila-repository';
import type { 
  ApostilaRow, 
  ApostilaContentRow, 
  UserApostilaProgressRow 
} from '@/types/database.types';

const apostilaRepo = new ApostilaRepository();

// Chaves de query
const apostilaKeys = {
  all: ['apostilas'] as const,
  lists: () => [...apostilaKeys.all, 'list'] as const,
  list: (filters?: any) => [...apostilaKeys.lists(), { filters }] as const,
  details: () => [...apostilaKeys.all, 'detail'] as const,
  detail: (id: string) => [...apostilaKeys.details(), id] as const,
  byConcurso: (concursoId: string) => 
    [...apostilaKeys.all, 'concurso', concursoId] as const,
  byCategoria: (categoriaId: string) => 
    [...apostilaKeys.all, 'categoria', categoriaId] as const,
  conteudo: (apostilaId: string) => 
    [...apostilaKeys.detail(apostilaId), 'conteudo'] as const,
  progresso: (userId: string, apostilaContentId: string) => 
    [...apostilaKeys.details(), 'progresso', userId, apostilaContentId] as const,
};

// Hook para buscar apostilas por concurso
export const useApostilasPorConcurso = (concursoId: string) => {
  return useQuery<ApostilaRow[], Error>({
    queryKey: apostilaKeys.byConcurso(concursoId),
    queryFn: () => apostilaRepo.findByConcurso(concursoId),
    enabled: !!concursoId,
  });
};

// Hook para buscar apostilas por categoria
export const useApostilasPorCategoria = (categoriaId: string) => {
  return useQuery<ApostilaRow[], Error>({
    queryKey: apostilaKeys.byCategoria(categoriaId),
    queryFn: () => apostilaRepo.findByCategoria(categoriaId),
    enabled: !!categoriaId,
  });
};

// Hook para buscar o conteúdo de uma apostila
export const useConteudoApostila = (apostilaId: string) => {
  return useQuery<ApostilaContentRow[], Error>({
    queryKey: apostilaKeys.conteudo(apostilaId),
    queryFn: () => apostilaRepo.findConteudo(apostilaId),
    enabled: !!apostilaId,
  });
};

// Hook para buscar o progresso do usuário em um conteúdo de apostila
export const useProgressoApostila = (userId: string, apostilaContentId: string) => {
  return useQuery<{
    completed: boolean;
    progress_percentage: number;
  } | null, Error>({
    queryKey: apostilaKeys.progresso(userId, apostilaContentId),
    queryFn: () => apostilaRepo.buscarProgresso(userId, apostilaContentId),
    enabled: !!userId && !!apostilaContentId,
  });
};

// Tipo para os parâmetros de atualização de progresso
type AtualizarProgressoParams = {
  userId: string;
  apostilaContentId: string;
  progresso: { completed: boolean; progressPercentage: number };
};

// Hook para atualizar o progresso do usuário em uma apostila
export const useAtualizarProgressoApostila = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    UserApostilaProgressRow,
    Error,
    AtualizarProgressoParams
  >({
    mutationFn: ({ userId, apostilaContentId, progresso }) => 
      apostilaRepo.atualizarProgresso(userId, apostilaContentId, progresso),
    onSuccess: (data, variables) => {
      // Atualiza o cache com os novos dados de progresso
      queryClient.setQueryData(
        apostilaKeys.progresso(variables.userId, variables.apostilaContentId),
        data
      );
      // Invalida as queries relacionadas ao progresso
      queryClient.invalidateQueries({ 
        queryKey: apostilaKeys.details() 
      });
    },
  });
};

// Hook para buscar uma apostila por ID
export const useBuscarApostila = (id: string) => {
  return useQuery<ApostilaRow | null, Error>({
    queryKey: apostilaKeys.detail(id),
    queryFn: () => apostilaRepo.findById(id),
    enabled: !!id,
  });
};
