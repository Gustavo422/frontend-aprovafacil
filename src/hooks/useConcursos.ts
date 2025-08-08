import { useQuery, useQueryClient } from './useQuery';
import { useMutation } from './useMutation';
import { useAuth } from './useAuth';

/**
 * Interface para Concurso
 */
export interface Concurso {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  ano?: number;
  banca?: string;
  categoria_id?: string;
  url_edital?: string;
  data_prova?: Date;
  vagas?: number;
  salario?: number;
  nivel_dificuldade: 'facil' | 'medio' | 'dificil';
  multiplicador_questoes: number;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Filtros para busca de concursos
 */
export interface ConcursoFilters {
  categoria_id?: string;
  status?: 'ativo' | 'inativo' | 'todos';
  search?: string;
  data_inicio?: string;
  data_fim?: string;
  banca?: string;
  ano?: number;
  nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Dados para criação de concurso
 */
export interface CreateConcursoData {
  nome: string;
  descricao?: string;
  categoria_id: string;
  ano?: number;
  banca?: string;
  url_edital?: string;
  data_prova?: Date;
  vagas?: number;
  salario?: number;
  nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
  multiplicador_questoes?: number;
}

/**
 * Dados para atualização de concurso
 */
export interface UpdateConcursoData extends Partial<CreateConcursoData> {
  ativo?: boolean;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Serviço de API para concursos
 */
class ConcursoService {
  private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  async getConcursos(filters?: ConcursoFilters, token?: string): Promise<PaginatedResponse<Concurso>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/concursos?${params.toString()}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar concursos');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar concursos');
    }
    
    return result;
  }
  
  async getConcursoById(id: string, token?: string): Promise<Concurso> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/concursos/${id}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar concurso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar concurso');
    }
    
    return result.data;
  }
  
  async getConcursoBySlug(slug: string, token?: string): Promise<Concurso> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/concursos/slug/${slug}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar concurso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar concurso');
    }
    
    return result.data;
  }
  
  async getConcursosByCategoria(categoriaId: string, token?: string): Promise<Concurso[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/concursos/categoria/${categoriaId}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar concursos por categoria');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar concursos por categoria');
    }
    
    return result.data;
  }
  
  async getConcursosAtivos(token?: string): Promise<Concurso[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/concursos/ativos`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar concursos ativos');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar concursos ativos');
    }
    
    return result.data;
  }
  
  async createConcurso(data: CreateConcursoData, token: string): Promise<Concurso> {
    const response = await fetch(`${this.baseUrl}/concursos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar concurso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao criar concurso');
    }
    
    return result.data;
  }
  
  async updateConcurso(id: string, data: UpdateConcursoData, token: string): Promise<Concurso> {
    const response = await fetch(`${this.baseUrl}/concursos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar concurso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar concurso');
    }
    
    return result.data;
  }
  
  async deleteConcurso(id: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/concursos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao excluir concurso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao excluir concurso');
    }
  }
}

const concursoService = new ConcursoService();

/**
 * Hook para buscar concursos com filtros
 */
export function useConcursos(filters?: ConcursoFilters) {
  const { token } = useAuth();
  
  const queryKey = ['concursos', filters ? JSON.stringify(filters) : 'all'];
  const query = useQuery(
    queryKey,
    async () => concursoService.getConcursos(filters, token || undefined),
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      onError: (error) => {
        console.error('Erro ao buscar concursos:', error);
      }
    }
  );
  
  // Log temporário para verificar dados
  console.log('[DEBUG] useConcursos - Dados recebidos:', {
    hasData: !!query.data,
    dataStructure: query.data ? Object.keys(query.data) : 'no data',
    dataData: query.data?.data,
    pagination: query.data?.pagination
  });
  
  return {
    concursos: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar concurso por ID
 */
export function useConcurso(id: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['concurso', id],
    async () => concursoService.getConcursoById(id, token || undefined),
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar concurso:', error);
      }
    }
  );
  
  return {
    concurso: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar concurso por slug
 */
export function useConcursoBySlug(slug: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['concurso', 'slug', slug],
    async () => concursoService.getConcursoBySlug(slug, token || undefined),
    {
      enabled: !!slug,
      staleTime: 10 * 60 * 1000, // 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar concurso por slug:', error);
      }
    }
  );
  
  return {
    concurso: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar concursos por categoria
 */
export function useConcursosByCategoria(categoriaId: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['concursos', 'categoria', categoriaId],
    async () => concursoService.getConcursosByCategoria(categoriaId, token || undefined),
    {
      enabled: !!categoriaId,
      staleTime: 5 * 60 * 1000, // 5 minutos
      onError: (error) => {
        console.error('Erro ao buscar concursos por categoria:', error);
      }
    }
  );
  
  return {
    concursos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar concursos ativos
 */
export function useConcursosAtivos() {
  const { token } = useAuth();
  
  const query = useQuery(
    ['concursos', 'ativos'],
    async () => concursoService.getConcursosAtivos(token || undefined),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar concursos ativos:', error);
      }
    }
  );
  
  return {
    concursos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para criar concurso
 */
export function useCreateConcurso() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    async (data: CreateConcursoData) => concursoService.createConcurso(data, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao criar concurso:', error);
      }
    }
  );
  
  return {
    createConcurso: mutation.mutate,
    createConcursoAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para atualizar concurso
 */
export function useUpdateConcurso() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    async ({ id, data }: { id: string; data: UpdateConcursoData }) =>
      concursoService.updateConcurso(id, data, token!),
    {
      onSuccess: (updatedConcurso) => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
        queryClient.setQueryData(['concurso', String(updatedConcurso.id)].join(':'), updatedConcurso);
      },
      onError: (error) => {
        console.error('Erro ao atualizar concurso:', error);
      }
    }
  );
  
  return {
    updateConcurso: async (id: string, data: UpdateConcursoData) => mutation.mutate({ id, data }),
    updateConcursoAsync: async (id: string, data: UpdateConcursoData) => mutation.mutateAsync({ id, data }),
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para excluir concurso
 */
export function useDeleteConcurso() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    async (id: string) => concursoService.deleteConcurso(id, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao excluir concurso:', error);
      }
    }
  );
  
  return {
    deleteConcurso: mutation.mutate,
    deleteConcursoAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}