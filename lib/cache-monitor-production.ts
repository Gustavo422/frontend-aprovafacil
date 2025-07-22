import { CacheType } from './cache-manager';
import { CacheMonitorConfig } from './cache-monitor-config';
import { SamplingStrategyType } from './cache-sampling-strategies';
import { CacheLogLevel } from './cache-logger';

/**
 * Production-specific configuration preset for the cache monitor
 */
export const PRODUCTION_CONFIG: Partial<CacheMonitorConfig> = {
  enabled: true,
  metricsEnabled: true,
  logLevel: 'warn', // Higher log level threshold in production
  dashboardEnabled: true,
  persistConfig: true,
  monitoredCacheTypes: [
    CacheType.MEMORY,
    CacheType.LOCAL_STORAGE,
    CacheType.SESSION_STORAGE,
    CacheType.SUPABASE
  ],
  metricsConfig: {
    enabled: true,
    sampleRate: 0.05, // 5% sampling in production
    maxMetricsHistory: 500, // Reduced history in production
    collectSizeMetrics: true,
    detailedTimings: false, // Disable detailed timings in production
    samplingStrategy: {
      type: SamplingStrategyType.ADAPTIVE,
      baseSampleRate: 0.05,
      minSampleRate: 0.01,
      maxSampleRate: 0.2, // Lower max sampling rate in production
      loadThreshold: 0.6, // More aggressive load threshold in production
      adaptiveWindowMs: 120000, // 2 minutes window in production
      operationPriorities: {
        get: 0.8,      // Lower priority for gets in production
        set: 1.2,      // Normal priority for sets
        delete: 1.2,   // Normal priority for deletes
        invalidate: 2.0, // High priority for invalidations
        clear: 3.0     // Highest priority for clears
      },
      cacheTypePriorities: {
        [CacheType.MEMORY]: 0.8,       // Lower priority for memory cache
        [CacheType.LOCAL_STORAGE]: 1.0, // Normal priority for local storage
        [CacheType.SESSION_STORAGE]: 1.0, // Normal priority for session storage
        [CacheType.SUPABASE]: 1.5      // Higher priority for Supabase
      }
    },
    useSystemLoadForSampling: true,
    memoryUsageLimit: 2 * 1024 * 1024, // 2MB limit in production
    autoPruning: {
      enabled: true,
      maxAgeMs: 12 * 60 * 60 * 1000, // 12 hours in production
      checkIntervalMs: 10 * 60 * 1000, // 10 minutes in production
      targetMemoryUsage: 0.7 // 70% of memory limit
    }
  },
  adaptiveLoggingConfig: {
    enabled: true,
    baseLogLevel: CacheLogLevel.WARN, // Higher base log level in production
    warnLogLevel: CacheLogLevel.INFO,
    errorLogLevel: CacheLogLevel.WARN,
    performanceWindowMs: 300000, // 5 minutes in production
    slowOperationThreshold: 5, // Less sensitive in production
    thresholds: {
      get: {
        warn: 200,  // 200ms in production
        error: 1000 // 1s in production
      },
      set: {
        warn: 300,  // 300ms in production
        error: 1500 // 1.5s in production
      },
      delete: {
        warn: 200,  // 200ms in production
        error: 1000 // 1s in production
      },
      invalidate: {
        warn: 500,  // 500ms in production
        error: 2000 // 2s in production
      },
      clear: {
        warn: 1000, // 1s in production
        error: 5000 // 5s in production
      }
    }
  },
  maxLogHistory: 500 // Reduced log history in production
};

/**
 * Feature toggles for production environments
 */
export interface FeatureToggles {
  enableDetailedMetrics: boolean;
  enableAdaptiveLogging: boolean;
  enableSystemLoadSampling: boolean;
  enableCacheSizeCalculation: boolean;
  enableRelationshipTracking: boolean;
  enableAutomaticPruning: boolean;
}

/**
 * Default feature toggles for production
 */
export const DEFAULT_PRODUCTION_TOGGLES: FeatureToggles = {
  enableDetailedMetrics: false,
  enableAdaptiveLogging: true,
  enableSystemLoadSampling: true,
  enableCacheSizeCalculation: true,
  enableRelationshipTracking: true,
  enableAutomaticPruning: true
};

/**
 * Memory usage limits for different device types
 */
export const MEMORY_USAGE_LIMITS = {
  LOW_END_DEVICE: 1 * 1024 * 1024,    // 1MB for low-end devices
  STANDARD_DEVICE: 2 * 1024 * 1024,   // 2MB for standard devices
  HIGH_END_DEVICE: 5 * 1024 * 1024    // 5MB for high-end devices
};

/**
 * Apply production optimizations to the cache monitor configuration
 */
