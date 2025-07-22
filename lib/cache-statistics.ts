import { CacheType } from './cache-manager';
import { CacheInspector } from './cache-inspector';
import { logger } from './logger';

/**
 * Cache size information
 */
export interface CacheSizeInfo {
  /**
   * Number of entries in the cache
   */
  entryCount: number;
  
  /**
   * Total size of cache entries in bytes (if available)
   */
  totalSize?: number;
  
  /**
   * Keys sorted by size (largest first)
   */
  keysBySize?: Array<{ key: string; size: number }>;
}

/**
 * Cache entry status counts
 */
export interface CacheStatusCounts {
  /**
   * Number of active (non-expired) entries
   */
  active: number;
  
  /**
   * Number of expired entries
   */
  expired: number;
  
  /**
   * Total number of entries
   */
  total: number;
}

/**
 * Cache statistics by type
 */
export interface CacheTypeStatistics {
  /**
   * Cache type
   */
  cacheType: CacheType;
  
  /**
   * Number of entries by status
   */
  counts: CacheStatusCounts;
  
  /**
   * Total size in bytes (if available)
   */
  totalSize?: number;
  
  /**
   * Average size per entry in bytes (if available)
   */
  averageSize?: number;
  
  /**
   * Largest entries by size
   */
  largestEntries?: Array<{ key: string; size: number }>;
}

/**
 * Expiration statistics
 */
export interface ExpirationStatistics {
  /**
   * Number of entries expiring in the next minute
   */
  expiringInNextMinute: number;
  
  /**
   * Number of entries expiring in the next hour
   */
  expiringInNextHour: number;
  
  /**
   * Number of entries expiring in the next day
   */
  expiringInNextDay: number;
  
  /**
   * Number of entries expiring in the next week
   */
  expiringInNextWeek: number;
  
  /**
   * Number of entries with long expiration (more than a week)
   */
  expiringLater: number;
  
  /**
   * Number of expired entries
   */
  expired: number;
}

/**
 * Complete cache statistics
 */
export interface CompleteStatistics {
  /**
   * Total number of entries across all cache types
   */
  totalEntries: number;
  
  /**
   * Total size across all cache types (if available)
   */
  totalSize?: number;
  
  /**
   * Statistics by cache type
   */
  byType: Record<CacheType, CacheTypeStatistics>;
  
  /**
   * Expiration statistics
   */
  expiration: ExpirationStatistics;
  
  /**
   * Timestamp when statistics were collected
   */
  timestamp: Date;
}

/**
 * Options for calculating cache statistics
 */
export interface StatisticsOptions {
  /**
   * Whether to include expired entries
   */
  includeExpired?: boolean;
  
  /**
   * Filter by cache type
   */
  cacheType?: CacheType;
  
  /**
   * Filter by key pattern
   */
  pattern?: string;
  
  /**
   * User ID (required for Supabase cache)
   */
  userId?: string;
  
  /**
   * Maximum number of largest entries to return
   */
  maxLargestEntries?: number;
}

/**
 * Cache Statistics Calculator - Provides utilities for calculating cache statistics
 */
export class CacheStatisticsCalculator {
  private cacheInspector: CacheInspector;
  
  /**
   * Constructor
   */
  constructor(cacheInspector: CacheInspector) {
    this.cacheInspector = cacheInspector;
  }
  
  /**
   * Calculate cache size information for a specific cache type
   */
  public async calculateCacheSize(
    cacheType: CacheType,
    options: {
      includeExpired?: boolean;
      pattern?: string;
      userId?: string;
    } = {}
  ): Promise<CacheSizeInfo> {
    try {
      const { includeExpired = false, pattern, userId } = options;
      
      // Get all entries for the specified cache type
      const entries = await this.cacheInspector.getAllEntries({
        cacheType,
        pattern,
        includeExpired,
        includeData: false,
        userId
      });
      
      // Calculate total size
      let totalSize = 0;
      const entriesWithSize: Array<{ key: string; size: number }> = [];
      
      for (const entry of entries) {
        if (entry.size !== undefined) {
          totalSize += entry.size;
          entriesWithSize.push({ key: entry.key, size: entry.size });
        }
      }
      
      // Sort entries by size (largest first)
      entriesWithSize.sort((a, b) => b.size - a.size);
      
      return {
        entryCount: entries.length,
        totalSize: totalSize > 0 ? totalSize : undefined,
        keysBySize: entriesWithSize.length > 0 ? entriesWithSize : undefined
      };
    } catch (error) {
      logger.error('Error calculating cache size', {
        error: error instanceof Error ? error.message : String(error),
        cacheType
      });
      
      return { entryCount: 0 };
    }
  }
  
  /**
   * Count entries by status (active/expired) for a specific cache type
   */
  public async countEntriesByStatus(
    cacheType: CacheType,
    options: {
      pattern?: string;
      userId?: string;
    } = {}
  ): Promise<CacheStatusCounts> {
    try {
      const { pattern, userId } = options;
      
      // Get all entries including expired ones
      const entries = await this.cacheInspector.getAllEntries({
        cacheType,
        pattern,
        includeExpired: true,
        includeData: false,
        userId
      });
      
      // Count active and expired entries
      let active = 0;
      let expired = 0;
      
      for (const entry of entries) {
        if (entry.isExpired) {
          expired++;
        } else {
          active++;
        }
      }
      
      return {
        active,
        expired,
        total: active + expired
      };
    } catch (error) {
      logger.error('Error counting entries by status', {
        error: error instanceof Error ? error.message : String(error),
        cacheType
      });
      
      return { active: 0, expired: 0, total: 0 };
    }
  }
  
