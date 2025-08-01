import { useQuery as useTanstackQuery, UseQueryOptions as TanstackQueryOptions, QueryKey } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { cacheManager, CacheType, CacheOptions } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

/**
 * Opções estendidas para useEnhancedQuery
 */
export interface UseEnhancedQueryOptions<TData, TError> extends Omit<TanstackQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  cacheOptions?: CacheOptions & {
    useLocalCache?: boolean;
    persistInSupabase?: boolean;
  };
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Hook aprimorado para busca de dados com cache em múltiplas camadas
 */
export function useEnhancedQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: UseEnhancedQueryOptions<TData, TError> = {}
) {
  const { user } = useAuth();
  const usuarioId = user?.id;
  
  const {
    cacheOptions = {},
    // onSuccess,
    // onError,
    // retry = 3,
    // enabled = true,
    // select,
    // Outras opções do useQuery
    ...rest
  } = options;
  
  const {
    useLocalCache = true,
    persistInSupabase = false,
    type = CacheType.MEMORY,
    ttlMinutes = 5,
    relatedKeys,
  } = cacheOptions;
  
  // Chave de cache formatada
  const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : String(queryKey);
  
  // Função para buscar dados com cache local
  const fetchWithCache = useCallback(async () => {
    try {
      // Verificar cache local primeiro se habilitado
      if (useLocalCache) {
        const cachedData = await cacheManager.get<TData>(cacheKey, {
          type,
          usuarioId: persistInSupabase ? usuarioId : undefined
        });
        
        if (cachedData !== null) {
          logger.debug('Cache hit', { key: cacheKey, type });
          return cachedData;
        }
      }
      
      // Buscar dados
      const data = await queryFn();
      
      // Salvar no cache local
      if (useLocalCache) {
        await cacheManager.set<TData>(cacheKey, data, {
          type,
          ttlMinutes,
          relatedKeys,
          usuarioId: persistInSupabase ? usuarioId : undefined
        });
      }
      
      return data;
    } catch (error) {
      logger.error('Erro ao buscar dados com cache', {
        key: cacheKey,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }, [cacheKey, queryFn, useLocalCache, type, ttlMinutes, relatedKeys, persistInSupabase, usuarioId]);
  
  // Usar React Query
  const query = useTanstackQuery<TData, TError>({
    queryKey,
    queryFn: fetchWithCache,
    ...rest
    // onSuccess e onError removidos
  });
  
  // Efeito para limpar cache quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Não fazemos nada aqui, o React Query gerencia o ciclo de vida do cache
    };
  }, []);
  
  // Função para invalidar manualmente o cache
  const invalidateCache = useCallback(async () => {
    await cacheManager.invalidate(cacheKey, {
      type,
      usuarioId: persistInSupabase ? usuarioId : undefined
    });
    
    // Forçar refetch
    query.refetch();
  }, [cacheKey, type, persistInSupabase, usuarioId, query]);
  
  // Função para atualizar o cache manualmente
  const updateCache = useCallback(async (newData: TData) => {
    await cacheManager.set<TData>(cacheKey, newData, {
      type,
      ttlMinutes,
      relatedKeys,
      usuarioId: persistInSupabase ? usuarioId : undefined
    });
    
    // Atualizar dados no React Query
    query.refetch();
  }, [cacheKey, type, ttlMinutes, relatedKeys, persistInSupabase, usuarioId, query]);
  
  // Função para atualização otimista
  const optimisticUpdate = useCallback(async (updateFn: (oldData: TData | null) => TData) => {
    return await cacheManager.optimisticUpdate<TData>(cacheKey, updateFn, {
      type,
      ttlMinutes,
      relatedKeys,
      usuarioId: persistInSupabase ? usuarioId : undefined
    });
  }, [cacheKey, type, ttlMinutes, relatedKeys, persistInSupabase, usuarioId]);
  
  return {
    ...query,
    invalidateCache,
    updateCache,
    optimisticUpdate
  };
}