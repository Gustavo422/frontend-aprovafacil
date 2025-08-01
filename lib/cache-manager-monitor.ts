import { cacheManager, CacheType, CacheOptions } from './cache-manager';
import { cacheMonitor } from './cache-monitor';
import { logger } from './logger';
import { CacheOperation, CacheOperationResult } from './cache-metrics-collector';
import { cacheLogger, CacheLogLevel } from './cache-logger';
import { adaptiveCacheLogger } from './cache-adaptive-logger';

/**
 * Event types for cache operations
 */
export enum CacheEventType {
  BEFORE_GET = 'before_get',
  AFTER_GET = 'after_get',
  BEFORE_SET = 'before_set',
  AFTER_SET = 'after_set',
  BEFORE_DELETE = 'before_delete',
  AFTER_DELETE = 'after_delete',
  BEFORE_INVALIDATE = 'before_invalidate',
  AFTER_INVALIDATE = 'after_invalidate',
  BEFORE_CLEAR = 'before_clear',
  AFTER_CLEAR = 'after_clear',
  ERROR = 'error'
}

/**
 * Cache event data
 */
export interface CacheEvent {
  type: CacheEventType;
  operation: CacheOperation;
  cacheType: CacheType;
  key?: string;
  data?: unknown;
  error?: Error;
  timestamp: Date;
  usuarioId?: string;
  duration?: number;
  result?: CacheOperationResult;
}

/**
 * Cache event listener function
 */
export type CacheEventListener = (event: CacheEvent) => void;

/**
 * Interface for batch operation result
 */
export interface BatchOperationResult {
  operation: CacheOperation;
  key: string;
  cacheType: CacheType;
  success: boolean;
  error?: string;
}

/**
 * Interface for confirmation options
 */
export interface ConfirmationOptions {
  requireConfirmation: boolean;
  confirmationToken?: string;
  reason?: string;
}

/**
 * Interface for cache export data
 */
export interface CacheExportData {
  version: string;
  exportDate: string;
  entries: Array<{
    key: string;
    cacheType: CacheType;
    data: unknown;
    expiresAt: string;
    createdAt: string;
    relatedKeys?: string[];
  }>;
}

/**
 * Enhanced Cache Manager with monitoring capabilities
 */
export class CacheManagerMonitor {
  private static instance: CacheManagerMonitor;
  private eventListeners: Map<CacheEventType, Set<CacheEventListener>> = new Map();
  private originalMethods: {
    get: typeof cacheManager.get;
    set: typeof cacheManager.set;
    delete: typeof cacheManager.delete;
    invalidate: typeof cacheManager.invalidate;
    clear: typeof cacheManager.clear;
  };
  private initialized = false;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Store original methods for later restoration if needed
    this.originalMethods = {
      get: cacheManager.get.bind(cacheManager),
      set: cacheManager.set.bind(cacheManager),
      delete: cacheManager.delete.bind(cacheManager),
      invalidate: cacheManager.invalidate.bind(cacheManager),
      clear: cacheManager.clear.bind(cacheManager)
    };
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheManagerMonitor {
    if (!CacheManagerMonitor.instance) {
      CacheManagerMonitor.instance = new CacheManagerMonitor();
    }
    return CacheManagerMonitor.instance;
  }
  
