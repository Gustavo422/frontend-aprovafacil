import { CacheType } from './cache-manager';
import type { CacheOperation } from './cache-metrics-collector';
import { cacheLogger } from './cache-logger';

/**
 * Sampling strategy types
 */
export enum SamplingStrategyType {
  FIXED_RATE = 'fixed_rate',
  ADAPTIVE = 'adaptive',
  PRIORITY_BASED = 'priority_based'
}

/**
 * Sampling strategy configuration
 */
export interface SamplingStrategyConfig {
  /**
   * Type of sampling strategy
   */
  type: SamplingStrategyType;
  
  /**
   * Base sampling rate (0-1)
   */
  baseSampleRate: number;
  
  /**
   * Minimum sampling rate (0-1) for adaptive sampling
   */
  minSampleRate?: number;
  
  /**
   * Maximum sampling rate (0-1) for adaptive sampling
   */
  maxSampleRate?: number;
  
  /**
   * System load threshold for reducing sampling rate
   */
  loadThreshold?: number;
  
  /**
   * Priority configuration for different operations
   */
  operationPriorities?: Record<CacheOperation, number>;
  
  /**
   * Priority configuration for different cache types
   */
  cacheTypePriorities?: Record<CacheType, number>;
  
  /**
   * Key pattern priorities (regex patterns and their priority values)
   */
  keyPatternPriorities?: Array<{ pattern: string; priority: number }>;
  
  /**
   * Window size in milliseconds for adaptive sampling
   */
  adaptiveWindowMs?: number;
}

/**
 * Default sampling strategy configuration
 */
export const DEFAULT_SAMPLING_CONFIG: SamplingStrategyConfig = {
  type: SamplingStrategyType.FIXED_RATE,
  baseSampleRate: 0.1, // 10% sampling by default
  minSampleRate: 0.01, // 1% minimum sampling rate
  maxSampleRate: 1.0, // 100% maximum sampling rate
  loadThreshold: 0.7, // 70% load threshold
  adaptiveWindowMs: 60000, // 1 minute window for adaptive sampling
  operationPriorities: {
    get: 1.0, // Normal priority
    set: 1.5, // Higher priority
    delete: 1.5, // Higher priority
    invalidate: 2.0, // High priority
    clear: 3.0 // Highest priority (always sample)
  },
  cacheTypePriorities: {
    [CacheType.MEMORY]: 1.0,
    [CacheType.LOCAL_STORAGE]: 1.2,
    [CacheType.SESSION_STORAGE]: 1.2,
    [CacheType.SUPABASE]: 2.0 // Higher priority for remote cache
  }
};

/**
 * Sampling context for making sampling decisions
 */
export interface SamplingContext {
  operation: CacheOperation;
  cacheType: CacheType;
  key?: string;
  timestamp: number;
  systemLoad?: number;
}

/**
 * Interface for sampling strategies
 */
export interface SamplingStrategy {
  /**
   * Determine if an operation should be sampled
   */
  shouldSample(context: SamplingContext): boolean;
  
  /**
   * Get the current effective sampling rate
   */
  getEffectiveSamplingRate(): number;
  
  /**
   * Update the strategy with new configuration
   */
  updateConfig(config: Partial<SamplingStrategyConfig>): void;
  
  /**
   * Get the current configuration
   */
  getConfig(): SamplingStrategyConfig;
}

/**
 * Fixed rate sampling strategy
 */
export class FixedRateSamplingStrategy implements SamplingStrategy {
  private config: SamplingStrategyConfig;
  
  constructor(config: Partial<SamplingStrategyConfig> = {}) {
    this.config = {
      ...DEFAULT_SAMPLING_CONFIG,
      type: SamplingStrategyType.FIXED_RATE,
      ...config
    };
  }
  
  public shouldSample(): boolean {
    return Math.random() < this.config.baseSampleRate;
  }
  
  public getEffectiveSamplingRate(): number {
    return this.config.baseSampleRate;
  }
  
  public updateConfig(config: Partial<SamplingStrategyConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  public getConfig(): SamplingStrategyConfig {
    return { ...this.config };
  }
}

/**
 * Adaptive sampling strategy that adjusts based on system load
 */
export class AdaptiveSamplingStrategy implements SamplingStrategy {
  private config: SamplingStrategyConfig;
  private currentSamplingRate: number;
  private recentOperations: Array<{ timestamp: number }> = [];
  
