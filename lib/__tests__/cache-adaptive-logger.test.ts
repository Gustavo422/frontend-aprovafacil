import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdaptiveCacheLogger, DEFAULT_ADAPTIVE_CONFIG } from '../cache-adaptive-logger';
import { cacheLogger, CacheLogLevel } from '../cache-logger';
import { CacheType } from '../cache-manager';

// Mock the cache logger
vi.mock('../cache-logger', () => ({
  cacheLogger: {
    setLogLevel: vi.fn(),
    logConfig: vi.fn(),
    logPerformance: vi.fn(),
    createOperationLogEntry: vi.fn().mockImplementation((op, type, options) => ({
      operation: op,
      cacheType: type,
      ...options
    }))
  },
  CacheLogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  }
}));

describe('AdaptiveCacheLogger', () => {
  let adaptiveLogger: AdaptiveCacheLogger;
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create a new instance for each test
    adaptiveLogger = AdaptiveCacheLogger.getInstance({
      ...DEFAULT_ADAPTIVE_CONFIG,
      // Use shorter window for tests
      performanceWindowMs: 1000,
      slowOperationThreshold: 2
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('should track operation performance', () => {
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 50, 'hit');
    
    // Should not trigger log level change for normal operations
    expect(cacheLogger.setLogLevel).not.toHaveBeenCalled();
    expect(cacheLogger.logPerformance).not.toHaveBeenCalled();
  });

  it('should detect and log slow operations', () => {
    // Track a slow operation (above warn threshold)
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    
    // Should log performance warning
    expect(cacheLogger.logPerformance).toHaveBeenCalledWith(
      'Slow cache operation detected',
      expect.objectContaining({
        operation: 'get',
        cacheType: CacheType.MEMORY,
        duration: 150,
        threshold: expect.any(Number)
      })
    );
  });

  it('should detect and log very slow operations', () => {
    // Track a very slow operation (above error threshold)
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 600, 'hit');
    
    // Should log performance error
    expect(cacheLogger.logPerformance).toHaveBeenCalledWith(
      'Very slow cache operation detected',
      expect.objectContaining({
        operation: 'get',
        cacheType: CacheType.MEMORY,
        duration: 600,
        threshold: expect.any(Number)
      })
    );
  });

  it('should adjust log level after multiple slow operations', () => {
    // Track multiple slow operations
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 160, 'hit');
    
    // Should adjust log level
    expect(cacheLogger.setLogLevel).toHaveBeenCalledWith(
      DEFAULT_ADAPTIVE_CONFIG.warnLogLevel
    );
    
    // Should log the adjustment
    expect(cacheLogger.logConfig).toHaveBeenCalledWith(
      CacheLogLevel.INFO,
      'Cache log level automatically adjusted due to performance issues',
      expect.objectContaining({
        oldLevel: DEFAULT_ADAPTIVE_CONFIG.baseLogLevel,
        newLevel: DEFAULT_ADAPTIVE_CONFIG.warnLogLevel
      })
    );
  });

  it('should reset log level after performance improves', () => {
    // Track multiple slow operations
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 160, 'hit');
    
    // Clear mocks to check reset
    vi.clearAllMocks();
    
    // Advance time past the performance window
    vi.advanceTimersByTime(1500);
    
    // Should reset log level
    expect(cacheLogger.setLogLevel).toHaveBeenCalledWith(
      DEFAULT_ADAPTIVE_CONFIG.baseLogLevel
    );
    
    // Should log the reset
    expect(cacheLogger.logConfig).toHaveBeenCalledWith(
      CacheLogLevel.INFO,
      'Cache log level automatically reset after performance improved',
      expect.objectContaining({
        newLevel: DEFAULT_ADAPTIVE_CONFIG.baseLogLevel
      })
    );
  });

  it('should not reset log level if still having performance issues', () => {
    // Track multiple slow operations
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 160, 'hit');
    
    // Clear mocks to check reset
    vi.clearAllMocks();
    
    // Add more slow operations just before timeout
    vi.advanceTimersByTime(900);
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 160, 'hit');
    
    // Advance time past the performance window
    vi.advanceTimersByTime(600);
    
    // Should not reset log level
    expect(cacheLogger.setLogLevel).not.toHaveBeenCalled();
  });

  it('should provide performance statistics', () => {
    // Track various operations
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 50, 'hit');
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    adaptiveLogger.trackOperationPerformance('set', CacheType.MEMORY, 200, 'success');
    adaptiveLogger.trackOperationPerformance('delete', CacheType.MEMORY, 30, 'success');
    
    const stats = adaptiveLogger.getPerformanceStatistics();
    
    expect(stats.totalOperations).toBe(4);
    expect(stats.slowOperations).toBeGreaterThan(0);
    expect(stats.byOperation.get.count).toBe(2);
    expect(stats.byOperation.set.count).toBe(1);
    expect(stats.byOperation.delete.count).toBe(1);
  });

  it('should log problematic operations', () => {
    // Track various operations including problematic ones
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 50, 'hit');
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    adaptiveLogger.trackOperationPerformance('set', CacheType.MEMORY, 800, 'success');
    
    // Clear mocks
    vi.clearAllMocks();
    
    adaptiveLogger.logProblematicOperations();
    
    // Should log summary of problematic operations
    expect(cacheLogger.logMonitor).toHaveBeenCalledWith(
      CacheLogLevel.WARN,
      'Problematic cache operations detected',
      expect.objectContaining({
        totalProblematic: 2
      })
    );
  });

  it('should disable adaptive logging', () => {
    adaptiveLogger.disable();
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Track a slow operation
    adaptiveLogger.trackOperationPerformance('get', CacheType.MEMORY, 150, 'hit');
    
    // Should not log or adjust level when disabled
    expect(cacheLogger.logPerformance).not.toHaveBeenCalled();
    expect(cacheLogger.setLogLevel).not.toHaveBeenCalled();
  });
});