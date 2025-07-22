import { cacheManager } from './cache-manager';
import { logger } from './logger';
import { queryClient } from '@/src/providers/query-client';

/**
 * Estratégias de invalidação de cache
 */
export enum InvalidationStrategy {
  /**
   * Invalidar imediatamente
   */
  IMMEDIATE = 'immediate',
  
  /**
   * Invalidar em lote (agrupar invalidações)
   */
  BATCH = 'batch',
  
  /**
   * Invalidar após um tempo
   */
  DELAYED = 'delayed',
  
  /**
   * Invalidar baseado em eventos
   */
  EVENT_BASED = 'event-based'
}

/**
 * Opções para invalidação de cache
 */
export interface InvalidationOptions {
  /**
   * Estratégia de invalidação
   */
  strategy?: InvalidationStrategy;
  
  /**
   * Delay para invalidação (em ms)
   */
  delay?: number;
  
  /**
   * Evento para invalidação
   */
  event?: string;
  
  /**
   * ID do usuário (para cache no Supabase)
   */
  userId?: string;
}

// Armazenar timeouts de invalidação
const invalidationTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Armazenar invalidações em lote
const batchedInvalidations = new Set<string>();
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

// Armazenar listeners de eventos
const eventListeners = new Map<string, Set<string>>();

/**
 * Gerenciador de invalidação de cache
 */
export const cacheInvalidation = {
  /**
   * Invalidar cache
   */
  invalidate(key: string, options: InvalidationOptions = {}): void {
    const {
      strategy = InvalidationStrategy.IMMEDIATE,
      delay = 5000,
      event,
      userId
    } = options;
    // invalidateRelated é sempre true por padrão nos métodos chamados
    switch (strategy) {
      case InvalidationStrategy.IMMEDIATE:
        this.invalidateImmediate(key, true, userId);
        break;
      case InvalidationStrategy.BATCH:
        this.invalidateBatch(key);
        break;
      case InvalidationStrategy.DELAYED:
        this.invalidateDelayed(key, delay, true, userId);
        break;
      case InvalidationStrategy.EVENT_BASED:
        if (event) {
          this.registerEventInvalidation(key, event);
        } else {
          logger.warn('Evento não especificado para invalidação baseada em eventos');
          this.invalidateImmediate(key, true, userId);
        }
        break;
    }
  },
  
  /**
   * Invalidar cache imediatamente
   */
  async invalidateImmediate(key: string, _invalidateRelated?: boolean, userId?: string): Promise<void> {
    try {
      // Invalidar no gerenciador de cache
      await cacheManager.invalidate(key, { userId });
      
      // Invalidar no React Query
      const queryKey = key.includes(':') ? key.split(':') : key;
      queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
      
      logger.debug('Cache invalidado', { key });
    } catch (error) {
      logger.error('Erro ao invalidar cache', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  /**
   * Invalidar cache em lote
   */
  invalidateBatch(key: string): void {
    // Adicionar à lista de invalidações em lote
    batchedInvalidations.add(key);
    
    // Configurar timeout para processar lote
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        this.processBatchInvalidations();
      }, 100); // Agrupar invalidações em 100ms
    }
  },
  
  /**
   * Processar invalidações em lote
   */
  async processBatchInvalidations(): Promise<void> {
    if (batchedInvalidations.size === 0) return;
    
    const keys = Array.from(batchedInvalidations);
    batchedInvalidations.clear();
    
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    
    try {
      // Invalidar cada chave
      for (const key of keys) {
        await cacheManager.invalidate(key, {});
        
        // Invalidar no React Query
        const queryKey = key.includes(':') ? key.split(':') : key;
        queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
      }
      
      logger.debug('Cache invalidado em lote', { keys, count: keys.length });
    } catch (error) {
      logger.error('Erro ao invalidar cache em lote', {
        keys,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },
  
  /**
   * Invalidar cache após um delay
   */
  invalidateDelayed(key: string, delay = 5000, _invalidateRelated?: boolean, userId?: string): void {
    // Cancelar timeout anterior se existir
    if (invalidationTimeouts.has(key)) {
      clearTimeout(invalidationTimeouts.get(key)!);
    }
    
    // Configurar novo timeout
    const timeout = setTimeout(() => {
      this.invalidateImmediate(key, true, userId);
      invalidationTimeouts.delete(key);
    }, delay);
    
    invalidationTimeouts.set(key, timeout);
    
    logger.debug('Invalidação de cache agendada', { key, delay });
  },
  
  /**
   * Registrar invalidação baseada em evento
   */
  registerEventInvalidation(key: string, event: string): void {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    
    eventListeners.get(event)!.add(key);
    
    logger.debug('Invalidação de cache registrada para evento', { key, event });
  },
  
  /**
   * Disparar evento de invalidação
   */
  triggerEvent(event: string, userId?: string): void {
    if (!eventListeners.has(event)) return;
    
    const keys = Array.from(eventListeners.get(event)!);
    
    // Invalidar cada chave
    keys.forEach(key => {
      this.invalidateImmediate(key, true, userId);
    });
    
    logger.debug('Evento de invalidação disparado', { event, keys });
  },
  
  /**
   * Cancelar invalidação agendada
   */
  cancelDelayedInvalidation(key: string): void {
    if (invalidationTimeouts.has(key)) {
      clearTimeout(invalidationTimeouts.get(key)!);
      invalidationTimeouts.delete(key);
      
      logger.debug('Invalidação de cache cancelada', { key });
    }
  },
  
  /**
   * Limpar todas as invalidações agendadas
   */
  clearAllDelayedInvalidations(): void {
    invalidationTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    
    invalidationTimeouts.clear();
    
    logger.debug('Todas as invalidações de cache agendadas foram canceladas');
  },

  /**
   * Invalidar cache por padrão
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      // O método correto é clear
      await cacheManager.clear({});
      queryClient.invalidateQueries({ predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey.join(':') : String(query.queryKey);
        return queryKey.includes(pattern);
      }});
      logger.debug('Cache invalidado por padrão', { pattern });
    } catch (error) {
      logger.error('Erro ao invalidar cache por padrão', {
        pattern,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
};