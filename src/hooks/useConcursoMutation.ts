import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useConcurso } from '@/contexts/ConcursoContext';
import { setActiveConcurso } from '@/src/lib/api';

// Tipos para o hook
interface ConcursoMutationOptions<TData = unknown, TError = unknown, TVariables = unknown> extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  requireConcurso?: boolean;
}

type ConcursoMutationResult<TData = unknown, TError = unknown, TVariables = unknown> = UseMutationResult<TData, TError, TVariables> & {
  hasConcurso: boolean;
  concursoId: string | null;
  isLoadingConcurso: boolean;
}

/**
 * Hook customizado para mutations que precisam do filtro de concurso
 * 
 * Este hook:
 * 1. Verifica se há um concurso ativo
 * 2. Aplica automaticamente o filtro de concurso
 * 3. Fornece informações sobre o estado do concurso
 * 4. Permite mutations com diferentes métodos HTTP
 */
export function useConcursoMutation<TData = unknown, TError = unknown, TVariables = unknown>(
  options: ConcursoMutationOptions<TData, TError, TVariables>
): ConcursoMutationResult<TData, TError, TVariables> {
  const { 
    endpoint, 
    method = 'POST',
    requireConcurso = true,
    ...mutationOptions 
  } = options;

  const { 
    activeConcursoId, 
    state: { isLoading: isLoadingConcurso },
    hasSelectedConcurso 
  } = useConcurso();

  // Definir o concurso ativo no cliente API
  React.useEffect(() => {
    if (activeConcursoId) {
      setActiveConcurso(activeConcursoId);
    }
  }, [activeConcursoId]);

  // Função para fazer a mutation
  const mutationFn = async (variables: TVariables): Promise<TData> => {
    // Verificar se precisa de concurso e se há um ativo
    if (requireConcurso && !hasSelectedConcurso) {
      throw new Error('Concurso não selecionado');
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro na mutation');
    }

    return data.data;
  };

  // Executar a mutation
  const mutation = useMutation({
    mutationFn,
    ...mutationOptions,
  });

  return {
    ...mutation,
    hasConcurso: hasSelectedConcurso,
    concursoId: activeConcursoId,
    isLoadingConcurso,
  };
}

/**
 * Hook para mutations POST
 */
export function useConcursoCreate<TData = unknown, TError = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<ConcursoMutationOptions<TData, TError, TVariables>, 'endpoint' | 'method'>
): ConcursoMutationResult<TData, TError, TVariables> {
  return useConcursoMutation({
    endpoint,
    method: 'POST',
    ...options,
  });
}

/**
 * Hook para mutations PUT
 */
export function useConcursoUpdate<TData = unknown, TError = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<ConcursoMutationOptions<TData, TError, TVariables>, 'endpoint' | 'method'>
): ConcursoMutationResult<TData, TError, TVariables> {
  return useConcursoMutation({
    endpoint,
    method: 'PUT',
    ...options,
  });
}

/**
 * Hook para mutations PATCH
 */
export function useConcursoPatch<TData = unknown, TError = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<ConcursoMutationOptions<TData, TError, TVariables>, 'endpoint' | 'method'>
): ConcursoMutationResult<TData, TError, TVariables> {
  return useConcursoMutation({
    endpoint,
    method: 'PATCH',
    ...options,
  });
}

/**
 * Hook para mutations DELETE
 */
export function useConcursoDelete<TData = unknown, TError = unknown, TVariables = unknown>(
  endpoint: string,
  options?: Omit<ConcursoMutationOptions<TData, TError, TVariables>, 'endpoint' | 'method'>
): ConcursoMutationResult<TData, TError, TVariables> {
  return useConcursoMutation({
    endpoint,
    method: 'DELETE',
    ...options,
  });
}

/**
 * Hook para mutations com ID dinâmico
 */
export function useConcursoMutationWithId<TData = unknown, TError = unknown, TVariables = unknown>(
  baseEndpoint: string,
  options?: Omit<ConcursoMutationOptions<TData, TError, TVariables & { id: string }>, 'endpoint' | 'method'>
): ConcursoMutationResult<TData, TError, TVariables & { id: string }> {
  const { 
    requireConcurso = true,
    ...mutationOptions 
  } = options || {};

  const { 
    activeConcursoId, 
    state: { isLoading: isLoadingConcurso },
    hasSelectedConcurso 
  } = useConcurso();

  // Definir o concurso ativo no cliente API
  React.useEffect(() => {
    if (activeConcursoId) {
      setActiveConcurso(activeConcursoId);
    }
  }, [activeConcursoId]);

  // Função para fazer a mutation com ID
  const mutationFn = async (variables: TVariables & { id: string }): Promise<TData> => {
    const { id, ...data } = variables;
    const endpoint = `${baseEndpoint}/${id}`;

    // Verificar se precisa de concurso e se há um ativo
    if (requireConcurso && !hasSelectedConcurso) {
      throw new Error('Concurso não selecionado');
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Erro na mutation');
    }

    return responseData.data;
  };

  // Executar a mutation
  const mutation = useMutation({
    mutationFn,
    ...mutationOptions,
  });

  return {
    ...mutation,
    hasConcurso: hasSelectedConcurso,
    concursoId: activeConcursoId,
    isLoadingConcurso,
  };
}

/**
 * Hook para mutations que não precisam de concurso
 */
export function useSimpleMutation<TData = unknown, TError = unknown, TVariables = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables> {
  const mutationFn = async (variables: TVariables): Promise<TData> => {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro na mutation');
    }

    return data.data;
  };

  return useMutation({
    mutationFn,
    ...options,
  });
}

// Importar React para useEffect
import React from 'react'; 