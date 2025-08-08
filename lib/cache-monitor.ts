import { CacheType } from './cache-manager';
import type { 
  CacheMetric, 
  CacheStatistics,
  CacheOperation,
  CacheOperationResult
} from './cache-metrics-collector';
import { 
  CacheMetricsCollector
} from './cache-metrics-collector';
import { cacheLogger, CacheLogLevel } from './cache-logger';
import { adaptiveCacheLogger } from './cache-adaptive-logger';
import { cacheManagerMonitor } from './cache-manager-monitor';
import type {
  CacheMonitorConfig} from './cache-monitor-config';
import {
  cacheMonitorConfig
} from './cache-monitor-config';
// Import dynamically to avoid circular dependencies
interface ProductionOptimizations {
  isProductionEnvironment(): boolean;
  applyProductionOptimizations(config: CacheMonitorConfig): CacheMonitorConfig;
  autoReduceOverhead(config: CacheMonitorConfig): CacheMonitorConfig;
}

let productionOptimizations: ProductionOptimizations | null = null;
import type {
  CacheEntryMetadata,
  CacheEntryInfo,
  GetKeysOptions,
  GetAllEntriesOptions
} from './cache-inspector';
import {
  CacheInspector
} from './cache-inspector';
import type {
  CacheRelationshipGraph
} from './cache-relationship-graph';
import type {
  GraphVisualizationOptions
} from './cache-graph-visualizer';
import {
  CacheGraphVisualizer
} from './cache-graph-visualizer';
import type {
  CacheSizeInfo,
  CacheStatusCounts,
  CacheTypeStatistics,
  ExpirationStatistics,
  CompleteStatistics,
  StatisticsOptions
} from './cache-statistics';

/**
 * Cache Monitor - Provides monitoring and management capabilities for the cache system
 */
export class CacheMonitor {
  private static instance: CacheMonitor;
  private config: CacheMonitorConfig;
  private initialized = false;
  private metricsCollector: CacheMetricsCollector | null = null;
  private cacheInspector: CacheInspector | null = null;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Get configuration from the config service
    this.config = cacheMonitorConfig.getConfig();
    
    // Set up config change listener
    cacheMonitorConfig.addListener((newConfig) => {
      this.handleConfigUpdate(newConfig);
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }
  
  /**
   * Initialize the cache monitor
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      cacheLogger.logMonitor(CacheLogLevel.INFO, 'Initializing Cache Monitor', {
        enabled: this.config.enabled,
        metricsEnabled: this.config.metricsEnabled,
        environment: process.env.NODE_ENV
      });
      
      // Apply production optimizations if in production mode
      if (process.env.NODE_ENV === 'production') {
        await this.applyProductionOptimizations();
      }
      
      // Initialize components
      this.metricsCollector = new CacheMetricsCollector(this.config.metricsConfig);
      this.cacheInspector = new CacheInspector();
      
      // Initialize cache manager monitoring hooks
      if (this.config.enabled) {
        cacheManagerMonitor.initialize();
        cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache Manager monitoring hooks initialized', {});
      }
      
      // Start metrics collection if enabled
      if (this.config.enabled && this.config.metricsEnabled && this.metricsCollector) {
        this.metricsCollector.start();
        cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics collection started', {});
      }
      
      this.initialized = true;
      cacheLogger.logMonitor(CacheLogLevel.INFO, 'Cache Monitor initialized successfully', {});
    } catch (error) {
      cacheLogger.logError('Failed to initialize Cache Monitor', 
        cacheLogger.createOperationLogEntry('set', CacheType.MEMORY, {
          error: error instanceof Error ? error : String(error)
        })
      );
      
      // Set to partially initialized state
      this.initialized = false;
    }
  }
  
  /**
   * Apply production optimizations
   */
  private async applyProductionOptimizations(): Promise<void> {
    // Dynamically import production optimizations
    if (!productionOptimizations) {
      try {
        productionOptimizations = await import('./cache-monitor-production') as ProductionOptimizations;
      } catch (error) {
        cacheLogger.logError('Failed to load production optimizations', 
          cacheLogger.createOperationLogEntry('set', CacheType.MEMORY, {
            error: error instanceof Error ? error : String(error)
          })
        );
        return;
      }
    }
    
    try {
      // Check if we're in production
      if (productionOptimizations.isProductionEnvironment()) {
        // Apply production optimizations
        const optimizedConfig = productionOptimizations.applyProductionOptimizations(this.config);
        
        // Apply automatic overhead reduction
        const finalConfig = productionOptimizations.autoReduceOverhead(optimizedConfig);
        
        // Update configuration
        this.updateConfig(finalConfig);
        
        cacheLogger.logMonitor(CacheLogLevel.INFO, 'Applied production optimizations', {});
      }
    } catch (error) {
      cacheLogger.logError('Failed to apply production optimizations', 
        cacheLogger.createOperationLogEntry('set', CacheType.MEMORY, {
          error: error instanceof Error ? error : String(error)
        })
      );
    }
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
    // Use the config service to update
    cacheMonitorConfig.updateConfig(config);
  }
  
  /**
   * Handle configuration update from the config service
   */
  private handleConfigUpdate(newConfig: CacheMonitorConfig): void {
    const oldConfig = { ...this.config };
    this.config = { ...newConfig };
    
    // Handle configuration changes
    this.handleConfigChanges(oldConfig, this.config);
    
    cacheLogger.logConfig(CacheLogLevel.DEBUG, 'Cache Monitor configuration updated', {
      source: 'config_service'
    });
  }
  
  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    // Use the config service to reset
    cacheMonitorConfig.resetConfig();
  }
  
