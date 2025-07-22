import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheMonitorConfigService, DEFAULT_CONFIG, DEV_CONFIG } from '../cache-monitor-config';

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
    setLogLevel: vi.fn(),
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

vi.mock('../cache-adaptive-logger', () => ({
  adaptiveCacheLogger: {
    configure: vi.fn()
  },
  AdaptiveLoggingConfig: {}
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

describe('CacheMonitorConfigService', () => {
  let configService: CacheMonitorConfigService;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Set up global objects
    global.localStorage = mockLocalStorage as unknown as Storage;
    
    // Clear localStorage
    mockLocalStorage.clear();
    
    // Set NODE_ENV to development for testing
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    
    // Create a new instance for each test
    // We need to use getInstance() to get the singleton
    configService = CacheMonitorConfigService.getInstance();
  });
  
  afterEach(() => {
    // Clean up
    (global as unknown as { localStorage?: Storage }).localStorage = undefined;
    // Remover restauração direta de process.env.NODE_ENV
  });
  
  describe('initialization', () => {
    it('should initialize with development config when NODE_ENV is development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      
      const config = configService.getConfig();
      
      expect(config.metricsEnabled).toBe(DEV_CONFIG.metricsEnabled);
      expect(config.logLevel).toBe(DEV_CONFIG.logLevel);
      expect(config.metricsConfig.sampleRate).toBe(DEV_CONFIG.metricsConfig.sampleRate);
    });
    
    it('should initialize with production config when NODE_ENV is production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      
      // Reset the singleton to force re-initialization with production env
      (CacheMonitorConfigService as unknown as { instance: CacheMonitorConfigService | undefined }).instance = undefined;
      
      const prodConfigService = CacheMonitorConfigService.getInstance();
      const config = prodConfigService.getConfig();
      
      expect(config.metricsEnabled).toBe(DEFAULT_CONFIG.metricsEnabled);
      expect(config.logLevel).toBe(DEFAULT_CONFIG.logLevel);
      expect(config.metricsConfig.sampleRate).toBe(DEFAULT_CONFIG.metricsConfig.sampleRate);
    });
  });
  
  describe('getConfig', () => {
    it('should return a copy of the config', () => {
      const config = configService.getConfig();
      
      // Modify the returned config
      config.enabled = !config.enabled;
      
      // Get the config again
      const newConfig = configService.getConfig();
      
      // The original config should not be modified
      expect(newConfig.enabled).not.toBe(config.enabled);
    });
  });
  
  describe('updateConfig', () => {
    it('should update the configuration', () => {
      const originalConfig = configService.getConfig();
      
      // Update config
      configService.updateConfig({
        enabled: !originalConfig.enabled,
        logLevel: 'debug',
        metricsConfig: {
          enabled: true,
          sampleRate: 0.75,
          maxMetricsHistory: 1000,
          collectSizeMetrics: true,
          detailedTimings: false
        }
      });
      
      const updatedConfig = configService.getConfig();
      
      expect(updatedConfig.enabled).toBe(!originalConfig.enabled);
      expect(updatedConfig.logLevel).toBe('debug');
      expect(updatedConfig.metricsConfig.sampleRate).toBe(0.75);
      
      // Other properties should remain unchanged
      expect(updatedConfig.dashboardEnabled).toBe(originalConfig.dashboardEnabled);
    });
    
    it('should save config to localStorage when persistConfig is true', () => {
      configService.updateConfig({
        persistConfig: true,
        enabled: false,
        metricsConfig: {
          enabled: true,
          sampleRate: 0.75,
          maxMetricsHistory: 1000,
          collectSizeMetrics: true,
          detailedTimings: false
        }
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      // The saved config should contain the updated values
      const savedConfig = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedConfig.enabled).toBe(false);
      expect(savedConfig.metricsConfig.enabled).toBe(true);
      expect(savedConfig.metricsConfig.sampleRate).toBe(0.75);
      expect(savedConfig.metricsConfig.maxMetricsHistory).toBe(1000);
      expect(savedConfig.metricsConfig.collectSizeMetrics).toBe(true);
      expect(savedConfig.metricsConfig.detailedTimings).toBe(false);
    });
    
    it('should notify listeners when config is updated', () => {
      const listener = vi.fn();
      const removeListener = configService.addListener(listener);
      
      configService.updateConfig({ enabled: false });
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        enabled: false
      }));
      
      // Remove listener and update again
      removeListener();
      configService.updateConfig({ enabled: true });
      
      // Listener should not be called again
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('resetConfig', () => {
    it('should reset config to defaults', () => {
      // First update config
      configService.updateConfig({
        enabled: false,
        logLevel: 'error',
        metricsConfig: {
          enabled: true,
          sampleRate: 0.75,
          maxMetricsHistory: 1000,
          collectSizeMetrics: true,
          detailedTimings: false
        }
      });
      
      // Then reset
      configService.resetConfig();
      
      const resetConfig = configService.getConfig();
      
      // Should be reset to development defaults
      expect(resetConfig.enabled).toBe(DEV_CONFIG.enabled);
      expect(resetConfig.logLevel).toBe(DEV_CONFIG.logLevel);
      expect(resetConfig.metricsConfig.sampleRate).toBe(DEV_CONFIG.metricsConfig.sampleRate);
    });
  });
  
  describe('loadConfig', () => {
    it('should load config from localStorage', async () => {
      // Save a config to localStorage
      const savedConfig = {
        enabled: false,
        logLevel: 'error',
        metricsConfig: {
          enabled: true,
          sampleRate: 0.75,
          maxMetricsHistory: 1000,
          collectSizeMetrics: true,
          detailedTimings: false
        }
      };
      
      mockLocalStorage.setItem('cache-monitor-config', JSON.stringify(savedConfig));
      
      // Load config
      const loaded = await configService.loadConfig();
      
      expect(loaded).toBe(true);
      
      const loadedConfig = configService.getConfig();
      expect(loadedConfig.enabled).toBe(false);
      expect(loadedConfig.logLevel).toBe('error');
      expect(loadedConfig.metricsConfig.sampleRate).toBe(0.75);
    });
    
    it('should return false when no config is saved', async () => {
      // Ensure localStorage is empty
      mockLocalStorage.clear();
      
      const loaded = await configService.loadConfig();
      
      expect(loaded).toBe(false);
    });
  });
  
  describe('validateConfig', () => {
    it('should validate sample rate', () => {
      const errors = configService.validateConfig({
        metricsConfig: {
          enabled: true,
          sampleRate: 1.5, // Invalid: should be between 0 and 1
          maxMetricsHistory: 1000,
          collectSizeMetrics: true,
          detailedTimings: false
        }
      });
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Sample rate');
    });
    
    it('should validate max metrics history', () => {
      const errors = configService.validateConfig({
        metricsConfig: {
          enabled: true,
          sampleRate: 0.75,
          maxMetricsHistory: 5, // Invalid: should be at least 10
          collectSizeMetrics: true,
          detailedTimings: false
        }
      });
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Max metrics history');
    });
    
    it('should return empty array for valid config', () => {
      const errors = configService.validateConfig({
        metricsConfig: {
          enabled: true,
          sampleRate: 0.5,
          maxMetricsHistory: 100,
          collectSizeMetrics: true,
          detailedTimings: false
        }
      });
      
      expect(errors).toHaveLength(0);
    });
  });
  
  describe('production mode', () => {
    it('should check if production mode is active', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      expect(configService.isProductionMode()).toBe(false);
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      expect(configService.isProductionMode()).toBe(true);
    });
  });
});