  /**
   * Initialize the monitoring hooks
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    this.applyMonitoringHooks();
    this.initialized = true;
    
    logger.info('Cache Manager monitoring hooks initialized');
  }
  
  /**
   * Apply monitoring hooks to cache manager methods
   */
  private applyMonitoringHooks(): void {
    // Override get method
    cacheManager.get = async <T>(key: string, options: CacheOptions & { usuarioId?: string } = {}): Promise<T | null> => {
      const { type = CacheType.MEMORY, usuarioId } = options;
      let result: CacheOperationResult = 'miss';
      let error: Error | undefined;
      let data: T | null = null;
      
      // Emit before event
      this.emitEvent({
        type: CacheEventType.BEFORE_GET,
        operation: 'get',
        cacheType: type,
        key,
        timestamp: new Date(),
        usuarioId
      });
      
      // Start monitoring
      const operationId = cacheMonitor.recordOperationStart('get', type, key);
      const startTime = performance.now();
      
      try {
        // Call original method
        data = await this.originalMethods.get<T>(key, options);
        
        // Determine result
        result = data !== null ? 'hit' : 'miss';
        
        return data;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        result = 'error';
        throw e;
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Record operation end in monitor
        cacheMonitor.recordOperationEnd(operationId, result, {
          error: error?.message,
          usuarioId
        });
        
        // Track operation performance for adaptive logging
        adaptiveCacheLogger.trackOperationPerformance('get', type, duration, result);
        
        // Emit after event
        this.emitEvent({
          type: CacheEventType.AFTER_GET,
          operation: 'get',
          cacheType: type,
          key,
          data,
          error,
          timestamp: new Date(),
          usuarioId,
          duration,
          result
        });
        
        // Log if error
        if (error) {
          // Use the cache logger for structured logging
          cacheLogger.logError('Cache get operation failed', 
            cacheLogger.createOperationLogEntry('get', type, {
              key,
              result: 'error',
              duration,
              error,
              usuarioId,
              correlationId: operationId
            })
          );
          
          this.emitEvent({
            type: CacheEventType.ERROR,
            operation: 'get',
            cacheType: type,
            key,
            error,
            timestamp: new Date(),
            usuarioId
          });
        }
        
        // Log operation for performance tracking
        if (duration > 100) { // Log slow operations (>100ms)
          cacheLogger.logPerformance('Slow cache get operation detected', 
            cacheLogger.createOperationLogEntry('get', type, {
              key,
              result,
              duration,
              usuarioId,
              correlationId: operationId
            })
          );
        }
      }
    };
    
    // Override set method
    cacheManager.set = async <T>(key: string, data: T, options: CacheOptions & { usuarioId?: string } = {}): Promise<void> => {
      const { type = CacheType.MEMORY, usuarioId } = options;
      let result: CacheOperationResult = 'success';
      let error: Error | undefined;
      
      // Emit before event
      this.emitEvent({
        type: CacheEventType.BEFORE_SET,
        operation: 'set',
        cacheType: type,
        key,
        data,
        timestamp: new Date(),
        usuarioId
      });
      
      // Start monitoring
      const operationId = cacheMonitor.recordOperationStart('set', type, key);
      const startTime = performance.now();
      
      try {
        // Call original method
        await this.originalMethods.set<T>(key, data, options);
        return;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        result = 'error';
        throw e;
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Calculate size for memory cache
        let size: number | undefined;
        if (type === CacheType.MEMORY) {
          try {
            // Estimate size in bytes
            const jsonString = JSON.stringify(data);
            size = new TextEncoder().encode(jsonString).length;
          } catch {
            // Ignore size calculation errors
          }
        }
        
        // Record operation end in monitor
        cacheMonitor.recordOperationEnd(operationId, result, {
          error: error?.message,
          size,
          usuarioId
        });
        
        // Track operation performance for adaptive logging
        adaptiveCacheLogger.trackOperationPerformance('set', type, duration, result);
        
        // Emit after event
        this.emitEvent({
          type: CacheEventType.AFTER_SET,
          operation: 'set',
          cacheType: type,
          key,
          data,
          error,
          timestamp: new Date(),
          usuarioId,
          duration,
          result
        });
        
        // Log if error
        if (error) {
          // Use the cache logger for structured logging
          cacheLogger.logError('Cache set operation failed', 
            cacheLogger.createOperationLogEntry('set', type, {
              key,
              result: 'error',
              duration,
              error,
              usuarioId,
              correlationId: operationId,
              size
            })
          );
          
          this.emitEvent({
            type: CacheEventType.ERROR,
            operation: 'set',
            cacheType: type,
            key,
            error,
            timestamp: new Date(),
            usuarioId
          });
        }
        
        // Log operation for performance tracking
        if (duration > 150) { // Log slow operations (>150ms)
          cacheLogger.logPerformance('Slow cache set operation detected', 
            cacheLogger.createOperationLogEntry('set', type, {
              key,
              result,
              duration,
              usuarioId,
              correlationId: operationId,
              size
            })
          );
        }
        
        // Log large cache entries
        if (size && size > 50000) { // Log large entries (>50KB)
          cacheLogger.logOperation(CacheLogLevel.WARN, 'Large cache entry detected', 
            cacheLogger.createOperationLogEntry('set', type, {
              key,
              result,
              duration,
              usuarioId,
              correlationId: operationId,
              size
            })
          );
        }
      }
    };
    
    // Override delete method
    cacheManager.delete = async (key: string, options: CacheOptions & { usuarioId?: string } = {}): Promise<void> => {
      const { type = CacheType.MEMORY, usuarioId } = options;
      let result: CacheOperationResult = 'success';
      let error: Error | undefined;
      
      // Emit before event
      this.emitEvent({
        type: CacheEventType.BEFORE_DELETE,
        operation: 'delete',
        cacheType: type,
        key,
        timestamp: new Date(),
        usuarioId
      });
      
      // Start monitoring
      const operationId = cacheMonitor.recordOperationStart('delete', type, key);
      const startTime = performance.now();
      
      try {
        // Call original method
        await this.originalMethods.delete(key, options);
        return;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        result = 'error';
        throw e;
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Record operation end in monitor
        cacheMonitor.recordOperationEnd(operationId, result, {
          error: error?.message,
          usuarioId
        });
        
        // Track operation performance for adaptive logging
        adaptiveCacheLogger.trackOperationPerformance('delete', type, duration, result);
        
        // Emit after event
        this.emitEvent({
          type: CacheEventType.AFTER_DELETE,
          operation: 'delete',
          cacheType: type,
          key,
          error,
          timestamp: new Date(),
          usuarioId,
          duration,
          result
        });
        
        // Log if error
        if (error) {
          // Use the cache logger for structured logging
          cacheLogger.logError('Cache delete operation failed', 
            cacheLogger.createOperationLogEntry('delete', type, {
              key,
              result: 'error',
              duration,
              error,
              usuarioId,
              correlationId: operationId
            })
          );
          
          this.emitEvent({
            type: CacheEventType.ERROR,
            operation: 'delete',
            cacheType: type,
            key,
            error,
            timestamp: new Date(),
            usuarioId
          });
        }
        
        // Log successful delete operations
        if (result === 'success') {
          cacheLogger.logOperation(CacheLogLevel.DEBUG, 'Cache entry deleted', 
            cacheLogger.createOperationLogEntry('delete', type, {
              key,
              result,
              duration,
              usuarioId,
              correlationId: operationId
            })
          );
        }
      }
    };
    
    // Override invalidate method
    cacheManager.invalidate = async (key: string, options: CacheOptions & { usuarioId?: string } = {}): Promise<void> => {
      const { type = CacheType.MEMORY, usuarioId } = options;
      let result: CacheOperationResult = 'success';
      let error: Error | undefined;
      
      // Emit before event
      this.emitEvent({
        type: CacheEventType.BEFORE_INVALIDATE,
        operation: 'invalidate',
        cacheType: type,
        key,
        timestamp: new Date(),
        usuarioId
      });
      
      // Start monitoring
      const operationId = cacheMonitor.recordOperationStart('invalidate', type, key);
      const startTime = performance.now();
      
      try {
        // Call original method
        await this.originalMethods.invalidate(key, options);
        return;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        result = 'error';
        throw e;
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Record operation end in monitor
        cacheMonitor.recordOperationEnd(operationId, result, {
          error: error?.message,
          usuarioId
        });
        
        // Track operation performance for adaptive logging
        adaptiveCacheLogger.trackOperationPerformance('invalidate', type, duration, result);
        
        // Emit after event
        this.emitEvent({
          type: CacheEventType.AFTER_INVALIDATE,
          operation: 'invalidate',
          cacheType: type,
          key,
          error,
          timestamp: new Date(),
          usuarioId,
          duration,
          result
        });
        
        // Log if error
        if (error) {
          // Use the cache logger for structured logging
          cacheLogger.logError('Cache invalidate operation failed', 
            cacheLogger.createOperationLogEntry('invalidate', type, {
              key,
              result: 'error',
              duration,
              error,
              usuarioId,
              correlationId: operationId
            })
          );
          
          this.emitEvent({
            type: CacheEventType.ERROR,
            operation: 'invalidate',
            cacheType: type,
            key,
            error,
            timestamp: new Date(),
            usuarioId
          });
        }
        
        // Log successful invalidate operations
        if (result === 'success') {
          cacheLogger.logOperation(CacheLogLevel.INFO, 'Cache entry invalidated', 
            cacheLogger.createOperationLogEntry('invalidate', type, {
              key,
              result,
              duration,
              usuarioId,
              correlationId: operationId
            })
          );
        }
      }
    };
    
    // Override clear method
    cacheManager.clear = async (options: { type?: CacheType; usuarioId?: string } = {}): Promise<void> => {
      const { type = CacheType.MEMORY, usuarioId } = options;
      let result: CacheOperationResult = 'success';
      let error: Error | undefined;
      
      // Emit before event
      this.emitEvent({
        type: CacheEventType.BEFORE_CLEAR,
        operation: 'clear',
        cacheType: type,
        timestamp: new Date(),
        usuarioId
      });
      
      // Start monitoring
      const operationId = cacheMonitor.recordOperationStart('clear', type);
      const startTime = performance.now();
      
      try {
        // Call original method
        await this.originalMethods.clear(options);
        return;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        result = 'error';
        throw e;
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Record operation end in monitor
        cacheMonitor.recordOperationEnd(operationId, result, {
          error: error?.message,
          usuarioId
        });
        
        // Track operation performance for adaptive logging
        adaptiveCacheLogger.trackOperationPerformance('clear', type, duration, result);
        
        // Emit after event
        this.emitEvent({
          type: CacheEventType.AFTER_CLEAR,
          operation: 'clear',
          cacheType: type,
          error,
          timestamp: new Date(),
          usuarioId,
          duration,
          result
        });
        
        // Log if error
        if (error) {
          // Use the cache logger for structured logging
          cacheLogger.logError('Cache clear operation failed', 
            cacheLogger.createOperationLogEntry('clear', type, {
              result: 'error',
              duration,
              error,
              usuarioId,
              correlationId: operationId
            })
          );
          
          this.emitEvent({
            type: CacheEventType.ERROR,
            operation: 'clear',
            cacheType: type,
            error,
            timestamp: new Date(),
            usuarioId
          });
        }
        
        // Log successful clear operations
        if (result === 'success') {
          cacheLogger.logOperation(CacheLogLevel.WARN, 'Cache cleared', 
            cacheLogger.createOperationLogEntry('clear', type, {
              result,
              duration,
              usuarioId,
              correlationId: operationId
            })
          );
        }
      }
    };
  }
  
