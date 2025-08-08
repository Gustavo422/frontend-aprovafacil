import React from 'react';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useConcurso } from '@/contexts/ConcursoContext';
import { setActiveConcurso } from '@/src/lib/api';

// Tipos para o hook
interface ConcursoQueryOptions<TData = unknown, TError = unknown> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  endpoint: string;
  enabled?: boolean;
  requireConcurso?: boolean;
  fallbackData?: TData;
}

type ConcursoQueryResult<TData = unknown, TError = unknown> = UseQueryResult<TData, TError> & {
  hasConcurso: boolean;
  concursoId: string | null;
  isLoadingConcurso: boolean;
}

/**
 * Hook customizado para queries que precisam do filtro de concurso
 * 
 * Este hook:
 * 1. Verifica se há um concurso ativo
 * 2. Aplica automaticamente o filtro de concurso
 * 3. Fornece informações sobre o estado do concurso
 * 4. Permite fallback para dados quando não há concurso
 */
export function useConcursoQuery<TData = unknown, TError = unknown>(
  options: ConcursoQueryOptions<TData, TError>
): ConcursoQueryResult<TData, TError> {
  const { 
    endpoint, 
    enabled = true, 
    requireConcurso = true, 
    fallbackData,
    ...queryOptions 
  } = options;

  const { 
    activeConcursoId, 
    state: { isLoading: isLoadingConcurso },
    hasSelectedConcurso,
    token 
  } = useConcurso();

  // Definir o concurso ativo no cliente API
  React.useEffect(() => {
    if (activeConcursoId) {
      setActiveConcurso(activeConcursoId);
    }
  }, [activeConcursoId]);

  // Função para fazer a requisição
  const fetchData = async (): Promise<TData> => {
    console.log('[DEBUG] useConcursoQuery - Token:', token ? `${token.substring(0, 10)}...` : 'null');
    console.log('[DEBUG] useConcursoQuery - Endpoint:', endpoint);
    console.log('[DEBUG] useConcursoQuery - activeConcursoId:', activeConcursoId);
    console.log('[DEBUG] useConcursoQuery - hasSelectedConcurso:', hasSelectedConcurso);
    console.log('[DEBUG] useConcursoQuery - isLoadingConcurso:', isLoadingConcurso);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('[DEBUG] useConcursoQuery - Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data.data;
  };

  // Determinar se a query deve ser executada
  const shouldEnable = enabled && 
    (!requireConcurso || hasSelectedConcurso) &&
    (!isLoadingConcurso);

  // Query key que inclui o concurso ativo
  const queryKey = ['concurso-query', endpoint, activeConcursoId];

  // Executar a query
  const query = useQuery({
    queryKey,
    queryFn: fetchData,
    enabled: shouldEnable,
    initialData: !hasSelectedConcurso && requireConcurso ? fallbackData : undefined,
    ...queryOptions,
  });

  return {
    ...query,
    hasConcurso: hasSelectedConcurso,
    concursoId: activeConcursoId,
    isLoadingConcurso,
  };
}

/**
 * Hook para queries que não precisam de concurso
 */
export function useSimpleQuery<TData = unknown, TError = unknown>(
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  const fetchData = async (): Promise<TData> => {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data.data;
  };

  return useQuery({
    queryKey: ['simple-query', endpoint],
    queryFn: fetchData,
    ...options,
  });
}

/**
 * Hook para queries com parâmetros
 */
export function useConcursoQueryWithParams<TData = unknown, TError = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options?: Omit<ConcursoQueryOptions<TData, TError>, 'endpoint'>
): ConcursoQueryResult<TData, TError> {
  const { 
    enabled = true, 
    requireConcurso = true, 
    fallbackData,
    ...queryOptions 
  } = options || {};

  const { 
    activeConcursoId, 
    state: { isLoading: isLoadingConcurso },
    hasSelectedConcurso,
    token 
  } = useConcurso();

  // Definir o concurso ativo no cliente API
  React.useEffect(() => {
    if (activeConcursoId) {
      setActiveConcurso(activeConcursoId);
    }
  }, [activeConcursoId]);

  // Função para fazer a requisição com parâmetros
  const fetchData = async (): Promise<TData> => {
    const queryParams = new URLSearchParams();
    
    // Adicionar parâmetros
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data.data;
  };

  // Determinar se a query deve ser executada
  const shouldEnable = enabled && 
    (!requireConcurso || hasSelectedConcurso) &&
    (!isLoadingConcurso);

  // Query key que inclui o concurso ativo e parâmetros
  const queryKey = ['concurso-query-with-params', endpoint, activeConcursoId, params];

  // Executar a query
  const query = useQuery({
    queryKey,
    queryFn: fetchData,
    enabled: shouldEnable,
    initialData: !hasSelectedConcurso && requireConcurso ? fallbackData : undefined,
    ...queryOptions,
  });

  return {
    ...query,
    hasConcurso: hasSelectedConcurso,
    concursoId: activeConcursoId,
    isLoadingConcurso,
  };
}

/**
 * Hook para queries de paginação
 */
export function useConcursoQueryPaginated<TData = unknown, TError = unknown>(
  endpoint: string,
  page = 1,
  limit = 10,
  options?: Omit<ConcursoQueryOptions<TData, TError>, 'endpoint'>
): ConcursoQueryResult<TData, TError> {
  return useConcursoQueryWithParams(endpoint, { page, limit }, options);
}

/**
 * Hook para queries de busca
 */
export function useConcursoQuerySearch<TData = unknown, TError = unknown>(
  endpoint: string,
  search = '',
  options?: Omit<ConcursoQueryOptions<TData, TError>, 'endpoint'>
): ConcursoQueryResult<TData, TError> {
  return useConcursoQueryWithParams(endpoint, { search }, options);
}

// Import do React movido para o topo 