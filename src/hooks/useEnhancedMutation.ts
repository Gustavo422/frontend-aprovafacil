import type { UseMutationOptions as TanstackMutationOptions, QueryKey } from '@tanstack/react-query';
import { useMutation as useTanstackMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { queryClient } from '@/src/providers/query-client';

/**
 * Opções estendidas para useEnhancedMutation
 */
export interface UseEnhancedMutationOptions<TData, TVariables, TError> extends TanstackMutationOptions<TData, TError, TVariables> {
  /**
   * Opções de cache
   */
  cacheOptions?: {
    /**
     * Chaves de query para invalidar após mutação bem-sucedida
     */
    invalidateQueries?: QueryKey[];
    
    /**
     * Função para atualização otimista
     */
    optimisticUpdate?: (variables: TVariables) => Record<string, unknown>;
    
    /**
     * Função para reverter atualização otimista
     */
    rollback?: (variables: TVariables, error: TError) => void;
  };
}

/**
 * Hook aprimorado para mutações com suporte a atualizações otimistas
 */
export function useEnhancedMutation<TData = unknown, TVariables = unknown, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseEnhancedMutationOptions<TData, TVariables, TError> = {}
) {
  
  const {
    cacheOptions = {},
    onMutate: originalOnMutate,
    onSuccess: originalOnSuccess,
    onError: originalOnError,
    onSettled: originalOnSettled,
    ...mutationOptions
  } = options;
  
  const {
    invalidateQueries = [],
    optimisticUpdate,
    rollback,
  } = cacheOptions;
  
  // Função para lidar com mutação
  const onMutate = useCallback(async (variables: TVariables) => {
    // Contexto para rollback
    let context: unknown = undefined;
    
    // Aplicar atualização otimista se configurada
    if (optimisticUpdate) {
      try {
        // Cancelar queries relacionadas
        if (invalidateQueries.length > 0) {
          await Promise.all(
            invalidateQueries.map(async queryKey => 
              queryClient.cancelQueries({ queryKey })
            )
          );
        }
        
        // Salvar snapshot do estado atual para possível rollback
        const previousValues: Record<string, unknown> = {};
        
        // Obter atualizações otimistas
        const updates = optimisticUpdate(variables);
        
        // Aplicar cada atualização otimista
        for (const [queryKey, value] of Object.entries(updates)) {
          const formattedKey = queryKey.includes(':') ? queryKey.split(':') : queryKey;
          
          // Salvar valor anterior
          previousValues[queryKey] = queryClient.getQueryData(
            Array.isArray(formattedKey) ? formattedKey : [formattedKey]
          );
          
          // Atualizar cache
          queryClient.setQueryData(
            Array.isArray(formattedKey) ? formattedKey : [formattedKey],
            value
          );
        }
        
        context = { previousValues, updates };
        
        logger.debug('Atualização otimista aplicada', { updates: Object.keys(updates) });
      } catch (error) {
        logger.error('Erro ao aplicar atualização otimista', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Chamar onMutate original
    if (originalOnMutate) {
      const originalContext = await originalOnMutate(variables);
      
      // Mesclar contextos
      if (originalContext !== undefined) {
        if (context && typeof context === 'object' && originalContext && typeof originalContext === 'object') {
          context = { ...context, ...originalContext };
        } else {
          context = { context, originalContext };
        }
      }
    }
    
    return context;
  }, [originalOnMutate, optimisticUpdate, invalidateQueries]);
  
  // Função para lidar com sucesso
  const onSuccess = useCallback(async (data: TData, variables: TVariables, context: unknown) => {
    // Invalidar queries relacionadas
    if (invalidateQueries.length > 0) {
      await Promise.all(
        invalidateQueries.map(async queryKey => 
          queryClient.invalidateQueries({ queryKey })
        )
      );
      
      logger.debug('Queries invalidadas após mutação', { 
        queries: invalidateQueries.map(q => Array.isArray(q) ? q.join(':') : q) 
      });
    }
    
    // Chamar onSuccess original
    if (originalOnSuccess) {
      await originalOnSuccess(data, variables, context);
    }
  }, [originalOnSuccess, invalidateQueries]);
  
  // Função para lidar com erro
  const onError = useCallback(async (error: TError, variables: TVariables, context: unknown) => {
    // Reverter atualizações otimistas em caso de erro
    if (context && typeof context === 'object' && 'previousValues' in context) {
      const { previousValues } = context as { previousValues: Record<string, unknown> };
      
      // Restaurar valores anteriores
      for (const [queryKey, value] of Object.entries(previousValues)) {
        const formattedKey = queryKey.includes(':') ? queryKey.split(':') : queryKey;
        
        queryClient.setQueryData(
          Array.isArray(formattedKey) ? formattedKey : [formattedKey],
          value
        );
      }
      
      logger.debug('Atualização otimista revertida', { 
        keys: Object.keys(previousValues) 
      });
    }
    
    // Chamar função de rollback personalizada
    if (rollback) {
      rollback(variables, error);
    }
    
    // Chamar onError original
    if (originalOnError) {
      await originalOnError(error, variables, context);
    }
  }, [originalOnError, rollback]);
  
  // Função para lidar com conclusão
  const onSettled = useCallback(async (data: TData | undefined, error: TError | null, variables: TVariables, context: unknown) => {
    // Chamar onSettled original
    if (originalOnSettled) {
      await originalOnSettled(data, error, variables, context);
    }
  }, [originalOnSettled]);
  
  // Usar React Query Mutation
  const mutation = useTanstackMutation<TData, TError, TVariables>({
    mutationFn,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    ...mutationOptions
  });
  
  return mutation;
}