  /**
   * Calculate expiration statistics for cache entries
   */
  public async calculateExpirationStatistics(
    options: {
      cacheType?: CacheType;
      pattern?: string;
      userId?: string;
    } = {}
  ): Promise<ExpirationStatistics> {
    try {
      const { cacheType, pattern, userId } = options;
      
      // Get all entries including expired ones
      const entries = await this.cacheInspector.getAllEntries({
        cacheType,
        pattern,
        includeExpired: true,
        includeData: false,
        userId
      });
      
      // Initialize counters
      let expiringInNextMinute = 0;
      let expiringInNextHour = 0;
      let expiringInNextDay = 0;
      let expiringInNextWeek = 0;
      let expiringLater = 0;
      let expired = 0;
      
      // Current time
      const now = new Date();
      
      // Calculate time thresholds
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Categorize entries by expiration time
      for (const entry of entries) {
        if (entry.isExpired) {
          expired++;
        } else {
          const expiresAt = entry.expiresAt;
          
          if (expiresAt <= oneMinuteFromNow) {
            expiringInNextMinute++;
          } else if (expiresAt <= oneHourFromNow) {
            expiringInNextHour++;
          } else if (expiresAt <= oneDayFromNow) {
            expiringInNextDay++;
          } else if (expiresAt <= oneWeekFromNow) {
            expiringInNextWeek++;
          } else {
            expiringLater++;
          }
        }
      }
      
      return {
        expiringInNextMinute,
        expiringInNextHour,
        expiringInNextDay,
        expiringInNextWeek,
        expiringLater,
        expired
      };
    } catch (error) {
      logger.error('Error calculating expiration statistics', {
        error: error instanceof Error ? error.message : String(error),
        cacheType: options.cacheType
      });
      
      return {
        expiringInNextMinute: 0,
        expiringInNextHour: 0,
        expiringInNextDay: 0,
        expiringInNextWeek: 0,
        expiringLater: 0,
        expired: 0
      };
    }
  }
  
  /**
   * Calculate statistics for a specific cache type
   */
  public async calculateTypeStatistics(
    cacheType: CacheType,
    options: {
      includeExpired?: boolean;
      pattern?: string;
      userId?: string;
      maxLargestEntries?: number;
    } = {}
  ): Promise<CacheTypeStatistics> {
    try {
      const { 
        includeExpired = false, 
        pattern, 
        userId,
        maxLargestEntries = 5
      } = options;
      
      // Get size information
      const sizeInfo = await this.calculateCacheSize(cacheType, {
        includeExpired,
        pattern,
        userId
      });
      
      // Get status counts
      const statusCounts = await this.countEntriesByStatus(cacheType, {
        pattern,
        userId
      });
      
      // Calculate average size
      const averageSize = sizeInfo.totalSize !== undefined && sizeInfo.entryCount > 0
        ? sizeInfo.totalSize / sizeInfo.entryCount
        : undefined;
      
      // Get largest entries
      const largestEntries = sizeInfo.keysBySize
        ? sizeInfo.keysBySize.slice(0, maxLargestEntries)
        : undefined;
      
      return {
        cacheType,
        counts: statusCounts,
        totalSize: sizeInfo.totalSize,
        averageSize,
        largestEntries
      };
    } catch (error) {
      logger.error('Error calculating type statistics', {
        error: error instanceof Error ? error.message : String(error),
        cacheType
      });
      
      return {
        cacheType,
        counts: { active: 0, expired: 0, total: 0 }
      };
    }
  }
  
  /**
   * Calculate complete statistics for all cache types
   */
  public async calculateCompleteStatistics(
    options: StatisticsOptions = {}
  ): Promise<CompleteStatistics> {
    try {
      const { 
        includeExpired = false, 
        cacheType, 
        pattern, 
        userId,
        maxLargestEntries = 5
      } = options;
      
      // Determine which cache types to include
      const cacheTypes = cacheType 
        ? [cacheType] 
        : Object.values(CacheType);
      
      // Initialize statistics
      const byType: Record<CacheType, CacheTypeStatistics> = {} as Record<CacheType, CacheTypeStatistics>;
      let totalEntries = 0;
      let totalSize = 0;
      let hasSizeInfo = false;
      
      // Calculate statistics for each cache type
      for (const type of cacheTypes) {
        const typeStats = await this.calculateTypeStatistics(type, {
          includeExpired,
          pattern,
          userId,
          maxLargestEntries
        });
        
        byType[type] = typeStats;
        totalEntries += typeStats.counts.total;
        
        if (typeStats.totalSize !== undefined) {
          totalSize += typeStats.totalSize;
          hasSizeInfo = true;
        }
      }
      
      // Calculate expiration statistics
      const expiration = await this.calculateExpirationStatistics({
        cacheType,
        pattern,
        userId
      });
      
      return {
        totalEntries,
        totalSize: hasSizeInfo ? totalSize : undefined,
        byType,
        expiration,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error calculating complete statistics', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty statistics
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
  }
}

// Export singleton instance
export const cacheStatisticsCalculator = new CacheStatisticsCalculator(new CacheInspector());