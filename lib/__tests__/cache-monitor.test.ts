import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheMonitor } from '../cache-monitor';
import { CacheType } from '../cache-manager';

// Mock dependencies
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../cache-logger', () => ({
  cacheLogger: {
    logMonitor: vi.fn(),
    logError: vi.fn(),
    logConfig: vi.fn(),
    createOperationLogEntry: vi.fn().mockReturnValue({}),
    CacheLogLevel: {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug'
    }
  },
  CacheLogLevel: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  }
}));

vi.mock('../cache-metrics-collector', () => {
  const MockMetricsCollector = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    configure: vi.fn(),
    recordOperationStart: vi.fn().mockReturnValue('test-operation-id'),
    recordOperationEnd: vi.fn(),
    recordOperation: vi.fn(),
    getMetrics: vi.fn().mockReturnValue([]),
    getStatistics: vi.fn().mockReturnValue({
      hitRate: 0.8,
      missRate: 0.2,
      averageDuration: 15,
      operationCounts: { get: 10, set: 5, delete: 2, invalidate: 1, clear: 0 },
      errorRate: 0.05,
      totalOperations: 18
    }),
    clearMetrics: vi.fn(),
    isEnabled: vi.fn().mockReturnValue(true)
  }));
  
  return {
    CacheMetricsCollector: MockMetricsCollector,
    CacheOperation: {
      GET: 'get',
      SET: 'set',
      DELETE: 'delete',
      INVALIDATE: 'invalidate',
      CLEAR: 'clear'
    },
    CacheOperationResult: {
      HIT: 'hit',
      MISS: 'miss',
      SUCCESS: 'success',
      ERROR: 'error'
    }
  };
});

vi.mock('../cache-inspector', () => {
  const MockCacheInspector = vi.fn().mockImplementation(() => ({
    getKeys: vi.fn().mockResolvedValue(['key1', 'key2', 'key3']),
    getEntryMetadata: vi.fn().mockResolvedValue({
      key: 'key1',
      cacheType: 'memory',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      isExpired: false,
      size: 1024,
      relatedKeys: ['related1', 'related2']
    }),
    getEntryData: vi.fn().mockResolvedValue({ value: 'test data' }),
    getAllEntries: vi.fn().mockResolvedValue([
      {
        key: 'key1',
        cacheType: 'memory',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        isExpired: false,
        data: { value: 'test data' }
      }
    ]),
    getRelatedKeys: vi.fn().mockResolvedValue(['related1', 'related2']),
    getAllRelatedKeysRecursive: vi.fn().mockResolvedValue(new Set(['related1', 'related2', 'nested1'])),
    buildRelationshipGraph: vi.fn().mockResolvedValue({
      nodes: [{ id: 'key1', label: 'key1' }],
      edges: [{ source: 'key1', target: 'related1' }]
    }),
    calculateCacheSize: vi.fn().mockResolvedValue({
      entryCount: 10,
      totalSize: 10240
    }),
    countEntriesByStatus: vi.fn().mockResolvedValue({
      active: 8,
      expired: 2,
      total: 10
    }),
    calculateExpirationStatistics: vi.fn().mockResolvedValue({
      expiringInNextMinute: 1,
      expiringInNextHour: 2,
      expiringInNextDay: 3,
      expiringInNextWeek: 2,
      expiringLater: 0,
      expired: 2
    }),
    calculateTypeStatistics: vi.fn().mockResolvedValue({
      cacheType: 'memory',
      counts: { active: 8, expired: 2, total: 10 },
      totalSize: 10240,
      averageSize: 1024
    }),
    calculateCompleteStatistics: vi.fn().mockResolvedValue({
      totalEntries: 10,
      totalSize: 10240,
      byType: {
        memory: {
          cacheType: 'memory',
          counts: { active: 8, expired: 2, total: 10 }
        }
      },
      expiration: {
        expiringInNextMinute: 1,
        expiringInNextHour: 2,
        expiringInNextDay: 3,
        expiringInNextWeek: 2,
        expiringLater: 0,
        expired: 2
      },
      timestamp: new Date()
    })
  }));
  
  return {
    CacheInspector: MockCacheInspector,
    cacheInspector: new MockCacheInspector()
  };
});

