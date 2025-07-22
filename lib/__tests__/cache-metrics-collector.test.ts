import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheMetricsCollector } from '../cache-metrics-collector';
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
  }
}));

// Mock performance.now
const originalPerformanceNow = global.performance.now;
let mockPerformanceTime = 1000;

describe('CacheMetricsCollector', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock performance.now to return controlled values
    global.performance.now = vi.fn(() => mockPerformanceTime);
    mockPerformanceTime = 1000;
  });
  
  afterEach(() => {
    // Restore original performance.now
    global.performance.now = originalPerformanceNow;
  });
  
  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const collector = new CacheMetricsCollector();
      expect(collector).toBeDefined();
      expect(collector.isEnabled()).toBe(false); // Should be disabled by default until start() is called
    });
    
    it('should initialize with custom configuration', () => {
      const config = {
        enabled: true,
        sampleRate: 0.5,
        maxMetricsHistory: 500
      };
      
      const collector = new CacheMetricsCollector(config);
      expect(collector).toBeDefined();
      expect(collector.getEffectiveSamplingRate()).toBe(0.5);
    });
  });
  
  describe('start and stop', () => {
    it('should start and stop metrics collection', () => {
      const collector = new CacheMetricsCollector();
      
      // Start collection
      collector.start();
      expect(collector.isEnabled()).toBe(true);
      
      // Stop collection
      collector.stop();
      expect(collector.isEnabled()).toBe(false);
    });
  });
  
  describe('configuration', () => {
    it('should update configuration', () => {
      const collector = new CacheMetricsCollector();
      
      // Update configuration
      collector.configure({
        sampleRate: 0.75,
        maxMetricsHistory: 200
      });
      
      expect(collector.getEffectiveSamplingRate()).toBe(0.75);
    });
    
    it('should enable collection when configuration is updated with enabled=true', () => {
      const collector = new CacheMetricsCollector();
      expect(collector.isEnabled()).toBe(false);
      
      collector.configure({ enabled: true });
      expect(collector.isEnabled()).toBe(true);
    });
  });
  
  describe('operation recording', () => {
    it('should record operation start and end', () => {
      const collector = new CacheMetricsCollector();
      collector.start();
      
      // Record operation start
      const operationId = collector.recordOperationStart('get', CacheType.MEMORY, 'test-key');
      expect(operationId).toBeTruthy();
      
      // Simulate time passing
      mockPerformanceTime += 50;
      
      // Record operation end
      collector.recordOperationEnd(operationId, 'hit', { size: 100 });
      
      // Get metrics
      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('get');
      expect(metrics[0].cacheType).toBe(CacheType.MEMORY);
      expect(metrics[0].key).toBe('test-key');
      expect(metrics[0].result).toBe('hit');
      expect(metrics[0].duration).toBe(50);
      expect(metrics[0].size).toBe(100);
    });
    
    it('should not record operations when disabled', () => {
      const collector = new CacheMetricsCollector();
      // Don't start collection
      
      const operationId = collector.recordOperationStart('get', CacheType.MEMORY, 'test-key');
      expect(operationId).toBe('');
      
      collector.recordOperationEnd(operationId, 'hit');
      
      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(0);
    });
    
    it('should record complete operations', () => {
      const collector = new CacheMetricsCollector();
      collector.start();
      
      collector.recordOperation('set', CacheType.MEMORY, 'success', 25, {
        key: 'test-key',
        size: 200
      });
      
      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('set');
      expect(metrics[0].result).toBe('success');
      expect(metrics[0].duration).toBe(25);
      expect(metrics[0].size).toBe(200);
    });
    
    it('should always record error operations regardless of sampling', () => {
      const collector = new CacheMetricsCollector({
        sampleRate: 0 // Set to 0 to disable sampling
      });
      collector.start();
      
      // This should still be recorded despite 0 sample rate because it's an error
      collector.recordOperation('get', CacheType.MEMORY, 'error', 30, {
        key: 'test-key',
        error: 'Test error'
      });
      
      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].result).toBe('error');
      expect(metrics[0].error).toBe('Test error');
    });
    
    it('should always record critical operations regardless of sampling', () => {
      const collector = new CacheMetricsCollector({
        sampleRate: 0 // Set to 0 to disable sampling
      });
      collector.start();
      
      // These should still be recorded despite 0 sample rate because they're critical
      collector.recordOperation('invalidate', CacheType.MEMORY, 'success', 30, {
        key: 'test-key'
      });
      
      collector.recordOperation('clear', CacheType.MEMORY, 'success', 40);
      
      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(2);
    });
  });
  
  describe('metrics retrieval and statistics', () => {
    it('should get filtered metrics', () => {
      const collector = new CacheMetricsCollector();
      collector.start();
      
      // Add some test metrics
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key1' });
      collector.recordOperation('get', CacheType.MEMORY, 'miss', 20, { key: 'key2' });
      collector.recordOperation('set', CacheType.MEMORY, 'success', 15, { key: 'key3' });
      collector.recordOperation('get', CacheType.LOCAL_STORAGE, 'hit', 25, { key: 'key4' });
      
      // Filter by operation
      const getMetrics = collector.getMetrics({ operation: 'get' });
      expect(getMetrics).toHaveLength(3);
      
      // Filter by cache type
      const memoryMetrics = collector.getMetrics({ cacheType: CacheType.MEMORY });
      expect(memoryMetrics).toHaveLength(3);
      
      // Filter by both
      const memoryGetMetrics = collector.getMetrics({ 
        operation: 'get', 
        cacheType: CacheType.MEMORY 
      });
      expect(memoryGetMetrics).toHaveLength(2);
      
      // Apply limit
      const limitedMetrics = collector.getMetrics({ limit: 2 });
      expect(limitedMetrics).toHaveLength(2);
    });
    
    it('should calculate statistics correctly', () => {
      const collector = new CacheMetricsCollector();
      collector.start();
      
      // Add test metrics
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key1' });
      collector.recordOperation('get', CacheType.MEMORY, 'miss', 20, { key: 'key2' });
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 30, { key: 'key3' });
      collector.recordOperation('set', CacheType.MEMORY, 'success', 15, { key: 'key4', size: 100 });
      collector.recordOperation('set', CacheType.MEMORY, 'error', 25, { key: 'key5', error: 'Test error' });
      
      const stats = collector.getStatistics();
      
      // Verify statistics
      expect(stats.totalOperations).toBe(5);
      expect(stats.hitRate).toBeCloseTo(2/3); // 2 hits out of 3 get operations
      expect(stats.missRate).toBeCloseTo(1/3); // 1 miss out of 3 get operations
      expect(stats.averageDuration).toBe(20); // (10 + 20 + 30 + 15 + 25) / 5 = 20
      expect(stats.errorRate).toBe(0.2); // 1 error out of 5 operations
      expect(stats.operationCounts.get).toBe(3);
      expect(stats.operationCounts.set).toBe(2);
    });
    
    it('should clear metrics', () => {
      const collector = new CacheMetricsCollector();
      collector.start();
      
      // Add test metrics
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key1' });
      collector.recordOperation('set', CacheType.MEMORY, 'success', 15, { key: 'key2' });
      
      // Verify metrics were added
      expect(collector.getMetrics()).toHaveLength(2);
      
      // Clear metrics
      collector.clearMetrics();
      
      // Verify metrics were cleared
      expect(collector.getMetrics()).toHaveLength(0);
    });
  });
  
  describe('memory management', () => {
    it('should respect max history limit', () => {
      const collector = new CacheMetricsCollector({
        maxMetricsHistory: 3
      });
      collector.start();
      
      // Add more metrics than the limit
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key1' });
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key2' });
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key3' });
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key4' });
      collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: 'key5' });
      
      // Should only keep the most recent 3
      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(3);
      
      // The keys should be the most recent ones (key3, key4, key5)
      const keys = metrics.map(m => m.key);
      expect(keys).toContain('key3');
      expect(keys).toContain('key4');
      expect(keys).toContain('key5');
    });
    
    it('should provide memory usage statistics', () => {
      const collector = new CacheMetricsCollector({
        maxMetricsHistory: 100,
        memoryUsageLimit: 10000
      });
      collector.start();
      
      // Add some metrics
      for (let i = 0; i < 10; i++) {
        collector.recordOperation('get', CacheType.MEMORY, 'hit', 10, { key: `key${i}` });
      }
      
      const memStats = collector.getMemoryUsageStatistics();
      expect(memStats.metricsCount).toBe(10);
      expect(memStats.bufferCapacity).toBe(100);
      expect(memStats.bufferUtilization).toBe(0.1);
      expect(memStats.estimatedMemoryUsage).toBeGreaterThan(0);
      expect(memStats.memoryUsageLimit).toBe(10000);
    });
  });
});