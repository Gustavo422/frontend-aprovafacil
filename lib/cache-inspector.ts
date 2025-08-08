import { cacheManager, CacheType } from './cache-manager';
import { logger } from './logger';
import { createClient } from './supabase';
import type { 
  CacheRelationshipGraph, 
  CacheGraphNode,
  BuildGraphOptions
} from './cache-relationship-graph';
import type {
  CacheSizeInfo,
  CacheStatusCounts,
  CacheTypeStatistics,
  ExpirationStatistics,
  CompleteStatistics,
  StatisticsOptions
} from './cache-statistics';

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  /**
   * Cache key
   */
  key: string;
  
  /**
   * Cache type
   */
  cacheType: CacheType;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Expiration timestamp
   */
  expiresAt: Date;
  
  /**
   * Whether the entry is expired
   */
  isExpired: boolean;
  
  /**
   * Size of the entry in bytes (if available)
   */
  size?: number;
  
  /**
   * Related keys
   */
  relatedKeys?: string[];
}

/**
 * Cache entry information including data
 */
export interface CacheEntryInfo extends CacheEntryMetadata {
  /**
   * The cached data
   */
  data?: unknown;
}

/**
 * Options for retrieving cache keys
 */
export interface GetKeysOptions {
  /**
   * Filter by cache type
   */
  cacheType?: CacheType;
  
  /**
   * Filter by key pattern
   */
  pattern?: string;
  
  /**
   * Whether to include expired entries
   */
  includeExpired?: boolean;
  
  /**
   * User ID (required for Supabase cache)
   */
  usuarioId?: string;
}

/**
 * Options for retrieving all cache entries
 */
export interface GetAllEntriesOptions extends GetKeysOptions {
  /**
   * Whether to include the actual data
   */
  includeData?: boolean;
  
  /**
   * Maximum number of entries to return
   */
  limit?: number;
  
  /**
   * Number of entries to skip
   */
  offset?: number;
}

/**
 * Cache Inspector - Provides utilities to examine cache contents
 */