  /**
   * Handle configuration changes
   */
  private handleConfigChanges(oldConfig: CacheMonitorConfig, newConfig: CacheMonitorConfig): void {
    // Handle enabling/disabling the monitor
    if (oldConfig.enabled !== newConfig.enabled) {
      if (newConfig.enabled) {
        // Initialize cache manager monitoring hooks if not already initialized
        if (!cacheManagerMonitor.isInitialized()) {
          cacheManagerMonitor.initialize();
          cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache Manager monitoring hooks initialized', {});
        }
      } else {
        // Restore original cache manager methods if monitoring hooks are initialized
        if (cacheManagerMonitor.isInitialized()) {
          cacheManagerMonitor.restoreOriginalMethods();
          cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache Manager monitoring hooks disabled', {});
        }
      }
    }
    
    // Handle metrics collection changes
    if (this.metricsCollector) {
      // Enable/disable metrics collection
      if (oldConfig.metricsEnabled !== newConfig.metricsEnabled) {
        if (newConfig.enabled && newConfig.metricsEnabled) {
          this.metricsCollector.start();
          cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics collection started', {});
        } else {
          this.metricsCollector.stop();
          cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics collection stopped', {});
        }
      }
      
      // Update metrics collector configuration
      if (JSON.stringify(oldConfig.metricsConfig) !== JSON.stringify(newConfig.metricsConfig)) {
        this.metricsCollector.configure(newConfig.metricsConfig);
        cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache metrics collector configuration updated', {});
      }
    }
    
    // Handle adaptive logging configuration changes
    if (JSON.stringify(oldConfig.adaptiveLoggingConfig) !== JSON.stringify(newConfig.adaptiveLoggingConfig)) {
      adaptiveCacheLogger.configure(newConfig.adaptiveLoggingConfig);
      cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Adaptive logging configuration updated', {});
    }
    
    // Handle log level changes
    if (oldConfig.logLevel !== newConfig.logLevel) {
      cacheLogger.logMonitor(CacheLogLevel.DEBUG, 'Cache Monitor log level changed', {
        from: oldConfig.logLevel,
        to: newConfig.logLevel
      });
    }
  }
  
  // Configuration loading and saving is now handled by the CacheMonitorConfigService
  
  /**
   * Check if the monitor is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Check if the monitor is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Enable the monitor
   */
  public enable(): void {
    if (!this.config.enabled) {
      this.updateConfig({ enabled: true });
    }
  }
  
  /**
   * Disable the monitor
   */
  public disable(): void {
    if (this.config.enabled) {
      this.updateConfig({ enabled: false });
    }
  }
  