  constructor(config: Partial<SamplingStrategyConfig> = {}) {
    this.config = {
      ...DEFAULT_SAMPLING_CONFIG,
      type: SamplingStrategyType.ADAPTIVE,
      ...config
    };
    this.currentSamplingRate = this.config.baseSampleRate;
  }
  
  public shouldSample(context: SamplingContext): boolean {
    // Update sampling rate based on system load or operation rate
    this.updateSamplingRate(context);
    
    // Record this operation attempt for rate calculation
    this.recentOperations.push({ timestamp: context.timestamp });
    
    // Clean up old operations
    this.cleanupOldOperations(context.timestamp);
    
    // Apply sampling decision
    return Math.random() < this.currentSamplingRate;
  }
  
  private updateSamplingRate(context: SamplingContext): void {
    // If system load is provided, use it to adjust sampling rate
    if (context.systemLoad !== undefined) {
      this.adjustRateBySystemLoad(context.systemLoad);
    } else {
      // Otherwise, use operation rate to estimate load
      this.adjustRateByOperationRate(context.timestamp);
    }
  }
  
  private adjustRateBySystemLoad(load: number): void {
    const { minSampleRate, maxSampleRate, baseSampleRate, loadThreshold } = this.config;
    
    if (load > (loadThreshold || 0.7)) {
      // Reduce sampling rate as load increases
      const loadFactor = Math.min(load, 1.0);
      const reduction = (loadFactor - (loadThreshold || 0.7)) / (1 - (loadThreshold || 0.7));
      this.currentSamplingRate = baseSampleRate * (1 - reduction);
      
      // Ensure we don't go below minimum
      if (minSampleRate !== undefined) {
        this.currentSamplingRate = Math.max(this.currentSamplingRate, minSampleRate);
      }
    } else {
      // Normal or low load, use base rate
      this.currentSamplingRate = baseSampleRate;
      
      // If load is very low, we can sample more
      if (load < (loadThreshold || 0.7) / 2) {
        const increaseFactor = 1 - (load / ((loadThreshold || 0.7) / 2));
        this.currentSamplingRate = baseSampleRate + (maxSampleRate || 1.0 - baseSampleRate) * increaseFactor * 0.5;
        
        // Ensure we don't exceed maximum
        if (maxSampleRate !== undefined) {
          this.currentSamplingRate = Math.min(this.currentSamplingRate, maxSampleRate);
        }
      }
    }
  }
  
  private adjustRateByOperationRate(currentTime: number): void {
    const windowMs = this.config.adaptiveWindowMs || 60000;
    const operationsInWindow = this.recentOperations.filter(
      op => op.timestamp > currentTime - windowMs
    ).length;
    
    // Calculate operations per second
    const opsPerSecond = operationsInWindow / (windowMs / 1000);
    
    // Adjust sampling rate based on operation rate
    // Higher operation rate = lower sampling rate
    const highRateThreshold = 100; // 100 ops/sec is considered high
    
    if (opsPerSecond > highRateThreshold) {
      const factor = Math.min(highRateThreshold / opsPerSecond, 1);
      this.currentSamplingRate = this.config.baseSampleRate * factor;
      
      // Ensure we don't go below minimum
      if (this.config.minSampleRate !== undefined) {
        this.currentSamplingRate = Math.max(this.currentSamplingRate, this.config.minSampleRate);
      }
    } else {
      // Normal or low operation rate, use base rate
      this.currentSamplingRate = this.config.baseSampleRate;
    }
  }
  
  private cleanupOldOperations(currentTime: number): void {
    const windowMs = this.config.adaptiveWindowMs || 60000;
    this.recentOperations = this.recentOperations.filter(
      op => op.timestamp > currentTime - windowMs
    );
  }
  
  public getEffectiveSamplingRate(): number {
    return this.currentSamplingRate;
  }
  
  public updateConfig(config: Partial<SamplingStrategyConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // Reset current sampling rate to base rate when config changes
    this.currentSamplingRate = this.config.baseSampleRate;
  }
  
  public getConfig(): SamplingStrategyConfig {
    return { ...this.config };
  }
}

/**
 * Priority-based sampling strategy that samples based on operation importance
 */
export class PriorityBasedSamplingStrategy implements SamplingStrategy {
  private config: SamplingStrategyConfig;
  
  constructor(config: Partial<SamplingStrategyConfig> = {}) {
    this.config = {
      ...DEFAULT_SAMPLING_CONFIG,
      type: SamplingStrategyType.PRIORITY_BASED,
      ...config
    };
  }
  
