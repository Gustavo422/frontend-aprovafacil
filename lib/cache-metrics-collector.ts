import { CacheType } from './cache-manager';
import { cacheLogger, CacheLogLevel } from './cache-logger';
import type { 
  SamplingStrategy,
  SamplingStrategyConfig} from './cache-sampling-strategies';
import { 
  SamplingStrategyFactory, 
  SamplingStrategyType,
  SystemLoadEstimator,
  AdaptiveSamplingStrategy
} from './cache-sampling-strategies';
import { CircularBuffer } from './cache-circular-buffer';

/**
 * Cache operation types
 */
export type CacheOperation = 'get' | 'set' | 'delete' | 'invalidate' | 'clear';

/**
 * Cache operation result types
 */
export type CacheOperationResult = 'hit' | 'miss' | 'success' | 'error';

/**
 * Cache metric data
 */
export interface CacheMetric {
  /**
   * Unique identifier for the metric
   */
  id: string;
  
  /**
   * Timestamp when the operation occurred
   */
  timestamp: Date;
  
  /**
   * Type of cache operation
   */
  operation: CacheOperation;
  
  /**
   * Type of cache storage
   */
  cacheType: CacheType;
  
  /**
   * Cache key (if applicable)
   */
  key?: string;
  
  /**
   * Operation duration in milliseconds
   */
  duration: number;
  
  /**
   * Operation result
   */
  result: CacheOperationResult;
  
  /**
   * Size of the cache entry (if available)
   */
  size?: number;
  
  /**
   * Error message (if operation resulted in error)
   */
  error?: string;
  
  /**
   * User ID (if applicable)
   */
  usuarioId?: string;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  /**
   * Hit rate (0-1)
   */
  hitRate: number;
  
  /**
   * Miss rate (0-1)
   */
  missRate: number;
  
  /**
   * Average operation duration in milliseconds
   */
  averageDuration: number;
  
  /**
   * Count of operations by type
   */
  operationCounts: Record<CacheOperation, number>;
  
  /**
   * Error rate (0-1)
   */
  errorRate: number;
  
  /**
   * Total number of operations
   */
  totalOperations: number;
  
  /**
   * Total cache size in bytes (if available)
   */
  cacheSize?: number;
  
  /**
   * Number of cache entries
   */
  entryCount?: number;
}

/**
 * Metrics collector configuration
 */
export interface MetricsCollectorConfig {
  /**
   * Whether metrics collection is enabled
   */
  enabled: boolean;
  
  /**
   * Sampling rate (0-1) for metrics collection
   */
  sampleRate: number;
  
  /**
   * Maximum number of metrics to keep in history
   */
  maxMetricsHistory: number;
  
  /**
   * Whether to collect size metrics
   */
  collectSizeMetrics: boolean;
  
  /**
   * Whether to collect detailed timing information
   */
  detailedTimings: boolean;
  
  /**
   * Sampling strategy configuration
   */
  samplingStrategy?: SamplingStrategyConfig;
  
  /**
   * Whether to use system load for adaptive sampling
   */
  useSystemLoadForSampling?: boolean;
  
  /**
   * Memory usage limit in bytes (0 for no limit)
   */
  memoryUsageLimit?: number;
  
  /**
   * Auto-pruning configuration
   */
  autoPruning?: {
    /**
     * Whether to enable automatic pruning of old metrics
     */
    enabled: boolean;
    
    /**
     * Maximum age of metrics in milliseconds
     */
    maxAgeMs?: number;
    
    /**
     * Interval for pruning checks in milliseconds
     */
    checkIntervalMs?: number;
    
    /**
     * Target memory usage percentage (0-1)
     */
    targetMemoryUsage?: number;
  };
}

/**
 * Default metrics collector configuration
 */
const DEFAULT_CONFIG: MetricsCollectorConfig = {
  enabled: true,
  sampleRate: 0.1,
  maxMetricsHistory: 1000,
  collectSizeMetrics: true,
  detailedTimings: false,
  samplingStrategy: {
    type: SamplingStrategyType.FIXED_RATE,
    baseSampleRate: 0.1
  },
  useSystemLoadForSampling: false,
  memoryUsageLimit: 5 * 1024 * 1024, // 5MB default limit
  autoPruning: {
    enabled: true,
    maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    checkIntervalMs: 5 * 60 * 1000, // 5 minutes
    targetMemoryUsage: 0.8 // 80% of memory limit
  }
};