export class CacheInspector {
  /**
   * Get all cache keys
   */
  public async getKeys(options: GetKeysOptions = {}): Promise<string[]> {
    const { cacheType, pattern, includeExpired = false, usuarioId } = options;
    const now = new Date();
    const keys: string[] = [];
    
    try {
      // Get keys from memory cache
      if (!cacheType || cacheType === CacheType.MEMORY) {
        const memoryKeys = Array.from(cacheManager['memoryCache'].keys());
        
        for (const key of memoryKeys) {
          const entry = cacheManager['memoryCache'].get(key);
          
          // Skip expired entries if not including them
          if (!includeExpired && entry && entry.expiresAt < now) {
            continue;
          }
          
          keys.push(key);
        }
      }
      
      // Get keys from localStorage
      if ((!cacheType || cacheType === CacheType.LOCAL_STORAGE) && typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          
          if (storageKey && storageKey.startsWith('cache:')) {
            const key = storageKey.substring(6); // Remove 'cache:' prefix
            
            // Skip expired entries if not including them
            if (!includeExpired) {
              try {
                const item = localStorage.getItem(storageKey);
                if (item) {
                  const entry = JSON.parse(item);
                  if (new Date(entry.expiresAt) < now) {
                    continue;
                  }
                }
              } catch {
                // Ignore parsing errors
              }
            }
            
            keys.push(key);
          }
        }
      }
      
      // Get keys from sessionStorage
      if ((!cacheType || cacheType === CacheType.SESSION_STORAGE) && typeof window !== 'undefined') {
        for (let i = 0; i < sessionStorage.length; i++) {
          const storageKey = sessionStorage.key(i);
          
          if (storageKey && storageKey.startsWith('cache:')) {
            const key = storageKey.substring(6); // Remove 'cache:' prefix
            
            // Skip expired entries if not including them
            if (!includeExpired) {
              try {
                const item = sessionStorage.getItem(storageKey);
                if (item) {
                  const entry = JSON.parse(item);
                  if (new Date(entry.expiresAt) < now) {
                    continue;
                  }
                }
              } catch {
                // Ignore parsing errors
              }
            }
            
            keys.push(key);
          }
        }
      }
      
      // Get keys from Supabase
      if ((!cacheType || cacheType === CacheType.SUPABASE) && usuarioId) {
        const supabaseKeys = await this.getSupabaseKeys(usuarioId, includeExpired);
        keys.push(...supabaseKeys);
      }
      
      // Filter by pattern if provided
      if (pattern) {
        const regex = new RegExp(pattern);
        return keys.filter(key => regex.test(key));
      }
      
      return keys;
    } catch (err) {
      logger.error('Error getting cache keys', {
        error: err instanceof Error ? err.message : String(err),
        cacheType
      });
      
      return [];
    }
  }
  
  /**
   * Get keys from Supabase cache
   */
  private async getSupabaseKeys(usuarioId: string, includeExpired: boolean): Promise<string[]> {
    try {
      // Só executar no lado do cliente
      if (typeof window === 'undefined') {
        return [];
      }
      
      const supabase = createClient();
      let query = supabase
        .from('user_performance_cache')
        .select('cache_key')
        .eq('usuario_id', usuarioId);
      
      // Filter out expired entries if needed
      if (!includeExpired) {
        query = query.gt('expires_at', new Date().toISOString());
      }
      
      const { data, error } = await query;
      
      if (error || !data) {
        logger.error('Error fetching Supabase cache keys', {
          error: error?.message || 'No data returned',
          usuarioId
        });
        return [];
      }
      
      return data.map(item => item.cache_key);
    } catch (err) {
      logger.error('Error fetching Supabase cache keys', {
        error: err instanceof Error ? err.message : String(err),
        usuarioId
      });
      return [];
    }
  }
  
  /**
   * Get cache entry metadata
   */
  public async getEntryMetadata(
    key: string,
    cacheType: CacheType,
    usuarioId?: string
  ): Promise<CacheEntryMetadata | null> {
    try {
      const now = new Date();
      
      switch (cacheType) {
        case CacheType.MEMORY: {
          const entry = cacheManager['memoryCache'].get(key);
          
          if (!entry) {
            return null;
          }
          
          return {
            key,
            cacheType,
            createdAt: entry.createdAt,
            expiresAt: entry.expiresAt,
            isExpired: entry.expiresAt < now,
            relatedKeys: entry.relatedKeys,
            // Estimate size in bytes
            size: this.estimateObjectSize(entry.data)
          };
        }
        
        case CacheType.LOCAL_STORAGE: {
          if (typeof window === 'undefined') {
            return null;
          }
          
          const item = localStorage.getItem(`cache:${key}`);
          if (!item) {
            return null;
          }
          
          const entry = JSON.parse(item);
          
          return {
            key,
            cacheType,
            createdAt: new Date(entry.createdAt),
            expiresAt: new Date(entry.expiresAt),
            isExpired: new Date(entry.expiresAt) < now,
            relatedKeys: entry.relatedKeys,
            size: item.length * 2 // Rough estimate: 2 bytes per character
          };
        }
        
        case CacheType.SESSION_STORAGE: {
          if (typeof window === 'undefined') {
            return null;
          }
          
          const item = sessionStorage.getItem(`cache:${key}`);
          if (!item) {
            return null;
          }
          
          const entry = JSON.parse(item);
          
          return {
            key,
            cacheType,
            createdAt: new Date(entry.createdAt),
            expiresAt: new Date(entry.expiresAt),
            isExpired: new Date(entry.expiresAt) < now,
            relatedKeys: entry.relatedKeys,
            size: item.length * 2 // Rough estimate: 2 bytes per character
          };
        }
        
        case CacheType.SUPABASE: {
          if (!usuarioId) {
            logger.error('usuarioId is required for Supabase cache');
            return null;
          }
          
          // Só executar no lado do cliente
          if (typeof window === 'undefined') {
            return null;
          }
          
          const supabase = createClient();
          const { data, error } = await supabase
            .from('user_performance_cache')
            .select('cache_key, cache_data, expires_at, atualizado_em, related_keys')
            .eq('usuario_id', usuarioId)
            .eq('cache_key', key)
            .single();
          
          if (error || !data) {
            return null;
          }
          
          const expiresAt = new Date(data.expires_at);
          
          return {
            key,
            cacheType,
            createdAt: new Date(data.atualizado_em),
            expiresAt,
            isExpired: expiresAt < now,
            relatedKeys: data.related_keys,
            // Estimate size based on JSON string length
            size: JSON.stringify(data.cache_data).length * 2
          };
        }
        
        default:
          return null;
      }
    } catch (err) {
      logger.error('Error getting cache entry metadata', {
        error: err instanceof Error ? err.message : String(err),
        key,
        cacheType
      });
      
      return null;
    }
  }
  
  /**
   * Get cache entry data
   */
  public async getEntryData<T>(
    key: string,
    cacheType: CacheType,
    usuarioId?: string
  ): Promise<T | null> {
    try {
      return await cacheManager.get<T>(key, { type: cacheType, usuarioId });
    } catch (err) {
      logger.error('Error getting cache entry data', {
        error: err instanceof Error ? err.message : String(err),
        key,
        cacheType
      });
      
      return null;
    }
  }
  
  /**
   * Get all cache entries with metadata
   */
  public async getAllEntries(options: GetAllEntriesOptions = {}): Promise<CacheEntryInfo[]> {
    const {
      cacheType,
      pattern,
      includeExpired = false,
      includeData = false,
      limit,
      offset = 0,
      usuarioId
    } = options;
    
    try {
      // Get all keys matching the criteria
      const keys = await this.getKeys({ cacheType, pattern, includeExpired, usuarioId });
      
      // Apply offset and limit
      const paginatedKeys = keys.slice(offset, limit ? offset + limit : undefined);
      
      // Get metadata for each key
      const entries: CacheEntryInfo[] = [];
      
      for (const key of paginatedKeys) {
        // Determine the cache type if not specified
        let entryType = cacheType;
        
        if (!entryType) {
          // Try to determine the cache type based on where the key exists
          if (cacheManager['memoryCache'].has(key)) {
            entryType = CacheType.MEMORY;
          } else if (typeof window !== 'undefined' && localStorage.getItem(`cache:${key}`)) {
            entryType = CacheType.LOCAL_STORAGE;
          } else if (typeof window !== 'undefined' && sessionStorage.getItem(`cache:${key}`)) {
            entryType = CacheType.SESSION_STORAGE;
          } else {
            // Default to memory if we can't determine
            entryType = CacheType.MEMORY;
          }
        }
        
        const metadata = await this.getEntryMetadata(key, entryType, usuarioId);
        
        if (metadata) {
          const entry: CacheEntryInfo = { ...metadata };
          
          // Include data if requested
          if (includeData) {
            entry.data = await this.getEntryData(key, entryType, usuarioId);
          }
          
          entries.push(entry);
        }
      }
      
      return entries;
    } catch (err) {
      logger.error('Error getting all cache entries', {
        error: err instanceof Error ? err.message : String(err),
        cacheType
      });
      
      return [];
    }
  }
  
  /**
   * Get related keys for a specific key
   */
  public async getRelatedKeys(key: string): Promise<string[]> {
    try {
      // Get all related keys from the cache manager's key relationships
      const relatedKeys = cacheManager['keyRelationships'].get(key);
      
      if (!relatedKeys) {
        return [];
      }
      
      return Array.from(relatedKeys);
    } catch (err) {
      logger.error('Error getting related keys', {
        error: err instanceof Error ? err.message : String(err),
        key
      });
      
      return [];
    }
  }
  
  /**
   * Get all related keys recursively for a specific key
   * @param key The cache key to find relationships for
   * @param maxDepth Maximum depth to traverse (default: 3)
   * @param visited Set of already visited keys to prevent cycles
   */
  public async getAllRelatedKeysRecursive(
    key: string, 
    maxDepth = 3,
    visited: Set<string> = new Set()
  ): Promise<Set<string>> {
    // Prevent infinite recursion
    if (visited.has(key) || maxDepth <= 0) {
      return visited;
    }
    
    // Mark this key as visited
    visited.add(key);
    
    try {
      // Get direct related keys
      const relatedKeys = await this.getRelatedKeys(key);
      
      // Recursively get related keys for each direct relation
      for (const relatedKey of relatedKeys) {
        if (!visited.has(relatedKey)) {
          await this.getAllRelatedKeysRecursive(relatedKey, maxDepth - 1, visited);
        }
      }
      
      return visited;
    } catch (err) {
      logger.error('Error getting recursive related keys', {
        error: err instanceof Error ? err.message : String(err),
        key
      });
      
      return visited;
    }
  }
  
  /**
   * Build a relationship graph for visualization
   * @param options Options for building the graph
   */
  public async buildRelationshipGraph(options: BuildGraphOptions): Promise<CacheRelationshipGraph> {
    const { 
      rootKey, 
      maxDepth = 3, 
      maxNodes = 100,
      includeExpired = false,
      includeMetadata = false
    } = options;
    
    const graph: CacheRelationshipGraph = {
      nodes: [],
      edges: []
    };
    
    const visitedKeys = new Set<string>();
    const nodeMap = new Map<string, CacheGraphNode>();
    
    try {
      // Start with the root key
      await this.buildGraphRecursive(
        rootKey, 
        graph, 
        visitedKeys, 
        nodeMap, 
        maxDepth, 
        maxNodes,
        includeExpired,
        includeMetadata
      );
      
      return graph;
    } catch (err) {
      logger.error('Error building relationship graph', {
        error: err instanceof Error ? err.message : String(err),
        rootKey
      });
      
      return graph;
    }
  }
  
  /**
   * Recursively build the relationship graph
   */
  private async buildGraphRecursive(
    key: string,
    graph: CacheRelationshipGraph,
    visitedKeys: Set<string>,
    nodeMap: Map<string, CacheGraphNode>,
    depth: number,
    maxNodes: number,
    includeExpired: boolean,
    includeMetadata: boolean
  ): Promise<void> {
    // Stop if we've reached the maximum depth or nodes
    if (depth <= 0 || visitedKeys.size >= maxNodes) {
      return;
    }
    
    // Mark this key as visited
    visitedKeys.add(key);
    
    // Try to determine the cache type for this key
    let cacheType: CacheType | undefined;
    
    if (cacheManager['memoryCache'].has(key)) {
      cacheType = CacheType.MEMORY;
    } else if (typeof window !== 'undefined' && localStorage.getItem(`cache:${key}`)) {
      cacheType = CacheType.LOCAL_STORAGE;
    } else if (typeof window !== 'undefined' && sessionStorage.getItem(`cache:${key}`)) {
      cacheType = CacheType.SESSION_STORAGE;
    } else {
      // Default to memory if we can't determine
      cacheType = CacheType.MEMORY;
    }
    
    // Get metadata for this key
    const metadata = await this.getEntryMetadata(key, cacheType);
    
    // Skip if expired and we're not including expired entries
    if (metadata?.isExpired && !includeExpired) {
      return;
    }
    
    // Create node if it doesn't exist
    if (!nodeMap.has(key)) {
      const node: CacheGraphNode = {
        id: key,
        label: this.shortenKeyForDisplay(key),
        type: cacheType,
        expired: metadata?.isExpired || false,
        size: metadata?.size
      };
      
      // Add additional metadata if requested
      if (includeMetadata && metadata) {
        node.metadata = {
          createdAt: metadata.createdAt,
          expiresAt: metadata.expiresAt,
          cacheType: metadata.cacheType
        };
      }
      
      graph.nodes.push(node);
      nodeMap.set(key, node);
    }
    
    // Get related keys
    const relatedKeys = await this.getRelatedKeys(key);
    
    // Process each related key
    for (const relatedKey of relatedKeys) {
      // Skip if we've already visited this key
      if (visitedKeys.has(relatedKey)) {
        // Still add the edge if the node exists
        if (nodeMap.has(relatedKey)) {
          graph.edges.push({
            source: key,
            target: relatedKey
          });
        }
        continue;
      }
      
      // Add edge
      graph.edges.push({
        source: key,
        target: relatedKey
      });
      
      // Recursively process related key
      await this.buildGraphRecursive(
        relatedKey,
        graph,
        visitedKeys,
        nodeMap,
        depth - 1,
        maxNodes,
        includeExpired,
        includeMetadata
      );
    }
  }
  
  /**
   * Shorten a key for display in the graph
   */
  private shortenKeyForDisplay(key: string, maxLength = 30): string {
    if (key.length <= maxLength) {
      return key;
    }
    
    // Try to intelligently shorten the key
    const parts = key.split(':');
    
    if (parts.length > 2) {
      // Keep first and last part, shorten middle parts
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      
      // Calculate how much space we have for middle parts
      const middleSpace = maxLength - firstPart.length - lastPart.length - 5; // 5 for ":" and "..."
      
      if (middleSpace > 0) {
        return `${firstPart}:...${lastPart.substring(0, middleSpace)}`;
      } 
        // Not enough space, just truncate
        return `${key.substring(0, maxLength - 3)}...`;
      
    } 
      // Simple truncation
      return `${key.substring(0, maxLength - 3)}...`;
    
  }
  
  /**
   * Estimate the size of an object in bytes
   */
  private estimateObjectSize(obj: unknown): number {
    try {
      const jsonString = JSON.stringify(obj);
      return jsonString.length * 2; // Rough estimate: 2 bytes per character
    } catch {
      // If we can't stringify, make a rough guess
      return 1024; // Default to 1KB
    }
  }
  
  /**
   * Calculate cache size information for a specific cache type
   */
  public async calculateCacheSize(
    cacheType: CacheType,
    options: {
      includeExpired?: boolean;
      pattern?: string;
      usuarioId?: string;
    } = {}
  ): Promise<CacheSizeInfo> {
    try {
      const { includeExpired = false, pattern, usuarioId } = options;
      
      // Get all entries for the specified cache type
      const entries = await this.getAllEntries({
        cacheType,
        pattern,
        includeExpired,
        includeData: false,
        usuarioId
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
    } catch (err) {
      logger.error('Error calculating cache size', {
        error: err instanceof Error ? err.message : String(err),
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
      usuarioId?: string;
    } = {}
  ): Promise<CacheStatusCounts> {
    try {
      const { pattern, usuarioId } = options;
      
      // Get all entries including expired ones
      const entries = await this.getAllEntries({
        cacheType,
        pattern,
        includeExpired: true,
        includeData: false,
        usuarioId
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
    } catch (err) {
      logger.error('Error counting entries by status', {
        error: err instanceof Error ? err.message : String(err),
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
      usuarioId?: string;
    } = {}
  ): Promise<ExpirationStatistics> {
    try {
      const { cacheType, pattern, usuarioId } = options;
      
      // Get all entries including expired ones
      const entries = await this.getAllEntries({
        cacheType,
        pattern,
        includeExpired: true,
        includeData: false,
        usuarioId
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
    } catch (err) {
      logger.error('Error calculating expiration statistics', {
        error: err instanceof Error ? err.message : String(err)
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
      usuarioId?: string;
      maxLargestEntries?: number;
    } = {}
  ): Promise<CacheTypeStatistics> {
    try {
      const { 
        includeExpired = false, 
        pattern, 
        usuarioId,
        maxLargestEntries = 5
      } = options;
      
      // Get size information
      const sizeInfo = await this.calculateCacheSize(cacheType, {
        includeExpired,
        pattern,
        usuarioId
      });
      
      // Get status counts
      const statusCounts = await this.countEntriesByStatus(cacheType, {
        pattern,
        usuarioId
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
    } catch (err) {
      logger.error('Error calculating type statistics', {
        error: err instanceof Error ? err.message : String(err),
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
        usuarioId,
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
          usuarioId,
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
        usuarioId
      });
      
      return {
        totalEntries,
        totalSize: hasSizeInfo ? totalSize : undefined,
        byType,
        expiration,
        timestamp: new Date()
      };
    } catch (err) {
      logger.error('Error calculating complete statistics', {
        error: err instanceof Error ? err.message : String(err)
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
export const cacheInspector = new CacheInspector();