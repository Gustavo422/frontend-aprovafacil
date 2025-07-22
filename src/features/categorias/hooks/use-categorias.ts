import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { CategoriaRepository } from '@/lib/repositories/categoria-repository';

// Definir Disciplina localmente para evitar erro de tipo
export type Disciplina = {
  id: string;
  categoria_id: string;
  nome: string;
  peso: number;
  horas_semanais: number;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

// Padronizar o tipo Categoria para garantir compatibilidade de tipos
export type CategoriaType = {
  id: string;
  nome: string;
  slug: string;
  descricao?: string | null;
  cor_primaria?: string;
  cor_secundaria?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  disciplinas?: Disciplina[];
};

// Padronizar o tipo CategoriaRow para uso nos hooks
export type CategoriaRow = {
  id: string;
  nome: string;
  descricao?: string;
  slug?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

// Função utilitária para normalizar Categoria para CategoriaRow
const toCategoriaRow = (cat: Record<string, unknown>): CategoriaRow => ({
  id: String(cat.id ?? ''),
  nome: String(cat.nome ?? ''),
  ativo: Boolean(cat.ativo),
  criado_em: String(cat.criado_em ?? ''),
  atualizado_em: String(cat.atualizado_em ?? ''),
  descricao: typeof cat.descricao === 'string' ? cat.descricao : undefined,
});

// Tipos locais para categorias
type CategoriaInsert = Omit<CategoriaRow, 'id' | 'criado_em' | 'atualizado_em'>;
type CategoriaUpdate = Partial<Omit<CategoriaRow, 'id' | 'criado_em'>>;


const categoriaRepo = new CategoriaRepository();

// Tipos para os filtros de categorias
type CategoriaFilters = {
  ativo?: boolean;
  search?: string;
  parentId?: string | null;
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
  children: (parentId: string | null) => [...categoriaKeys.all, 'children', parentId] as const,
  tree: () => [...categoriaKeys.all, 'tree'] as const,
};

// Hooks para listar categorias
export const useListarCategorias = (
  filters: CategoriaFilters = {},
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: categoriaKeys.list(filters),
    queryFn: async () => {
      const categorias = await categoriaRepo.buscarComFiltros(filters as Record<string, string | boolean>);
      return Array.isArray(categorias) ? categorias.map(toCategoriaRow) : [];
    },
    ...options,
  });
};

// Hook para buscar categorias ativas
export const useListarCategoriasAtivas = (
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: categoriaKeys.ativas(),
    queryFn: async () => (await categoriaRepo.findAtivas()).map(toCategoriaRow),
    ...options,
  });
};

// Hook para buscar categoria por ID
export const useBuscarCategoria = (
  id: string,
  options?: Omit<UseQueryOptions<CategoriaRow | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow | null, Error>({
    queryKey: categoriaKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const cat = await categoriaRepo.findBySlug(id);
      if (!cat) return null;
      return toCategoriaRow(cat);
    },
    enabled: !!id,
    ...options,
  });
};

// Hook para buscar categoria por slug
export const useBuscarCategoriaPorSlug = (
  slug: string,
  options?: Omit<UseQueryOptions<CategoriaRow | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow | null, Error>({
    queryKey: categoriaKeys.bySlug(slug),
    queryFn: async () => {
      const categoria = await categoriaRepo.findBySlug(slug);
      return categoria ? toCategoriaRow(categoria) : null;
    },
    enabled: !!slug,
    ...options,
  });
};

// Tipo para os dados de criação de categoria
type CriarCategoriaData = Omit<CategoriaInsert, 'id' | 'criado_em' | 'atualizado_em'>;

