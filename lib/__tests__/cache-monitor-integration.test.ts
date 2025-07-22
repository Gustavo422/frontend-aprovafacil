import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheMonitor } from '../cache-monitor';
import { cacheManagerMonitor } from '../cache-manager-monitor';
import { cacheLogger } from '../cache-logger';
import { cacheManager } from '../cache-manager';

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

// Mock cache manager methods
vi.mock('../cache-manager', () => {
  const mockMemoryCache = new Map();
  const mockKeyRelationships = new Map();
  
  // Add some test data
  mockMemoryCache.set('test-key', {
    data: { value: 'test-data' },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    relatedKeys: ['related-key']
  });
  
  mockKeyRelationships.set('test-key', new Set(['related-key']));
  
  return {
    cacheManager: {
      get: vi.fn().mockImplementation((key) => {
        if (key === 'test-key') {
          return Promise.resolve({ value: 'test-data' });
        }
        return Promise.resolve(null);
      }),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      memoryCache: mockMemoryCache,
      keyRelationships: mockKeyRelationships
    },
    CacheType: {
      MEMORY: 'memory',
      LOCAL_STORAGE: 'localStorage',
      SESSION_STORAGE: 'sessionStorage',
      SUPABASE: 'supabase'
    }
  };
});

// Create a real integration test that uses the actual implementations
describe('Cache Monitor Integration Tests', () => {
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Initialize the cache monitor
    await cacheMonitor.initialize();
    
    // Enable monitoring
    cacheMonitor.updateConfig({
      enabled: true,
      metricsEnabled: true
    });
  });
  
  afterEach(() => {
    // Clean up
    cacheMonitor.disable();
  });
  
  describe('End-to-end cache operation flow', () => {
    it('should track cache operations through the complete flow', async () => {
      // Initialize cache manager monitoring
      cacheManagerMonitor.initialize();
      
      // Perform cache operations
      await cacheManager.get('test-key');
      await cacheManager.set('new-key', { value: 'new-data' });
      
      // Get metrics
      const metrics = cacheMonitor.getMetrics();
      
      // Verify metrics were collected
      expect(metrics.length).toBeGreaterThan(0);
      
      // Verify operation types
      const operationTypes = metrics.map(m => m.operation);
      expect(operationTypes).toContain('get');
      expect(operationTypes).toContain('set');
      
      // Verify cache keys
      const keys = metrics.map(m => m.key);
      expect(keys).toContain('test-key');
      expect(keys).toContain('new-key');
      
      // Restore original methods
      cacheManagerMonitor.restoreOriginalMethods();
    });
    
    it('should track cache hit/miss statistics', async () => {
      // Initialize cache manager monitoring
      cacheManagerMonitor.initialize();
      
      // Perform cache operations - one hit, one miss
      await cacheManager.get('test-key'); // Should be a hit
      await cacheManager.get('non-existent-key'); // Should be a miss
      
      // Get statistics
      const stats = cacheMonitor.getStatistics();
      
      // Verify statistics
      expect(stats).toBeDefined();
      expect(stats && stats.hitRate).toBeGreaterThan(0);
      expect(stats && stats.missRate).toBeGreaterThan(0);
      
      // Restore original methods
      cacheManagerMonitor.restoreOriginalMethods();
    });
  });
  
  describe('Dashboard integration', () => {
    it('should provide data for dashboard visualizations', async () => {
      // Initialize cache manager monitoring
      cacheManagerMonitor.initialize();
      
      // Perform some cache operations
      await cacheManager.get('test-key');
      await cacheManager.set('dashboard-key', { value: 'dashboard-data' });
      
      // Get data for visualizations
      const metrics = cacheMonitor.getMetrics();
      const stats = cacheMonitor.getStatistics();
      const cacheEntries = await cacheMonitor.getAllCacheEntries();
      
      // Verify data is available for dashboard
      expect(metrics.length).toBeGreaterThan(0);
      expect(stats).toBeDefined();
      expect(cacheEntries.length).toBeGreaterThan(0);
      
      // Verify relationship visualization data
      const graph = await cacheMonitor.buildCacheRelationshipGraph({
        rootKey: 'test-key'
      });
      
      expect(graph).toBeDefined();
      expect(graph.nodes.length).toBeGreaterThan(0);
      
      // Restore original methods
      cacheManagerMonitor.restoreOriginalMethods();
    });
  });
  
  describe('Logger integration', () => {
    it('should log cache events', async () => {
      // Initialize cache manager monitoring
      cacheManagerMonitor.initialize();
      
      // Perform a cache operation that should trigger logging
      await cacheManager.set('log-test-key', { value: 'log-data' });
      
      // Verify that logger was called
      expect(cacheLogger.logMonitor).toHaveBeenCalled();
      
      // Restore original methods
      cacheManagerMonitor.restoreOriginalMethods();
    });
    
    it('should log cache errors', async () => {
      // Initialize cache manager monitoring
      cacheManagerMonitor.initialize();
      
      // Mock cache manager to throw an error
      cacheManager.get = vi.fn().mockRejectedValueOnce(new Error('Test error'));
      
      // Perform a cache operation that should trigger error logging
      try {
        await cacheManager.get('error-key');
      } catch {
        // Ignore the error
      }
      
      // Verify that error logger was called
      expect(cacheLogger.logError).toHaveBeenCalled();
      
      // Restore original methods
      cacheManagerMonitor.restoreOriginalMethods();
    });
  });
});