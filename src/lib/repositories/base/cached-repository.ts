import { BaseRepository } from './base-repository';
import { getLogger } from '@/src/lib/logging';

const logger = getLogger('CachedRepository');

/**
 * Cache options
 */
export interface CacheOptions {
  /**
   * Time to live in milliseconds
   * @default 60000 (1 minute)
   */
  ttl?: number;
  
  /**
   * Maximum number of items to cache
   * @default 100
   */
  maxItems?: number;
  
  /**
   * Whether to cache findById results
   * @default true
   */
  cacheById?: boolean;
  
  /**
   * Whether to cache findAll results
   * @default false
   */
  cacheAll?: boolean;
  
  /**
   * Whether to cache count results
   * @default false
   */
  cacheCount?: boolean;
}

/**
 * Cache entry
 */
interface CacheEntry<T> {
  /**
   * Cached data
   */
  data: T;
  
  /**
   * Expiration timestamp
   */
  expiresAt: number;
}

/**
 * Repository with caching
 * @template T Entity type
 * @template ID ID type
 */
export class CachedRepository<T extends { id: ID }, ID = string> extends BaseRepository<T, ID> {
  /**
   * Cache for findById results
   */
  private byIdCache = new Map<string, CacheEntry<T | null>>();
  
  /**
   * Cache for findAll results
   */
  private allCache = new Map<string, CacheEntry<T[]>>();
  
  /**
   * Cache for count results
   */
  private countCache = new Map<string, CacheEntry<number>>();
  
  /**
   * Create a new cached repository
   * @param tableName Supabase table name
   * @param options Cache options
   * @param idField ID field name
   * @param softDeleteField Soft delete field name (if applicable)
   */
  constructor(
    tableName: string,
    private readonly options: CacheOptions = {},
    idField: string = 'id',
    softDeleteField?: string
  ) {
    super(tableName, idField, softDeleteField);
    
    // Set default options
    this.options = {
      ttl: 60000, // 1 minute
      maxItems: 100,
      cacheById: true,
      cacheAll: false,
      cacheCount: false,
      ...options
    };
  }
  
  /**
   * Find an entity by ID
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: ID): Promise<T | null> {
    // Check if caching is enabled
    if (!this.options.cacheById) {
      return super.findById(id);
    }
    
    // Generate cache key
    const cacheKey = String(id ?? '');
    
    // Check cache
    const cached = this.byIdCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Cache hit for findById', { id, tableName: this.tableName });
      return cached.data;
    }
    
    // Get from database
    const result = await super.findById(id);
    
    // Cache result
    this.byIdCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + (this.options.ttl || 60000)
    });
    
    // Ensure cache doesn't exceed max size
    if (this.byIdCache.size > (this.options.maxItems || 100)) {
      // Remove oldest entry
      const oldestKey = this.byIdCache.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.byIdCache.delete(oldestKey);
      }
    }
    
    return result;
  }
  
  /**
   * Find all entities
   * @param filters Optional filters
   * @returns Array of entities
   */
  async findAll(filters?: Record<string, unknown>): Promise<T[]> {
    // Check if caching is enabled
    if (!this.options.cacheAll) {
      return super.findAll(filters);
    }
    
    // Generate cache key
    const cacheKey = filters ? JSON.stringify(filters) : 'all';
    
    // Check cache
    const cached = this.allCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Cache hit for findAll', { filters, tableName: this.tableName });
      return cached.data;
    }
    
    // Get from database
    const result = await super.findAll(filters);
    
    // Cache result
    this.allCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + (this.options.ttl || 60000)
    });
    
    // Ensure cache doesn't exceed max size
    if (this.allCache.size > (this.options.maxItems || 100)) {
      // Remove oldest entry
      const oldestKey = this.allCache.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.allCache.delete(oldestKey);
      }
    }
    
    return result;
  }
  
  /**
   * Count entities
   * @param filters Optional filters
   * @returns Number of entities
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    // Check if caching is enabled
    if (!this.options.cacheCount) {
      return super.count(filters);
    }
    
    // Generate cache key
    const cacheKey = filters ? JSON.stringify(filters) : 'all';
    
    // Check cache
    const cached = this.countCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Cache hit for count', { filters, tableName: this.tableName });
      return cached.data;
    }
    
    // Get from database
    const result = await super.count(filters);
    
    // Cache result
    this.countCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + (this.options.ttl || 60000)
    });
    
    // Ensure cache doesn't exceed max size
    if (this.countCache.size > (this.options.maxItems || 100)) {
      // Remove oldest entry
      const oldestKey = this.countCache.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.countCache.delete(oldestKey);
      }
    }
    
    return result;
  }
  
  /**
   * Create a new entity
   * @param entity Entity to create
   * @returns Created entity
   */
  async create(entity: Omit<T, 'id'>): Promise<T> {
    // Create entity
    const result = await super.create(entity);
    
    // Invalidate caches
    this.invalidateAllCache();
    this.invalidateCountCache();
    
    return result;
  }
  
  /**
   * Update an entity
   * @param id Entity ID
   * @param entity Entity data to update
   * @returns Updated entity or null if not found
   */
  async update(id: ID, entity: Partial<T>): Promise<T | null> {
    // Update entity
    const result = await super.update(id, entity);
    
    // Invalidate caches
    this.invalidateByIdCache(id);
    this.invalidateAllCache();
    
    return result;
  }
  
  /**
   * Delete an entity
   * @param id Entity ID
   * @returns True if deleted, false if not found
   */
  async delete(id: ID): Promise<boolean> {
    // Delete entity
    const result = await super.delete(id);
    
    // Invalidate caches
    this.invalidateByIdCache(id);
    this.invalidateAllCache();
    this.invalidateCountCache();
    
    return result;
  }
  
  /**
   * Soft delete an entity
   * @param id Entity ID
   * @returns True if soft deleted, false if not found
   */
  async softDelete(id: ID): Promise<boolean> {
    // Soft delete entity
    const result = await super.softDelete(id);
    
    // Invalidate caches
    this.invalidateByIdCache(id);
    this.invalidateAllCache();
    this.invalidateCountCache();
    
    return result;
  }
  
  /**
   * Restore a soft deleted entity
   * @param id Entity ID
   * @returns Restored entity or null if not found
   */
  async restore(id: ID): Promise<T | null> {
    // Restore entity
    const result = await super.restore(id);
    
    // Invalidate caches
    this.invalidateByIdCache(id);
    this.invalidateAllCache();
    this.invalidateCountCache();
    
    return result;
  }
  
  /**
   * Invalidate the cache for a specific entity
   * @param id Entity ID
   */
  invalidateByIdCache(id: ID): void {
    const cacheKey = String(id ?? '');
    this.byIdCache.delete(cacheKey);
  }
  
  /**
   * Invalidate the cache for all entities
   */
  invalidateAllCache(): void {
    this.allCache.clear();
  }
  
  /**
   * Invalidate the cache for count
   */
  invalidateCountCache(): void {
    this.countCache.clear();
  }
  
  /**
   * Invalidate all caches
   */
  invalidateAllCaches(): void {
    this.byIdCache.clear();
    this.allCache.clear();
    this.countCache.clear();
  }
}