// Hook para criar categoria
export const useCriarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaRow, 
    Error, 
    CriarCategoriaData,
    { previousCategorias: CategoriaRow[] | undefined }
  >({
    mutationFn: async (data) => {
      const cat = await categoriaRepo.criarCategoria({
        ...data,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        ativo: data.ativo ?? true
      } as CategoriaInsert);
      return toCategoriaRow(cat);
    },
    // Otimista UI update
    onMutate: async (newCategoria) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: categoriaKeys.lists() });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousCategorias = queryClient.getQueryData<CategoriaRow[]>(
        categoriaKeys.list()
      );
      
      // Atualizar o cache otimisticamente
      if (previousCategorias) {
        queryClient.setQueryData<CategoriaRow[]>(
          categoriaKeys.list(),
          [...previousCategorias, { ...newCategoria, id: 'temp-id' } as CategoriaRow]
        );
      }
      
      return { previousCategorias };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, newCategoria, context) => {
      if (context?.previousCategorias) {
        queryClient.setQueryData(categoriaKeys.lists(), context.previousCategorias);
      }
    },
    // Sempre revalidar os dados após a mutação
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Tipo para os dados de atualização de categoria
type AtualizarCategoriaData = Partial<Omit<CategoriaUpdate, 'id' | 'criado_em' | 'atualizado_em'>>;

// Hook para atualizar categoria
export const useAtualizarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaRow, 
    Error, 
    { id: string; data: AtualizarCategoriaData },
    { previousCategoria: CategoriaRow | undefined }
  >({
    mutationFn: async ({ id, data }) => {
      const cat = await categoriaRepo.atualizarCategoria(id, data);
      return toCategoriaRow(cat);
    },
    // Otimista UI update
    onMutate: async ({ id, data }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: categoriaKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousCategoria = queryClient.getQueryData<CategoriaRow>(
        categoriaKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousCategoria) {
        const updatedCategoria = {
          ...previousCategoria,
          ...data,
          atualizado_em: new Date().toISOString(),
        };
        
        queryClient.setQueryData(categoriaKeys.detail(id), updatedCategoria);
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
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: categoriaKeys.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Hook para desativar categoria
export const useDesativarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaRow, 
    Error, 
    string,
    { previousCategoria: CategoriaRow | undefined }
  >({
    mutationFn: async (id: string) => {
      const cat = await categoriaRepo.desativarCategoria(id);
      return toCategoriaRow(cat);
    },
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: categoriaKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousCategoria = queryClient.getQueryData<CategoriaRow>(
        categoriaKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), {
          ...previousCategoria,
          ativo: false,
          atualizado_em: new Date().toISOString(),
        });
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
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: categoriaKeys.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Hook para ativar categoria
export const useAtivarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaRow, 
    Error, 
    string,
    { previousCategoria: CategoriaRow | undefined }
  >({
    mutationFn: async (id: string) => {
      const cat = await categoriaRepo.ativarCategoria(id);
      return toCategoriaRow(cat);
    },
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: categoriaKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousCategoria = queryClient.getQueryData<CategoriaRow>(
        categoriaKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), {
          ...previousCategoria,
          ativo: true,
          atualizado_em: new Date().toISOString(),
        });
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
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: categoriaKeys.detail(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Tipo para o retorno da verificação de exclusão
type PodeExcluirResult = {
  podeExcluir: boolean;
  motivo?: string;
};

// Hook para verificar se uma categoria pode ser excluída
export const usePodeExcluirCategoria = (
  id: string,
  options?: Omit<UseQueryOptions<PodeExcluirResult, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PodeExcluirResult, Error>({
    queryKey: [...categoriaKeys.detail(id), 'can-delete'],
    queryFn: async () => {
      if (!id) return { podeExcluir: false, motivo: 'ID não fornecido' };
      return categoriaRepo.podeExcluirCategoria(id);
    },
    enabled: !!id,
    ...options,
  });
};

// Hook para buscar categorias filhas
export const useListarCategoriasFilhas = (
  parentId: string | null,
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: categoriaKeys.children(parentId),
    queryFn: async () => {
      const categorias = await categoriaRepo.findByParentId(parentId);
      return categorias.map(toCategoriaRow);
    },
    enabled: parentId !== undefined,
    ...options,
  });
};

// Hook para buscar árvore de categorias
export const useListarArvoreCategorias = (
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: categoriaKeys.tree(),
    queryFn: async () => {
      const categorias = await categoriaRepo.findArvoreCategorias();
      return categorias.map(toCategoriaRow);
    },
    ...options,
  });
};