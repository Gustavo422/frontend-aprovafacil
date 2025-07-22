import { useQuery, useQueryClient } from './useQuery';
import { useMutation } from './useMutation';
import { useAuth } from './useAuth';
import { User } from './useAuth';

/**
 * Estatísticas do usuário
 */
export interface UserStats {
  total_simulados_realizados: number;
  media_pontuacao_simulados: number;
  total_questoes_semanais_respondidas: number;
  total_flashcards_dominados: number;
  total_apostilas_concluidas: number;
  tempo_total_estudo_horas: number;
  sequencia_dias_estudo: number;
  ultima_atividade: Date;
  total_acertos: number;
}

/**
 * Dados para atualização de perfil
 */
export interface UpdateProfileData {
  nome?: string;
  email?: string;
}

/**
 * Dados para configuração inicial
 */
export interface InitialConfigData {
  concursoId: string;
  horasEstudo: number;
  tempoProva: number;
}

/**
 * Serviço de API para usuários
 */
class UserService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  async getUserById(id: string, token: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar usuário');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar usuário');
    }
    
    return result.data;
  }
  
  async getUserStats(id: string, token: string): Promise<UserStats> {
    const response = await fetch(`${this.baseUrl}/users/${id}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar estatísticas');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar estatísticas');
    }
    
    return result.data;
  }
  
  async updateProfile(id: string, data: UpdateProfileData, token: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar perfil');
    }
    
    return result.data;
  }
  
  async initialConfig(data: InitialConfigData, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/initial-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro na configuração inicial');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro na configuração inicial');
    }
  }
}

const userService = new UserService();

/**
 * Hook para buscar dados do usuário atual
 */
export function useUser() {
  const { user, token, isAuthenticated } = useAuth();
  
  const queryKey = ['user', user?.id ? String(user.id) : 'none'].join(':');
  const query = useQuery(
    queryKey,
    () => userService.getUserById(user!.id, token!),
    {
      enabled: isAuthenticated && !!user?.id && !!token,
      staleTime: 5 * 60 * 1000, // 5 minutos
      onError: (error) => {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    }
  );
  
  return {
    user: query.data || user,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar estatísticas do usuário
 */
export function useUserStats(userId?: string) {
  const { user, token, isAuthenticated } = useAuth();
  const targetUserId = userId || user?.id;
  
  const queryKey = ['user', 'stats', targetUserId ? String(targetUserId) : 'none'].join(':');
  const query = useQuery(
    queryKey,
    () => userService.getUserStats(targetUserId!, token!),
    {
      enabled: isAuthenticated && !!targetUserId && !!token,
      staleTime: 2 * 60 * 1000, // 2 minutos
      refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
      onError: (error) => {
        console.error('Erro ao buscar estatísticas do usuário:', error);
      }
    }
  );
  
  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para atualizar perfil do usuário
 */
export function useUpdateProfile() {
  const { user, token, updateProfile: updateAuthProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (data: UpdateProfileData) => userService.updateProfile(user!.id, data, token!),
    {
      onSuccess: (updatedUser) => {
        // Atualizar contexto de autenticação
        updateAuthProfile(updatedUser);
        
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao atualizar perfil:', error);
      }
    }
  );
  
  return {
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para configuração inicial do usuário
 */
export function useInitialConfig() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (data: InitialConfigData) => userService.initialConfig(data, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro na configuração inicial:', error);
      }
    }
  );
  
  return {
    initialConfig: mutation.mutate,
    initialConfigAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para verificar se usuário precisa fazer configuração inicial
 */
export function useRequiresInitialConfig() {
  const { user } = useAuth();
  
  return {
    requiresConfig: user?.primeiro_login === true,
    user
  };
}

/**
 * Hook para dados de progresso do usuário
 */
export function useUserProgress() {
  const { user, token, isAuthenticated } = useAuth();
  
  // Aqui você pode implementar queries específicas para progresso
  // Por exemplo: progresso em simulados, apostilas, etc.
  
  const simuladosQuery = useQuery(
    ['user', 'progress', 'simulados', String(user?.id ?? 'none')],
    () => {
      // Implementar busca de progresso em simulados
      return Promise.resolve([]);
    },
    {
      enabled: isAuthenticated && !!user?.id && !!token,
      staleTime: 5 * 60 * 1000
    }
  );
  
  const apostilasQuery = useQuery(
    ['user', 'progress', 'apostilas', String(user?.id ?? 'none')],
    () => {
      // Implementar busca de progresso em apostilas
      return Promise.resolve([]);
    },
    {
      enabled: isAuthenticated && !!user?.id && !!token,
      staleTime: 5 * 60 * 1000
    }
  );
  
  return {
    simulados: {
      data: simuladosQuery.data,
      isLoading: simuladosQuery.isLoading,
      isError: simuladosQuery.isError,
      error: simuladosQuery.error
    },
    apostilas: {
      data: apostilasQuery.data,
      isLoading: apostilasQuery.isLoading,
      isError: apostilasQuery.isError,
      error: apostilasQuery.error
    },
    refetchAll: () => {
      simuladosQuery.refetch();
      apostilasQuery.refetch();
    }
  };
}