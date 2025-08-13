import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import type { Simulado } from '../api/contracts';

// Repositório para chamadas à API de simulados
const simuladoRepo = {
  buscarTodos: async (filters: SimuladoFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.concursoId) params.append('concurso_id', filters.concursoId);
    if (filters.dificuldade) params.append('dificuldade', filters.dificuldade);
    const publicoFlag =
      filters.publico !== undefined ? filters.publico : filters.isPublic;
    if (publicoFlag !== undefined) {
      // preferir snake_case 'publico'; manter alias legado 'isPublic' no filtro
      params.append('publico', String(publicoFlag));
    }
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/simulados?${queryString}` : '/simulados';
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  findById: async (id: string) => {
    const response = await apiClient.get(`/simulados/${id}`);
    return response.data;
  },
  
  findByConcurso: async (concursoId: string) => {
    const response = await apiClient.get(`/simulados?concurso_id=${concursoId}`);
    return response.data;
  },
  
  findByDificuldade: async (dificuldade: string) => {
    const response = await apiClient.get(`/simulados?dificuldade=${dificuldade}`);
    return response.data;
  },
  
  criarSimulado: async (data: CriarSimuladoData) => {
    const response = await apiClient.post('/simulados', data);
    return response.data;
  },
  
  atualizarSimulado: async (id: string, data: AtualizarSimuladoData) => {
    const response = await apiClient.put(`/simulados/${id}`, data);
    return response.data;
  },
  
  deletarSimulado: async (id: string) => {
    const response = await apiClient.delete(`/simulados/${id}`);
    return response.data;
  },
};

// Tipos para os filtros de simulados
type SimuladoFilters = {
  concursoId?: string;
  dificuldade?: string;
  // preferencial
  publico?: boolean;
  // legado (deprecated): mantido temporariamente como alias
  isPublic?: boolean;
  search?: string;
  [key: string]: unknown; // Permite filtros adicionais
};

// Chaves de query
const simuladoKeys = {
  all: ['simulados'] as const,
  lists: () => [...simuladoKeys.all, 'list'] as const,
  list: (filters?: SimuladoFilters) => [...simuladoKeys.lists(), { filters }] as const,
  details: () => [...simuladoKeys.all, 'detail'] as const,
  detail: (id: string) => [...simuladoKeys.details(), id] as const,
  byConcurso: (concursoId: string) => [...simuladoKeys.all, 'concurso', concursoId] as const,
  byDificuldade: (dificuldade: string) => [...simuladoKeys.all, 'dificuldade', dificuldade] as const,
  publicos: () => [...simuladoKeys.all, 'publicos'] as const,
};

// Hook para listar simulados
export const useListarSimulados = (
  filters: SimuladoFilters = {},
  options?: Omit<UseQueryOptions<Simulado[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Simulado[], Error>({
    queryKey: simuladoKeys.list(filters),
    queryFn: async () => simuladoRepo.buscarTodos(filters),
    ...options,
  });
};

// Hook para buscar simulado por ID
export const useBuscarSimulado = (
  id: string,
  options?: Omit<UseQueryOptions<Simulado | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Simulado | null, Error>({
    queryKey: simuladoKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const simulado = await simuladoRepo.findById(id);
      return simulado || null;
    },
    enabled: !!id,
    ...options,
  });
};

// Hook para buscar simulados por concurso
export const useListarSimuladosPorConcurso = (
  concursoId: string,
  options?: Omit<UseQueryOptions<Simulado[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Simulado[], Error>({
    queryKey: simuladoKeys.byConcurso(concursoId),
    queryFn: async () => simuladoRepo.findByConcurso(concursoId),
    enabled: !!concursoId,
    ...options,
  });
};

// Hook para buscar simulados por dificuldade
export const useListarSimuladosPorDificuldade = (
  dificuldade: string,
  options?: Omit<UseQueryOptions<Simulado[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Simulado[], Error>({
    queryKey: simuladoKeys.byDificuldade(dificuldade),
    queryFn: async () => simuladoRepo.findByDificuldade(dificuldade),
    enabled: !!dificuldade,
    ...options,
  });
};

// Hook para buscar simulados públicos
export const useListarSimuladosPublicos = (
  options?: Omit<UseQueryOptions<Simulado[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Simulado[], Error>({
    queryKey: simuladoKeys.publicos(),
    queryFn: async () => simuladoRepo.buscarTodos({ publico: true }),
    ...options,
  });
};

// Tipos para mutations
type CriarSimuladoData = Partial<Omit<Simulado, 'id' | 'criado_em' | 'atualizado_em'>>;
type AtualizarSimuladoData = Partial<Omit<Simulado, 'id' | 'criado_em' | 'atualizado_em'>>;

// Hook para criar simulado
export const useCriarSimulado = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    Simulado, 
    Error, 
    CriarSimuladoData,
    { previousSimulados: Simulado[] | undefined }
  >({
    mutationFn: async (data: CriarSimuladoData) => {
      const response = await simuladoRepo.criarSimulado(data);
      return response;
    },
    // Otimista UI update
    onMutate: async (newSimulado) => {
      await queryClient.cancelQueries({ queryKey: simuladoKeys.lists() });
      
      const previousSimulados = queryClient.getQueryData<Simulado[]>(simuladoKeys.list());
      
      if (previousSimulados) {
        queryClient.setQueryData<Simulado[]>(simuladoKeys.list(), [...previousSimulados, { ...newSimulado, id: 'temp-id' } as Simulado]);
      }
      
      return { previousSimulados };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, newSimulado, context) => {
      if (context?.previousSimulados) {
        queryClient.setQueryData(simuladoKeys.list(), context.previousSimulados);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: simuladoKeys.lists() });
    },
  });
};

// Hook para atualizar simulado
export const useAtualizarSimulado = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    Simulado, 
    Error, 
    { id: string; data: AtualizarSimuladoData },
    { previousSimulado: Simulado | undefined }
  >({
    mutationFn: async ({ id, data }: { id: string; data: AtualizarSimuladoData }) => {
      const response = await simuladoRepo.atualizarSimulado(id, data);
      return response;
    },
    // Otimista UI update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: simuladoKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: simuladoKeys.lists() });
      
      const previousSimulado = queryClient.getQueryData<Simulado>(simuladoKeys.detail(id));
      
      if (previousSimulado) {
        queryClient.setQueryData(simuladoKeys.detail(id), { ...previousSimulado, ...data });
      }
      
      return { previousSimulado };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, { id }, context) => {
      if (context?.previousSimulado) {
        queryClient.setQueryData(simuladoKeys.detail(id), context.previousSimulado);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: simuladoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: simuladoKeys.lists() });
    },
  });
};

// Hook para deletar simulado
export const useDeletarSimulado = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    Simulado, 
    Error, 
    string,
    { previousSimulado: Simulado | undefined }
  >({
    mutationFn: async (id: string) => {
      const response = await simuladoRepo.deletarSimulado(id);
      return response;
    },
    // Otimista UI update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: simuladoKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: simuladoKeys.lists() });
      
      const previousSimulado = queryClient.getQueryData<Simulado>(simuladoKeys.detail(id));
      
      if (previousSimulado) {
        queryClient.setQueryData(simuladoKeys.detail(id), { ...previousSimulado, deleted_at: new Date().toISOString() });
      }
      
      return { previousSimulado };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousSimulado) {
        queryClient.setQueryData(simuladoKeys.detail(id), context.previousSimulado);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: simuladoKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: simuladoKeys.lists() });
    },
  });
}; 