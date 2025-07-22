import { useCallback } from 'react';
import { QueryKey } from '@tanstack/react-query';
import { queryClient } from '@/src/providers/query-client';
import { logger } from '@/lib/logger';

/**
 * Opções para atualizações otimistas
 */
export interface OptimisticUpdateOptions<TData, TVariables> {
  /**
   * Chave da query a ser atualizada
   */
  queryKey: QueryKey;
  
  /**
   * Função para atualizar os dados existentes com base nas variáveis
   */
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  
  /**
   * Função para reverter a atualização em caso de erro
   */
  rollbackFn?: (oldData: TData | undefined, variables: TVariables) => void;
  
  /**
   * Chaves de query relacionadas para invalidar após sucesso
   */
  relatedQueryKeys?: QueryKey[];
}

/**
 * Hook para gerenciar atualizações otimistas
 */
export function useOptimisticUpdate<TData = unknown, TVariables = unknown>() {
  /**
   * Executa uma atualização otimista
   */
  const performOptimisticUpdate = useCallback(
    async (
      options: OptimisticUpdateOptions<TData, TVariables>,
      mutationFn: (variables: TVariables) => Promise<unknown>,
      variables: TVariables
    ) => {
      const { queryKey, updateFn, rollbackFn, relatedQueryKeys = [] } = options;
      
      // Snapshot dos dados originais
      const previousData = queryClient.getQueryData<TData>(queryKey);
      
      try {
        // Atualizar dados otimisticamente
        const optimisticData = updateFn(previousData, variables);
        queryClient.setQueryData(queryKey, optimisticData);
        
        logger.debug('Atualização otimista aplicada', { 
          queryKey: Array.isArray(queryKey) ? queryKey.join(':') : queryKey 
        });
        
        // Executar mutação
        const result = await mutationFn(variables);
        
        // Invalidar queries relacionadas após sucesso
        if (relatedQueryKeys.length > 0) {
          await Promise.all(
            relatedQueryKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
          );
          
          logger.debug('Queries relacionadas invalidadas', { 
            queryKeys: relatedQueryKeys.map(k => Array.isArray(k) ? k.join(':') : k) 
          });
        }
        
        return result;
      } catch (error) {
        // Reverter para dados originais em caso de erro
        queryClient.setQueryData(queryKey, previousData);
        
        // Chamar função de rollback personalizada
        if (rollbackFn) {
          rollbackFn(previousData, variables);
        }
        
        logger.error('Erro na atualização otimista, revertendo', {
          queryKey: Array.isArray(queryKey) ? queryKey.join(':') : queryKey,
          error: error instanceof Error ? error.message : String(error)
        });
        
        throw error;
      }
    },
    []
  );
  
  /**
   * Cria uma função de atualização otimista para um tipo específico de operação
   */
  const createOptimisticMutation = useCallback(
    <T extends TVariables>(
      options: OptimisticUpdateOptions<TData, T>,
      mutationFn: (variables: T) => Promise<unknown>
    ) => {
      return async (variables: T) => {
        return performOptimisticUpdate(
          options as OptimisticUpdateOptions<TData, TVariables>,
          mutationFn as (variables: TVariables) => Promise<unknown>,
          variables as unknown as TVariables
        );
      };
    },
    [performOptimisticUpdate]
  );
  
  return {
    performOptimisticUpdate,
    createOptimisticMutation
  };
}