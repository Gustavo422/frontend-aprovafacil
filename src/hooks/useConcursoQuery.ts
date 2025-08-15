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
    console.log('[DEBUG] useConcursoQuery - Endpoint:', endpoint);
    console.log('[DEBUG] useConcursoQuery - activeConcursoId:', activeConcursoId);
    console.log('[DEBUG] useConcursoQuery - hasSelectedConcurso:', hasSelectedConcurso);
    console.log('[DEBUG] useConcursoQuery - isLoadingConcurso:', isLoadingConcurso);
    
    const correlationId = generateCorrelationId();
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });

    const metaInfo = {
      responseStatus: response.status,
      correlationId,
      requestId: response.headers.get('x-request-id') ?? undefined,
      serverCorrelationId: response.headers.get('x-correlation-id') ?? undefined,
      serverCacheHit: response.headers.get('x-cache-hit') === '1',
      serverDurationMs: Number(response.headers.get('x-duration-ms') ?? '0') || undefined,
      fetchedAt: new Date().toISOString(),
    } as const;

    // Anexar no meta da query para aparecer no DevTools do TanStack
    if ((queryOptions as any)?.meta) {
      (queryOptions as any).meta.lastFetch = metaInfo;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.json();
    // Suporta ambos formatos: { success, data } e payload direto (para testes/MSW)
    const hasEnvelope = typeof body === 'object' && body !== null && ('success' in body || 'data' in body);
    if (hasEnvelope) {
      if (body.success === false) {
        throw new Error(body.error || 'Erro na requisição');
      }
      return (body.data ?? undefined) as TData;
    }
    return body as TData;
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
    meta: {
      feature: 'guru',
      apiVersion: 'v1',
      endpoint,
      params: undefined,
    },
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

    const body = await response.json();
    const hasEnvelope = typeof body === 'object' && body !== null && ('success' in body || 'data' in body);
    if (hasEnvelope) {
      if (body.success === false) {
        throw new Error(body.error || 'Erro na requisição');
      }
      return (body.data ?? undefined) as TData;
    }
    return body as TData;
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

    const correlationId = generateCorrelationId();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });

    const metaInfo = {
      responseStatus: response.status,
      correlationId,
      requestId: response.headers.get('x-request-id') ?? undefined,
      serverCorrelationId: response.headers.get('x-correlation-id') ?? undefined,
      serverCacheHit: response.headers.get('x-cache-hit') === '1',
      serverDurationMs: Number(response.headers.get('x-duration-ms') ?? '0') || undefined,
      fetchedAt: new Date().toISOString(),
    } as const;
    
    if ((queryOptions as any)?.meta) {
      (queryOptions as any).meta.lastFetch = metaInfo;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.json();
    const hasEnvelope = typeof body === 'object' && body !== null && ('success' in body || 'data' in body);
    if (hasEnvelope) {
      if (body.success === false) {
        throw new Error(body.error || 'Erro na requisição');
      }
      return (body.data ?? undefined) as TData;
    }
    return body as TData;
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
    meta: {
      feature: 'guru',
      apiVersion: 'v1',
      endpoint,
      params,
    },
    ...queryOptions,
  });

  return {
    ...query,
    hasConcurso: hasSelectedConcurso,
    concursoId: activeConcursoId,
    isLoadingConcurso,
  };
}

function generateCorrelationId(): string {
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `${time}-${rand}`;
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