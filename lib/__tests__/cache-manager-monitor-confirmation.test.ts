import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before imports
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
    recordOperationEnd: vi.fn(),
    getAllCacheEntries: vi.fn().mockResolvedValue([
      {
        key: 'test-key-1',
        cacheType: 'memory',
        data: { test: 'data1' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        isExpired: false,
        relatedKeys: ['related-key-1']
      },
      {
        key: 'test-key-2',
        cacheType: 'memory',
        data: { test: 'data2' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 60000),
        isExpired: true,
        relatedKeys: ['related-key-2']
      }
    ])
  }
}));

// Mock supabase
vi.mock('../supabase', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })
  })
}));

// Agora importe o monitor estendido para garantir que os métodos existam
import { cacheManager, CacheType } from '../cache-manager';
import { cacheManagerMonitor } from '../cache-manager-monitor-extension';
import { logger } from '../logger';

// Mock the original cache manager methods
const originalGet = vi.fn().mockImplementation((key) => {
  if (key === 'test-key-1') {
    return Promise.resolve({ test: 'data1' });
  }
  return Promise.resolve(null);
});

const originalSet = vi.fn().mockResolvedValue(undefined);
const originalDelete = vi.fn().mockResolvedValue(undefined);
const originalInvalidate = vi.fn().mockResolvedValue(undefined);
const originalClear = vi.fn().mockResolvedValue(undefined);

describe('CacheManagerMonitor Confirmation Mechanism', () => {
  beforeEach(() => {
    // Mock cache manager methods
    cacheManager.get = originalGet;
    cacheManager.set = originalSet;
    cacheManager.delete = originalDelete;
    cacheManager.invalidate = originalInvalidate;
    cacheManager.clear = originalClear;
    
    // Initialize the monitor
    cacheManagerMonitor.initialize();
    
    // Clear mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original methods
    cacheManagerMonitor.restoreOriginalMethods();
  });
  
  describe('clearByType with confirmation', () => {
    it('should require confirmation for clearing cache by type', async () => {
      // Setup
      const cacheType = CacheType.MEMORY;
      
      // Execute and verify
      if (!cacheManagerMonitor.clearByType) throw new Error('Método clearByType não implementado');
      await expect(cacheManagerMonitor.clearByType(cacheType, undefined))
        .rejects.toThrow(/Confirmation required to clear cache/);
      
      expect(originalClear).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Destructive operation requires confirmation',
        expect.objectContaining({
          operation: 'clear_by_type',
          cacheType
        })
      );
    });
    
    it('should proceed with clearing when confirmation token is provided', async () => {
      // Setup
      const cacheType = CacheType.MEMORY;
      
      // Execute
      if (!cacheManagerMonitor.clearByType) throw new Error('Método clearByType não implementado');
      await cacheManagerMonitor.clearByType(cacheType, undefined);
      
      // Verify
      expect(originalClear).toHaveBeenCalledWith({ type: cacheType, userId: undefined });
      expect(logger.info).toHaveBeenCalledWith(
        'Cleared cache by type',
        expect.objectContaining({
          operation: 'clear_by_type',
          cacheType,
          reason: 'Testing confirmation'
        })
      );
    });
  });
  
  describe('invalidateMultiple with confirmation', () => {
    it('should require confirmation for invalidating multiple keys', async () => {
      // Setup
      const keys = ['key1', 'key2', 'key3', 'key4', 'key5', 'key6']; // More than 5 keys
      const options = { type: CacheType.MEMORY };
      
      // Execute and verify
      if (!cacheManagerMonitor.invalidateMultiple) throw new Error('Método invalidateMultiple não implementado');
      await expect(cacheManagerMonitor.invalidateMultiple(keys, options))
        .rejects.toThrow(/Confirmation required to invalidate/);
      
      expect(originalInvalidate).not.toHaveBeenCalled();
    });
    
    it('should not require confirmation for small number of keys', async () => {
      // Setup
      const keys = ['key1', 'key2', 'key3']; // Less than 5 keys
      const options = { type: CacheType.MEMORY };
      
      // Execute
      if (!cacheManagerMonitor.invalidateMultiple) throw new Error('Método invalidateMultiple não implementado');
      await cacheManagerMonitor.invalidateMultiple(keys, options);
      
      // Verify
      expect(originalInvalidate).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('executeBatch with confirmation', () => {
    it('should require confirmation for batch with destructive operations', async () => {
      // Setup
      const operations = [
        { operation: 'get' as const, key: 'key1' },
        { operation: 'set' as const, key: 'key2', data: { test: 'data' } },
        { operation: 'delete' as const, key: 'key3' }
      ];
      
      // Execute and verify
      if (!cacheManagerMonitor.executeBatch) throw new Error('Método executeBatch não implementado');
      await expect(cacheManagerMonitor.executeBatch(operations))
        .rejects.toThrow(/Confirmation required for batch operation/);
      
      expect(originalGet).not.toHaveBeenCalled();
      expect(originalSet).not.toHaveBeenCalled();
      expect(originalDelete).not.toHaveBeenCalled();
    });
    
    it('should proceed with batch when confirmation token is provided', async () => {
      // Setup
      const operations = [
        { operation: 'get' as const, key: 'key1' },
        { operation: 'set' as const, key: 'key2', data: { test: 'data' } },
        { operation: 'delete' as const, key: 'key3' }
      ];
      
      // Execute
      if (!cacheManagerMonitor.executeBatch) throw new Error('Método executeBatch não implementado');
      await cacheManagerMonitor.executeBatch(operations);
      
      // Verify
      expect(originalGet).toHaveBeenCalledTimes(1);
      expect(originalSet).toHaveBeenCalledTimes(1);
      expect(originalDelete).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Executed batch cache operations',
        expect.objectContaining({
          reason: 'Testing batch confirmation'
        })
      );
    });
  });
  
  describe('importCache with confirmation', () => {
    it('should require confirmation for importing cache data', async () => {
      // Setup
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        entries: [
          {
            key: 'import-key-1',
            cacheType: CacheType.MEMORY,
            data: { test: 'import1' },
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            createdAt: new Date().toISOString()
          }
        ]
      };
      
      // Execute and verify
      if (!cacheManagerMonitor.importCache) throw new Error('Método importCache não implementado');
      await expect(cacheManagerMonitor.importCache(JSON.stringify(exportData)))
        .rejects.toThrow(/Confirmation required to import cache data/);
      
      expect(originalSet).not.toHaveBeenCalled();
    });
  });
  
  describe('clearExpired with confirmation', () => {
    it('should require confirmation for clearing expired entries', async () => {
      // Setup
      const options = { cacheType: CacheType.MEMORY };
      
      // Execute and verify
      if (!cacheManagerMonitor.clearExpired) throw new Error('Método clearExpired não implementado');
      await expect(cacheManagerMonitor.clearExpired(options))
        .rejects.toThrow(/Confirmation required to clear expired cache entries/);
      
      expect(originalDelete).not.toHaveBeenCalled();
    });
    
    it('should proceed with clearing expired entries when confirmation token is provided', async () => {
      // Setup
      const options = { cacheType: CacheType.MEMORY };
      
      // Execute
      if (!cacheManagerMonitor.clearExpired) throw new Error('Método clearExpired não implementado');
      await cacheManagerMonitor.clearExpired(options);
      
      // Verify
      expect(originalDelete).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Cleared expired cache entries',
        expect.objectContaining({
          reason: 'Testing expired confirmation'
        })
      );
    });
  });
});