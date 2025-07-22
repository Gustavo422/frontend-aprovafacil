import { CacheType } from './cache-manager';
import { MetricsCollectorConfig } from './cache-metrics-collector';
import { CacheLogLevel, cacheLogger } from './cache-logger';
import { AdaptiveLoggingConfig, adaptiveCacheLogger } from './cache-adaptive-logger';
import { SamplingStrategyType } from './cache-sampling-strategies';
import { logger } from './logger';
// Import dynamically to avoid circular dependencies
const productionOptimizations = {
  applyProductionOptimizations: (config: CacheMonitorConfig): Partial<CacheMonitorConfig> => {
    // Return production-optimized configuration
    return {
      ...config,
      metricsConfig: {
        ...config.metricsConfig,
        sampleRate: 0.1, // Reduce sampling in production
        detailedTimings: false
      },
      logLevel: 'warn' as const,
      maxLogHistory: 500
    };
  },
  DEFAULT_PRODUCTION_TOGGLES: {
    enableMetrics: true,
    enableLogging: true,
    enableDashboard: false
  }
};
// Import dynamically to avoid circular dependencies
let cacheLogStorage: unknown = null;

/**
 * Configuration options for the cache monitor
 */
export interface CacheMonitorConfig {
  /**
   * Whether the monitor is enabled
   */
  enabled: boolean;
  
  /**
   * Whether metrics collection is enabled
   */
  metricsEnabled: boolean;
  
  /**
   * Log level for cache monitoring
   */
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /**
   * Whether to enable the monitoring dashboard
   */
  dashboardEnabled: boolean;
  
  /**
   * Whether to persist configuration
   */
  persistConfig: boolean;
  
  /**
   * Cache types to monitor
   */
  monitoredCacheTypes: CacheType[];
  
  /**
   * Metrics collection configuration
   */
  metricsConfig: MetricsCollectorConfig;
  
  /**
   * Adaptive logging configuration
   */
  adaptiveLoggingConfig: AdaptiveLoggingConfig;
  
  /**
   * Maximum number of logs to store
   */
  maxLogHistory: number;
}

/**
 * Default configuration for the cache monitor
 */
export const DEFAULT_CONFIG: CacheMonitorConfig = {
  enabled: true,
  metricsEnabled: true,
  logLevel: 'info',
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
    sampleRate: 0.1, // 10% sampling in production
    maxMetricsHistory: 1000,
    collectSizeMetrics: true,
    detailedTimings: false,
    samplingStrategy: {
      type: SamplingStrategyType.ADAPTIVE,
      baseSampleRate: 0.1,
      minSampleRate: 0.01,
      maxSampleRate: 0.5,
      loadThreshold: 0.7,
      adaptiveWindowMs: 60000,
      operationPriorities: {
        get: 1.0,
        set: 1.5,
        delete: 1.5,
        invalidate: 2.0,
        clear: 3.0
      },
      cacheTypePriorities: {
        [CacheType.MEMORY]: 1.0,
        [CacheType.LOCAL_STORAGE]: 1.2,
        [CacheType.SESSION_STORAGE]: 1.2,
        [CacheType.SUPABASE]: 2.0
      }
    },
    useSystemLoadForSampling: true
  },
  adaptiveLoggingConfig: {
    enabled: true,
    baseLogLevel: CacheLogLevel.INFO,
    warnLogLevel: CacheLogLevel.DEBUG,
    errorLogLevel: CacheLogLevel.DEBUG,
    performanceWindowMs: 60000, // 1 minute
    slowOperationThreshold: 3,
    thresholds: {
      get: {
        warn: 100,  // 100ms
        error: 500  // 500ms
      },
      set: {
        warn: 150,  // 150ms
        error: 750  // 750ms
      },
      delete: {
        warn: 100,  // 100ms
        error: 500  // 500ms
      },
      invalidate: {
        warn: 200,  // 200ms
        error: 1000 // 1s
      },
      clear: {
        warn: 500,  // 500ms
        error: 2000 // 2s
      }
    }
  },
  maxLogHistory: 1000
};

/**
 * Development configuration for the cache monitor
 */