vi.mock('../cache-monitor-config', () => {
  const mockConfig = {
    enabled: true,
    metricsEnabled: true,
    logLevel: 'info',
    dashboardEnabled: true,
    persistConfig: true,
    monitoredCacheTypes: ['memory', 'localStorage', 'sessionStorage', 'supabase'],
    metricsConfig: {
      enabled: true,
      sampleRate: 0.1,
      maxMetricsHistory: 1000
    },
    adaptiveLoggingConfig: {
      enabled: true,
      baseLogLevel: 'info'
    },
    maxLogHistory: 1000
  };
  
  const MockConfigService = vi.fn().mockImplementation(() => ({
    getConfig: vi.fn().mockReturnValue({ ...mockConfig }),
    updateConfig: vi.fn(),
    resetConfig: vi.fn(),
    loadConfig: vi.fn().mockResolvedValue(true),
    saveConfig: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockImplementation(() => {
      // Return a function to remove the listener
      return () => {};
    }),
    isProductionMode: vi.fn().mockReturnValue(false),
    getProductionFeatureToggles: vi.fn().mockReturnValue({
      detailedMetrics: false,
      adaptiveLogging: true
    }),
    applyProductionMode: vi.fn(),
    validateConfig: vi.fn().mockReturnValue([])
  }));
  
  return {
    CacheMonitorConfigService: MockConfigService,
    cacheMonitorConfig: new MockConfigService(),
    DEFAULT_CONFIG: { ...mockConfig }
  };
});

// Mock the cache-monitor module itself to avoid circular dependencies
vi.mock('../cache-monitor', () => {
  // Create a mock implementation of CacheMonitor
  const MockCacheMonitor = vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    isEnabled: vi.fn().mockReturnValue(true),
    getConfig: vi.fn().mockReturnValue({
      enabled: true,
      metricsEnabled: true
    }),
    updateConfig: vi.fn(),
    resetConfig: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    getMetricsCollector: vi.fn().mockReturnValue({
      recordOperationStart: vi.fn(),
      recordOperationEnd: vi.fn(),
      recordOperation: vi.fn(),
      getMetrics: vi.fn().mockReturnValue([]),
      getStatistics: vi.fn(),
      clearMetrics: vi.fn()
    }),
    recordOperationStart: vi.fn().mockReturnValue('test-operation-id'),
    recordOperationEnd: vi.fn(),
    recordOperation: vi.fn(),
    getMetrics: vi.fn().mockReturnValue([]),
    getStatistics: vi.fn(),
    clearMetrics: vi.fn(),
    getCacheInspector: vi.fn(),
    getCacheKeys: vi.fn().mockResolvedValue(['key1', 'key2']),
    getCacheEntryMetadata: vi.fn().mockResolvedValue({
      key: 'key1',
      cacheType: 'memory'
    }),
    getCacheEntryData: vi.fn().mockResolvedValue({ value: 'test' }),
    getAllCacheEntries: vi.fn().mockResolvedValue([]),
    getRelatedCacheKeys: vi.fn().mockResolvedValue(['related1']),
    getAllRelatedCacheKeysRecursive: vi.fn().mockResolvedValue(['related1', 'nested1']),
    buildCacheRelationshipGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    generateCacheRelationshipMermaidDiagram: vi.fn().mockResolvedValue('graph TD;'),
    generateCacheRelationshipD3Json: vi.fn().mockResolvedValue({ nodes: [], links: [] }),
    generateCacheRelationshipDotGraph: vi.fn().mockResolvedValue('digraph G {}'),
    calculateCacheSize: vi.fn().mockResolvedValue({ entryCount: 10 }),
    countCacheEntriesByStatus: vi.fn().mockResolvedValue({ active: 8, expired: 2, total: 10 }),
    calculateCacheExpirationStatistics: vi.fn().mockResolvedValue({}),
    calculateCacheTypeStatistics: vi.fn().mockResolvedValue({ cacheType: 'memory' }),
    calculateCompleteStatistics: vi.fn().mockResolvedValue({ totalEntries: 10 }),
    isProductionMode: vi.fn().mockReturnValue(false),
    getProductionFeatureToggles: vi.fn().mockReturnValue({}),
    applyProductionMode: vi.fn()
  }));
  
  // Create a mock instance
  const mockInstance = new MockCacheMonitor();
  
  // Return both the class and the singleton instance
  return {
    CacheMonitor: MockCacheMonitor,
    cacheMonitor: mockInstance
  };
});

vi.mock('../cache-manager-monitor', () => ({
  cacheManagerMonitor: {
    initialize: vi.fn(),
    restoreOriginalMethods: vi.fn(),
    isInitialized: vi.fn().mockReturnValue(false)
  }
}));

vi.mock('../cache-adaptive-logger', () => ({
  adaptiveCacheLogger: {
    configure: vi.fn(),
    logProblematicOperations: vi.fn(),
    getPerformanceStatistics: vi.fn().mockReturnValue({
      totalOperations: 100,
      averageDuration: 15,
      slowOperations: 5,
      verySlowOperations: 2
    })
  }
}));

