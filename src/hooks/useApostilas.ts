import { useQuery, useQueryClient } from './useQuery';
import { useMutation } from './useMutation';
import { useAuth } from './useAuth';

/**
 * Interface para Apostila
 */
export interface Apostila {
  id: string;
  titulo: string;
  slug: string;
  descricao?: string;
  concurso_id?: string;
  categoria_id?: string;
  disciplinas?: string[];
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Interface para Conteúdo da Apostila
 */
export interface ConteudoApostila {
  id: string;
  apostila_id: string;
  concurso_id?: string;
  numero_modulo: number;
  titulo: string;
  conteudo_json: unknown;
  criado_em: Date;
}

/**
 * Apostila com conteúdo
 */
export interface ApostilaComConteudo extends Apostila {
  conteudo: ConteudoApostila[];
}

/**
 * Filtros para busca de apostilas
 */
export interface ApostilaFilters {
  categoria_id?: string;
  concurso_id?: string;
  search?: string;
  disciplina?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Dados para criação de apostila
 */
export interface CreateApostilaData {
  titulo: string;
  descricao?: string;
  concurso_id?: string;
  categoria_id?: string;
  disciplinas?: string[];
}

/**
 * Dados para atualização de apostila
 */
export interface UpdateApostilaData extends Partial<CreateApostilaData> {
  ativo?: boolean;
}

/**
 * Dados para marcar progresso
 */
export interface MarcarProgressoData {
  conteudoId: string;
  percentual: number;
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
 * Serviço de API para apostilas
 */
class ApostilaService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  async getApostilas(filters?: ApostilaFilters, token?: string): Promise<PaginatedResponse<Apostila>> {
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
    
    const response = await fetch(`${this.baseUrl}/apostilas?${params.toString()}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar apostilas');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar apostilas');
    }
    
    return result;
  }
  
  async getApostilaById(id: string, token?: string): Promise<Apostila> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/apostilas/${id}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar apostila');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar apostila');
    }
    
    return result.data;
  }
  
  async getApostilaBySlug(slug: string, token?: string): Promise<Apostila> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/apostilas/slug/${slug}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar apostila');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar apostila');
    }
    
    return result.data;
  }
  
  async getApostilaComConteudo(id: string, token?: string): Promise<ApostilaComConteudo> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/apostilas/${id}/conteudo`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar apostila com conteúdo');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar apostila com conteúdo');
    }
    
    return result.data;
  }
  
  async getApostilasPorConcurso(concursoId: string, token?: string): Promise<Apostila[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/apostilas/concurso/${concursoId}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar apostilas por concurso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar apostilas por concurso');
    }
    
    return result.data;
  }
  
  async createApostila(data: CreateApostilaData, token: string): Promise<Apostila> {
    const response = await fetch(`${this.baseUrl}/apostilas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar apostila');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao criar apostila');
    }
    
    return result.data;
  }
  
  async updateApostila(id: string, data: UpdateApostilaData, token: string): Promise<Apostila> {
    const response = await fetch(`${this.baseUrl}/apostilas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar apostila');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar apostila');
    }
    
    return result.data;
  }
  
  async deleteApostila(id: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/apostilas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao excluir apostila');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao excluir apostila');
    }
  }
  
  async marcarProgresso(data: MarcarProgressoData, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/apostilas/progresso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao marcar progresso');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao marcar progresso');
    }
  }
}

const apostilaService = new ApostilaService();

/**
 * Hook para buscar apostilas com filtros
 */
export function useApostilas(filters?: ApostilaFilters) {
  const { token } = useAuth();
  
  const queryKey = ['apostilas', filters ? JSON.stringify(filters) : 'all'];
  const query = useQuery(
    queryKey,
    () => apostilaService.getApostilas(filters, token || undefined),
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      onError: (error) => {
        console.error('Erro ao buscar apostilas:', error);
      }
    }
  );
  
  return {
    apostilas: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar apostila por ID
 */
export function useApostila(id: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['apostila', id],
    () => apostilaService.getApostilaById(id, token || undefined),
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar apostila:', error);
      }
    }
  );
  
  return {
    apostila: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar apostila por slug
 */
export function useApostilaBySlug(slug: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['apostila', 'slug', slug],
    () => apostilaService.getApostilaBySlug(slug, token || undefined),
    {
      enabled: !!slug,
      staleTime: 10 * 60 * 1000, // 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar apostila por slug:', error);
      }
    }
  );
  
  return {
    apostila: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar apostila com conteúdo
 */
export function useApostilaComConteudo(id: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['apostila', 'conteudo', id],
    () => apostilaService.getApostilaComConteudo(id, token || undefined),
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar apostila com conteúdo:', error);
      }
    }
  );
  
  return {
    apostila: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar apostilas por concurso
 */
export function useApostilasPorConcurso(concursoId: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['apostilas', 'concurso', concursoId],
    () => apostilaService.getApostilasPorConcurso(concursoId, token || undefined),
    {
      enabled: !!concursoId,
      staleTime: 5 * 60 * 1000, // 5 minutos
      onError: (error) => {
        console.error('Erro ao buscar apostilas por concurso:', error);
      }
    }
  );
  
  return {
    apostilas: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para criar apostila
 */
export function useCreateApostila() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (data: CreateApostilaData) => apostilaService.createApostila(data, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao criar apostila:', error);
      }
    }
  );
  
  return {
    createApostila: mutation.mutate,
    createApostilaAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para atualizar apostila
 */
export function useUpdateApostila() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    ({ id, data }: { id: string; data: UpdateApostilaData }) =>
      apostilaService.updateApostila(id, data, token!),
    {
      onSuccess: (updatedApostila) => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
        queryClient.setQueryData(['apostila', String(updatedApostila.id)].join(':'), updatedApostila);
      },
      onError: (error) => {
        console.error('Erro ao atualizar apostila:', error);
      }
    }
  );
  
  return {
    updateApostila: (id: string, data: UpdateApostilaData) => mutation.mutate({ id, data }),
    updateApostilaAsync: (id: string, data: UpdateApostilaData) => mutation.mutateAsync({ id, data }),
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para excluir apostila
 */
export function useDeleteApostila() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (id: string) => apostilaService.deleteApostila(id, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao excluir apostila:', error);
      }
    }
  );
  
  return {
    deleteApostila: mutation.mutate,
    deleteApostilaAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para marcar progresso na apostila
 */
export function useMarcarProgresso() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (data: MarcarProgressoData) => apostilaService.marcarProgresso(data, token!),
    {
      onSuccess: () => {
        // Invalidar queries de progresso do usuário
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao marcar progresso:', error);
      }
    }
  );
  
  return {
    marcarProgresso: mutation.mutate,
    marcarProgressoAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para obter disciplinas disponíveis
 */
export function useDisciplinas() {
  const disciplinas = [
    'Português',
    'Matemática',
    'Raciocínio Lógico',
    'Informática',
    'Direito Constitucional',
    'Direito Administrativo',
    'Direito Civil',
    'Direito Penal',
    'Direito Processual Civil',
    'Direito Processual Penal',
    'Direito Tributário',
    'Direito Previdenciário',
    'Direito do Trabalho',
    'Contabilidade',
    'Administração Pública',
    'Economia',
    'Estatística',
    'Geografia',
    'História',
    'Atualidades',
    'Conhecimentos Específicos'
  ];
  
  return {
    disciplinas,
    getDisciplinaByName: (name: string) => disciplinas.find(d => d === name),
    searchDisciplinas: (query: string) => 
      disciplinas.filter(d => d.toLowerCase().includes(query.toLowerCase()))
  };
}