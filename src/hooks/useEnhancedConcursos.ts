import { useEnhancedQuery } from './useEnhancedQuery';
import { useEnhancedMutation } from './useEnhancedMutation';
import { useAuth } from './useAuth';
import { CacheType } from '@/lib/cache-manager';
import { queryUtils } from '@/src/providers/query-client';

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
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
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
      headers,
      // Adicionar sinal de cache para evitar cache do navegador
      cache: 'no-store'
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
      headers,
      cache: 'no-store'
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
      headers,
      cache: 'no-store'
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
      headers,
      cache: 'no-store'
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
      headers,
      cache: 'no-store'
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
 * Hook aprimorado para buscar concursos com filtros
 */
export function useEnhancedConcursos(filters?: ConcursoFilters) {
  const { token } = useAuth();
  // Garantir que filters seja Record<string, unknown>
  const filtersRecord = filters as Record<string, unknown> | undefined;
  // Gerar chave de query baseada nos filtros
  const queryKey = queryUtils.entityListKey('concursos', filtersRecord);
  
  // Usar hook aprimorado com cache em múltiplas camadas
  const query = useEnhancedQuery<PaginatedResponse<Concurso>>(
    queryKey,
    () => concursoService.getConcursos(filters, token || undefined),
    {
      staleTime: queryUtils.getEntityCacheConfig('concursos', true).staleTime,
      gcTime: queryUtils.getEntityCacheConfig('concursos', true).gcTime,
      cacheOptions: {
        useLocalCache: true,
        persistInSupabase: false,
        type: CacheType.MEMORY,
        ttlMinutes: 5,
        relatedKeys: ['concursos:list', 'categorias:list'],
        optimistic: true
      }
    }
  );
  
  return {
    concursos: query.data ? ((query.data as unknown) as PaginatedResponse<Concurso>).data : [],
    pagination: query.data ? ((query.data as unknown) as PaginatedResponse<Concurso>).pagination : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidateCache: query.invalidateCache,
    updateCache: query.updateCache
  };
}

/**
 * Hook aprimorado para buscar concurso por ID
 */
export function useEnhancedConcurso(id: string) {
  const { token } = useAuth();
  // Gerar chave de query
  const queryKey = queryUtils.entityKey('concursos', id);
  // Usar hook aprimorado com cache em múltiplas camadas
  const query = useEnhancedQuery<Concurso>(
    queryKey,
    () => concursoService.getConcursoById(id, token || undefined),
    {
      enabled: !!id,
      staleTime: queryUtils.getEntityCacheConfig('concursos').staleTime,
      gcTime: queryUtils.getEntityCacheConfig('concursos').gcTime,
      cacheOptions: {
        useLocalCache: true,
        persistInSupabase: false,
        type: CacheType.MEMORY,
        ttlMinutes: 10,
        relatedKeys: ['concursos:list'],
        optimistic: true
      }
    }
  );
  return {
    concurso: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidateCache: query.invalidateCache,
    updateCache: query.updateCache
  };
}

/**
 * Hook aprimorado para criar concurso com atualização otimista
 */
export function useEnhancedCreateConcurso() {
  const { token } = useAuth();
  const mutation = useEnhancedMutation<Concurso, CreateConcursoData>(
    (data) => concursoService.createConcurso(data, token!),
    {
      cacheOptions: {
        invalidateQueries: [
          ['concursos', 'list'],
          ['categorias', 'list']
        ],
        optimisticUpdate: () => ({})
      }
    }
  );
  return mutation;
}

/**
 * Hook aprimorado para atualizar concurso com atualização otimista
 */
export function useEnhancedUpdateConcurso() {
  const { token } = useAuth();
  const mutation = useEnhancedMutation<Concurso, { id: string; data: UpdateConcursoData }>(
    ({ id, data }) => concursoService.updateConcurso(id, data, token!),
    {
      cacheOptions: {
        invalidateQueries: [
          ['concursos', 'list']
        ],
        optimisticUpdate: (variables) => ({
          [`concursos:${variables.id}`]: (oldData: Concurso | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              ...variables.data,
              atualizado_em: new Date()
            };
          }
        })
      }
    }
  );
  return mutation;
}

/**
 * Hook aprimorado para excluir concurso com atualização otimista
 */
export function useEnhancedDeleteConcurso() {
  const { token } = useAuth();
  const mutation = useEnhancedMutation<void, string>(
    (id) => concursoService.deleteConcurso(id, token!),
    {
      cacheOptions: {
        invalidateQueries: [
          ['concursos', 'list'],
          ['categorias', 'list']
        ],
        optimisticUpdate: () => ({})
      }
    }
  );
  return mutation;
}