export function applyProductionOptimizations(
  config: CacheMonitorConfig,
  toggles: Partial<FeatureToggles> = {}
): CacheMonitorConfig {
  // Merge toggles with defaults
  const mergedToggles: FeatureToggles = {
    ...DEFAULT_PRODUCTION_TOGGLES,
    ...toggles
  };
  
  // Start with the production config
  const optimizedConfig: CacheMonitorConfig = {
    ...config,
    ...PRODUCTION_CONFIG,
    // Ensure nested objects are properly merged
    metricsConfig: {
      ...config.metricsConfig,
      ...PRODUCTION_CONFIG.metricsConfig,
      // Apply feature toggles
      detailedTimings: mergedToggles.enableDetailedMetrics,
      useSystemLoadForSampling: mergedToggles.enableSystemLoadSampling
    },
    adaptiveLoggingConfig: {
      ...config.adaptiveLoggingConfig,
      ...PRODUCTION_CONFIG.adaptiveLoggingConfig,
      // Apply feature toggles
      enabled: mergedToggles.enableAdaptiveLogging
    }
  };
  
  return optimizedConfig;
}

/**
 * Detect if the current environment is production
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Automatically reduce overhead based on system capabilities
 */
export function autoReduceOverhead(config: CacheMonitorConfig): CacheMonitorConfig {
  // Start with the current config
  const optimizedConfig = { ...config };
  
  // Check if we're in a memory-constrained environment
  const isMemoryConstrained = typeof window !== 'undefined' &&
    'deviceMemory' in navigator &&
    (navigator as { deviceMemory?: number }).deviceMemory !== undefined &&
    (navigator as { deviceMemory?: number }).deviceMemory! < 4;
  
  // Check if we're on a mobile device
  const isMobileDevice = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Determine device capability level
  let deviceCapabilityLevel = 'STANDARD_DEVICE';
  
  if (isMemoryConstrained || isMobileDevice) {
    deviceCapabilityLevel = 'LOW_END_DEVICE';
  } else if (typeof window !== 'undefined' &&
             'deviceMemory' in navigator &&
             (navigator as { deviceMemory?: number }).deviceMemory !== undefined &&
             (navigator as { deviceMemory?: number }).deviceMemory! >= 8) {
    deviceCapabilityLevel = 'HIGH_END_DEVICE';
  }
  
  // Adjust configuration based on environment
  if (deviceCapabilityLevel === 'LOW_END_DEVICE') {
    // Reduce memory usage for low-end devices
    optimizedConfig.metricsConfig = {
      ...optimizedConfig.metricsConfig,
      maxMetricsHistory: Math.min(optimizedConfig.metricsConfig.maxMetricsHistory, 200),
      sampleRate: Math.min(optimizedConfig.metricsConfig.sampleRate, 0.02),
      collectSizeMetrics: false,
      detailedTimings: false,
      memoryUsageLimit: MEMORY_USAGE_LIMITS.LOW_END_DEVICE,
      autoPruning: {
        ...(optimizedConfig.metricsConfig.autoPruning || {}),
        enabled: true,
        maxAgeMs: 6 * 60 * 60 * 1000, // 6 hours for low-end devices
        checkIntervalMs: 5 * 60 * 1000, // 5 minutes for low-end devices
        targetMemoryUsage: 0.6 // 60% of memory limit for low-end devices
      }
    };
    
    // Reduce log history
    optimizedConfig.maxLogHistory = Math.min(optimizedConfig.maxLogHistory, 100);
    
    // Adjust monitored cache types
    optimizedConfig.monitoredCacheTypes = [
      CacheType.MEMORY,
      CacheType.SUPABASE
    ];
  } else if (deviceCapabilityLevel === 'STANDARD_DEVICE') {
    // Standard device optimizations
    optimizedConfig.metricsConfig = {
      ...optimizedConfig.metricsConfig,
      memoryUsageLimit: MEMORY_USAGE_LIMITS.STANDARD_DEVICE,
      autoPruning: {
        ...(optimizedConfig.metricsConfig.autoPruning || {}),
        enabled: true,
        maxAgeMs: 12 * 60 * 60 * 1000, // 12 hours for standard devices
        checkIntervalMs: 10 * 60 * 1000 // 10 minutes for standard devices
      }
    };
  } else {
    // High-end device optimizations
    optimizedConfig.metricsConfig = {
      ...optimizedConfig.metricsConfig,
      memoryUsageLimit: MEMORY_USAGE_LIMITS.HIGH_END_DEVICE,
      autoPruning: {
        ...(optimizedConfig.metricsConfig.autoPruning || {}),
        enabled: true,
        maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours for high-end devices
        checkIntervalMs: 15 * 60 * 1000 // 15 minutes for high-end devices
      }
    };
  }
  
  return optimizedConfig;
}