  /**
   * Apply production mode with specific feature toggles
   */
  public applyProductionMode(featureToggles?: Record<string, boolean>): void {
    cacheMonitorConfig.applyProductionMode(featureToggles);
  }
  
  /**
   * Check if production mode is active
   */
  public isProductionMode(): boolean {
    return cacheMonitorConfig.isProductionMode();
  }
  
  /**
   * Get available feature toggles for production mode
   */
  public getProductionFeatureToggles(): Record<string, boolean> | null {
    return cacheMonitorConfig.getProductionFeatureToggles();
  }
  
  /**
   * Get the metrics collector
   */
  public getMetricsCollector(): CacheMetricsCollector | null {
    return this.metricsCollector;
  }
  
  /**
   * Record the start of a cache operation
   */
  public recordOperationStart(
    operation: CacheOperation,
    cacheType: CacheType,
    key?: string
  ): string {
    if (!this.initialized || !this.config.enabled || !this.metricsCollector) {
      return '';
    }
    
    // Check if this cache type should be monitored
    if (!this.config.monitoredCacheTypes.includes(cacheType)) {
      return '';
    }
    
    return this.metricsCollector.recordOperationStart(operation, cacheType, key);
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
    if (!this.initialized || !this.config.enabled || !this.metricsCollector || !operationId) {
      return;
    }
    
    this.metricsCollector.recordOperationEnd(operationId, result, options);
  }
  
  /**
   * Record a complete cache operation
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
    if (!this.initialized || !this.config.enabled || !this.metricsCollector) {
      return;
    }
    
    // Check if this cache type should be monitored
    if (!this.config.monitoredCacheTypes.includes(cacheType)) {
      return;
    }
    
    this.metricsCollector.recordOperation(operation, cacheType, result, duration, options);
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
    if (!this.initialized || !this.metricsCollector) {
      return [];
    }
    
    return this.metricsCollector.getMetrics(options);
  }
  
  /**
   * Get cache statistics
   */
  public getStatistics(options: {
    cacheType?: CacheType;
    timeRange?: [Date, Date];
  } = {}): CacheStatistics | null {
    if (!this.initialized || !this.metricsCollector) {
      return null;
    }
    
    return this.metricsCollector.getStatistics(options);
  }
  
  /**
   * Clear collected metrics
   */
  public clearMetrics(): void {
    if (!this.initialized || !this.metricsCollector) {
      return;
    }
    
    this.metricsCollector.clearMetrics();
  }
  
  /**
   * Get the cache inspector
   */
  public getCacheInspector(): CacheInspector | null {
    return this.cacheInspector;
  }
  
