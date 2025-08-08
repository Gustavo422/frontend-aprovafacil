import type { CacheType } from './cache-manager';
import type { CacheOperation, CacheOperationResult } from './cache-metrics-collector';
import { cacheLogger, CacheLogLevel } from './cache-logger';

/**
 * Performance thresholds for different cache operations (in milliseconds)
 */
export interface PerformanceThresholds {
  get: {
    warn: number;
    error: number;
  };
  set: {
    warn: number;
    error: number;
  };
  delete: {
    warn: number;
    error: number;
  };
  invalidate: {
    warn: number;
    error: number;
  };
  clear: {
    warn: number;
    error: number;
  };
}

/**
 * Default performance thresholds
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  get: {
    warn: 100, // 100ms
    error: 500 // 500ms
  },
  set: {
    warn: 150, // 150ms
    error: 750 // 750ms
  },
  delete: {
    warn: 100, // 100ms
    error: 500 // 500ms
  },
  invalidate: {
    warn: 200, // 200ms
    error: 1000 // 1s
  },
  clear: {
    warn: 500, // 500ms
    error: 2000 // 2s
  }
};

/**
 * Configuration for adaptive logging
 */
export interface AdaptiveLoggingConfig {
  /**
   * Whether adaptive logging is enabled
   */
  enabled: boolean;
  
  /**
   * Performance thresholds for different operations
   */
  thresholds: PerformanceThresholds;
  
  /**
   * Base log level when no performance issues are detected
   */
  baseLogLevel: CacheLogLevel;
  
  /**
   * Log level when performance is above warning threshold
   */
  warnLogLevel: CacheLogLevel;
  
  /**
   * Log level when performance is above error threshold
   */
  errorLogLevel: CacheLogLevel;
  
  /**
   * Time window for performance tracking (in milliseconds)
   */
  performanceWindowMs: number;
  
  /**
   * Number of slow operations required to trigger log level adjustment
   */
  slowOperationThreshold: number;
}

/**
 * Default adaptive logging configuration
 */
export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveLoggingConfig = {
  enabled: true,
  thresholds: DEFAULT_THRESHOLDS,
  baseLogLevel: CacheLogLevel.INFO,
  warnLogLevel: CacheLogLevel.DEBUG,
  errorLogLevel: CacheLogLevel.DEBUG,
  performanceWindowMs: 60000, // 1 minute
  slowOperationThreshold: 3 // 3 slow operations to trigger adjustment
};

/**
 * Performance record for tracking operation performance
 */
interface PerformanceRecord {
  timestamp: number;
  operation: CacheOperation;
  cacheType: CacheType;
  duration: number;
  result: CacheOperationResult;
}

/**
 * Adaptive Cache Logger - Adjusts log level based on cache performance
 */
export class AdaptiveCacheLogger {
  private static instance: AdaptiveCacheLogger;
  private config: AdaptiveLoggingConfig;
  private performanceRecords: PerformanceRecord[] = [];
  private currentLogLevel: CacheLogLevel;
  private adaptiveLogLevelTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor(config: Partial<AdaptiveLoggingConfig> = {}) {
    this.config = {
      ...DEFAULT_ADAPTIVE_CONFIG,
      ...config
    };
    
    this.currentLogLevel = this.config.baseLogLevel;
    
    // Set initial log level
    if (this.config.enabled) {
      cacheLogger.setLogLevel(this.currentLogLevel);
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(config: Partial<AdaptiveLoggingConfig> = {}): AdaptiveCacheLogger {
    if (!AdaptiveCacheLogger.instance) {
      AdaptiveCacheLogger.instance = new AdaptiveCacheLogger(config);
    }
    return AdaptiveCacheLogger.instance;
  }
  
  /**
   * Configure the adaptive logger
   */
  public configure(config: Partial<AdaptiveLoggingConfig>): void {
    const oldConfig = { ...this.config };
    
    this.config = {
      ...this.config,
      ...config,
      // Ensure nested objects are properly merged
      thresholds: {
        ...this.config.thresholds,
        ...(config.thresholds || {})
      }
    };
    
    // Handle enabling/disabling
    if (oldConfig.enabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    }
    
    // Log configuration change
    cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Adaptive cache logger configured', {
      changes: Object.keys(config)
    });
  }
  
  /**
   * Enable adaptive logging
   */
  public enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.resetLogLevel();
      
