import { QueryClient } from '@tanstack/react-query';

/**
 * Configuração avançada do cliente React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 60 * 60 * 1000, // 1 hour (replaced cacheTime in v5+)
      refetchOnMount: true,
      refetchOnReconnect: true,
      retryOnMount: true,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

/**
 * Configuração de cache por tipo de entidade
 */
export const entityCacheConfig = {
  // Configurações de cache por entidade
  concursos: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    list: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos
    }
  },
  categorias: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  },
  apostilas: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  },
  usuarios: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  },
  performance: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  }
};

/**
 * Utilitários para React Query
 */
export const queryUtils = {
  /**
   * Gera chave de query para entidade
   */
  entityKey: (entityType: string, id: string) => [entityType, id],
  
  /**
   * Gera chave de query para lista de entidades
   */
  entityListKey: (entityType: string, filters?: Record<string, unknown>) => {
    const key = [entityType, 'list'];
    
    if (filters && Object.keys(filters).length > 0) {
      key.push(JSON.stringify(filters));
    }
    
    return key;
  },
  
  /**
   * Obtém configuração de cache para entidade
   */
  getEntityCacheConfig: (entityType: string, isList = false) => {
    const config = entityCacheConfig[entityType as keyof typeof entityCacheConfig];
    
    if (!config) {
      return {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000
      };
    }
    
    if (isList && 'list' in config) {
      return config.list;
    }
    
    return config;
  }
};
