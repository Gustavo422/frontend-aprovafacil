import type { CacheType } from './cache-manager';
import type { CacheOperation, CacheOperationResult } from './cache-metrics-collector';
import type { CacheLogCategory, CacheLogLevel } from './cache-logger';

/**
 * Interface for a cache log entry
 */
export interface CacheLogEntry {
  /**
   * Timestamp of the log entry
   */
  timestamp: string;
  
  /**
   * Log level
   */
  level: CacheLogLevel;
  
  /**
   * Log message
   */
  message: string;
  
  /**
   * Log category
   */
  category: CacheLogCategory;
  
  /**
   * Cache operation type (if applicable)
   */
  operation?: CacheOperation;
  
  /**
   * Cache type (if applicable)
   */
  cacheType?: CacheType;
  
  /**
   * Cache key (if applicable)
   */
  key?: string;
  
  /**
   * Operation result (if applicable)
   */
  result?: CacheOperationResult;
  
  /**
   * Operation duration in milliseconds (if applicable)
   */
  duration?: number;
  
  /**
   * Error message (if applicable)
   */
  error?: string;
  
  /**
   * User ID (if applicable)
   */
  usuarioId?: string;
  
  /**
   * Correlation ID for related operations
   */
  correlationId?: string;
  
  /**
   * Any additional context
   */
  [key: string]: unknown;
}

/**
 * Filter options for cache logs
 */
export interface CacheLogFilterOptions {
  /**
   * Filter by log level
   */
  level?: CacheLogLevel | CacheLogLevel[];
  
  /**
   * Filter by log category
   */
  category?: CacheLogCategory | CacheLogCategory[];
  
  /**
   * Filter by cache operation
   */
  operation?: CacheOperation | CacheOperation[];
  
  /**
   * Filter by cache type
   */
  cacheType?: CacheType | CacheType[];
  
  /**
   * Filter by cache key pattern (supports wildcards * and ?)
   */
  keyPattern?: string;
  
  /**
   * Filter by operation result
   */
  result?: CacheOperationResult | CacheOperationResult[];
  
  /**
   * Filter by minimum duration (in milliseconds)
   */
  minDuration?: number;
  
  /**
   * Filter by maximum duration (in milliseconds)
   */
  maxDuration?: number;
  
  /**
   * Filter by error presence
   */
  hasError?: boolean;
  
  /**
   * Filter by user ID
   */
  usuarioId?: string;
  
  /**
   * Filter by correlation ID
   */
  correlationId?: string;
  
  /**
   * Filter by time range (start time)
   */
  startTime?: Date;
  
  /**
   * Filter by time range (end time)
   */
  endTime?: Date;
  
  /**
   * Filter by message pattern (supports wildcards * and ?)
   */
  messagePattern?: string;
  
  /**
   * Maximum number of logs to return
   */
  limit?: number;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Cache Log Filter - Provides filtering capabilities for cache logs
 */
export class CacheLogFilter {
  /**
   * Filter cache logs based on the provided options
   */
  public static filterLogs(
    logs: CacheLogEntry[],
    options: CacheLogFilterOptions = {}
  ): CacheLogEntry[] {
    let filteredLogs = [...logs];
    
    // Filter by log level
    if (options.level) {
      const levels = Array.isArray(options.level) ? options.level : [options.level];
      filteredLogs = filteredLogs.filter(log => levels.includes(log.level));
    }
    
    // Filter by log category
    if (options.category) {
      const categories = Array.isArray(options.category) ? options.category : [options.category];
      filteredLogs = filteredLogs.filter(log => categories.includes(log.category));
    }
    
    // Filter by cache operation
    if (options.operation) {
      const operations = Array.isArray(options.operation) ? options.operation : [options.operation];
      filteredLogs = filteredLogs.filter(log => log.operation && operations.includes(log.operation));
    }
    
    // Filter by cache type
    if (options.cacheType) {
      const cacheTypes = Array.isArray(options.cacheType) ? options.cacheType : [options.cacheType];
      filteredLogs = filteredLogs.filter(log => log.cacheType && cacheTypes.includes(log.cacheType));
    }
    
    // Filter by cache key pattern
    if (options.keyPattern) {
      const pattern = this.wildcardToRegExp(options.keyPattern);
      filteredLogs = filteredLogs.filter(log => log.key && pattern.test(log.key));
    }
    
    // Filter by operation result
    if (options.result) {
      const results = Array.isArray(options.result) ? options.result : [options.result];
      filteredLogs = filteredLogs.filter(log => log.result && results.includes(log.result));
    }
    
    // Filter by duration range
    if (options.minDuration !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.duration !== undefined && log.duration >= options.minDuration!);
    }
    
