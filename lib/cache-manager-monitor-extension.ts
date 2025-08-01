import { cacheManagerMonitor } from './cache-manager-monitor';
import { CacheType, CacheOptions } from './cache-manager';
import { logger } from './logger';
import { CacheOperation } from './cache-manager-monitor';

/**
 * Extended options for setting cache entries with metadata
 */
interface SetWithMetadataOptions extends CacheOptions {
  usuarioId?: string;
  expiresAt?: Date;
  createdAt?: Date;
  relatedKeys?: string[];
}

/**
 * Extension method for setting cache entries with specific metadata
 * This allows importing cache entries with their original metadata
 */
(cacheManagerMonitor as unknown as CacheManagerMonitorExtensions).setWithMetadata = async function<T>(
  key: string,
  data: T,
  options: SetWithMetadataOptions = {}
): Promise<void> {
  const { 
    type = CacheType.MEMORY, 
    usuarioId,
    expiresAt,
    createdAt,
    relatedKeys,
    ...restOptions
  } = options;
  
  try {
    // Calculate TTL in minutes based on expiresAt if provided
    let ttlMinutes = options.ttlMinutes;
    
    if (expiresAt && !ttlMinutes) {
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      ttlMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    }
    
    // Set the cache entry with the calculated TTL
    // O método measurePerformance é uma extensão dinâmica, não tipada na interface. Uso de 'as any' é necessário aqui.
    await (cacheManagerMonitor as unknown as CacheManagerMonitorExtensions).measurePerformance?.(
      async () => {
        // Access the internal cache directly to set with metadata
        // This is a special case for importing with original metadata
        const cacheEntry = {
          data,
          expiresAt: expiresAt || new Date(Date.now() + (ttlMinutes || 60) * 60 * 1000),
          createdAt: createdAt || new Date(),
          relatedKeys: relatedKeys || []
        };
        
        // Use different storage methods based on cache type
        switch (type) {
          case CacheType.MEMORY:
            (globalThis as GlobalCache).__CACHE__ = (globalThis as GlobalCache).__CACHE__ || {};
            (globalThis as GlobalCache).__CACHE__![key] = cacheEntry;
            break;
            
          case CacheType.LOCAL_STORAGE:
            // For browser environments
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(key, JSON.stringify(cacheEntry));
            }
            break;
            
          case CacheType.SESSION_STORAGE:
            // For browser environments
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(key, JSON.stringify(cacheEntry));
            }
            break;
            
          case CacheType.SUPABASE:
            // For Supabase, we need to use the regular set method
            // as we can't directly manipulate the Supabase storage
            await (cacheManagerMonitor as unknown as CacheManagerMonitorExtensions).set?.(key, data, {
              type: CacheType.SUPABASE,
              ttlMinutes,
              relatedKeys,
              ...restOptions
            });
            break;
            
          default:
            throw new Error(`Unsupported cache type: ${type}`);
        }
        
        return true;
      },
      {
        operationType: 'set',
        cacheType: type,
        key,
        usuarioId
      }
    );
    
    logger.debug('Cache entry set with metadata', {
      key,
      cacheType: type,
      expiresAt: expiresAt?.toISOString(),
      createdAt: createdAt?.toISOString(),
      hasRelatedKeys: !!relatedKeys && relatedKeys.length > 0,
      usuarioId
    });
  } catch (error) {
    logger.error('Failed to set cache entry with metadata', {
      key,
      cacheType: type,
      error: typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error),
      usuarioId
    });
    
    throw error;
  }
};

// Declaração de tipos para extensão do objeto
interface CacheManagerMonitorExtensions {
  setWithMetadata?: <T>(key: string, data: T, options?: SetWithMetadataOptions) => Promise<void>;
  measurePerformance?: <T>(
    operation: () => Promise<T>,
    options: {
      operationType: CacheOperation;
      cacheType: CacheType;
      key?: string;
      usuarioId?: string;
    }
  ) => Promise<{ result: T; duration: number }>;
  invalidateMultiple?: (keys: string[], options?: CacheOptions & { usuarioId?: string }) => Promise<boolean>;
  clearByType?: (cacheType: CacheType, usuarioId?: string) => Promise<boolean>;
  clearExpired?: (options?: Record<string, unknown>) => Promise<void>;
  executeBatch?: (operations: unknown[]) => Promise<void>;
  importCache?: (jsonData: string) => Promise<void>;
  set?: <T>(key: string, data: T, options?: CacheOptions & { usuarioId?: string }) => Promise<void>;
  invalidate?: (key: string, options?: CacheOptions & { usuarioId?: string }) => Promise<void>;
  clear?: (options?: { type?: CacheType; usuarioId?: string }) => Promise<void>;
}

const monitor = cacheManagerMonitor as typeof cacheManagerMonitor & CacheManagerMonitorExtensions;

// Remover as linhas:
// (monitor as any).setWithMetadata = monitor.setWithMetadata;
// (monitor as any).set = monitor.set;
// Elas não são necessárias para a extensão dinâmica e causam erro de tipagem.

// Métodos de extensão para compatibilidade com rotas e testes
monitor.invalidateMultiple = async function(keys: string[], options: CacheOptions & { usuarioId?: string } = {}): Promise<boolean> {
  if (!Array.isArray(keys)) throw new Error('keys deve ser um array');
  for (const key of keys) {
    if (typeof monitor.invalidate === 'function') {
      await monitor.invalidate(key, options);
    } else {
      throw new Error('Método invalidate não implementado');
    }
  }
  return true;
};

monitor.clearByType = async function(cacheType: CacheType, usuarioId?: string): Promise<boolean> {
  if (typeof monitor.clear === 'function') {
    await monitor.clear({ type: cacheType, usuarioId });
    return true;
  }
  throw new Error('Método clear não implementado');
};

monitor.clearExpired = async function(): Promise<void> {
  throw new Error('clearExpired não implementado');
};

monitor.executeBatch = async function(): Promise<void> {
  // Implementação futura para processamento em lote
  logger.warn('executeBatch não implementado');
};

monitor.importCache = async function(): Promise<void> {
  // Implementação futura para importação de cache
  logger.warn('importCache não implementado');
};

// Exportar o objeto monitor (com extensões) como cacheManagerMonitor
export { monitor as cacheManagerMonitor };

// Definir tipo para o cache global
interface GlobalCache {
  __CACHE__?: Record<string, unknown>;
}