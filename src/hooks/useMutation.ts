import { useState, useCallback, useRef } from 'react';

/**
 * Status da mutação
 */
export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Opções para useMutation
 */
export interface UseMutationOptions<TData, TVariables> {
  /**
   * Callback executado em caso de sucesso
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  
  /**
   * Callback executado em caso de erro
   */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
  
  /**
   * Callback executado sempre (sucesso ou erro)
   */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void | Promise<void>;
  
  /**
   * Callback executado antes da mutação
   */
  onMutate?: (variables: TVariables) => void | Promise<void>;
  
  /**
   * Número de tentativas em caso de erro
   */
  retry?: number;
  
  /**
   * Delay entre tentativas em milissegundos
   */
  retryDelay?: number;
}

/**
 * Resultado do useMutation
 */
export interface UseMutationResult<TData, TVariables> {
  /**
   * Dados da mutação
   */
  data: TData | undefined;
  
  /**
   * Status da mutação
   */
  status: MutationStatus;
  
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
   * Erro da mutação
   */
  error: Error | null;
  
  /**
   * Função para executar a mutação
   */
  mutate: (variables: TVariables) => Promise<TData>;
  
  /**
   * Função para executar a mutação de forma assíncrona
   */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  
  /**
   * Função para resetar o estado da mutação
   */
  reset: () => void;
  
  /**
   * Variáveis da última mutação
   */
  variables: TVariables | undefined;
}

/**
 * Hook para mutações (operações que modificam dados)
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  // Opções padrão
  const {
    onSuccess,
    onError,
    onSettled,
    onMutate,
    retry = 0,
    retryDelay = 1000
  } = options;
  
  // Estado
  const [data, setData] = useState<TData | undefined>(undefined);
  const [status, setStatus] = useState<MutationStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [variables, setVariables] = useState<TVariables | undefined>(undefined);
  
  // Refs
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Função para resetar estado
  const reset = useCallback(() => {
    setData(undefined);
    setStatus('idle');
    setError(null);
    setVariables(undefined);
    retryCountRef.current = 0;
    
    // Cancelar requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  // Função para executar mutação
  const executeMutation = useCallback(async (vars: TVariables): Promise<TData> => {
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      // Callback antes da mutação
      if (onMutate) {
        await onMutate(vars);
      }
      
      // Definir estado de loading
      setStatus('loading');
      setError(null);
      setVariables(vars);
      
      // Executar mutação
      const result = await mutationFn(vars);
      
      // Verificar se não foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Mutation was aborted');
      }
      
      // Atualizar estado
      setData(result);
      setStatus('success');
      setError(null);
      retryCountRef.current = 0;
      
      // Callback de sucesso
      if (onSuccess) {
        await onSuccess(result, vars);
      }
      
      // Callback settled
      if (onSettled) {
        await onSettled(result, null, vars);
      }
      
      return result;
    } catch (err) {
      // Verificar se não foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        throw err;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Tentar novamente se ainda há tentativas
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        
        // Aguardar delay antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
        
        // Tentar novamente
        return executeMutation(vars);
      }
      
      // Definir erro
      setError(error);
      setStatus('error');
      retryCountRef.current = 0;
      
      // Callback de erro
      if (onError) {
        await onError(error, vars);
      }
      
      // Callback settled
      if (onSettled) {
        await onSettled(undefined, error, vars);
      }
      
      throw error;
    }
  }, [mutationFn, onMutate, onSuccess, onError, onSettled, retry, retryDelay]);
  
  // Função mutate (não lança erro)
  const mutate = useCallback(async (vars: TVariables): Promise<TData> => {
    try {
      return await executeMutation(vars);
    } catch (error) {
      // Erro já foi tratado no executeMutation
      throw error;
    }
  }, [executeMutation]);
  
  // Função mutateAsync (lança erro)
  const mutateAsync = useCallback(async (vars: TVariables): Promise<TData> => {
    return await executeMutation(vars);
  }, [executeMutation]);
  
  return {
    data,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
    error,
    mutate,
    mutateAsync,
    reset,
    variables
  };
}

/**
 * Hook para mutações otimistas
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> & {
    /**
     * Função para aplicar atualização otimista
     */
    optimisticUpdate?: (variables: TVariables) => TData;
    
    /**
     * Função para reverter atualização otimista em caso de erro
     */
    rollback?: (variables: TVariables) => void;
  } = {}
): UseMutationResult<TData, TVariables> {
  const { optimisticUpdate, rollback, ...mutationOptions } = options;
  
  const mutation = useMutation(mutationFn, {
    ...mutationOptions,
    onMutate: async (variables) => {
      // Aplicar atualização otimista
      if (optimisticUpdate) {
        optimisticUpdate(variables);
      }
      
      // Chamar callback original
      if (mutationOptions.onMutate) {
        await mutationOptions.onMutate(variables);
      }
    },
    onError: async (error, variables) => {
      // Reverter atualização otimista
      if (rollback) {
        rollback(variables);
      }
      
      // Chamar callback original
      if (mutationOptions.onError) {
        await mutationOptions.onError(error, variables);
      }
    }
  });
  
  return mutation;
}