  /**
   * Get all cache keys
   */
  public async getCacheKeys(options: GetKeysOptions = {}): Promise<string[]> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return [];
    }
    
    return this.cacheInspector.getKeys(options);
  }
  
  /**
   * Get cache entry metadata
   */
  public async getCacheEntryMetadata(
    key: string,
    cacheType: CacheType,
    usuarioId?: string
  ): Promise<CacheEntryMetadata | null> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return null;
    }
    
    return this.cacheInspector.getEntryMetadata(key, cacheType, usuarioId);
  }
  
  /**
   * Get cache entry data
   */
  public async getCacheEntryData<T>(
    key: string,
    cacheType: CacheType,
    usuarioId?: string
  ): Promise<T | null> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return null;
    }
    
    return this.cacheInspector.getEntryData<T>(key, cacheType, usuarioId);
  }
  
  /**
   * Get all cache entries with metadata
   */
  public async getAllCacheEntries(options: GetAllEntriesOptions = {}): Promise<CacheEntryInfo[]> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return [];
    }
    
    return this.cacheInspector.getAllEntries(options);
  }
  
  /**
   * Get related keys for a specific key
   */
  public async getRelatedCacheKeys(key: string): Promise<string[]> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return [];
    }
    
    return this.cacheInspector.getRelatedKeys(key);
  }
  
  /**
   * Get all related keys recursively for a specific key
   */
  public async getAllRelatedCacheKeysRecursive(
    key: string,
    maxDepth = 3
  ): Promise<string[]> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return [];
    }
    
    const relatedKeys = await this.cacheInspector.getAllRelatedKeysRecursive(key, maxDepth);
    return Array.from(relatedKeys);
  }
  
  /**
   * Build a relationship graph for visualization
   */
  public async buildCacheRelationshipGraph(options: {
    rootKey: string;
    maxDepth?: number;
    maxNodes?: number;
    includeExpired?: boolean;
    includeMetadata?: boolean;
  }): Promise<CacheRelationshipGraph> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return { nodes: [], edges: [] };
    }
    
    return this.cacheInspector.buildRelationshipGraph(options);
  }
  
  /**
   * Generate a Mermaid diagram for the cache relationship graph
   */
  public async generateCacheRelationshipMermaidDiagram(
    options: {
      rootKey: string;
      maxDepth?: number;
      maxNodes?: number;
      includeExpired?: boolean;
    } & GraphVisualizationOptions
  ): Promise<string> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return 'graph TD\n  A[No cache data available]';
    }
    
    const { rootKey, maxDepth, maxNodes, includeExpired, ...visualizationOptions } = options;
    
    // Build the graph
    const graph = await this.buildCacheRelationshipGraph({
      rootKey,
      maxDepth,
      maxNodes,
      includeExpired,
      includeMetadata: true
    });
    
    // Generate Mermaid diagram
    return CacheGraphVisualizer.generateMermaidDiagram(graph, visualizationOptions);
  }
  
  /**
   * Generate a D3 compatible JSON for the cache relationship graph
   */
  public async generateCacheRelationshipD3Json(
    options: {
      rootKey: string;
      maxDepth?: number;
      maxNodes?: number;
      includeExpired?: boolean;
    } & GraphVisualizationOptions
  ): Promise<unknown> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return { nodes: [], links: [] };
    }
    
    const { rootKey, maxDepth, maxNodes, includeExpired, ...visualizationOptions } = options;
    
    // Build the graph
    const graph = await this.buildCacheRelationshipGraph({
      rootKey,
      maxDepth,
      maxNodes,
      includeExpired,
      includeMetadata: true
    });
    
    // Generate D3 JSON
    return CacheGraphVisualizer.generateD3Json(graph, visualizationOptions);
  }
  
  /**
   * Generate a DOT graph for Graphviz
   */
  public async generateCacheRelationshipDotGraph(
    options: {
      rootKey: string;
      maxDepth?: number;
      maxNodes?: number;
      includeExpired?: boolean;
    } & GraphVisualizationOptions
  ): Promise<string> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return 'digraph CacheRelationships {\n  A [label="No cache data available"];\n}';
    }
    
    const { rootKey, maxDepth, maxNodes, includeExpired, ...visualizationOptions } = options;
    
    // Build the graph
    const graph = await this.buildCacheRelationshipGraph({
      rootKey,
      maxDepth,
      maxNodes,
      includeExpired,
      includeMetadata: true
    });
    
    // Generate DOT graph
    return CacheGraphVisualizer.generateDotGraph(graph, visualizationOptions);
  }
  
  /**
   * Calculate cache size information for a specific cache type
   */
  public async calculateCacheSize(
    cacheType: CacheType,
    options: {
      includeExpired?: boolean;
      pattern?: string;
      usuarioId?: string;
    } = {}
  ): Promise<CacheSizeInfo> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return { entryCount: 0 };
    }
    
    return this.cacheInspector.calculateCacheSize(cacheType, options);
  }
  
  /**
   * Count entries by status (active/expired) for a specific cache type
   */
  public async countCacheEntriesByStatus(
    cacheType: CacheType,
    options: {
      pattern?: string;
      usuarioId?: string;
    } = {}
  ): Promise<CacheStatusCounts> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return { active: 0, expired: 0, total: 0 };
    }
    
    return this.cacheInspector.countEntriesByStatus(cacheType, options);
  }
  
  /**
   * Calculate expiration statistics for cache entries
   */
  public async calculateCacheExpirationStatistics(
    options: {
      cacheType?: CacheType;
      pattern?: string;
      usuarioId?: string;
    } = {}
  ): Promise<ExpirationStatistics> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return {
        expiringInNextMinute: 0,
        expiringInNextHour: 0,
        expiringInNextDay: 0,
        expiringInNextWeek: 0,
        expiringLater: 0,
        expired: 0
      };
    }
    
    return this.cacheInspector.calculateExpirationStatistics(options);
  }
  
  /**
   * Calculate statistics for a specific cache type
   */
  public async calculateCacheTypeStatistics(
    cacheType: CacheType,
    options: {
      includeExpired?: boolean;
      pattern?: string;
      usuarioId?: string;
      maxLargestEntries?: number;
    } = {}
  ): Promise<CacheTypeStatistics> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return {
        cacheType,
        counts: { active: 0, expired: 0, total: 0 }
      };
    }
    
    return this.cacheInspector.calculateTypeStatistics(cacheType, options);
  }
  
  /**
   * Calculate complete statistics for all cache types
   */
  public async calculateCompleteStatistics(
    options: StatisticsOptions = {}
  ): Promise<CompleteStatistics> {
    if (!this.initialized || !this.config.enabled || !this.cacheInspector) {
      return {
        totalEntries: 0,
        byType: {} as Record<CacheType, CacheTypeStatistics>,
        expiration: {
          expiringInNextMinute: 0,
          expiringInNextHour: 0,
          expiringInNextDay: 0,
          expiringInNextWeek: 0,
          expiringLater: 0,
          expired: 0
        },
        timestamp: new Date()
      };
    }
    
    return this.cacheInspector.calculateCompleteStatistics(options);
  }

  /**
   * Analyze and log problematic cache operations
   * This method will analyze recent cache operations and log detailed information
   * about any problematic operations that were detected.
   */
  public analyzeAndLogProblematicOperations(): void {
    if (!this.initialized || !this.config.enabled) {
      return;
    }
    
    // Use the adaptive logger to log problematic operations
    adaptiveCacheLogger.logProblematicOperations();
  }
  
  /**
   * Get performance statistics from the adaptive logger
   */
  public getPerformanceStatistics(): unknown {
    if (!this.initialized || !this.config.enabled) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
        verySlowOperations: 0,
        byOperation: {}
      };
    }
    
    return adaptiveCacheLogger.getPerformanceStatistics();
  }

  /**
   * Get filtered cache logs
   */
  public async getFilteredLogs(options: Record<string, unknown> = {}): Promise<unknown[]> {
    if (!this.initialized || !this.config.enabled) {
      return [];
    }
    
    // Import dynamically to avoid circular dependencies
    const { cacheLogStorage } = await import('./cache-log-filter');
    return cacheLogStorage.getFilteredLogs(options);
  }
  
  /**
   * Find related logs by correlation ID
   */
  public async findRelatedLogs(correlationId: string): Promise<unknown[]> {
    if (!this.initialized || !this.config.enabled) {
      return [];
    }
    
    // Import dynamically to avoid circular dependencies
    const { cacheLogStorage } = await import('./cache-log-filter');
    return cacheLogStorage.findRelatedLogs(correlationId);
  }
  
  /**
   * Find logs for a specific cache key
   */
  public async findLogsByKey(key: string): Promise<unknown[]> {
    if (!this.initialized || !this.config.enabled) {
      return [];
    }
    
    // Import dynamically to avoid circular dependencies
    const { cacheLogStorage } = await import('./cache-log-filter');
    return cacheLogStorage.findLogsByKey(key);
  }
  
  /**
   * Group logs by correlation ID
   */
  public async groupLogsByCorrelationId(): Promise<Record<string, unknown[]>> {
    if (!this.initialized || !this.config.enabled) {
      return {};
    }
    
    // Import dynamically to avoid circular dependencies
    const { cacheLogStorage } = await import('./cache-log-filter');
    return cacheLogStorage.groupLogsByCorrelationId();
  }
  
  /**
   * Clear all logs
   */
  public async clearLogs(): Promise<void> {
    if (!this.initialized || !this.config.enabled) {
      return;
    }
    
    // Import dynamically to avoid circular dependencies
    const { cacheLogStorage } = await import('./cache-log-filter');
    cacheLogStorage.clearLogs();
    
    cacheLogger.logMonitor(CacheLogLevel.INFO, 'Cache logs cleared', {});
  }
}

// Export singleton instance
export const cacheMonitor = CacheMonitor.getInstance();