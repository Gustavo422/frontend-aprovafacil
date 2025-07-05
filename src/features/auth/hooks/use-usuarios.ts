import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { UserRepository } from '@/lib/repositories/user-repository';
import type { PostgrestError, User as SupabaseUser } from '@supabase/supabase-js';
import { mapUserRowToAppUser } from '../types/user.types';
import type { AppUser, UserStatsUpdate } from '../types/user.types';
import type { UserRow as DBUserRow } from '@/types/database.types';

const userRepo = new UserRepository();

// Tipos para os filtros de usuário
type UserFilters = {
  ativo?: boolean;
  role?: string;
  search?: string;
  email?: string;
};

// Chaves de query
const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byEmail: (email: string) => [...userKeys.all, 'email', email] as const,
  current: ['currentUser'] as const,
};

// Hook para buscar usuário por ID
export const useBuscarUsuario = (
  id: string,
  options?: Omit<UseQueryOptions<AppUser | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AppUser | null, Error>({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<AppUser | null> => {
      if (!id) return null;
      const user = await userRepo.findById(id);
      if (!user) return null;
      
      // Garantir que temos um objeto válido antes de mapear
      const userData = user as unknown as DBUserRow;
      const mappedUser = mapUserRowToAppUser(userData);
      
      // Adicionar campos obrigatórios do SupabaseUser
      if (mappedUser) {
        const supabaseUser: Partial<SupabaseUser> = {
          id: mappedUser.id,
          email: mappedUser.email || '',
          created_at: mappedUser.created_at,
          updated_at: mappedUser.updated_at,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
        };
        
        return {
          ...supabaseUser,
          ...mappedUser,
        } as AppUser;
      }
      
      return null;
    },
    enabled: !!id,
    ...options,
  });
};

// Hook para buscar usuário por email
export const useBuscarUsuarioPorEmail = (
  email: string,
  options?: Omit<UseQueryOptions<AppUser | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AppUser | null, Error>({
    queryKey: userKeys.byEmail(email),
    queryFn: async (): Promise<AppUser | null> => {
      if (!email) return null;
      const user = await userRepo.findByEmail(email);
      if (!user) return null;
      
      const userData = user as unknown as DBUserRow;
      const mappedUser = mapUserRowToAppUser(userData);
      
      if (mappedUser) {
        const supabaseUser: Partial<SupabaseUser> = {
          id: mappedUser.id,
          email: mappedUser.email || '',
          created_at: mappedUser.created_at,
          updated_at: mappedUser.updated_at,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
        };
        
        return {
          ...supabaseUser,
          ...mappedUser,
        } as AppUser;
      }
      
      return null;
    },
    enabled: !!email,
    ...options,
  });
};

// Re-exportar tipos
export type { UserStatsUpdate, AppUser } from '../types/user.types';

// Hook para atualizar estatísticas do usuário
export const useAtualizarEstatisticasUsuario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['updateUserStats'],
    mutationFn: async ({ userId, stats }: { userId: string; stats: UserStatsUpdate }) => {
      const updatedUser = await userRepo.updateUserStats(userId, {
        questionsAnswered: stats.total_questions_answered ?? 0,
        correctAnswers: stats.total_correct_answers ?? 0,
        studyTimeMinutes: stats.study_time_minutes ?? 0,
      });
      if (!updatedUser) throw new Error('Falha ao atualizar estatísticas do usuário');
      const mappedUser = mapUserRowToAppUser(updatedUser as unknown as DBUserRow);
      if (!mappedUser) throw new Error('Falha ao mapear usuário');
      return mappedUser;
    },
    // Otimista UI update
    onMutate: async ({ userId, stats }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousUser = queryClient.getQueryData<AppUser>(userKeys.detail(userId));
      
      // Atualizar o cache otimisticamente
      if (previousUser) {
        const updatedUser: AppUser = {
          ...previousUser,
          // Atualizar campos principais
          total_questions_answered: stats.total_questions_answered ?? previousUser.total_questions_answered,
          total_correct_answers: stats.total_correct_answers ?? previousUser.total_correct_answers,
          study_time_minutes: stats.study_time_minutes ?? previousUser.study_time_minutes,
          average_score: stats.average_score ?? previousUser.average_score,
          updated_at: new Date().toISOString(),
          
          // Atualizar campos calculados
          total_questions: stats.total_questions_answered ?? previousUser.total_questions,
          total_correct: stats.total_correct_answers ?? previousUser.total_correct,
          total_time_minutes: stats.study_time_minutes ?? previousUser.total_time_minutes,
          score: stats.average_score ?? previousUser.score,
        };
        
        queryClient.setQueryData(userKeys.detail(userId), updatedUser);
      }
      
      return { previousUser };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (err: Error, _, context) => {
      console.error('Erro ao atualizar estatísticas:', err);
      
      if (context?.previousUser) {
        queryClient.setQueryData(
          userKeys.detail(context.previousUser.id),
          context.previousUser
        );
      }
    },
    // Sempre refazer a busca após a mutação para garantir que os dados estejam sincronizados
    onSettled: (data: AppUser | undefined) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      }
    },
  });
};

// Hook para desativar conta de usuário
export const useDesativarConta = () => {
  const queryClient = useQueryClient();
  
  return useMutation<boolean, Error, string, { previousUser: AppUser | undefined }>({
    mutationFn: (userId: string) => userRepo.deactivateAccount(userId),
    // Otimista UI update
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });
      
      const previousUser = queryClient.getQueryData<AppUser>(userKeys.detail(userId));
      
      if (previousUser) {
        queryClient.setQueryData(
          userKeys.detail(userId),
          { 
            ...previousUser, 
            is_active: false, 
            updated_at: new Date().toISOString() 
          }
        );
      }
      
      return { previousUser };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, userId, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUser);
      }
      console.error('Erro ao desativar conta:', error);
    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data, error, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Hook para buscar o usuário atual (baseado na sessão)
export const useCurrentUser = (
  options?: Omit<UseQueryOptions<AppUser | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AppUser | null, Error>({
    queryKey: userKeys.current,
    queryFn: async () => {
      const { data: { user } } = await userRepo.client.auth.getUser();
      if (!user) return null;
      const userData = await userRepo.findById(user.id);
      if (!userData) return null;
      return mapUserRowToAppUser(userData as unknown as DBUserRow);
    },
    ...options,
  });
};

// Hook para buscar lista de usuários com filtros
export const useListarUsuarios = (
  filters: UserFilters = {},
  options?: Omit<UseQueryOptions<AppUser[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AppUser[], Error>({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      let query = userRepo.client.from('users').select('*');
      
      if (filters.ativo !== undefined) {
        query = query.eq('is_active', filters.ativo);
      }
      
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      
      if (filters.search) {
        query = query.ilike('full_name', `%${filters.search}%`);
      }
      
      if (filters.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map(user => mapUserRowToAppUser(user as unknown as DBUserRow)!).filter(Boolean) as AppUser[];
    },
    ...options,
  });
};
