import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Status da query
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Opções para useQuery
 */
export interface UseQueryOptions<T> {
  /**
   * Se a query deve ser executada automaticamente
   */
  enabled?: boolean;
  
  /**
   * Intervalo de refetch automático em milissegundos
   */
  refetchInterval?: number;
  
  /**
   * Callback executado em caso de sucesso
   */
  onSuccess?: (data: T) => void;
  
  /**
   * Callback executado em caso de erro
   */
  onError?: (error: Error) => void;
  
  /**
   * Número de tentativas em caso de erro
   */
  retry?: number;
  
  /**
   * Delay entre tentativas em milissegundos
   */
  retryDelay?: number;
  
  /**
   * Tempo de cache em milissegundos
   */
  staleTime?: number;
  
  /**
   * Tempo para considerar dados como frescos em milissegundos
   */
  cacheTime?: number;
  
  /**
   * Refetch quando a janela ganha foco
   */
  refetchOnWindowFocus?: boolean;
  
  /**
   * Refetch quando reconecta à internet
   */
  refetchOnReconnect?: boolean;
}

/**
 * Resultado do useQuery
 */
export interface UseQueryResult<T> {
  /**
   * Dados da query
   */
  data: T | undefined;
  
  /**
   * Status da query
   */
  status: QueryStatus;
  
  /**
   * Se está carregando
   */
  isLoading: boolean;
  
  /**
   * Se teve sucesso
   */
  isSuccess: boolean;
  
  /**
   * Se teve erro
   */
  isError: boolean;
  
  /**
   * Se está idle
   */
  isIdle: boolean;
  
  /**
   * Erro da query
   */
  error: Error | null;
  
  /**
   * Função para refazer a query
   */
  refetch: () => Promise<void>;
  
  /**
   * Função para invalidar e refazer a query
   */
  invalidate: () => Promise<void>;
  
  /**
   * Se está fazendo refetch
   */
  isRefetching: boolean;
}

/**
 * Cache simples para queries
 */
class QueryCache {
  private cache = new Map<string, { data: unknown; timestamp: number; staleTime: number }>();
  
  get<T>(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.staleTime) {
      this.cache.delete(key);
      return undefined;
    }
    
    return cached.data as T;
  }
  
  set<T>(key: string, data: T, staleTime: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime
    });
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Instância global do cache
const queryCache = new QueryCache();

/**
 * Hook para busca de dados com cache e retry
 */
export function useQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  // Opções padrão
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    retry = 3,
    retryDelay = 1000,
    staleTime = 5 * 60 * 1000, // 5 minutos
    // cacheTime = 10 * 60 * 1000, // 10 minutos (removido pois não é usado)
    refetchOnWindowFocus = true,
    refetchOnReconnect = true
  } = options;
  
  // Estado
  const [data, setData] = useState<T | undefined>(undefined);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  
  // Refs
  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Chave da query
  const queryKey = Array.isArray(key) ? key.join(':') : key;
  
  // Função para executar a query
  const executeQuery = useCallback(async (isRefetch = false) => {
    if (!enabled) return;
    
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      // Verificar cache primeiro (apenas se não for refetch)
      if (!isRefetch) {
        const cachedData = queryCache.get<T>(queryKey);
        if (cachedData !== undefined) {
          setData(cachedData);
          setStatus('success');
          setError(null);
          return;
        }
      }
      
      // Definir status de loading
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setStatus('loading');
      }
      
      setError(null);
      
      // Executar query
      const result = await queryFn();
      
      // Verificar se não foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Salvar no cache
      queryCache.set(queryKey, result, staleTime);
      
      // Atualizar estado
      setData(result);
      setStatus('success');
      setError(null);
      retryCountRef.current = 0;
      
      // Callback de sucesso
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Verificar se não foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Tentar novamente se ainda há tentativas
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          executeQuery(isRefetch);
        }, retryDelay * retryCountRef.current);
        return;
      }
      
      // Definir erro
      setError(error);
      setStatus('error');
      retryCountRef.current = 0;
      
      // Callback de erro
      if (onError) {
        onError(error);
      }
    } finally {
      if (isRefetch) {
        setIsRefetching(false);
      }
    }
  }, [enabled, queryKey, queryFn, retry, retryDelay, staleTime, onSuccess, onError]);
  
  // Função para refetch
  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);
  
  // Função para invalidar
  const invalidate = useCallback(async () => {
    queryCache.invalidate(queryKey);
    await executeQuery(true);
  }, [queryKey, executeQuery]);
  
  // Efeito para executar query inicial
  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [executeQuery, enabled]);
  
  // Efeito para refetch interval
  useEffect(() => {
    if (refetchInterval && enabled && status === 'success') {
      intervalRef.current = setInterval(() => {
        executeQuery(true);
      }, refetchInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, status, executeQuery]);
  
  // Efeito para refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;
    
    const handleFocus = () => {
      if (status === 'success') {
        executeQuery(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, status, executeQuery]);
  
  // Efeito para refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return;
    
    const handleOnline = () => {
      if (status === 'success') {
        executeQuery(true);
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchOnReconnect, enabled, status, executeQuery]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return {
    data,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
    error,
    refetch,
    invalidate,
    isRefetching
  };
}

/**
 * Hook para invalidar queries por padrão
 */
export function useQueryClient() {
  return {
    invalidateQueries: () => {
      // Implementação simples - em uma aplicação real, você usaria uma biblioteca como React Query
      queryCache.clear();
    },
    
    setQueryData: <T>(key: string, data: T) => {
      queryCache.set(key, data);
    },
    
    getQueryData: <T>(key: string): T | undefined => {
      return queryCache.get<T>(key);
    }
  };
}