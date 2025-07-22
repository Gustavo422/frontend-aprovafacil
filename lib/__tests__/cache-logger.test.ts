import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheLogger, CacheLogLevel, CacheLogCategory } from '../cache-logger';
import { logger } from '../logger';
import { CacheType } from '../cache-manager';

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

describe('CacheLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheLogger.enable();
    cacheLogger.setLogLevel(CacheLogLevel.DEBUG);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should log operation with the correct level and context', () => {
    const context = cacheLogger.createOperationLogEntry('get', CacheType.MEMORY, {
      key: 'test-key',
      result: 'hit',
      duration: 10,
      userId: 'user-123'
    });

    cacheLogger.logOperation(CacheLogLevel.INFO, 'Cache hit', context);

    expect(logger.info).toHaveBeenCalledWith('Cache hit', {
      ...context,
      category: CacheLogCategory.OPERATION,
      timestamp: expect.any(String)
    });
  });

  it('should log performance events', () => {
    const context = cacheLogger.createOperationLogEntry('get', CacheType.MEMORY, {
      key: 'test-key',
      result: 'hit',
      duration: 150,
      userId: 'user-123'
    });

    cacheLogger.logPerformance('Slow cache operation', context);

    expect(logger.debug).toHaveBeenCalledWith('Slow cache operation', {
      ...context,
      category: CacheLogCategory.PERFORMANCE,
      timestamp: expect.any(String)
    });
  });

  it('should log errors', () => {
    const context = cacheLogger.createOperationLogEntry('set', CacheType.MEMORY, {
      key: 'test-key',
      result: 'error',
      error: new Error('Test error'),
      userId: 'user-123'
    });

    cacheLogger.logError('Cache operation failed', context);

    expect(logger.error).toHaveBeenCalledWith('Cache operation failed', {
      ...context,
      error: 'Test error', // Error should be converted to string
      category: CacheLogCategory.ERROR,
      timestamp: expect.any(String)
    });
  });

  it('should log management operations', () => {
    cacheLogger.logManagement(
      CacheLogLevel.WARN,
      'Cleared cache',
      {
        action: 'clear_all',
        cacheType: CacheType.MEMORY,
        userId: 'user-123'
      }
    );

    expect(logger.warn).toHaveBeenCalledWith('Cleared cache', {
      action: 'clear_all',
      cacheType: CacheType.MEMORY,
      userId: 'user-123',
      category: CacheLogCategory.MANAGEMENT,
      timestamp: expect.any(String)
    });
  });

  it('should respect log level settings', () => {
    cacheLogger.setLogLevel(CacheLogLevel.WARN);

    const context = cacheLogger.createOperationLogEntry('get', CacheType.MEMORY, {
      key: 'test-key'
    });

    // This should be skipped due to log level
    cacheLogger.logOperation(CacheLogLevel.DEBUG, 'Debug message', context);
    cacheLogger.logOperation(CacheLogLevel.INFO, 'Info message', context);
    
    // These should be logged
    cacheLogger.logOperation(CacheLogLevel.WARN, 'Warning message', context);
    cacheLogger.logOperation(CacheLogLevel.ERROR, 'Error message', context);

    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should not log when disabled', () => {
    cacheLogger.disable();

    const context = cacheLogger.createOperationLogEntry('get', CacheType.MEMORY, {
      key: 'test-key'
    });

    cacheLogger.logOperation(CacheLogLevel.INFO, 'Test message', context);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should generate correlation IDs', () => {
    const id1 = cacheLogger.generateCorrelationId();
    const id2 = cacheLogger.generateCorrelationId();

    expect(id1).toMatch(/^cache-\d+-\d+$/);
    expect(id2).toMatch(/^cache-\d+-\d+$/);
    expect(id1).not.toEqual(id2);
  });

  it('should create operation log entries with all fields', () => {
    const entry = cacheLogger.createOperationLogEntry('set', CacheType.LOCAL_STORAGE, {
      key: 'test-key',
      result: 'success',
      duration: 15,
      error: 'Test error',
      userId: 'user-123',
      correlationId: 'test-correlation-id',
      size: 1024
    });

    expect(entry).toEqual({
      operation: 'set',
      cacheType: CacheType.LOCAL_STORAGE,
      key: 'test-key',
      result: 'success',
      duration: 15,
      error: 'Test error',
      userId: 'user-123',
      correlationId: 'test-correlation-id',
      size: 1024
    });
  });

  it('should create operation log entries with minimal fields', () => {
    const entry = cacheLogger.createOperationLogEntry('get', CacheType.MEMORY);

    expect(entry).toEqual({
      operation: 'get',
      cacheType: CacheType.MEMORY,
      correlationId: expect.stringMatching(/^cache-\d+-\d+$/)
    });
  });
});