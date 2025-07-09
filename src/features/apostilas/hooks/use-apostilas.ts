import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { ApostilaRepository } from '@/lib/repositories/apostila-repository';
import type { 
  Database 
} from '@/src/types/supabase.types';

type ApostilaRow = Database['public']['Tables']['apostilas']['Row'];
type ApostilaContentRow = Database['public']['Tables']['apostila_content']['Row'];
type UserApostilaProgressRow = Database['public']['Tables']['user_apostila_progress']['Row'];

const apostilaRepo = new ApostilaRepository();

// Chaves de query
const apostilaKeys = {
  all: ['apostilas'] as const,
  lists: () => [...apostilaKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...apostilaKeys.lists(), { filters }] as const,
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

interface Apostila {
  id: string;
  title: string;
  description?: string | null;
  concurso_id?: string | null;
  categoria_id?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disciplinas?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApostilaProgress {
  id: string;
  user_id: string;
  apostila_content_id: string;
  completed: boolean;
  progress_percentage: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

interface UseApostilasOptions {
  userId?: string;
  includePublic?: boolean;
  limit?: number;
}

export function useApostilas(options: UseApostilasOptions = {}) {
  const { userId, includePublic = false, limit = 50 } = options;
  const queryClient = useQueryClient();

  const {
    data: apostilas,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['apostilas', userId, includePublic],
    queryFn: async (): Promise<Apostila[]> => {
      const supabaseClient = supabase;
      let query = supabaseClient
        .from('apostilas')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        if (includePublic) {
          query = query.or(`user_id.eq.${userId},is_public.eq.true`);
        } else {
          query = query.eq('user_id', userId);
        }
      } else if (includePublic) {
        query = query.eq('is_public', true);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        logger.error('Erro ao buscar apostilas:', {
          error: queryError.message,
          details: queryError,
        });
        throw new Error('Erro ao buscar apostilas');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any) || [];
    },
    enabled: !!userId || includePublic,
  });

  const createApostilaMutation = useMutation({
    mutationFn: async (apostilaData: Omit<Apostila, 'id' | 'created_at' | 'updated_at'>) => {
      const supabaseClient = supabase;
      const { data, error } = await supabaseClient
        .from('apostilas')
        .insert(apostilaData)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao criar apostila:', {
          error: error.message,
          details: error,
        });
        throw new Error('Erro ao criar apostila');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostilas'] });
    },
  });

  const updateApostilaMutation = useMutation({
    mutationFn: async ({
      id,
      ...apostilaData
    }: Partial<Apostila> & { id: string }) => {
      const supabaseClient = supabase;
      const { data, error } = await supabaseClient
        .from('apostilas')
        .update({
          ...apostilaData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao atualizar apostila:', {
          error: error.message,
          details: error,
        });
        throw new Error('Erro ao atualizar apostila');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostilas'] });
    },
  });

  const deleteApostilaMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabaseClient = supabase;
      const { error } = await supabaseClient
        .from('apostilas')
        .update({
          is_active: false,
        })
        .eq('id', id);

      if (error) {
        logger.error('Erro ao deletar apostila:', {
          error: error.message,
          details: error,
        });
        throw new Error('Erro ao deletar apostila');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostilas'] });
    },
  });

  return {
    apostilas,
    isLoading,
    error,
    refetch,
    createApostila: createApostilaMutation.mutateAsync,
    updateApostila: updateApostilaMutation.mutateAsync,
    deleteApostila: deleteApostilaMutation.mutateAsync,
    isCreating: createApostilaMutation.isPending,
    isUpdating: updateApostilaMutation.isPending,
    isDeleting: deleteApostilaMutation.isPending,
  };
}

export function useApostilaProgress(apostilaId: string, userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: progress,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['apostila-progress', apostilaId, userId],
    queryFn: async (): Promise<ApostilaProgress | null> => {
      if (!userId) return null;

      const supabaseClient = supabase;
      const { data, error: queryError } = await supabaseClient
        .from('user_apostila_progress')
        .select('*')
        .eq('apostila_id', apostilaId)
        .eq('user_id', userId)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        logger.error('Erro ao buscar progresso da apostila:', {
          error: queryError.message,
          details: queryError,
        });
        throw new Error('Erro ao buscar progresso da apostila');
      }

      return data;
    },
    enabled: !!userId && !!apostilaId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: Partial<ApostilaProgress>) => {
      
      if (progress) {
        // Atualizar progresso existente
        const { data, error } = await supabase
          .from('user_apostila_progress')
          .update({
            ...progressData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', progress.id)
          .select()
          .single();

        if (error) {
          logger.error('Erro ao atualizar progresso da apostila:', {
            error: error.message,
            details: error,
          });
          throw new Error('Erro ao atualizar progresso da apostila');
        }

        return data;
      } else {
        // Criar novo progresso
        const { data, error } = await supabase
          .from('user_apostila_progress')
          .insert({
            apostila_content_id: apostilaId,
            user_id: userId!,
            ...progressData,
          })
          .select()
          .single();

        if (error) {
          logger.error('Erro ao criar progresso da apostila:', {
            error: error.message,
            details: error,
          });
          throw new Error('Erro ao criar progresso da apostila');
        }

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostila-progress', apostilaId, userId] });
    },
  });

  return {
    progress,
    isLoading,
    error,
    updateProgress: updateProgressMutation.mutateAsync,
    isUpdating: updateProgressMutation.isPending,
  };
}
