import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { ConcursoRepository } from '@/lib/repositories/concurso-repository';
import type { 
  ConcursoRow, 
  ConcursoInsert, 
  ConcursoUpdate 
} from '@/types/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

const concursoRepo = new ConcursoRepository();

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
  options?: Omit<UseQueryOptions<ConcursoRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoRow[], Error>({
    queryKey: concursoKeys.list(filters),
    queryFn: () => concursoRepo.buscarComFiltros(filters),
    ...options,
  });
};

// Hook para buscar concursos ativos
export const useListarConcursosAtivos = (
  options?: Omit<UseQueryOptions<ConcursoRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoRow[], Error>({
    queryKey: concursoKeys.ativos(),
    queryFn: () => concursoRepo.findAtivos(),
    ...options,
  });
};

// Hook para buscar concursos por categoria
export const useListarConcursosPorCategoria = (
  categoriaId: string,
  options?: Omit<UseQueryOptions<ConcursoRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoRow[], Error>({
    queryKey: concursoKeys.byCategoria(categoriaId),
    queryFn: () => concursoRepo.findByCategoria(categoriaId),
    enabled: !!categoriaId,
    ...options,
  });
};

// Hook para buscar concursos por banca
export const useListarConcursosPorBanca = (
  banca: string,
  options?: Omit<UseQueryOptions<ConcursoRow[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoRow[], Error>({
    queryKey: concursoKeys.byBanca(banca),
    queryFn: () => concursoRepo.findByBanca(banca),
    enabled: !!banca,
    ...options,
  });
};

// Hook para buscar concurso por ID
export const useBuscarConcurso = (
  id: string,
  options?: Omit<UseQueryOptions<ConcursoRow | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ConcursoRow | null, Error>({
    queryKey: concursoKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      return concursoRepo.findById(id);
    },
    enabled: !!id,
    ...options,
  });
};

// Tipo para os dados de criação de concurso
type CriarConcursoData = Omit<ConcursoInsert, 'id' | 'created_at' | 'updated_at'>;

// Hook para criar concurso
export const useCriarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConcursoRow, 
    Error, 
    CriarConcursoData,
    { previousConcursos: ConcursoRow[] | undefined }
  >({
    mutationFn: (data) => concursoRepo.criarConcurso({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: data.is_active ?? true
    } as ConcursoInsert),
    // Otimista UI update
    onMutate: async (newConcurso) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.lists() });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcursos = queryClient.getQueryData<ConcursoRow[]>(
        concursoKeys.list()
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcursos) {
        queryClient.setQueryData<ConcursoRow[]>(
          concursoKeys.list(),
          [...previousConcursos, { ...newConcurso, id: 'temp-id' } as ConcursoRow]
        );
      }
      
      return { previousConcursos };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, newConcurso, context) => {
      if (context?.previousConcursos) {
        queryClient.setQueryData(concursoKeys.lists(), context.previousConcursos);
      }
      console.error('Erro ao criar concurso:', error);
    },
    // Sempre revalidar os dados após a mutação
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: concursoKeys.lists() });
    },
  });
};

// Tipo para os dados de atualização de concurso
type AtualizarConcursoData = Partial<Omit<ConcursoUpdate, 'id' | 'created_at' | 'updated_at'>>;

// Hook para atualizar concurso
export const useAtualizarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConcursoRow, 
    Error, 
    { id: string; data: AtualizarConcursoData },
    { previousConcurso: ConcursoRow | undefined }
  >({
    mutationFn: ({ id, data }) => concursoRepo.atualizarConcurso(id, {
      ...data,
      updated_at: new Date().toISOString()
    }),
    // Otimista UI update
    onMutate: async ({ id, data }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<ConcursoRow>(
        concursoKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcurso) {
        const updatedConcurso = {
          ...previousConcurso,
          ...data,
          updated_at: new Date().toISOString(),
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
      console.error('Erro ao atualizar concurso:', error);
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
    ConcursoRow, 
    Error, 
    string,
    { previousConcurso: ConcursoRow | undefined }
  >({
    mutationFn: (id: string) => concursoRepo.desativarConcurso(id),
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<ConcursoRow>(
        concursoKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), {
          ...previousConcurso,
          is_active: false,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previousConcurso };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), context.previousConcurso);
      }
      console.error('Erro ao desativar concurso:', error);
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
    ConcursoRow, 
    Error, 
    string,
    { previousConcurso: ConcursoRow | undefined }
  >({
    mutationFn: (id: string) => concursoRepo.ativarConcurso(id),
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<ConcursoRow>(
        concursoKeys.detail(id)
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), {
          ...previousConcurso,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      }
      
      return { previousConcurso };
    },
    // Em caso de erro, reverter para o estado anterior
    onError: (error, id, context) => {
      if (context?.previousConcurso) {
        queryClient.setQueryData(concursoKeys.detail(id), context.previousConcurso);
      }
      console.error('Erro ao ativar concurso:', error);
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
