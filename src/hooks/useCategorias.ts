import { useQuery, useQueryClient } from './useQuery';
import { useMutation } from './useMutation';
import { useAuth } from './useAuth';

/**
 * Interface para Categoria
 */
export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Filtros para busca de categorias
 */
export interface CategoriaFilters {
  ativo?: boolean;
  search?: string;
  cor_primaria?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Dados para criação de categoria
 */
export interface CreateCategoriaData {
  nome: string;
  descricao?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
}

/**
 * Dados para atualização de categoria
 */
export interface UpdateCategoriaData extends Partial<CreateCategoriaData> {
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
 * Serviço de API para categorias
 */
class CategoriaService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  async getCategorias(filters?: CategoriaFilters, token?: string): Promise<PaginatedResponse<Categoria>> {
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
    
    const response = await fetch(`${this.baseUrl}/categorias?${params.toString()}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar categorias');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar categorias');
    }
    
    return result;
  }
  
  async getCategoriaById(id: string, token?: string): Promise<Categoria> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/categorias/${id}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar categoria');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar categoria');
    }
    
    return result.data;
  }
  
  async getCategoriaBySlug(slug: string, token?: string): Promise<Categoria> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/categorias/slug/${slug}`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar categoria');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar categoria');
    }
    
    return result.data;
  }
  
  async getCategoriasAtivas(token?: string): Promise<Categoria[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}/categorias/ativas`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar categorias ativas');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar categorias ativas');
    }
    
    return result.data;
  }
  
  async createCategoria(data: CreateCategoriaData, token: string): Promise<Categoria> {
    const response = await fetch(`${this.baseUrl}/categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar categoria');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao criar categoria');
    }
    
    return result.data;
  }
  
  async updateCategoria(id: string, data: UpdateCategoriaData, token: string): Promise<Categoria> {
    const response = await fetch(`${this.baseUrl}/categorias/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar categoria');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar categoria');
    }
    
    return result.data;
  }
  
  async deleteCategoria(id: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/categorias/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao excluir categoria');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao excluir categoria');
    }
  }
}

const categoriaService = new CategoriaService();

/**
 * Hook para buscar categorias com filtros
 */
export function useCategorias(filters?: CategoriaFilters) {
  const { token } = useAuth();
  
  const queryKey = ['categorias', filters ? JSON.stringify(filters) : 'all'];
  const query = useQuery(
    queryKey,
    () => categoriaService.getCategorias(filters, token || undefined),
    {
      staleTime: 10 * 60 * 1000, // 10 minutos (categorias mudam pouco)
      onError: (error) => {
        console.error('Erro ao buscar categorias:', error);
      }
    }
  );
  
  return {
    categorias: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar categoria por ID
 */
export function useCategoria(id: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['categoria', id],
    () => categoriaService.getCategoriaById(id, token || undefined),
    {
      enabled: !!id,
      staleTime: 15 * 60 * 1000, // 15 minutos
      onError: (error) => {
        console.error('Erro ao buscar categoria:', error);
      }
    }
  );
  
  return {
    categoria: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar categoria por slug
 */
export function useCategoriaBySlug(slug: string) {
  const { token } = useAuth();
  
  const query = useQuery(
    ['categoria', 'slug', slug],
    () => categoriaService.getCategoriaBySlug(slug, token || undefined),
    {
      enabled: !!slug,
      staleTime: 15 * 60 * 1000, // 15 minutos
      onError: (error) => {
        console.error('Erro ao buscar categoria por slug:', error);
      }
    }
  );
  
  return {
    categoria: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para buscar categorias ativas
 */
export function useCategoriasAtivas() {
  const { token } = useAuth();
  
  const query = useQuery(
    ['categorias', 'ativas'],
    () => categoriaService.getCategoriasAtivas(token || undefined),
    {
      staleTime: 15 * 60 * 1000, // 15 minutos
      onError: (error) => {
        console.error('Erro ao buscar categorias ativas:', error);
      }
    }
  );
  
  return {
    categorias: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

/**
 * Hook para criar categoria
 */
export function useCreateCategoria() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (data: CreateCategoriaData) => categoriaService.createCategoria(data, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao criar categoria:', error);
      }
    }
  );
  
  return {
    createCategoria: mutation.mutate,
    createCategoriaAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para atualizar categoria
 */
export function useUpdateCategoria() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    ({ id, data }: { id: string; data: UpdateCategoriaData }) =>
      categoriaService.updateCategoria(id, data, token!),
    {
      onSuccess: (updatedCategoria) => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
        queryClient.setQueryData(['categoria', String(updatedCategoria.id)].join(':'), updatedCategoria);
      },
      onError: (error) => {
        console.error('Erro ao atualizar categoria:', error);
      }
    }
  );
  
  return {
    updateCategoria: (id: string, data: UpdateCategoriaData) => mutation.mutate({ id, data }),
    updateCategoriaAsync: (id: string, data: UpdateCategoriaData) => mutation.mutateAsync({ id, data }),
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para excluir categoria
 */
export function useDeleteCategoria() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  const mutation = useMutation(
    (id: string) => categoriaService.deleteCategoria(id, token!),
    {
      onSuccess: () => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        console.error('Erro ao excluir categoria:', error);
      }
    }
  );
  
  return {
    deleteCategoria: mutation.mutate,
    deleteCategoriaAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Hook para obter cores disponíveis para categorias
 */
export function useCategoriaColors() {
  const colors = [
    { name: 'Azul', primary: '#3B82F6', secondary: '#1E40AF' },
    { name: 'Verde', primary: '#10B981', secondary: '#047857' },
    { name: 'Roxo', primary: '#8B5CF6', secondary: '#5B21B6' },
    { name: 'Rosa', primary: '#EC4899', secondary: '#BE185D' },
    { name: 'Amarelo', primary: '#F59E0B', secondary: '#D97706' },
    { name: 'Vermelho', primary: '#EF4444', secondary: '#DC2626' },
    { name: 'Índigo', primary: '#6366F1', secondary: '#4338CA' },
    { name: 'Teal', primary: '#14B8A6', secondary: '#0F766E' },
    { name: 'Laranja', primary: '#F97316', secondary: '#EA580C' },
    { name: 'Cinza', primary: '#6B7280', secondary: '#374151' }
  ];
  
  return {
    colors,
    getColorByName: (name: string) => colors.find(color => color.name === name),
    getRandomColor: () => colors[Math.floor(Math.random() * colors.length)]
  };
}