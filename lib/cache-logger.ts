import { logger } from './logger';
import { CacheType } from './cache-manager';
import { CacheOperation, CacheOperationResult } from './cache-metrics-collector';
import { cacheLogStorage, CacheLogEntry } from './cache-log-filter';

/**
 * Log categories for cache operations
 */
export enum CacheLogCategory {
  OPERATION = 'cache:operation',
  PERFORMANCE = 'cache:performance',
  ERROR = 'cache:error',
  MANAGEMENT = 'cache:management',
  MONITOR = 'cache:monitor',
  CONFIG = 'cache:config',
}

/**
 * Log levels for cache operations
 */
export enum CacheLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Context for cache operations
 */
export interface CacheOperationContext {
  operation: CacheOperation;
  cacheType: CacheType;
  key?: string;
  result?: CacheOperationResult;
  duration?: number;
  size?: number;
  error?: string;
  usuarioId?: string;
  correlationId?: string;
}

/**
 * Cache Logger - Provides structured logging for cache operations
 */
export class CacheLogger {
  private static instance: CacheLogger;
  private enabled: boolean = true;
  private logLevel: CacheLogLevel = CacheLogLevel.INFO;
  private correlationIdCounter: number = 0;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheLogger {
    if (!CacheLogger.instance) {
      CacheLogger.instance = new CacheLogger();
    }
    return CacheLogger.instance;
  }
  
  /**
   * Enable logging
   */
  public enable(): void {
    this.enabled = true;
  }
  
  /**
   * Disable logging
   */
  public disable(): void {
    this.enabled = false;
  }
  
  /**
   * Set log level
   */
  public setLogLevel(level: CacheLogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * Get current log level
   */
  public getLogLevel(): CacheLogLevel {
    return this.logLevel;
  }
  
  /**
   * Generate a correlation ID for tracking related cache operations
   */
  public generateCorrelationId(): string {
    this.correlationIdCounter++;
    return `cache-${Date.now()}-${this.correlationIdCounter}`;
  }
  
  /**
   * Log a cache operation
   */
  public logOperation(
    level: CacheLogLevel,
    message: string,
    context: CacheOperationContext
  ): void {
    if (!this.enabled) return;
    
    // Skip logging if level is below configured level
    if (this.shouldSkipLogging(level)) return;
    
    // Add category to context
    const enhancedContext = {
      ...context,
      category: CacheLogCategory.OPERATION,
      timestamp: new Date().toISOString(),
    };
    
    // Log using the appropriate level
    this.logWithLevel(level, message, enhancedContext);
  }
  
  /**
   * Log a cache performance event
   */
  public logPerformance(
    message: string,
    context: CacheOperationContext & { threshold?: number }
  ): void {
    if (!this.enabled) return;
    
    // Skip logging if level is below configured level
    if (this.shouldSkipLogging(CacheLogLevel.DEBUG)) return;
    
    // Add category to context
    const enhancedContext = {
      ...context,
      category: CacheLogCategory.PERFORMANCE,
      timestamp: new Date().toISOString(),
    };
    
    // Log as debug level
    logger.debug(message, enhancedContext);
  }
  
  /**
   * Log a cache error
   */
  public logError(
    message: string,
    context: CacheOperationContext
  ): void {
    if (!this.enabled) return;
    
    // Skip logging if level is below configured level
    if (this.shouldSkipLogging(CacheLogLevel.ERROR)) return;
    
    // Add category to context
    const enhancedContext = {
      ...context,
      category: CacheLogCategory.ERROR,
      timestamp: new Date().toISOString(),
    };
    
    // Log as error level
    logger.error(message, enhancedContext);
  }
  
  /**
   * Log a cache management operation
   */
  public logManagement(
    level: CacheLogLevel,
    message: string,
    context: Partial<CacheOperationContext> & { action: string }
  ): void {
    if (!this.enabled) return;
    
    // Skip logging if level is below configured level
    if (this.shouldSkipLogging(level)) return;
    
    // Add category to context
    const enhancedContext = {
      ...context,
      category: CacheLogCategory.MANAGEMENT,
      timestamp: new Date().toISOString(),
    };
    
    // Log using the appropriate level
    this.logWithLevel(level, message, enhancedContext);
  }
  
  /**
   * Log a cache monitor event
   */
  public logMonitor(
    level: CacheLogLevel,
    message: string,
    context: Record<string, unknown>
  ): void {
    if (!this.enabled) return;
    
    // Skip logging if level is below configured level
    if (this.shouldSkipLogging(level)) return;
    
    // Add category to context
    const enhancedContext = {
      ...context,
      category: CacheLogCategory.MONITOR,
      timestamp: new Date().toISOString(),
    };
    
    // Log using the appropriate level
    this.logWithLevel(level, message, enhancedContext);
  }
  
  /**
   * Log a cache configuration change
   */
  public logConfig(
    level: CacheLogLevel,
    message: string,
    context: Record<string, unknown>
  ): void {
    if (!this.enabled) return;
    
    // Skip logging if level is below configured level
    if (this.shouldSkipLogging(level)) return;
    
    // Add category to context
    const enhancedContext = {
      ...context,
      category: CacheLogCategory.CONFIG,
      timestamp: new Date().toISOString(),
    };
    
    // Log using the appropriate level
    this.logWithLevel(level, message, enhancedContext);
  }
  
  /**
   * Check if logging should be skipped based on level
   */
  private shouldSkipLogging(level: CacheLogLevel): boolean {
    const levels = [
      CacheLogLevel.DEBUG,
      CacheLogLevel.INFO,
      CacheLogLevel.WARN,
      CacheLogLevel.ERROR,
    ];
    
    const configuredLevelIndex = levels.indexOf(this.logLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex < configuredLevelIndex;
  }
  
  /**
   * Log with the appropriate level
   */
  private logWithLevel(
    level: CacheLogLevel,
    message: string,
    context: Record<string, unknown> & { category?: CacheLogCategory }
  ): void {
    // Store log in cache log storage
    const logEntry: CacheLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category: context.category || CacheLogCategory.OPERATION,
      ...context
    };
    
    cacheLogStorage.addLog(logEntry);
    
    // Log using the appropriate level
    switch (level) {
      case CacheLogLevel.DEBUG:
        logger.debug(message, context);
        break;
      case CacheLogLevel.INFO:
        logger.info(message, context);
        break;
      case CacheLogLevel.WARN:
        logger.warn(message, context);
        break;
      case CacheLogLevel.ERROR:
        logger.error(message, context);
        break;
    }
  }
  
  /**
   * Create a structured log entry for a cache operation
   */
  public createOperationLogEntry(
    operation: CacheOperation,
    cacheType: CacheType,
    options: {
      key?: string;
      result?: CacheOperationResult;
      duration?: number;
      error?: Error | string;
      usuarioId?: string;
      correlationId?: string;
      size?: number;
    } = {}
  ): CacheOperationContext {
    const { key, result, duration, error, usuarioId, correlationId, size } = options;
    
    return {
      operation,
      cacheType,
      key,
      result,
      duration,
      error: error instanceof Error ? error.message : error,
      usuarioId,
      correlationId: correlationId || this.generateCorrelationId(),
      size,
    };
  }
}

// Export singleton instance
export const cacheLogger = CacheLogger.getInstance();