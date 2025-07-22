import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
// TODO: Implementar ConcursoRepository e tipos ou substituir por mocks temporários
type ConcursoType = {
  id: string;
  nome: string;
  descricao?: string;
  ano?: number;
  banca?: string;
  categoriaId?: string;
  ativo?: boolean;
  nivel_dificuldade?: 'facil' | 'medio' | 'dificil';
  multiplicador_questoes?: number;
  atualizado_em?: string;
};

// Mock de concursos em memória
const concursosMock: ConcursoType[] = [
  {
    id: '1',
    nome: 'Concurso Exemplo',
    descricao: 'Descrição de exemplo',
    ano: 2024,
    banca: 'Banca X',
    categoriaId: 'cat1',
    ativo: true,
    nivel_dificuldade: 'medio',
    multiplicador_questoes: 1.0,
    atualizado_em: new Date().toISOString(),
  }
];

const concursoRepo = {
  buscarComFiltros: async () => concursosMock,
  findAtivos: async () => concursosMock.filter(c => c.ativo),
  findByCategoria: async (categoriaId: string) => concursosMock.filter(c => c.categoriaId === categoriaId),
  findByBanca: async (banca: string) => concursosMock.filter(c => c.banca === banca),
  criarConcurso: async (data: CriarConcursoData) => {
    const novo: ConcursoType = {
      ...data,
      id: (concursosMock.length + 1).toString(),
      atualizado_em: new Date().toISOString(),
    };
    concursosMock.push(novo);
    return novo;
  },
  atualizarConcurso: async (id: string, data: AtualizarConcursoData) => {
    const idx = concursosMock.findIndex(c => c.id === id);
    if (idx >= 0) {
      concursosMock[idx] = {
        ...concursosMock[idx],
        ...data,
        atualizado_em: new Date().toISOString(),
      };
      return concursosMock[idx];
    }
    throw new Error('Concurso não encontrado');
  },
  desativarConcurso: async (id: string) => {
    const idx = concursosMock.findIndex(c => c.id === id);
    if (idx >= 0) {
      concursosMock[idx].ativo = false;
      concursosMock[idx].atualizado_em = new Date().toISOString();
      return concursosMock[idx];
    }
    throw new Error('Concurso não encontrado');
  },
  ativarConcurso: async (id: string) => {
    const idx = concursosMock.findIndex(c => c.id === id);
    if (idx >= 0) {
      concursosMock[idx].ativo = true;
      concursosMock[idx].atualizado_em = new Date().toISOString();
      return concursosMock[idx];
    }
    throw new Error('Concurso não encontrado');
  },
};
// ConcursoType é o tipo do repositório


// Tipos para os filtros de concursos
type ConcursoFilters = {
  categoriaId?: string;
  banca?: string;
  ativo?: boolean;
  anoMinimo?: number;
  anoMaximo?: number;
  search?: string;
};

// Chaves de query
const concursoKeys = {
  all: ['concursos'] as const,
  lists: () => [...concursoKeys.all, 'list'] as const,
  list: (filters?: ConcursoFilters) => [...concursoKeys.lists(), { filters }] as const,
  details: () => [...concursoKeys.all, 'detail'] as const,
  detail: (id: string) => [...concursoKeys.details(), id] as const,
  byCategoria: (categoriaId: string) => 
    [...concursoKeys.all, 'categoria', categoriaId] as const,
  ativos: () => [...concursoKeys.all, 'ativos'] as const,
  byBanca: (banca: string) => [...concursoKeys.all, 'banca', banca] as const,
};

// Hook para listar concursos
export const useListarConcursos = (
  filters: ConcursoFilters = {},
  options?: Omit<UseQueryOptions<ConcursoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoType[], Error>({
    queryKey: concursoKeys.list(filters),
    queryFn: () => concursoRepo.buscarComFiltros(),
    ...options,
  });
};

// Hook para buscar concursos ativos
export const useListarConcursosAtivos = (
  options?: Omit<UseQueryOptions<ConcursoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoType[], Error>({
    queryKey: concursoKeys.ativos(),
    queryFn: () => concursoRepo.findAtivos(),
    ...options,
  });
};

// Hook para buscar concursos por categoria
export const useListarConcursosPorCategoria = (
  categoriaId: string,
  options?: Omit<UseQueryOptions<ConcursoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoType[], Error>({
    queryKey: concursoKeys.byCategoria(categoriaId),
    queryFn: () => concursoRepo.findByCategoria(categoriaId),
    enabled: !!categoriaId,
    ...options,
  });
};