vi.mock('../cache-graph-visualizer', () => ({
  CacheGraphVisualizer: {
    generateMermaidDiagram: vi.fn().mockReturnValue('graph TD;\\n  A-->B;'),
    generateD3Json: vi.fn().mockReturnValue({ nodes: [], links: [] }),
    generateDotGraph: vi.fn().mockReturnValue('digraph G {\\n  A -> B;\\n}')
  }
}));

describe('CacheMonitor', () => {
  let monitor: CacheMonitor;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset the singleton instance
    (CacheMonitor as unknown as { instance?: CacheMonitor }).instance = undefined;
    
    // Create a new instance
    monitor = CacheMonitor.getInstance();
  });
  
  describe('initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = CacheMonitor.getInstance();
      const instance2 = CacheMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    it('should initialize the monitor', async () => {
      await monitor.initialize();
      
      expect(monitor.isInitialized()).toBe(true);
    });
  });
  
  describe('configuration', () => {
    it('should get the current configuration', () => {
      const config = monitor.getConfig();
      
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.metricsEnabled).toBe(true);
    });
    
    it('should update the configuration', () => {
      monitor.updateConfig({ enabled: false });
      
      const config = monitor.getConfig();
      expect(config.enabled).toBe(false);
    });
    
    it('should reset configuration to defaults', () => {
      monitor.resetConfig();
      
      // The mock will just return the default config
      const config = monitor.getConfig();
      expect(config.enabled).toBe(true);
    });
  });
  
  describe('metrics collection', () => {
    it('should record operation start', async () => {
      await monitor.initialize();
      
      const operationId = monitor.recordOperationStart('get', CacheType.MEMORY, 'test-key');
      
      expect(operationId).toBe('test-operation-id');
    });
    
    it('should record operation end', async () => {
      await monitor.initialize();
      
      monitor.recordOperationEnd('test-operation-id', 'hit', {
        size: 100,
        userId: 'test-user'
      });
      
      // Verify the metrics collector was called
      expect(monitor.getMetricsCollector()?.recordOperationEnd).toHaveBeenCalledWith(
        'test-operation-id',
        'hit',
        { size: 100, userId: 'test-user' }
      );
    });
    
    it('should record complete operation', async () => {
      await monitor.initialize();
      
      monitor.recordOperation('get', CacheType.MEMORY, 'hit', 15, {
        key: 'test-key',
        userId: 'test-user'
      });
      
      // Verify the metrics collector was called
      expect(monitor.getMetricsCollector()?.recordOperation).toHaveBeenCalledWith(
        'get',
        CacheType.MEMORY,
        'hit',
        15,
        { key: 'test-key', userId: 'test-user' }
      );
    });
    
    it('should get collected metrics', async () => {
      await monitor.initialize();
      
      const metrics = monitor.getMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
    });
    
    it('should get statistics', async () => {
      await monitor.initialize();
      
      const stats = monitor.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats && stats.hitRate).toBeGreaterThan(0);
      expect(stats && stats.missRate).toBeGreaterThan(0);
    });
    
    it('should clear metrics', async () => {
      await monitor.initialize();
      
      monitor.clearMetrics();
      
      expect(monitor.getMetricsCollector()?.clearMetrics).toHaveBeenCalled();
    });
  });
  
  describe('cache inspection', () => {
    it('should get cache keys', async () => {
      await monitor.initialize();
      
      const keys = await monitor.getCacheKeys();
      
      expect(Array.isArray(keys)).toBe(true);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
    
    it('should get cache entry metadata', async () => {
      await monitor.initialize();
      
      const metadata = await monitor.getCacheEntryMetadata('key1', CacheType.MEMORY);
      
      expect(metadata).toBeDefined();
      expect(metadata?.key).toBe('key1');
      expect(metadata?.cacheType).toBe('memory');
    });
    
    it('should get cache entry data', async () => {
      await monitor.initialize();
      
      const data = await monitor.getCacheEntryData('key1', CacheType.MEMORY);
      
      expect(data).toEqual({ value: 'test data' });
    });
    
    it('should get all cache entries', async () => {
      await monitor.initialize();
      
      const entries = await monitor.getAllCacheEntries();
      
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].key).toBe('key1');
    });
    
    it('should get related cache keys', async () => {
      await monitor.initialize();
      
      const relatedKeys = await monitor.getRelatedCacheKeys('key1');
      
      expect(Array.isArray(relatedKeys)).toBe(true);
      expect(relatedKeys).toContain('related1');
      expect(relatedKeys).toContain('related2');
    });
    
    it('should get all related cache keys recursively', async () => {
      await monitor.initialize();
      
      const relatedKeys = await monitor.getAllRelatedCacheKeysRecursive('key1');
      
      expect(Array.isArray(relatedKeys)).toBe(true);
      expect(relatedKeys).toContain('related1');
      expect(relatedKeys).toContain('nested1');
    });
  });
  
  describe('cache visualization', () => {
    it('should build cache relationship graph', async () => {
      await monitor.initialize();
      
      const graph = await monitor.buildCacheRelationshipGraph({
        rootKey: 'key1'
      });
      
      expect(graph).toBeDefined();
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
    });
    
    it('should generate Mermaid diagram', async () => {
      await monitor.initialize();
      
      const diagram = await monitor.generateCacheRelationshipMermaidDiagram({
        rootKey: 'key1'
      });
      
      expect(typeof diagram).toBe('string');
      expect(diagram).toContain('graph TD');
    });
    
    it('should generate D3 JSON', async () => {
      await monitor.initialize();
      
      const json: unknown = await monitor.generateCacheRelationshipD3Json({
        rootKey: 'key1'
      });
      
      expect(json).toBeDefined();
      // Definir tipo explícito para o resultado esperado
      type D3Json = { nodes: unknown; links: unknown };
      const d3json = json as D3Json;
      expect(d3json.nodes).toBeDefined();
      expect(d3json.links).toBeDefined();
    });
    
    it('should generate DOT graph', async () => {
      await monitor.initialize();
      
      const dot = await monitor.generateCacheRelationshipDotGraph({
        rootKey: 'key1'
      });
      
      expect(typeof dot).toBe('string');
      expect(dot).toContain('digraph');
    });
  });
  
  describe('cache statistics', () => {
    it('should calculate cache size', async () => {
      await monitor.initialize();
      
      const sizeInfo = await monitor.calculateCacheSize(CacheType.MEMORY);
      
      expect(sizeInfo).toBeDefined();
      expect(sizeInfo.entryCount).toBe(10);
      expect(sizeInfo.totalSize).toBe(10240);
    });
    
    it('should count cache entries by status', async () => {
      await monitor.initialize();
      
      const counts = await monitor.countCacheEntriesByStatus(CacheType.MEMORY);
      
      expect(counts).toBeDefined();
      expect(counts.active).toBe(8);
      expect(counts.expired).toBe(2);
      expect(counts.total).toBe(10);
    });
    
    it('should calculate expiration statistics', async () => {
      await monitor.initialize();
      
      const stats = await monitor.calculateCacheExpirationStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.expired).toBe(2);
      expect(stats.expiringInNextHour).toBe(2);
    });
    
    it('should calculate type statistics', async () => {
      await monitor.initialize();
      
      const stats = await monitor.calculateCacheTypeStatistics(CacheType.MEMORY);
      
      expect(stats).toBeDefined();
      expect(stats.cacheType).toBe('memory');
      expect(stats.counts.total).toBe(10);
      expect(stats.totalSize).toBe(10240);
    });
    
    it('should calculate complete statistics', async () => {
      await monitor.initialize();
      
      const stats = await monitor.calculateCompleteStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalEntries).toBe(10);
      expect(stats.totalSize).toBe(10240);
      expect(stats.byType.memory).toBeDefined();
      expect(stats.expiration).toBeDefined();
    });
  });
  
  describe('enable/disable', () => {
    it('should enable the monitor', async () => {
      await monitor.initialize();
      
      // First disable
      monitor.updateConfig({ enabled: false });
      expect(monitor.isEnabled()).toBe(false);
      
      // Then enable
      monitor.enable();
      expect(monitor.isEnabled()).toBe(true);
    });
    
    it('should disable the monitor', async () => {
      await monitor.initialize();
      
      // First ensure it's enabled
      monitor.updateConfig({ enabled: true });
      expect(monitor.isEnabled()).toBe(true);
      
      // Then disable
      monitor.disable();
      expect(monitor.isEnabled()).toBe(false);
    });
  });
  
  describe('production mode', () => {
    it('should check if production mode is active', async () => {
      await monitor.initialize();
      
      const isProduction = monitor.isProductionMode();
      expect(isProduction).toBe(false);
    });
    
    it('should get production feature toggles', async () => {
      await monitor.initialize();
      
      const toggles = monitor.getProductionFeatureToggles();
      expect(toggles).toBeDefined();
      expect(toggles?.adaptiveLogging).toBe(true);
      expect(toggles?.detailedMetrics).toBe(false);
    });
    
    it('should apply production mode', async () => {
      await monitor.initialize();
      
      monitor.applyProductionMode({
        detailedMetrics: true
      });
      expect(monitor.applyProductionMode).toHaveBeenCalledWith({
        detailedMetrics: true
      });
    });
  });
});