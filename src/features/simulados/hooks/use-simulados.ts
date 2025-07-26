import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

export type SimuladoType = {
  id: string;
  titulo: string;
  descricao?: string | null;
  questions_count: number;
  time_minutes: number;
  dificuldade: string;
  criado_em: string;
  concurso_id: string | null;
  is_public: boolean;
  atualizado_em: string;
  deleted_at: string | null;
  created_by: string | null;
};

// Mock de simulados em memória (substituir por repositório real)
const simuladosMock: SimuladoType[] = [
  {
    id: '1',
    titulo: 'Simulado Exemplo',
    descricao: 'Descrição de exemplo',
    questions_count: 20,
    time_minutes: 60,
    dificuldade: 'Médio',
    criado_em: new Date().toISOString(),
    concurso_id: '1',
    is_public: true,
    atualizado_em: new Date().toISOString(),
    deleted_at: null,
    created_by: 'user1',
  }
];

const simuladoRepo = {
  buscarTodos: async () => simuladosMock,
  findById: async (id: string) => simuladosMock.find(s => s.id === id),
  findByConcurso: async (concursoId: string) => simuladosMock.filter(s => s.concurso_id === concursoId),
  findByDificuldade: async (dificuldade: string) => simuladosMock.filter(s => s.dificuldade === dificuldade),
  criarSimulado: async (data: CriarSimuladoData) => {
    const novo: SimuladoType = {
      ...data,
      id: (simuladosMock.length + 1).toString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      deleted_at: null,
    };
    simuladosMock.push(novo);
    return novo;
  },
  atualizarSimulado: async (id: string, data: AtualizarSimuladoData) => {
    const idx = simuladosMock.findIndex(s => s.id === id);
    if (idx >= 0) {
      simuladosMock[idx] = {
        ...simuladosMock[idx],
        ...data,
        atualizado_em: new Date().toISOString(),
      };
      return simuladosMock[idx];
    }
    throw new Error('Simulado não encontrado');
  },
  deletarSimulado: async (id: string) => {
    const idx = simuladosMock.findIndex(s => s.id === id);
    if (idx >= 0) {
      simuladosMock[idx].deleted_at = new Date().toISOString();
      return simuladosMock[idx];
    }
    throw new Error('Simulado não encontrado');
  },
};

// Tipos para os filtros de simulados
type SimuladoFilters = {
  concursoId?: string;
  dificuldade?: string;
  isPublic?: boolean;
  search?: string;
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
  options?: Omit<UseQueryOptions<SimuladoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SimuladoType[], Error>({
    queryKey: simuladoKeys.list(filters),
    queryFn: () => simuladoRepo.buscarTodos(),
    ...options,
  });
};

// Hook para buscar simulado por ID
export const useBuscarSimulado = (
  id: string,
  options?: Omit<UseQueryOptions<SimuladoType | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SimuladoType | null, Error>({
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
  options?: Omit<UseQueryOptions<SimuladoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SimuladoType[], Error>({
    queryKey: simuladoKeys.byConcurso(concursoId),
    queryFn: () => simuladoRepo.findByConcurso(concursoId),
    enabled: !!concursoId,
    ...options,
  });
};

// Hook para buscar simulados por dificuldade
export const useListarSimuladosPorDificuldade = (
  dificuldade: string,
  options?: Omit<UseQueryOptions<SimuladoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SimuladoType[], Error>({
    queryKey: simuladoKeys.byDificuldade(dificuldade),
    queryFn: () => simuladoRepo.findByDificuldade(dificuldade),
    enabled: !!dificuldade,
    ...options,
  });
};

// Hook para buscar simulados públicos
export const useListarSimuladosPublicos = (
  options?: Omit<UseQueryOptions<SimuladoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SimuladoType[], Error>({
    queryKey: simuladoKeys.publicos(),
    queryFn: () => simuladoRepo.buscarTodos().then(simulados => simulados.filter(s => s.is_public)),
    ...options,
  });
};

// Tipos para mutations
type CriarSimuladoData = Omit<SimuladoType, 'id' | 'criado_em' | 'atualizado_em' | 'deleted_at'>;
type AtualizarSimuladoData = Partial<Omit<SimuladoType, 'id' | 'criado_em' | 'atualizado_em' | 'deleted_at'>>;

// Hook para criar simulado
export const useCriarSimulado = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    SimuladoType, 
    Error, 
    CriarSimuladoData,
    { previousSimulados: SimuladoType[] | undefined }
  >({
    mutationFn: (data) => simuladoRepo.criarSimulado(data),
    // Otimista UI update
    onMutate: async (newSimulado) => {
      await queryClient.cancelQueries({ queryKey: simuladoKeys.lists() });
      
      const previousSimulados = queryClient.getQueryData<SimuladoType[]>(simuladoKeys.list());
      
      if (previousSimulados) {
        queryClient.setQueryData<SimuladoType[]>(simuladoKeys.list(), [...previousSimulados, { ...newSimulado, id: 'temp-id' } as SimuladoType]);
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
    SimuladoType, 
    Error, 
    { id: string; data: AtualizarSimuladoData },
    { previousSimulado: SimuladoType | undefined }
  >({
    mutationFn: ({ id, data }) => simuladoRepo.atualizarSimulado(id, data),
    // Otimista UI update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: simuladoKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: simuladoKeys.lists() });
      
      const previousSimulado = queryClient.getQueryData<SimuladoType>(simuladoKeys.detail(id));
      
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
    SimuladoType, 
    Error, 
    string,
    { previousSimulado: SimuladoType | undefined }
  >({
    mutationFn: (id) => simuladoRepo.deletarSimulado(id),
    // Otimista UI update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: simuladoKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: simuladoKeys.lists() });
      
      const previousSimulado = queryClient.getQueryData<SimuladoType>(simuladoKeys.detail(id));
      
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