// Hook para buscar concursos por banca
export const useListarConcursosPorBanca = (
  banca: string,
  options?: Omit<UseQueryOptions<ConcursoType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoType[], Error>({
    queryKey: concursoKeys.byBanca(banca),
    queryFn: () => concursoRepo.findByBanca(banca),
    enabled: !!banca,
    ...options,
  });
};

// Hook para buscar concurso por ID
export const useBuscarConcurso = (
  id: string,
  options?: Omit<UseQueryOptions<ConcursoType | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoType | null, Error>({
    queryKey: concursoKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      return null; // Corrigir: nunca retornar undefined
    },
    enabled: !!id,
    ...options,
  });
};

// Tipo para os dados de criação de concurso
type CriarConcursoData = Omit<ConcursoType, 'id' | 'atualizado_em'>;

// Hook para criar concurso
export const useCriarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConcursoType, 
    Error, 
    CriarConcursoData,
    { previousConcursos: ConcursoType[] | undefined }
  >({
    mutationFn: (data) => concursoRepo.criarConcurso({
      ...data,
      nivel_dificuldade: (data.nivel_dificuldade === 'facil' || data.nivel_dificuldade === 'medio' || data.nivel_dificuldade === 'dificil') ? data.nivel_dificuldade : undefined,
      multiplicador_questoes: typeof data.multiplicador_questoes === 'number' ? data.multiplicador_questoes : undefined,
    }),
    // Otimista UI update
    onMutate: async (newConcurso) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.lists() });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcursos = queryClient.getQueryData<ConcursoType[]>(concursoKeys.list());
      
      // Atualizar o cache otimisticamente
      if (previousConcursos) {
        queryClient.setQueryData<ConcursoType[]>(concursoKeys.list(), [...previousConcursos, { ...newConcurso, id: 'temp-id' } as ConcursoType]);
      }
      
      return { previousConcursos };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, newConcurso, context) => {
      if (context?.previousConcursos) {
        queryClient.setQueryData(concursoKeys.lists(), context.previousConcursos);
      }

    },
    // Sempre revalidar os dados após a mutação
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: concursoKeys.lists() });
    },
  });
};

// Tipo para os dados de atualização de concurso
type AtualizarConcursoData = Partial<Omit<ConcursoType, 'id' | 'atualizado_em'>>;

// Hook para atualizar concurso
export const useAtualizarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConcursoType, 
    Error, 
    { id: string; data: AtualizarConcursoData },
    { previousConcurso: ConcursoType | undefined }
  >({
    mutationFn: ({ id, data }) => {
      return concursoRepo.atualizarConcurso(id, {
        ...data,
        nivel_dificuldade: (data.nivel_dificuldade === 'facil' || data.nivel_dificuldade === 'medio' || data.nivel_dificuldade === 'dificil') ? data.nivel_dificuldade : undefined,
        multiplicador_questoes: typeof data.multiplicador_questoes === 'number' ? data.multiplicador_questoes : undefined,
      });
    },
    // Otimista UI update
    onMutate: async ({ id, data }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<ConcursoType>(
        concursoKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcurso) {
        const updatedConcurso = {
          ...previousConcurso,
          ...data,
          atualizado_em: new Date().toISOString(),
        };
        
        queryClient.setQueryData(concursoKeys.detail(id), updatedConcurso);
      }
      
      return { previousConcurso };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, { id }, context) => {
      if (context?.previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), context.previousConcurso);
      }

    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: concursoKeys.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: concursoKeys.lists() });
    },
  });
};

// Hook para desativar concurso
export const useDesativarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConcursoType, 
    Error, 
    string,
    { previousConcurso: ConcursoType | undefined }
  >({
    mutationFn: (id: string) => concursoRepo.desativarConcurso(id),
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<ConcursoType>(
        concursoKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), {
          ...previousConcurso,
          ativo: false,
          atualizado_em: new Date().toISOString(),
        });
      }
      
      return { previousConcurso };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), context.previousConcurso);
      }

    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: concursoKeys.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: concursoKeys.lists() });
    },
  });
};

// Hook para ativar concurso
export const useAtivarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConcursoType, 
    Error, 
    string,
    { previousConcurso: ConcursoType | undefined }
  >({
    mutationFn: (id: string) => concursoRepo.ativarConcurso(id),
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<ConcursoType>(
        concursoKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), {
          ...previousConcurso,
          ativo: true,
          atualizado_em: new Date().toISOString(),
        });
      }
      
      return { previousConcurso };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), context.previousConcurso);
      }

    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: concursoKeys.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: concursoKeys.lists() });
    },
  });
};