    if (options.maxDuration !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.duration !== undefined && log.duration <= options.maxDuration!);
    }
    
    // Filter by error presence
    if (options.hasError !== undefined) {
      filteredLogs = filteredLogs.filter(log => 
        options.hasError ? !!log.error : !log.error
      );
    }
    
    // Filter by user ID
    if (options.usuarioId) {
      filteredLogs = filteredLogs.filter(log => log.usuarioId === options.usuarioId);
    }
    
    // Filter by correlation ID
    if (options.correlationId) {
      filteredLogs = filteredLogs.filter(log => log.correlationId === options.correlationId);
    }
    
    // Filter by time range
    if (options.startTime) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= options.startTime!);
    }
    
    if (options.endTime) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= options.endTime!);
    }
    
    // Filter by message pattern
    if (options.messagePattern) {
      const pattern = this.wildcardToRegExp(options.messagePattern);
      filteredLogs = filteredLogs.filter(log => pattern.test(log.message));
    }
    
    // Sort logs
    filteredLogs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return options.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }
    
    return filteredLogs;
  }
  
  /**
   * Find related logs by correlation ID
   */
  public static findRelatedLogs(
    logs: CacheLogEntry[],
    correlationId: string
  ): CacheLogEntry[] {
    return logs.filter(log => log.correlationId === correlationId);
  }
  
  /**
   * Find logs for a specific cache key
   */
  public static findLogsByKey(
    logs: CacheLogEntry[],
    key: string
  ): CacheLogEntry[] {
    return logs.filter(log => log.key === key);
  }
  
  /**
   * Group logs by correlation ID
   */
  public static groupLogsByCorrelationId(
    logs: CacheLogEntry[]
  ): Record<string, CacheLogEntry[]> {
    const groups: Record<string, CacheLogEntry[]> = {};
    
    logs.forEach(log => {
      if (log.correlationId) {
        if (!groups[log.correlationId]) {
          groups[log.correlationId] = [];
        }
        groups[log.correlationId].push(log);
      }
    });
    
    return groups;
  }
  
  /**
   * Convert wildcard pattern to RegExp
   */
  private static wildcardToRegExp(pattern: string): RegExp {
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*') // * becomes .*
      .replace(/\?/g, '.'); // ? becomes .
    
    return new RegExp(`^${escapedPattern}$`);
  }
}

/**
 * In-memory cache log storage
 */
export class CacheLogStorage {
  private static instance: CacheLogStorage;
  private logs: CacheLogEntry[] = [];
  private maxLogs = 1000;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheLogStorage {
    if (!CacheLogStorage.instance) {
      CacheLogStorage.instance = new CacheLogStorage();
    }
    return CacheLogStorage.instance;
  }
  
  /**
   * Add a log entry
   */
  public addLog(log: CacheLogEntry): void {
    this.logs.push(log);
    
    // Trim logs if we've exceeded the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  
  /**
   * Get all logs
   */
  public getLogs(): CacheLogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Set maximum number of logs to store
   */
  public setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    
    // Trim logs if we've exceeded the new maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  
  /**
   * Get filtered logs
   */
  public getFilteredLogs(options: CacheLogFilterOptions = {}): CacheLogEntry[] {
    return CacheLogFilter.filterLogs(this.logs, options);
  }
  
  /**
   * Find related logs by correlation ID
   */
  public findRelatedLogs(correlationId: string): CacheLogEntry[] {
    return CacheLogFilter.findRelatedLogs(this.logs, correlationId);
  }
  
  /**
   * Find logs for a specific cache key
   */
  public findLogsByKey(key: string): CacheLogEntry[] {
    return CacheLogFilter.findLogsByKey(this.logs, key);
  }
  
  /**
   * Group logs by correlation ID
   */
  public groupLogsByCorrelationId(): Record<string, CacheLogEntry[]> {
    return CacheLogFilter.groupLogsByCorrelationId(this.logs);
  }
}

// Export singleton instance
export const cacheLogStorage = CacheLogStorage.getInstance();