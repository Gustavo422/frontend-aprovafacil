import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheManager, CacheType } from '../cache-manager';
import { cacheManagerMonitor, CacheEventType } from '../cache-manager-monitor';
import { cacheMonitor } from '../cache-monitor';
import { CacheOperation } from '../cache-metrics-collector';

// Mock dependencies
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../cache-monitor', () => ({
  cacheMonitor: {
    recordOperationStart: vi.fn().mockReturnValue('test-operation-id'),
    recordOperationEnd: vi.fn()
  }
}));

describe('CacheManagerMonitor', () => {
  beforeEach(() => {
    // Initialize the monitor
    cacheManagerMonitor.initialize();
    
    // Clear mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original methods
    cacheManagerMonitor.restoreOriginalMethods();
  });
  
  it('should initialize and apply monitoring hooks', () => {
    expect(cacheManagerMonitor.isInitialized()).toBe(true);
  });
  
  it('should record metrics when get is called', async () => {
    // Setup
    const key = 'test-key';
    const options = { type: CacheType.MEMORY };
    
    // Execute
    await cacheManager.get(key, options);
    
    // Verify
    expect(cacheMonitor.recordOperationStart).toHaveBeenCalledWith(
      'get',
      CacheType.MEMORY,
      key
    );
    expect(cacheMonitor.recordOperationEnd).toHaveBeenCalledWith(
      'test-operation-id',
      'miss',
      expect.any(Object)
    );
  });
  
  it('should record metrics when set is called', async () => {
    // Setup
    const key = 'test-key';
    const data = { test: 'data' };
    const options = { type: CacheType.MEMORY };
    
    // Execute
    await cacheManager.set(key, data, options);
    
    // Verify
    expect(cacheMonitor.recordOperationStart).toHaveBeenCalledWith(
      'set',
      CacheType.MEMORY,
      key
    );
    expect(cacheMonitor.recordOperationEnd).toHaveBeenCalledWith(
      'test-operation-id',
      'success',
      expect.any(Object)
    );
  });
  
  it('should record metrics when delete is called', async () => {
    // Setup
    const key = 'test-key';
    const options = { type: CacheType.MEMORY };
    
    // Execute
    await cacheManager.delete(key, options);
    
    // Verify
    expect(cacheMonitor.recordOperationStart).toHaveBeenCalledWith(
      'delete',
      CacheType.MEMORY,
      key
    );
    expect(cacheMonitor.recordOperationEnd).toHaveBeenCalledWith(
      'test-operation-id',
      'success',
      expect.any(Object)
    );
  });
  
  it('should record metrics when invalidate is called', async () => {
    // Setup
    const key = 'test-key';
    const options = { type: CacheType.MEMORY };
    
    // Execute
    await cacheManager.invalidate(key, options);
    
    // Verify
    expect(cacheMonitor.recordOperationStart).toHaveBeenCalledWith(
      'invalidate',
      CacheType.MEMORY,
      key
    );
    expect(cacheMonitor.recordOperationEnd).toHaveBeenCalledWith(
      'test-operation-id',
      'success',
      expect.any(Object)
    );
  });
  
  it('should record metrics when clear is called', async () => {
    // Setup
    const options = { type: CacheType.MEMORY };
    
    // Execute
    await cacheManager.clear(options);
    
    // Verify
    expect(cacheMonitor.recordOperationStart).toHaveBeenCalledWith(
      'clear',
      CacheType.MEMORY
    );
    expect(cacheMonitor.recordOperationEnd).toHaveBeenCalledWith(
      'test-operation-id',
      'success',
      expect.any(Object)
    );
  });
  
  it('should emit events when cache operations occur', async () => {
    // Setup
    const key = 'test-key';
    const data = { test: 'data' };
    const options = { type: CacheType.MEMORY };
    const eventListener = vi.fn();
    
    // Add event listener
    cacheManagerMonitor.addEventListener(CacheEventType.AFTER_SET, eventListener);
    
    // Execute
    await cacheManager.set(key, data, options);
    
    // Verify
    expect(eventListener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CacheEventType.AFTER_SET,
        operation: 'set',
        cacheType: CacheType.MEMORY,
        key,
        data
      })
    );
  });
  
  it('should restore original methods when requested', async () => {
    // Setup - store original method
    const originalGet = cacheManager.get;
    
    // Execute
    cacheManagerMonitor.restoreOriginalMethods();
    
    // Verify
    expect(cacheManagerMonitor.isInitialized()).toBe(false);
    expect(cacheManager.get).toBe(originalGet);
  });
  
  it('should measure performance of cache operations', async () => {
    // Setup
    const operation = async () => 'test-result';
    const options = {
      operationType: 'get' as CacheOperation,
      cacheType: CacheType.MEMORY,
      key: 'test-key'
    };
    
    // Execute
    const result = await cacheManagerMonitor.measurePerformance(operation, options);
    
    // Verify
    expect(result.result).toBe('test-result');
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(cacheMonitor.recordOperationStart).toHaveBeenCalledWith(
      'get',
      CacheType.MEMORY,
      'test-key'
    );
    expect(cacheMonitor.recordOperationEnd).toHaveBeenCalledWith(
      'test-operation-id',
      'success',
      expect.any(Object)
    );
  });
});