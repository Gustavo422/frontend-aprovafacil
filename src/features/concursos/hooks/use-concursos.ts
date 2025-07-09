import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { ConcursoRepository } from '@/lib/repositories/concurso-repository';
import type { 
  Concurso, 
  TablesInsert, 
  TablesUpdate 
} from '@/types/supabase.types';


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
  options?: Omit<UseQueryOptions<Concurso[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Concurso[], Error>({
    queryKey: concursoKeys.list(filters),
    queryFn: () => concursoRepo.buscarComFiltros(filters),
    ...options,
  });
};

// Hook para buscar concursos ativos
export const useListarConcursosAtivos = (
  options?: Omit<UseQueryOptions<Concurso[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Concurso[], Error>({
    queryKey: concursoKeys.ativos(),
    queryFn: () => concursoRepo.findAtivos(),
    ...options,
  });
};

// Hook para buscar concursos por categoria
export const useListarConcursosPorCategoria = (
  categoriaId: string,
  options?: Omit<UseQueryOptions<Concurso[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Concurso[], Error>({
    queryKey: concursoKeys.byCategoria(categoriaId),
    queryFn: () => concursoRepo.findByCategoria(categoriaId),
    enabled: !!categoriaId,
    ...options,
  });
};

// Hook para buscar concursos por banca
export const useListarConcursosPorBanca = (
  banca: string,
  options?: Omit<UseQueryOptions<Concurso[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Concurso[], Error>({
    queryKey: concursoKeys.byBanca(banca),
    queryFn: () => concursoRepo.findByBanca(banca),
    enabled: !!banca,
    ...options,
  });
};

// Hook para buscar concurso por ID
export const useBuscarConcurso = (
  id: string,
  options?: Omit<UseQueryOptions<Concurso | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Concurso | null, Error>({
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
type CriarConcursoData = Omit<TablesInsert<'concursos'>, 'id' | 'created_at' | 'updated_at'>;

// Hook para criar concurso
export const useCriarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    Concurso, 
    Error, 
    CriarConcursoData,
    { previousConcursos: Concurso[] | undefined }
  >({
    mutationFn: (data) => concursoRepo.criarConcurso({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: data.is_active ?? true
    } as TablesInsert<'concursos'>),
    // Otimista UI update
    onMutate: async (newConcurso) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.lists() });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcursos = queryClient.getQueryData<Concurso[]>(
        concursoKeys.list()
      );
      
      // Atualizar o cache otimisticamente
      if (previousConcursos) {
        queryClient.setQueryData<Concurso[]>(
          concursoKeys.list(),
          [...previousConcursos, { ...newConcurso, id: 'temp-id' } as Concurso]
        );
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
type AtualizarConcursoData = Partial<Omit<TablesUpdate<'concursos'>, 'id' | 'created_at' | 'updated_at'>>;

// Hook para atualizar concurso
export const useAtualizarConcurso = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    Concurso, 
    Error, 
    { id: string; data: AtualizarConcursoData },
    { previousConcurso: Concurso | undefined }
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
      const previousConcurso = queryClient.getQueryData<Concurso>(
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
    Concurso, 
    Error, 
    string,
    { previousConcurso: Concurso | undefined }
  >({
    mutationFn: (id: string) => concursoRepo.desativarConcurso(id),
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<Concurso>(
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
    Concurso, 
    Error, 
    string,
    { previousConcurso: Concurso | undefined }
  >({
    mutationFn: (id: string) => concursoRepo.ativarConcurso(id),
    // Otimista UI update
    onMutate: async (id) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: concursoKeys.detail(id) });
      
      // Salvar o estado anterior para rollback em caso de erro
      const previousConcurso = queryClient.getQueryData<Concurso>(
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