export const DEV_CONFIG: CacheMonitorConfig = {
  ...DEFAULT_CONFIG,
  metricsEnabled: true,
  logLevel: 'debug',
  metricsConfig: {
    enabled: true,
    sampleRate: 1.0, // 100% sampling in development
    maxMetricsHistory: 5000,
    collectSizeMetrics: true,
    detailedTimings: true,
    samplingStrategy: {
      type: SamplingStrategyType.PRIORITY_BASED,
      baseSampleRate: 1.0,
      operationPriorities: {
        get: 1.0,
        set: 1.0,
        delete: 1.0,
        invalidate: 1.0,
        clear: 1.0
      },
      cacheTypePriorities: {
        [CacheType.MEMORY]: 1.0,
        [CacheType.LOCAL_STORAGE]: 1.0,
        [CacheType.SESSION_STORAGE]: 1.0,
        [CacheType.SUPABASE]: 1.0
      }
    },
    useSystemLoadForSampling: false
  },
  adaptiveLoggingConfig: {
    ...DEFAULT_CONFIG.adaptiveLoggingConfig,
    enabled: true,
    baseLogLevel: CacheLogLevel.DEBUG,
    performanceWindowMs: 30000, // 30 seconds in development
    slowOperationThreshold: 2, // More sensitive in development
    thresholds: {
      get: {
        warn: 50,   // 50ms in development
        error: 250  // 250ms in development
      },
      set: {
        warn: 100,  // 100ms in development
        error: 500  // 500ms in development
      },
      delete: {
        warn: 50,   // 50ms in development
        error: 250  // 250ms in development
      },
      invalidate: {
        warn: 100,  // 100ms in development
        error: 500  // 500ms in development
      },
      clear: {
        warn: 250,  // 250ms in development
        error: 1000 // 1s in development
      }
    }
  },
  maxLogHistory: 5000 // More logs in development
};

/**
 * Storage key for cache monitor configuration
 */
const STORAGE_KEY = 'cache-monitor-config';

/**
 * Configuration service for cache monitor
 */
export class CacheMonitorConfigService {
  private static instance: CacheMonitorConfigService;
  private config: CacheMonitorConfig;
  private listeners: Array<(config: CacheMonitorConfig) => void> = [];
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Load configuration based on environment
    this.config = process.env.NODE_ENV === 'production' 
      ? { ...DEFAULT_CONFIG } 
      : { ...DEV_CONFIG };
    
    // Try to load saved configuration
    this.loadConfig();
    
