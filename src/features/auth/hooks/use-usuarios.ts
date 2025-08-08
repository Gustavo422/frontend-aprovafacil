import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRepository } from '@/lib/repositories/user-repository';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { mapUserRowToAppUser } from '../types/user.types';
import type { AppUser, usuariostatsUpdate } from '../types/user.types';
import type { Database } from '@/src/types/supabase.types';

type DBUserRow = Database['public']['Tables']['usuarios']['Row'];

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
  all: ['usuarios'] as const,
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
      // Substituir ou comentar a linha: const user = await userRepo.findById(id);
      const response = await fetch(`/api/user/profile/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Usuário não encontrado
        }
        throw new Error('Erro ao buscar usuário por ID');
      }
      const userData = await response.json();
      if (!userData) return null;
      
      // Garantir que temos um objeto válido antes de mapear
      const userRow = userData as DBUserRow;
      const mappedUser = mapUserRowToAppUser(userRow);
      
      // Adicionar campos obrigatórios do SupabaseUser
      if (mappedUser) {
        const supabaseUser: Partial<SupabaseUser> = {
          id: mappedUser.id,
          email: mappedUser.email || '',
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
export type { usuariostatsUpdate, AppUser } from '../types/user.types';

// Hook para atualizar estatísticas do usuário
export const useAtualizarEstatisticasUsuario = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['updateusuariostats'],
    mutationFn: async ({ usuarioId, stats }: { usuarioId: string; stats: usuariostatsUpdate }) => {
      const updatedUser = await userRepo.updateusuariostats(usuarioId, {
        total_questoes_respondidas: stats.total_questoes_respondidas ?? 0,
        total_acertos: stats.total_acertos ?? 0, // CORRETO conforme schema
        tempo_estudo_minutos: stats.tempo_estudo_minutos ?? 0,
        pontuacao_media: stats.pontuacao_media ?? 0,
      });
      if (!updatedUser) throw new Error('Falha ao atualizar estatísticas do usuário');
      const mappedUser = mapUserRowToAppUser(updatedUser as unknown as DBUserRow);
      if (!mappedUser) throw new Error('Falha ao mapear usuário');
      return mappedUser;
    },
    // Otimista UI update
    onMutate: async ({ usuarioId, stats }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: userKeys.detail(usuarioId) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousUser = queryClient.getQueryData<AppUser>(userKeys.detail(usuarioId));
      
      // Atualizar o cache otimisticamente
      if (previousUser) {
        const updatedUser: AppUser = {
          ...previousUser,
          tempo_estudo_minutos: stats.tempo_estudo_minutos ?? previousUser.tempo_estudo_minutos,
          total_questoes_respondidas: stats.total_questoes_respondidas ?? previousUser.total_questoes_respondidas,
          total_acertos: stats.total_acertos ?? previousUser.total_acertos, // CORRETO conforme schema
          pontuacao_media: stats.pontuacao_media ?? previousUser.pontuacao_media,
        };
        
        queryClient.setQueryData(userKeys.detail(usuarioId), updatedUser);
      }
      
      return { previousUser };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (err: Error, _, context) => {
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
    mutationFn: async (usuarioId: string) => userRepo.deactivateAccount(usuarioId),
    // Otimista UI update
    onMutate: async (usuarioId: string) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(usuarioId) });
      
      const previousUser = queryClient.getQueryData<AppUser>(userKeys.detail(usuarioId));
      
      if (previousUser) {
        queryClient.setQueryData(
          userKeys.detail(usuarioId),
          { 
            ...previousUser, 
            ativo: false, 
            atualizado_em: new Date().toISOString() 
          }
        );
      }
      
      return { previousUser };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, usuarioId, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(usuarioId), context.previousUser);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data, error, usuarioId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(usuarioId) });
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
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Usuário não autenticado
        }
        throw new Error('Erro ao buscar usuário atual');
      }
      
      const userData = await response.json();
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
      const params = new URLSearchParams();
      
      if (filters.ativo !== undefined) {
        params.append('ativo', filters.ativo.toString());
      }
      
      if (filters.role) {
        params.append('role', filters.role);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.email) {
        params.append('email', filters.email);
      }
      
      const response = await fetch(`/api/user/list?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar lista de usuários');
      }
      
      const data = await response.json();
      return (data || []).map((user: unknown) => mapUserRowToAppUser(user as DBUserRow)).filter(Boolean) as AppUser[];
    },
    ...options,
  });
};