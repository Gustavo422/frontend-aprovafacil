import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

export type CategoriaType = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

// Mock de categorias em memória (substituir por repositório real)
const categoriasMock: CategoriaType[] = [
  {
    id: '1',
    nome: 'Polícia Federal',
    slug: 'policia-federal',
    descricao: 'Concursos da Polícia Federal',
    cor_primaria: '#1f2937',
    cor_secundaria: '#374151',
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  }
];

const categoriaRepo = {
  buscarTodas: async () => categoriasMock,
  findById: async (id: string) => categoriasMock.find(c => c.id === id),
  findBySlug: async (slug: string) => categoriasMock.find(c => c.slug === slug),
  findAtivas: async () => categoriasMock.filter(c => c.ativo),
  criarCategoria: async (data: CriarCategoriaData) => {
    const nova: CategoriaType = {
      ...data,
      id: (categoriasMock.length + 1).toString(),
      slug: data.nome.toLowerCase().replace(/\s+/g, '-'),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
    categoriasMock.push(nova);
    return nova;
  },
  atualizarCategoria: async (id: string, data: AtualizarCategoriaData) => {
    const idx = categoriasMock.findIndex(c => c.id === id);
    if (idx >= 0) {
      categoriasMock[idx] = {
        ...categoriasMock[idx],
        ...data,
        atualizado_em: new Date().toISOString(),
      };
      return categoriasMock[idx];
    }
    throw new Error('Categoria não encontrada');
  },
  deletarCategoria: async (id: string) => {
    const idx = categoriasMock.findIndex(c => c.id === id);
    if (idx >= 0) {
      categoriasMock[idx].ativo = false;
      categoriasMock[idx].atualizado_em = new Date().toISOString();
      return categoriasMock[idx];
    }
    throw new Error('Categoria não encontrada');
  },
};

// Tipos para os filtros de categorias
type CategoriaFilters = {
  ativo?: boolean;
  search?: string;
};

// Chaves de query
const categoriaKeys = {
  all: ['categorias'] as const,
  lists: () => [...categoriaKeys.all, 'list'] as const,
  list: (filters?: CategoriaFilters) => [...categoriaKeys.lists(), { filters }] as const,
  details: () => [...categoriaKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoriaKeys.details(), id] as const,
  bySlug: (slug: string) => [...categoriaKeys.all, 'slug', slug] as const,
  ativas: () => [...categoriaKeys.all, 'ativas'] as const,
};

// Hook para listar categorias
export const useListarCategorias = (
  filters: CategoriaFilters = {},
  options?: Omit<UseQueryOptions<CategoriaType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaType[], Error>({
    queryKey: categoriaKeys.list(filters),
    queryFn: () => categoriaRepo.buscarTodas(),
    ...options,
  });
};

// Hook para buscar categoria por ID
export const useBuscarCategoria = (
  id: string,
  options?: Omit<UseQueryOptions<CategoriaType | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaType | null, Error>({
    queryKey: categoriaKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const categoria = await categoriaRepo.findById(id);
      return categoria || null;
    },
    enabled: !!id,
    ...options,
  });
};

// Hook para buscar categoria por slug
export const useBuscarCategoriaPorSlug = (
  slug: string,
  options?: Omit<UseQueryOptions<CategoriaType | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaType | null, Error>({
    queryKey: categoriaKeys.bySlug(slug),
    queryFn: async () => {
      if (!slug) return null;
      const categoria = await categoriaRepo.findBySlug(slug);
      return categoria || null;
    },
    enabled: !!slug,
    ...options,
  });
};

// Hook para buscar categorias ativas
export const useListarCategoriasAtivas = (
  options?: Omit<UseQueryOptions<CategoriaType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaType[], Error>({
    queryKey: categoriaKeys.ativas(),
    queryFn: () => categoriaRepo.findAtivas(),
    ...options,
  });
};

// Tipos para mutations
type CriarCategoriaData = Omit<CategoriaType, 'id' | 'slug' | 'criado_em' | 'atualizado_em'>;
type AtualizarCategoriaData = Partial<Omit<CategoriaType, 'id' | 'criado_em' | 'atualizado_em'>>;

// Hook para criar categoria
export const useCriarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaType, 
    Error, 
    CriarCategoriaData,
    { previousCategorias: CategoriaType[] | undefined }
  >({
    mutationFn: (data) => categoriaRepo.criarCategoria(data),
    // Otimista UI update
    onMutate: async (newCategoria) => {
      await queryClient.cancelQueries({ queryKey: categoriaKeys.lists() });
      
      const previousCategorias = queryClient.getQueryData<CategoriaType[]>(categoriaKeys.list());
      
      if (previousCategorias) {
        queryClient.setQueryData<CategoriaType[]>(categoriaKeys.list(), [...previousCategorias, { ...newCategoria, id: 'temp-id' } as CategoriaType]);
      }
      
      return { previousCategorias };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, newCategoria, context) => {
      if (context?.previousCategorias) {
        queryClient.setQueryData(categoriaKeys.list(), context.previousCategorias);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Hook para atualizar categoria
export const useAtualizarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaType, 
    Error, 
    { id: string; data: AtualizarCategoriaData },
    { previousCategoria: CategoriaType | undefined }
  >({
    mutationFn: ({ id, data }) => categoriaRepo.atualizarCategoria(id, data),
    // Otimista UI update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: categoriaKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: categoriaKeys.lists() });
      
      const previousCategoria = queryClient.getQueryData<CategoriaType>(categoriaKeys.detail(id));
      
      if (previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), { ...previousCategoria, ...data });
      }
      
      return { previousCategoria };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, { id }, context) => {
      if (context?.previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), context.previousCategoria);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: categoriaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Hook para deletar categoria
export const useDeletarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaType, 
    Error, 
    string,
    { previousCategoria: CategoriaType | undefined }
  >({
    mutationFn: (id) => categoriaRepo.deletarCategoria(id),
    // Otimista UI update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: categoriaKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: categoriaKeys.lists() });
      
      const previousCategoria = queryClient.getQueryData<CategoriaType>(categoriaKeys.detail(id));
      
      if (previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), { ...previousCategoria, ativo: false });
      }
      
      return { previousCategoria };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), context.previousCategoria);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: categoriaKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};