      cacheLogger.logConfig(CacheLogLevel.INFO, 'Adaptive cache logging enabled', {});
    }
  }
  
  /**
   * Disable adaptive logging
   */
  public disable(): void {
    if (this.config.enabled) {
      this.config.enabled = false;
      this.resetLogLevel();
      
      // Clear any scheduled log level adjustments
      if (this.adaptiveLogLevelTimeout) {
        clearTimeout(this.adaptiveLogLevelTimeout);
        this.adaptiveLogLevelTimeout = null;
      }
      
      cacheLogger.logConfig(CacheLogLevel.INFO, 'Adaptive cache logging disabled', {});
    }
  }
  
  /**
   * Reset log level to base level
   */
  public resetLogLevel(): void {
    this.currentLogLevel = this.config.baseLogLevel;
    cacheLogger.setLogLevel(this.currentLogLevel);
  }
  
  /**
   * Track operation performance
   */
  public trackOperationPerformance(
    operation: CacheOperation,
    cacheType: CacheType,
    duration: number,
    result: CacheOperationResult
  ): void {
    if (!this.config.enabled) {
      return;
    }
    
    // Add performance record
    this.performanceRecords.push({
      timestamp: Date.now(),
      operation,
      cacheType,
      duration,
      result
    });
    
    // Check if operation is slow based on thresholds
    const threshold = this.config.thresholds[operation];
    if (threshold) {
      if (duration >= threshold.error) {
        // Log detailed information for very slow operations
        cacheLogger.logPerformance('Very slow cache operation detected', {
          operation,
          cacheType,
          duration,
          result,
          threshold: threshold.error
        });
        
        // Adjust log level immediately for very slow operations
        this.adjustLogLevelForSlowOperation('error');
      } else if (duration >= threshold.warn) {
        // Log warning for slow operations
        cacheLogger.logPerformance('Slow cache operation detected', {
          operation,
          cacheType,
          duration,
          result,
          threshold: threshold.warn
        });
        
        // Adjust log level for slow operation
        this.adjustLogLevelForSlowOperation('warn');
      }
    }
    
    // Clean up old records
    this.cleanupOldRecords();
    
    // Schedule periodic analysis of performance trends
    this.schedulePerformanceAnalysis();
  }
  
  /**
   * Adjust log level based on slow operation
   */
  private adjustLogLevelForSlowOperation(level: 'warn' | 'error'): void {
    // Count recent slow operations
    const now = Date.now();
    const recentSlowOps = this.performanceRecords.filter(record => {
      const threshold = this.config.thresholds[record.operation];
      if (!threshold) return false;
      
      const isRecent = now - record.timestamp < this.config.performanceWindowMs;
      const isSlow = level === 'error' 
        ? record.duration >= threshold.error
        : record.duration >= threshold.warn;
      
      return isRecent && isSlow;
    });
    
    // If we have enough slow operations, adjust log level
    if (recentSlowOps.length >= this.config.slowOperationThreshold) {
      const newLogLevel = level === 'error' 
        ? this.config.errorLogLevel 
        : this.config.warnLogLevel;
      
      // Only change if new level is more verbose than current
      if (this.shouldIncreaseLogLevel(newLogLevel)) {
        const oldLevel = this.currentLogLevel;
        this.currentLogLevel = newLogLevel;
        cacheLogger.setLogLevel(this.currentLogLevel);
        
        cacheLogger.logConfig(CacheLogLevel.INFO, 'Cache log level automatically adjusted due to performance issues', {
          oldLevel,
          newLevel: this.currentLogLevel,
          slowOperations: recentSlowOps.length,
          reason: level === 'error' ? 'very slow operations' : 'slow operations'
        });
        
        // Schedule reset of log level
        this.scheduleLogLevelReset();
      }
    }
  }
  
  /**
   * Schedule reset of log level after performance window
   */
  private scheduleLogLevelReset(): void {
    // Clear any existing timeout
    if (this.adaptiveLogLevelTimeout) {
      clearTimeout(this.adaptiveLogLevelTimeout);
    }
    
    // Schedule reset after performance window
    this.adaptiveLogLevelTimeout = setTimeout(() => {
      // Only reset if no recent slow operations
      const now = Date.now();
      const recentSlowOps = this.performanceRecords.filter(record => {
        const threshold = this.config.thresholds[record.operation];
        if (!threshold) return false;
        
        const isRecent = now - record.timestamp < this.config.performanceWindowMs / 2;
        const isSlow = record.duration >= threshold.warn;
        
        return isRecent && isSlow;
      });
      
      if (recentSlowOps.length < this.config.slowOperationThreshold) {
        const oldLevel = this.currentLogLevel;
        this.resetLogLevel();
        
        cacheLogger.logConfig(CacheLogLevel.INFO, 'Cache log level automatically reset after performance improved', {
          oldLevel,
          newLevel: this.currentLogLevel
        });
      } else {
        // If still having issues, schedule another check
        this.scheduleLogLevelReset();
      }
    }, this.config.performanceWindowMs);
  }
  
  /**
   * Schedule analysis of performance trends
   */
  private schedulePerformanceAnalysis(): void {
    // We could implement more sophisticated analysis here
    // For now, we just rely on the immediate adjustments
  }
  
  /**
   * Clean up old performance records
   */
  private cleanupOldRecords(): void {
    const cutoff = Date.now() - (this.config.performanceWindowMs * 2);
    this.performanceRecords = this.performanceRecords.filter(record => 
      record.timestamp >= cutoff
    );
  }
  
  /**
   * Check if we should increase log level
   */
  private shouldIncreaseLogLevel(newLevel: CacheLogLevel): boolean {
    const levels = [
      CacheLogLevel.ERROR,
      CacheLogLevel.WARN,
      CacheLogLevel.INFO,
      CacheLogLevel.DEBUG
    ];
    
    const currentIndex = levels.indexOf(this.currentLogLevel);
    const newIndex = levels.indexOf(newLevel);
    
    // Higher index means more verbose logging
    return newIndex > currentIndex;
  }
  
  /**
   * Get detailed performance statistics
   */
  public getPerformanceStatistics(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    verySlowOperations: number;
    byOperation: Record<CacheOperation, {
      count: number;
      averageDuration: number;
      slowCount: number;
      verySlowCount: number;
    }>;
  } {
    // Clean up old records first
    this.cleanupOldRecords();
    
    // Initialize statistics
    const stats = {
      totalOperations: this.performanceRecords.length,
      averageDuration: 0,
      slowOperations: 0,
      verySlowOperations: 0,
      byOperation: {} as Record<CacheOperation, {
        count: number;
        averageDuration: number;
        slowCount: number;
        verySlowCount: number;
      }>
    };
    
    // Initialize operation stats
    const operations: CacheOperation[] = ['get', 'set', 'delete', 'invalidate', 'clear'];
    operations.forEach(op => {
      stats.byOperation[op] = {
        count: 0,
        averageDuration: 0,
        slowCount: 0,
        verySlowCount: 0
      };
    });
    
    // Calculate statistics
    let totalDuration = 0;
    
    this.performanceRecords.forEach(record => {
      totalDuration += record.duration;
      
      // Update operation stats
      const opStats = stats.byOperation[record.operation];
      if (opStats) {
        opStats.count++;
        opStats.averageDuration += record.duration;
        
        // Check if slow based on thresholds
        const threshold = this.config.thresholds[record.operation];
        if (threshold) {
          if (record.duration >= threshold.error) {
            opStats.verySlowCount++;
            stats.verySlowOperations++;
          } else if (record.duration >= threshold.warn) {
            opStats.slowCount++;
            stats.slowOperations++;
          }
        }
      }
    });
    
    // Calculate averages
    if (stats.totalOperations > 0) {
      stats.averageDuration = totalDuration / stats.totalOperations;
    }
    
    // Calculate operation averages
    Object.keys(stats.byOperation).forEach(op => {
      const opStats = stats.byOperation[op as CacheOperation];
      if (opStats.count > 0) {
        opStats.averageDuration = opStats.averageDuration / opStats.count;
      }
    });
    
    return stats;
  }
  
  /**
   * Log detailed information about problematic operations
   */
  public logProblematicOperations(): void {
    // Clean up old records first
    this.cleanupOldRecords();
    
    // Find problematic operations
    const problematicOps = this.performanceRecords.filter(record => {
      const threshold = this.config.thresholds[record.operation];
      if (!threshold) return false;
      
      return record.duration >= threshold.warn;
    });
    
    if (problematicOps.length === 0) {
      cacheLogger.logMonitor(CacheLogLevel.INFO, 'No problematic cache operations detected', {});
      return;
    }
    
    // Group by operation type
    const byOperation: Record<CacheOperation, typeof problematicOps> = {
      get: [],
      set: [],
      delete: [],
      invalidate: [],
      clear: []
    };
    
    problematicOps.forEach(op => {
      byOperation[op.operation].push(op);
    });
    
    // Log summary
    cacheLogger.logMonitor(CacheLogLevel.WARN, 'Problematic cache operations detected', {
      totalProblematic: problematicOps.length,
      byOperation: Object.fromEntries(
        Object.entries(byOperation)
          .filter(([, ops]) => ops.length > 0)
          .map(([op, ops]) => [
            op, 
            {
              count: ops.length,
              averageDuration: ops.reduce((sum, op) => sum + op.duration, 0) / ops.length
            }
          ])
      )
    });
    
    // Log details for each operation type
    Object.entries(byOperation).forEach(([op, ops]) => {
      if (ops.length === 0) return;
      
      const verySlowOps = ops.filter(record => {
        const threshold = this.config.thresholds[record.operation];
        return threshold && record.duration >= threshold.error;
      });
      
      if (verySlowOps.length > 0) {
        cacheLogger.logMonitor(CacheLogLevel.ERROR, `Very slow ${op} operations detected`, {
          operation: op,
          count: verySlowOps.length,
          averageDuration: verySlowOps.reduce((sum, op) => sum + op.duration, 0) / verySlowOps.length,
          maxDuration: Math.max(...verySlowOps.map(op => op.duration)),
          threshold: this.config.thresholds[op as CacheOperation]?.error
        });
      }
    });
  }
}

// Export singleton instance
export const adaptiveCacheLogger = AdaptiveCacheLogger.getInstance();