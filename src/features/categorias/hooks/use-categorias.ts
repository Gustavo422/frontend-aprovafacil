import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { CategoriaRepository } from '@/lib/repositories/categoria-repository';
import type { 
  CategoriaRow, 
  CategoriaInsert, 
  CategoriaUpdate 
} from '@/types/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

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
};

// Hooks para listar categorias
export const useListarCategorias = (
  filters: CategoriaFilters = {},
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: categoriaKeys.list(filters),
    queryFn: () => categoriaRepo.buscarComFiltros(filters),
    ...options,
  });
};

// Hook para buscar categorias ativas
export const useListarCategoriasAtivas = (
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: categoriaKeys.ativas(),
    queryFn: () => categoriaRepo.findAtivas(),
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
      return categoriaRepo.findById(id);
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
      if (!slug) return null;
      return categoriaRepo.findBySlug(slug);
    },
    enabled: !!slug,
    ...options,
  });
};

// Tipo para os dados de criação de categoria
type CriarCategoriaData = Omit<CategoriaInsert, 'id' | 'created_at' | 'updated_at'>;

// Hook para criar categoria
export const useCriarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaRow, 
    Error, 
    CriarCategoriaData,
    { previousCategorias: CategoriaRow[] | undefined }
  >({
    mutationFn: (data) => categoriaRepo.criarCategoria({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: data.is_active ?? true
    } as CategoriaInsert),
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
      console.error('Erro ao criar categoria:', error);
    },
    // Sempre revalidar os dados após a mutação
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriaKeys.lists() });
    },
  });
};

// Tipo para os dados de atualização de categoria
type AtualizarCategoriaData = Partial<Omit<CategoriaUpdate, 'id' | 'created_at' | 'updated_at'>>;

// Hook para atualizar categoria
export const useAtualizarCategoria = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    CategoriaRow, 
    Error, 
    { id: string; data: AtualizarCategoriaData },
    { previousCategoria: CategoriaRow | undefined }
  >({
    mutationFn: ({ id, data }) => categoriaRepo.atualizarCategoria(id, {
      ...data,
      updated_at: new Date().toISOString()
    }),
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
          updated_at: new Date().toISOString(),
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
      console.error('Erro ao atualizar categoria:', error);
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
    mutationFn: (id: string) => categoriaRepo.desativarCategoria(id),
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
          is_active: false,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previousCategoria };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), context.previousCategoria);
      }
      console.error('Erro ao desativar categoria:', error);
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
    mutationFn: (id: string) => categoriaRepo.ativarCategoria(id),
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
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previousCategoria };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousCategoria) {
        queryClient.setQueryData(categoriaKeys.detail(id), context.previousCategoria);
      }
      console.error('Erro ao ativar categoria:', error);
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
// @ts-ignore - Ignorar erro de tipo temporariamente
export const useListarCategoriasFilhas = (
  parentId: string | null,
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: [...categoriaKeys.detail(parentId || 'root'), 'filhas'],
    queryFn: () => categoriaRepo.findByParentId(parentId),
    enabled: parentId !== undefined,
    ...options,
  });
};

// Hook para buscar árvore de categorias
export const useListarArvoreCategorias = (
  options?: Omit<UseQueryOptions<CategoriaRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriaRow[], Error>({
    queryKey: [...categoriaKeys.all, 'arvore'],
    queryFn: () => categoriaRepo.findArvoreCategorias(),
    ...options,
  });
};