/**
 * Cache metrics collector - Tracks performance metrics for cache operations
 */
export class CacheMetricsCollector {
  private config: MetricsCollectorConfig;
  private readonly metricsBuffer: CircularBuffer<CacheMetric>;
  private enabled = false;
  private readonly operationTimers: Map<string, { startTime: number; operation: CacheOperation; key?: string; cacheType: CacheType }> = new Map();
  private samplingStrategy: SamplingStrategy = SamplingStrategyFactory.createStrategy({ type: SamplingStrategyType.FIXED_RATE, baseSampleRate: 0.1 });
  private readonly systemLoadEstimator: SystemLoadEstimator;
  private pruningInterval: ReturnType<typeof setInterval> | null = null;
  private estimatedMemoryUsage = 0;
  private lastPruneTime: number = Date.now();
  
  /**
   * Constructor
   */
  constructor(config: Partial<MetricsCollectorConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      autoPruning: {
        ...((DEFAULT_CONFIG.autoPruning ?? {}) as object),
        ...(config.autoPruning || {}),
        enabled: (config.autoPruning && typeof config.autoPruning.enabled === 'boolean') ? config.autoPruning.enabled : (DEFAULT_CONFIG.autoPruning ? DEFAULT_CONFIG.autoPruning.enabled : true)
      }
    };
    
    // Initialize metrics buffer with circular buffer
    this.metricsBuffer = new CircularBuffer<CacheMetric>(this.config.maxMetricsHistory);
    
    // Initialize sampling strategy
    this.initializeSamplingStrategy();
    
