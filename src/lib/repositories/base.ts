import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/src/lib/logging';
import { DatabaseError } from '@/src/lib/errors';

const logger = getLogger('BaseRepository');

/**
 * Options for cached repository
 */
export interface CacheOptions {
  ttl: number;
  cacheById: boolean;
  cacheAll: boolean;
}

/**
 * Base repository interface
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filters?: Record<string, unknown>): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filters?: Record<string, unknown>): Promise<number>;
}

/**
 * Base repository implementation
 */
export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  protected client: SupabaseClient;
  protected tableName: string;

  /**
   * Create a new base repository
   * @param tableName Table name
   */
  constructor(tableName: string) {
    this.tableName = tableName;
    
    // Get Supabase client from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key must be defined in environment variables');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Find an entity by ID
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        logger.error(`Failed to find ${this.tableName} by ID`, { error, id });
        throw new DatabaseError(`Failed to find ${this.tableName} by ID: ${error.message}`);
      }
      
      return data as T | null;
    } catch (error) {
      logger.error(`Error in findById for ${this.tableName}`, { error, id });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to find ${this.tableName} by ID`, { cause: error as Error });
    }
  }

  /**
   * Find all entities with optional filters
   * @param filters Optional filters
   * @returns Array of entities
   */
  async findAll(filters?: Record<string, unknown>): Promise<T[]> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*');
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error(`Failed to find all ${this.tableName}`, { error, filters });
        throw new DatabaseError(`Failed to find all ${this.tableName}: ${error.message}`);
      }
      
      return data as T[];
    } catch (error) {
      logger.error(`Error in findAll for ${this.tableName}`, { error, filters });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to find all ${this.tableName}`, { cause: error as Error });
    }
  }

  /**
   * Create a new entity
   * @param entity Entity data
   * @returns Created entity
   */
  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      const now = new Date().toISOString();
      const entityWithTimestamps = {
        ...entity,
        criado_em: now,
        atualizado_em: now
      };
      
      const { data, error } = await this.client
        .from(this.tableName)
        .insert(entityWithTimestamps)
        .select()
        .single();
      
      if (error) {
        logger.error(`Failed to create ${this.tableName}`, { error, entity });
        throw new DatabaseError(`Failed to create ${this.tableName}: ${error.message}`);
      }
      
      return data as T;
    } catch (error) {
      logger.error(`Error in create for ${this.tableName}`, { error, entity });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to create ${this.tableName}`, { cause: error as Error });
    }
  }

  /**
   * Update an entity
   * @param id Entity ID
   * @param entity Entity data
   * @returns Updated entity or null if not found
   */
  async update(id: string, entity: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .update({
          ...entity,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        logger.error(`Failed to update ${this.tableName}`, { error, id, entity });
        throw new DatabaseError(`Failed to update ${this.tableName}: ${error.message}`);
      }
      
      return data as T;
    } catch (error) {
      logger.error(`Error in update for ${this.tableName}`, { error, id, entity });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to update ${this.tableName}`, { cause: error as Error });
    }
  }

  /**
   * Delete an entity
   * @param id Entity ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        logger.error(`Failed to delete ${this.tableName}`, { error, id });
        throw new DatabaseError(`Failed to delete ${this.tableName}: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error in delete for ${this.tableName}`, { error, id });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to delete ${this.tableName}`, { cause: error as Error });
    }
  }

  /**
   * Count entities with optional filters
   * @param filters Optional filters
   * @returns Count of entities
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { count, error } = await query;
      
      if (error) {
        logger.error(`Failed to count ${this.tableName}`, { error, filters });
        throw new DatabaseError(`Failed to count ${this.tableName}: ${error.message}`);
      }
      
      return count || 0;
    } catch (error) {
      logger.error(`Error in count for ${this.tableName}`, { error, filters });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to count ${this.tableName}`, { cause: error as Error });
    }
  }
}

/**
 * Cached repository implementation
 */
export class CachedRepository<T extends { id: string }> extends BaseRepository<T> {
  private cache: Map<string, T> = new Map();
  private allCache: T[] | null = null;
  private cacheTimestamp: number = 0;
  private options: CacheOptions;

  /**
   * Create a new cached repository
   * @param tableName Table name
   * @param options Cache options
   */
  constructor(tableName: string, options: CacheOptions) {
    super(tableName);
    this.options = options;
  }

  /**
   * Find an entity by ID with caching
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: string): Promise<T | null> {
    // Check if caching by ID is enabled and cache is valid
    if (this.options.cacheById && this.cache.has(id)) {
      const now = Date.now();
      const cachedItem = this.cache.get(id);
      
      if (cachedItem && now - this.cacheTimestamp < this.options.ttl) {
        return cachedItem;
      }
    }
    
    // Cache miss or disabled, fetch from database
    const result = await super.findById(id);
    
    // Update cache if enabled
    if (this.options.cacheById && result) {
      this.cache.set(id, result);
      this.cacheTimestamp = Date.now();
    }
    
    return result;
  }

  /**
   * Find all entities with caching
   * @param filters Optional filters
   * @returns Array of entities
   */
  async findAll(filters?: Record<string, unknown>): Promise<T[]> {
    // If no filters and caching all is enabled, check cache
    if (!filters && this.options.cacheAll && this.allCache) {
      const now = Date.now();
      
      if (now - this.cacheTimestamp < this.options.ttl) {
        return this.allCache;
      }
    }
    
    // Cache miss or disabled, fetch from database
    const result = await super.findAll(filters);
    
    // Update cache if enabled and no filters
    if (!filters && this.options.cacheAll) {
      this.allCache = result;
      this.cacheTimestamp = Date.now();
    }
    
    return result;
  }

  /**
   * Create a new entity and invalidate cache
   * @param entity Entity data
   * @returns Created entity
   */
  async create(entity: Omit<T, 'id'>): Promise<T> {
    const result = await super.create(entity);
    this.invalidateAllCaches();
    return result;
  }

  /**
   * Update an entity and invalidate cache
   * @param id Entity ID
   * @param entity Entity data
   * @returns Updated entity or null if not found
   */
  async update(id: string, entity: Partial<T>): Promise<T | null> {
    const result = await super.update(id, entity);
    
    if (result) {
      this.invalidateByIdCache(id);
      this.invalidateAllCache();
    }
    
    return result;
  }

  /**
   * Delete an entity and invalidate cache
   * @param id Entity ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await super.delete(id);
    
    if (result) {
      this.invalidateByIdCache(id);
      this.invalidateAllCache();
    }
    
    return result;
  }

  /**
   * Invalidate cache for a specific ID
   * @param id Entity ID
   */
  protected invalidateByIdCache(id: string): void {
    if (this.options.cacheById) {
      this.cache.delete(id);
    }
  }

  /**
   * Invalidate all cache
   */
  protected invalidateAllCache(): void {
    if (this.options.cacheAll) {
      this.allCache = null;
    }
  }

  /**
   * Invalidate all caches
   */
  protected invalidateAllCaches(): void {
    this.invalidateAllCache();
    if (this.options.cacheById) {
      this.cache.clear();
    }
  }
}