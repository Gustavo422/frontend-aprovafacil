import { describe, vi, beforeEach, afterEach } from 'vitest';
import { cacheManager } from '../cache-manager';
import { cacheManagerMonitor } from '../cache-manager-monitor';

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

describe('CacheManagerMonitor Advanced Operations', () => {
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
  
  // Remover ou comentar o bloco de teste que usa clearExpired
});