  public shouldSample(context: SamplingContext): boolean {
    const priorityFactor = this.calculatePriorityFactor(context);
    const effectiveRate = Math.min(this.config.baseSampleRate * priorityFactor, 1.0);
    
    return Math.random() < effectiveRate;
  }
  
  private calculatePriorityFactor(context: SamplingContext): number {
    let priorityFactor = 1.0;
    
    // Apply operation priority
    if (this.config.operationPriorities?.[context.operation]) {
      priorityFactor *= this.config.operationPriorities[context.operation];
    }
    
    // Apply cache type priority
    if (this.config.cacheTypePriorities?.[context.cacheType]) {
      priorityFactor *= this.config.cacheTypePriorities[context.cacheType];
    }
    
    // Apply key pattern priorities if key is available
    if (context.key && this.config.keyPatternPriorities) {
      for (const { pattern, priority } of this.config.keyPatternPriorities) {
        try {
          const regex = new RegExp(pattern);
          if (regex.test(context.key)) {
            priorityFactor *= priority;
            break; // Apply only the first matching pattern
          }
        } catch (error) {
          // Invalid regex pattern, ignore
          cacheLogger.logError('Invalid regex pattern in key pattern priorities', {
            operation: context.operation,
            cacheType: context.cacheType,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    return priorityFactor;
  }
  
  public getEffectiveSamplingRate(): number {
    // Return base rate as we can't know the effective rate without context
    return this.config.baseSampleRate;
  }
  
  public updateConfig(config: Partial<SamplingStrategyConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      // Ensure nested objects are properly merged
      operationPriorities: {
        ...this.config.operationPriorities,
        ...(config.operationPriorities || {})
      } as Record<CacheOperation, number>,
      cacheTypePriorities: {
        ...this.config.cacheTypePriorities,
        ...(config.cacheTypePriorities || {})
      } as Record<CacheType, number>,
    };
    
    // Merge key pattern priorities if provided
    if (config.keyPatternPriorities) {
      this.config.keyPatternPriorities = [...config.keyPatternPriorities];
    }
  }
  
  public getConfig(): SamplingStrategyConfig {
    return { ...this.config };
  }
}

/**
 * Factory for creating sampling strategies
 */
export class SamplingStrategyFactory {
  /**
   * Create a sampling strategy based on configuration
   */
  public static createStrategy(config: SamplingStrategyConfig): SamplingStrategy {
    switch (config.type) {
      case SamplingStrategyType.ADAPTIVE:
        return new AdaptiveSamplingStrategy(config);
      case SamplingStrategyType.PRIORITY_BASED:
        return new PriorityBasedSamplingStrategy(config);
      case SamplingStrategyType.FIXED_RATE:
      default:
        return new FixedRateSamplingStrategy(config);
    }
  }
}

/**
 * Helper to estimate system load
 */
export class SystemLoadEstimator {
  private static instance: SystemLoadEstimator;
  private readonly samples: Array<{ timestamp: number; load: number }> = [];
  private readonly maxSamples = 10;
  private readonly lastCPUInfo: { idle: number; total: number } | null = null;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SystemLoadEstimator {
    if (!SystemLoadEstimator.instance) {
      SystemLoadEstimator.instance = new SystemLoadEstimator();
    }
    return SystemLoadEstimator.instance;
  }
  
  /**
   * Get the current system load (0-1)
   * This is an approximation based on operation timing
   */
  public async getSystemLoad(): Promise<number> {
    // In browser environments, we can't get actual CPU usage
    // Instead, we'll use a combination of:
    // 1. requestAnimationFrame timing as a proxy for rendering load
    // 2. Operation timing trends
    
    try {
      const load = await this.estimateLoadFromTiming();
      
      // Add to samples
      this.samples.push({
        timestamp: Date.now(),
        load
      });
      
      // Trim samples
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
      
      // Return average of recent samples
      return this.samples.reduce((sum, sample) => sum + sample.load, 0) / this.samples.length;
    } catch {
      // If estimation fails, return a moderate load value
      return 0.5;
    }
  }
  
  /**
   * Estimate load from timing of requestAnimationFrame
   */
  private async estimateLoadFromTiming(): Promise<number> {
    return new Promise<number>((resolve) => {
      // Measure time between requestAnimationFrame calls
      // Longer times indicate higher load
      const start = performance.now();
      
      requestAnimationFrame(() => {
        const end = performance.now();
        const duration = end - start;
        
        // Normalize: 0-16ms is normal (60fps), >32ms indicates high load
        // Map to 0-1 range
        const normalizedLoad = Math.min(duration / 32, 1);
        resolve(normalizedLoad);
      });
    });
  }
}