    // Initialize system load estimator
    this.systemLoadEstimator = SystemLoadEstimator.getInstance();
  }
  
  /**
   * Initialize the sampling strategy based on configuration
   */
  private initializeSamplingStrategy(): void {
    const strategyConfig = this.config.samplingStrategy || {
      type: SamplingStrategyType.FIXED_RATE,
      baseSampleRate: this.config.sampleRate
    };
    
    // Ensure base sample rate is synchronized with the main config
    strategyConfig.baseSampleRate = this.config.sampleRate;
    
    this.samplingStrategy = SamplingStrategyFactory.createStrategy(strategyConfig);
    
    cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Sampling strategy initialized', {
      type: strategyConfig.type,
      baseSampleRate: strategyConfig.baseSampleRate
    });
  }
  
  /**
   * Start collecting metrics
   */
  public start(): void {
    if (this.enabled) {
      return;
    }
    
    this.enabled = true;
    
    // Start auto-pruning if enabled
    this.startAutoPruning();
    
    cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics collection started', {
      sampleRate: this.config.sampleRate,
      maxHistory: this.config.maxMetricsHistory,
      autoPruning: this.config.autoPruning?.enabled
    });
  }
  
  /**
   * Start automatic pruning of old metrics
   */
  private startAutoPruning(): void {
    // Clear any existing interval
    if (this.pruningInterval) {
      clearInterval(this.pruningInterval);
      this.pruningInterval = null;
    }
    
    // If auto-pruning is enabled, start the interval
    if (this.config.autoPruning?.enabled) {
      const checkInterval = this.config.autoPruning.checkIntervalMs || 5 * 60 * 1000; // Default: 5 minutes
      
      this.pruningInterval = setInterval(() => {
        this.pruneOldMetrics();
      }, checkInterval);
      
      cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Auto-pruning started', {
        checkInterval,
        maxAgeMs: this.config.autoPruning.maxAgeMs
      });
    }
  }
  
  /**
   * Stop collecting metrics
   */
  public stop(): void {
    if (!this.enabled) {
      return;
    }
    
    this.enabled = false;
    
    // Stop auto-pruning
    if (this.pruningInterval) {
      clearInterval(this.pruningInterval);
      this.pruningInterval = null;
    }
    
    cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics collection stopped', {});
  }
  
  /**
   * Configure the metrics collector
   */
  public configure(config: Partial<MetricsCollectorConfig>): void {
    const oldConfig = { ...this.config };
    
    this.config = {
      ...this.config,
      ...config,
      // Ensure nested objects are properly merged
      autoPruning: {
        ...((DEFAULT_CONFIG.autoPruning ?? {}) as object),
        ...(config.autoPruning || {}),
        enabled: (config.autoPruning && typeof config.autoPruning.enabled === 'boolean') ? config.autoPruning.enabled : (DEFAULT_CONFIG.autoPruning ? DEFAULT_CONFIG.autoPruning.enabled : true)
      }
    };
    
    // Handle configuration changes
    if (oldConfig.enabled !== this.config.enabled) {
      if (this.config.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
    
    // If max history changed, resize the buffer
    if (this.config.maxMetricsHistory !== oldConfig.maxMetricsHistory) {
      this.resizeMetricsBuffer(this.config.maxMetricsHistory);
    }
    
    // Update sampling strategy if configuration changed
    if (config.samplingStrategy || config.sampleRate !== oldConfig.sampleRate) {
      // If only sampleRate changed, update the existing strategy
      if (!config.samplingStrategy && config.sampleRate !== oldConfig.sampleRate) {
        this.samplingStrategy.updateConfig({
          baseSampleRate: this.config.sampleRate
        });
      } else {
        // Otherwise reinitialize the strategy
        this.initializeSamplingStrategy();
      }
    }
    
    // Update auto-pruning if configuration changed
    if (JSON.stringify(oldConfig.autoPruning) !== JSON.stringify(this.config.autoPruning)) {
      if (this.enabled) {
        this.startAutoPruning();
      }
    }
    
    cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Cache metrics collector configured', {
      changes: Object.keys(config)
    });
  }
  
  /**
   * Record the start of a cache operation
   */
  public recordOperationStart(
    operation: CacheOperation,
    cacheType: CacheType,
    key?: string
  ): string {
    if (!this.enabled) {
      return '';
    }
    
    // Create sampling context
    const context = {
      operation,
      cacheType,
      key,
      timestamp: Date.now()
    };
    
    // For critical operations, always sample
    if (operation === 'invalidate' || operation === 'clear') {
      const operationId = this.generateOperationId();
      
      this.operationTimers.set(operationId, {
        startTime: performance.now(),
        operation,
        cacheType,
        key
      });
      
      return operationId;
    }
    
    // For other operations, use the sampling strategy
    // We can't use async/await here, so we use the strategy directly
    if (!this.samplingStrategy.shouldSample(context)) {
      return '';
    }
    
    const operationId = this.generateOperationId();
    
    this.operationTimers.set(operationId, {
      startTime: performance.now(),
      operation,
      cacheType,
      key
    });
    
    return operationId;
  }
  
  /**
   * Record the end of a cache operation
   */
  public recordOperationEnd(
    operationId: string,
    result: CacheOperationResult,
    options: {
      error?: string;
      size?: number;
      usuarioId?: string;
    } = {}
  ): void {
    if (!operationId || !this.enabled) {
      return;
    }
    
    const timer = this.operationTimers.get(operationId);
    if (!timer) {
      return;
    }
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    const metric: CacheMetric = {
      id: operationId,
      timestamp: new Date(),
      operation: timer.operation,
      cacheType: timer.cacheType,
      key: timer.key,
      duration,
      result,
      ...options
    };
    
    this.addMetric(metric);
    this.operationTimers.delete(operationId);
  }
  
  /**
   * Record a complete cache operation (for operations that are already complete)
   */
  public recordOperation(
    operation: CacheOperation,
    cacheType: CacheType,
    result: CacheOperationResult,
    duration: number,
    options: {
      key?: string;
      error?: string;
      size?: number;
      usuarioId?: string;
    } = {}
  ): void {
    if (!this.enabled) {
      return;
    }
    
    // Always sample errors and important operations
    if (result === 'error' || operation === 'invalidate' || operation === 'clear') {
      const metric: CacheMetric = {
        id: this.generateOperationId(),
        timestamp: new Date(),
        operation,
        cacheType,
        duration,
        result,
        ...options
      };
      
      this.addMetric(metric);
      return;
    }
    
    // Create sampling context
    const context = {
      operation,
      cacheType,
      key: options.key,
      timestamp: Date.now()
    };
    
    // For other operations, use the sampling strategy
    if (!this.samplingStrategy.shouldSample(context)) {
      return;
    }
    
    const metric: CacheMetric = {
      id: this.generateOperationId(),
      timestamp: new Date(),
      operation,
      cacheType,
      duration,
      result,
      ...options
    };
    
    this.addMetric(metric);
  }
  
  /**
   * Add a metric to the collection
   */
  private addMetric(metric: CacheMetric): void {
    // Add to circular buffer (automatically handles capacity)
    const overwritten = this.metricsBuffer.push(metric);
    
    // Update estimated memory usage
    this.updateMemoryUsageEstimate(metric, overwritten);
    
    // Log error metrics
    if (metric.result === 'error') {
      cacheLogger.logError('Cache operation error', 
        cacheLogger.createOperationLogEntry(
          metric.operation, 
          metric.cacheType, 
          {
            key: metric.key,
            error: metric.error,
            duration: metric.duration,
            usuarioId: metric.usuarioId,
            correlationId: metric.id
          }
        )
      );
    }
    
    // Check if we need to prune based on memory usage
    this.checkMemoryUsage();
  }
  
  /**
   * Update the estimated memory usage
   */
  private updateMemoryUsageEstimate(addedMetric: CacheMetric, removedMetric: CacheMetric | null): void {
    // Estimate size of the added metric
    const addedSize = this.estimateMetricSize(addedMetric);
    this.estimatedMemoryUsage += addedSize;
    
    // Subtract size of removed metric if any
    if (removedMetric) {
      const removedSize = this.estimateMetricSize(removedMetric);
      this.estimatedMemoryUsage -= removedSize;
    }
    
    // Ensure we don't go negative
    if (this.estimatedMemoryUsage < 0) {
      this.estimatedMemoryUsage = 0;
    }
  }
  
  /**
   * Estimate the memory size of a metric in bytes
   */
  private estimateMetricSize(metric: CacheMetric): number {
    // Base size for object structure
    let size = 200; // Base size for object structure
    
    // Add size for string properties
    if (metric.id) size += metric.id.length * 2;
    if (metric.key) size += metric.key.length * 2;
    if (metric.error) size += metric.error.length * 2;
    if (metric.usuarioId) size += metric.usuarioId.length * 2;
    
    // Add fixed sizes for other properties
    size += 8; // timestamp (Date object reference)
    size += 4; // operation (string enum)
    size += 4; // cacheType (string enum)
    size += 8; // duration (number)
    size += 4; // result (string enum)
    size += 8; // size (number, if present)
    
    return size;
  }
  
  /**
   * Check if memory usage exceeds limits and prune if necessary
   */
  private checkMemoryUsage(): void {
    if (!this.config.memoryUsageLimit || this.config.memoryUsageLimit <= 0) {
      return;
    }
    
    // If we're over the target memory usage, prune
    const targetUsage = this.config.memoryUsageLimit * 
      ((this.config.autoPruning?.targetMemoryUsage || 0.8));
    
    if (this.estimatedMemoryUsage > targetUsage) {
      this.pruneByMemoryTarget(targetUsage);
    }
  }
  
  /**
   * Prune metrics to meet memory target
   */
  private pruneByMemoryTarget(targetBytes: number): void {
    // If we're already under target, nothing to do
    if (this.estimatedMemoryUsage <= targetBytes) {
      return;
    }
    
    // Calculate how much we need to reduce
    const reductionNeeded = this.estimatedMemoryUsage - targetBytes;
    let bytesReduced = 0;
    let metricsRemoved = 0;
    
    // Remove oldest metrics until we meet the target
    while (bytesReduced < reductionNeeded && !this.metricsBuffer.isEmpty()) {
      const oldestMetric = this.metricsBuffer.shift();
      if (oldestMetric) {
        const metricSize = this.estimateMetricSize(oldestMetric);
        bytesReduced += metricSize;
        this.estimatedMemoryUsage -= metricSize;
        metricsRemoved++;
      } else {
        break;
      }
    }
    
    cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Pruned metrics by memory target', {
      metricsRemoved,
      bytesReduced,
      remainingMetrics: this.metricsBuffer.getSize(),
      currentMemoryUsage: this.estimatedMemoryUsage
    });
  }
  
  /**
   * Resize the metrics buffer to a new capacity
   */
  private resizeMetricsBuffer(newCapacity: number): void {
    if (newCapacity <= 0) {
      return;
    }
    
    // Resize the buffer
    const discarded = this.metricsBuffer.resize(newCapacity);
    
    // Update memory usage estimate
    let discardedBytes = 0;
    for (const metric of discarded) {
      discardedBytes += this.estimateMetricSize(metric);
    }
    
    this.estimatedMemoryUsage -= discardedBytes;
    
    // Ensure we don't go negative
    if (this.estimatedMemoryUsage < 0) {
      this.estimatedMemoryUsage = 0;
    }
    
    cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Resized metrics buffer', {
      newCapacity,
      discardedMetrics: discarded.length,
      discardedBytes,
      currentMemoryUsage: this.estimatedMemoryUsage
    });
  }
  
  /**
   * Prune old metrics based on age
   */
  private pruneOldMetrics(): void {
    if (!this.config.autoPruning?.enabled) {
      return;
    }
    
    const now = Date.now();
    const maxAgeMs = this.config.autoPruning.maxAgeMs || 24 * 60 * 60 * 1000; // Default: 24 hours
    const cutoffTime = new Date(now - maxAgeMs);
    
    // Get all metrics as array
    const allMetrics = this.metricsBuffer.toArray();
    
    // Filter out old metrics
    const metricsToKeep = allMetrics.filter(metric => metric.timestamp >= cutoffTime);
    
    // If we're removing metrics, rebuild the buffer
    if (metricsToKeep.length < allMetrics.length) {
      // Clear the buffer
      this.metricsBuffer.clear();
      
      // Reset memory usage estimate
      this.estimatedMemoryUsage = 0;
      
      // Add back the metrics to keep
      for (const metric of metricsToKeep) {
        this.metricsBuffer.push(metric);
        this.estimatedMemoryUsage += this.estimateMetricSize(metric);
      }
      
      cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Pruned old metrics', {
        removedCount: allMetrics.length - metricsToKeep.length,
        remainingCount: metricsToKeep.length,
        maxAgeMs,
        currentMemoryUsage: this.estimatedMemoryUsage
      });
    }
    
    this.lastPruneTime = now;
  }
  
  /**
   * Update system load information for the sampling strategy
   * This should be called periodically to keep the load information up to date
   */
  public async updateSystemLoadInfo(): Promise<void> {
    if (!this.config.useSystemLoadForSampling) {
      return;
    }
    
    try {
      // const systemLoad = await this.systemLoadEstimator.getSystemLoad();
      
      // Store the system load in the sampling strategy if it's adaptive
      if (typeof AdaptiveSamplingStrategy !== 'undefined' && this.samplingStrategy instanceof AdaptiveSamplingStrategy) {
        // Se necessário, adapte para passar apenas propriedades válidas para updateConfig
      }
    } catch (error) {
      cacheLogger.logError('Failed to update system load information', {
        operation: 'get',
        cacheType: CacheType.MEMORY,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get the current effective sampling rate
   */
  public getEffectiveSamplingRate(): number {
    return this.samplingStrategy.getEffectiveSamplingRate();
  }
  
  /**
   * Get the current sampling strategy
   */
  public getSamplingStrategy(): SamplingStrategy {
    return this.samplingStrategy;
  }
  
  /**
   * Update the sampling strategy configuration
   */
  public updateSamplingStrategy(config: Partial<SamplingStrategyConfig>): void {
    this.samplingStrategy.updateConfig(config);
    
    cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Sampling strategy updated', {
      type: this.samplingStrategy.getConfig().type,
      baseSampleRate: this.samplingStrategy.getConfig().baseSampleRate
    });
  }
  
  /**
   * Generate a unique operation ID
   */
  private generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get collected metrics
   */
  public getMetrics(options: {
    cacheType?: CacheType;
    operation?: CacheOperation;
    timeRange?: [Date, Date];
    limit?: number;
  } = {}): CacheMetric[] {
    // Get all metrics from the buffer
    const allMetrics = this.metricsBuffer.toArray();
    let filteredMetrics = allMetrics;
    
    // Filter by cache type
    if (options.cacheType) {
      filteredMetrics = filteredMetrics.filter(m => m.cacheType === options.cacheType);
    }
    
    // Filter by operation
    if (options.operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === options.operation);
    }
    
    // Filter by time range
    if (options.timeRange) {
      const [start, end] = options.timeRange;
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= start && m.timestamp <= end
      );
    }
    
    // Sort by timestamp (newest first)
    filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      filteredMetrics = filteredMetrics.slice(0, options.limit);
    }
    
    return filteredMetrics;
  }
  
  /**
   * Get statistics from collected metrics
   */
  public getStatistics(options: {
    cacheType?: CacheType;
    timeRange?: [Date, Date];
  } = {}): CacheStatistics {
    // Get filtered metrics
    const metrics = this.getMetrics(options);
    
    // Initialize statistics
    const statistics: CacheStatistics = {
      hitRate: 0,
      missRate: 0,
      averageDuration: 0,
      operationCounts: {
        get: 0,
        set: 0,
        delete: 0,
        invalidate: 0,
        clear: 0
      },
      errorRate: 0,
      totalOperations: metrics.length
    };
    
    if (metrics.length === 0) {
      return statistics;
    }
    
    // Calculate operation counts
    metrics.forEach(metric => {
      statistics.operationCounts[metric.operation]++;
      
      // Sum durations for average calculation
      statistics.averageDuration += metric.duration;
    });
    
    // Calculate average duration
    statistics.averageDuration /= metrics.length;
    
    // Calculate hit/miss rates (only for 'get' operations)
    const getOperations = metrics.filter(m => m.operation === 'get');
    if (getOperations.length > 0) {
      const hits = getOperations.filter(m => m.result === 'hit').length;
      statistics.hitRate = hits / getOperations.length;
      statistics.missRate = 1 - statistics.hitRate;
    }
    
    // Calculate error rate
    const errors = metrics.filter(m => m.result === 'error').length;
    statistics.errorRate = errors / metrics.length;
    
    // Calculate cache size and entry count if available
    if (this.config.collectSizeMetrics) {
      // Group by unique keys to estimate entry count
      const uniqueKeys = new Set<string>();
      let totalSize = 0;
      
      metrics.forEach(metric => {
        if (metric.key) {
          uniqueKeys.add(`${metric.cacheType}:${metric.key}`);
        }
        
        if (metric.size) {
          totalSize += metric.size;
        }
      });
      
      statistics.entryCount = uniqueKeys.size;
      
      if (totalSize > 0) {
        statistics.cacheSize = totalSize;
      }
    }
    
    return statistics;
  }
  
  /**
   * Get memory usage statistics
   */
  public getMemoryUsageStatistics(): {
    estimatedMemoryUsage: number;
    memoryUsageLimit: number | undefined;
    metricsCount: number;
    bufferCapacity: number;
    bufferUtilization: number;
    lastPruneTime: Date;
    autoPruningEnabled: boolean;
  } {
    return {
      estimatedMemoryUsage: this.estimatedMemoryUsage,
      memoryUsageLimit: this.config.memoryUsageLimit,
      metricsCount: this.metricsBuffer.getSize(),
      bufferCapacity: this.metricsBuffer.getCapacity(),
      bufferUtilization: this.metricsBuffer.getSize() / this.metricsBuffer.getCapacity(),
      lastPruneTime: new Date(this.lastPruneTime),
      autoPruningEnabled: !!this.config.autoPruning?.enabled
    };
  }
  
  /**
   * Clear all collected metrics
   */
  public clearMetrics(): void {
    this.metricsBuffer.clear();
    this.estimatedMemoryUsage = 0;
    cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics cleared', {});
  }
  
  /**
   * Force pruning of old metrics
   */
  public forcePrune(): void {
    this.pruneOldMetrics();
  }
  
  /**
   * Set memory usage limit
   */
  public setMemoryUsageLimit(limitBytes: number): void {
    this.config.memoryUsageLimit = limitBytes;
    this.checkMemoryUsage();
  }
  
  /**
   * Check if metrics collection is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}