  /**
   * Restore original cache manager methods
   */
  public restoreOriginalMethods(): void {
    if (!this.initialized) {
      return;
    }
    
    cacheManager.get = this.originalMethods.get;
    cacheManager.set = this.originalMethods.set;
    cacheManager.delete = this.originalMethods.delete;
    cacheManager.invalidate = this.originalMethods.invalidate;
    cacheManager.clear = this.originalMethods.clear;
    
    this.initialized = false;
    
    logger.info('Cache Manager original methods restored');
  }
  
  /**
   * Add event listener
   */
  public addEventListener(type: CacheEventType, listener: CacheEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    
    this.eventListeners.get(type)!.add(listener);
  }
  
  /**
   * Remove event listener
   */
  public removeEventListener(type: CacheEventType, listener: CacheEventListener): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    
    this.eventListeners.get(type)!.delete(listener);
  }
  
  /**
   * Emit cache event
   */
  private emitEvent(event: CacheEvent): void {
    // Get listeners for this event type
    const listeners = this.eventListeners.get(event.type);
    
    if (listeners) {
      // Call all listeners
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in cache event listener', {
            eventType: event.type,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    }
    
    // Also emit to all listeners
    const allListeners = this.eventListeners.get('*' as CacheEventType);
    
    if (allListeners) {
      allListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in cache event listener', {
            eventType: '*',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    }
  }
  
  /**
   * Check if monitoring is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get performance measurements for a specific cache operation
   */
  public async measurePerformance<T>(
    operation: () => Promise<T>,
    options: {
      operationType: CacheOperation;
      cacheType: CacheType;
      key?: string;
      usuarioId?: string;
    }
  ): Promise<{ result: T; duration: number }> {
    const { operationType, cacheType, key, usuarioId } = options;
    let result: T;
    let error: Error | undefined;
    
    // Start monitoring
    const operationId = cacheMonitor.recordOperationStart(operationType, cacheType, key);
    const startTime = performance.now();
    
    try {
      // Execute operation
      result = await operation();
      
      return { result, duration: performance.now() - startTime };
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      throw e;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Record operation end in monitor
      cacheMonitor.recordOperationEnd(operationId, error ? 'error' : 'success', {
        error: error?.message,
        usuarioId
      });
      
      // Log if error
      if (error) {
        logger.error('Cache operation failed', {
          operation: operationType,
          cacheType,
          key,
          error: error.message,
          usuarioId,
          duration
        });
      }
    }
  }
}

export type { CacheOperation } from './cache-metrics-collector';

// Export singleton instance
export const cacheManagerMonitor = CacheManagerMonitor.getInstance();