    // Initialize log storage with max logs setting
    setTimeout(async () => {
      // Delay import to avoid circular dependencies
      if (!cacheLogStorage) {
        try {
          const cacheLogModule = await import('./cache-log-filter');
          cacheLogStorage = cacheLogModule.cacheLogStorage;
          if (cacheLogStorage && typeof cacheLogStorage === 'object' && 'setMaxLogs' in cacheLogStorage) {
            (cacheLogStorage as { setMaxLogs: (max: number) => void }).setMaxLogs(this.config.maxLogHistory);
          }
        } catch {
          console.error('Failed to initialize cache log storage');
        }
      }
      
      // Apply production optimizations if in production mode
      if (process.env.NODE_ENV === 'production') {
        this.applyProductionOptimizations();
      }
    }, 0);
  }
  
  /**
   * Apply production-specific optimizations
   */
  private applyProductionOptimizations(): void {
    // Production optimizations disabled for now
    // Dynamic import to avoid circular dependencies would be:
    // productionOptimizations = await import('./cache-monitor-production');
    
    this.notifyListeners();
    cacheLogger.logConfig(CacheLogLevel.INFO, 'Production optimizations skipped (disabled)', {});
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheMonitorConfigService {
    if (!CacheMonitorConfigService.instance) {
      CacheMonitorConfigService.instance = new CacheMonitorConfigService();
    }
    return CacheMonitorConfigService.instance;
  }
  
  /**
   * Get the current configuration
   */
  public getConfig(): CacheMonitorConfig {
    return { ...this.config };
  }
  
  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<CacheMonitorConfig>): void {
    // Update configuration
    this.config = {
      ...this.config,
      ...config,
      // Ensure nested objects are properly merged
      metricsConfig: {
        ...this.config.metricsConfig,
        ...(config.metricsConfig || {})
      }
    };
    
    // Update cache logger log level if it was changed
    if (config.logLevel) {
      const logLevelMap: Record<string, CacheLogLevel> = {
        'error': CacheLogLevel.ERROR,
        'warn': CacheLogLevel.WARN,
        'info': CacheLogLevel.INFO,
        'debug': CacheLogLevel.DEBUG,
        'trace': CacheLogLevel.DEBUG // Map trace to debug since we don't have trace level
      };
      
      cacheLogger.setLogLevel(logLevelMap[config.logLevel]);
    }
    
    // Update adaptive logging configuration if it was changed
    if (config.adaptiveLoggingConfig) {
      adaptiveCacheLogger.configure(config.adaptiveLoggingConfig);
    }
    
    // Update log storage max logs if it was changed
    if (config.maxLogHistory !== undefined && cacheLogStorage && typeof cacheLogStorage === 'object' && 'setMaxLogs' in cacheLogStorage) {
      (cacheLogStorage as { setMaxLogs: (max: number) => void }).setMaxLogs(config.maxLogHistory);
    }
    
    // Save configuration if persistence is enabled
    if (this.config.persistConfig) {
      this.saveConfig();
    }
    
    // Notify listeners
    this.notifyListeners();
    
    cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Cache Monitor configuration updated', {
      changes: Object.keys(config)
    });
  }
  
  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    // Reset to default or development configuration
    this.config = process.env.NODE_ENV === 'production' 
      ? { ...DEFAULT_CONFIG } 
      : { ...DEV_CONFIG };
    
    // Apply production optimizations if in production mode
    if (process.env.NODE_ENV === 'production') {
      this.applyProductionOptimizations();
    }
    
    // Save configuration if persistence is enabled
    if (this.config.persistConfig) {
      this.saveConfig();
    }
    
    // Update cache logger log level
    const logLevelMap: Record<string, CacheLogLevel> = {
      'error': CacheLogLevel.ERROR,
      'warn': CacheLogLevel.WARN,
      'info': CacheLogLevel.INFO,
      'debug': CacheLogLevel.DEBUG,
      'trace': CacheLogLevel.DEBUG // Map trace to debug since we don't have trace level
    };
    
    cacheLogger.setLogLevel(logLevelMap[this.config.logLevel]);
    
    // Notify listeners
    this.notifyListeners();
    
    cacheLogger.logConfig(CacheLogLevel.INFO, 'Cache Monitor configuration reset to defaults', {});
  }
  
  /**
   * Apply production mode optimizations with specific feature toggles
   */
  public applyProductionMode(featureToggles?: Record<string, boolean>): void {
    if (!productionOptimizations) {
      try {
        // productionOptimizations = await import('./cache-monitor-production');
        // Production optimizations disabled for now
        return;
      } catch (error) {
        console.error('Failed to load production optimizations', {
          error: error instanceof Error ? error.message : String(error)
        });
        return;
      }
    }
    
    try {
      // Apply production optimizations
      const optimizedConfig = productionOptimizations.applyProductionOptimizations(
        this.config
      );
      
      // Update configuration
      this.updateConfig(optimizedConfig);
      
      cacheLogger.logConfig(CacheLogLevel.INFO, 'Applied production mode to Cache Monitor', {
        featureToggles: featureToggles ? Object.keys(featureToggles) : 'default'
      });
    } catch (error) {
      logger.error('Failed to apply production mode', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Check if production mode is active
   */
  public isProductionMode(): boolean {
    return process.env.NODE_ENV === 'production';
  }
  
  /**
   * Get available feature toggles for production mode
   */
  public getProductionFeatureToggles(): Record<string, boolean> | null {
    if (!productionOptimizations) {
      try {
        // productionOptimizations = await import('./cache-monitor-production');
        // Production optimizations disabled for now
        return null;
      } catch {
        return null;
      }
    }
    
    return productionOptimizations.DEFAULT_PRODUCTION_TOGGLES || null;
  }
  
  /**
   * Save configuration to localStorage
   */
  public saveConfig(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Cache Monitor configuration saved', {});
        resolve();
      } catch (error) {
        cacheLogger.logError('Failed to save Cache Monitor configuration', 
          cacheLogger.createOperationLogEntry('set', CacheType.MEMORY, {
            error: error instanceof Error ? error : String(error)
          })
        );
        reject(error);
      }
    });
  }
  
  /**
   * Load configuration from localStorage
   */
  public loadConfig(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      
      try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig) as Partial<CacheMonitorConfig>;
          
          // Update configuration with saved values
          this.config = {
            ...this.config,
            ...parsedConfig,
            // Ensure nested objects are properly merged
            metricsConfig: {
              ...this.config.metricsConfig,
              ...(parsedConfig.metricsConfig || {})
            }
          };
          
          cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Cache Monitor configuration loaded from storage', {});
          
          // Notify listeners
          this.notifyListeners();
          
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        cacheLogger.logError('Failed to load Cache Monitor configuration', 
          cacheLogger.createOperationLogEntry('get', CacheType.MEMORY, {
            error: error instanceof Error ? error : String(error)
          })
        );
        resolve(false);
      }
    });
  }
  
  /**
   * Add a configuration change listener
   */
  public addListener(listener: (config: CacheMonitorConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify all listeners of configuration change
   */
  private notifyListeners(): void {
    const config = this.getConfig();
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        cacheLogger.logError('Error in cache monitor config listener', 
          cacheLogger.createOperationLogEntry('get', CacheType.MEMORY, {
            error: error instanceof Error ? error : String(error)
          })
        );
      }
    });
  }
  
  /**
   * Validate configuration
   */
  public validateConfig(config: Partial<CacheMonitorConfig>): string[] {
    const errors: string[] = [];
    
    // Validate metrics config
    if (config.metricsConfig) {
      if (config.metricsConfig.sampleRate !== undefined) {
        if (config.metricsConfig.sampleRate < 0 || config.metricsConfig.sampleRate > 1) {
          errors.push('Sample rate must be between 0 and 1');
        }
      }
      
      if (config.metricsConfig.maxMetricsHistory !== undefined) {
        if (config.metricsConfig.maxMetricsHistory < 10) {
          errors.push('Max metrics history must be at least 10');
        }
      }
    }
    
    return errors;
  }
}

// Export singleton instance
export const cacheMonitorConfig = CacheMonitorConfigService.getInstance();