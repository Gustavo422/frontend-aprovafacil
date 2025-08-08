import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { getLogger } from '@/src/lib/logging';
import { DatabaseError } from '@/src/lib/errors';
import type {
  IFullRepository,
  PaginatedResult
} from './repository.interface';

const logger = getLogger('BaseRepository');

/**
 * Base repository implementation for Supabase
 * @template T Entity type
 * @template ID ID type
 */
export abstract class BaseRepository<T extends { id: ID }, ID = string>
  implements IFullRepository<T, ID> {
  
  /**
   * Create a new base repository
   * @param tableName Supabase table name
   * @param idField ID field name
   * @param softDeleteField Soft delete field name (if applicable)
   */
  constructor(
    protected readonly tableName: string,
    protected readonly idField = 'id',
    protected readonly softDeleteField?: string
  ) {}
  
  /**
   * Retorna o query builder do Supabase para a tabela configurada.
   * O Supabase espera string literal, mas aqui usamos dinâmico por ser um repositório genérico.
   * O uso de 'as any' é necessário para evitar erro de tipagem.
   */
  protected getQueryBuilder() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (supabase.from as any)(this.tableName);
  }
  
  /**
   * Handle Supabase error
   * @param error Error to handle
   * @param operation Operation that caused the error
   * @throws DatabaseError
   */
  protected handleError(error: PostgrestError, operation: string): never {
    logger.error(`Error in ${operation}`, { error, tableName: this.tableName });
    
    throw new DatabaseError(`Database error in ${operation}: ${error.message}`, {
      code: error.code,
      details: {
        hint: error.hint,
        details: error.details,
        tableName: this.tableName,
        operation
      }
    });
  }
  
  /**
   * Find an entity by ID
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  async findById(id: ID): Promise<T | null> {
    try {
      const { data, error } = await this.getQueryBuilder()
        .select('*')
        .eq(this.idField, id as string)
        .maybeSingle();
      if (error) {
        this.handleError(error, 'findById');
      }
      return data as unknown as T | null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in findById', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in findById', { cause: error as Error });
    }
  }
  
  /**
   * Find all entities
   * @param filters Optional filters
   * @returns Array of entities
   */
  async findAll(filters?: Record<string, unknown>): Promise<T[]> {
    try {
      let query = this.getQueryBuilder().select('*');
      
      // Apply soft delete filter if applicable
      if (this.softDeleteField) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query).is(this.softDeleteField, null);
      }
      
      // Apply filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (Array.isArray(value)) query = (query).in(key, value);
            else if (typeof value === 'object') {
              // Handle special operators
              const obj = value as Record<string, unknown>;
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ('eq' in obj) query = (query).eq(key, obj.eq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('neq' in obj) query = (query).neq(key, obj.neq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gt' in obj) query = (query).gt(key, obj.gt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gte' in obj) query = (query).gte(key, obj.gte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lt' in obj) query = (query).lt(key, obj.lt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lte' in obj) query = (query).lte(key, obj.lte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('like' in obj) query = (query).like(key, `%${obj.like}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('ilike' in obj) query = (query).ilike(key, `%${obj.ilike}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('in' in obj && Array.isArray(obj.in)) query = (query).in(key, obj.in);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('is' in obj) query = (query).is(key, obj.is);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              query = (query).eq(key, value);
            }
          }
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        this.handleError(error, 'findAll');
      }
      
      return data as unknown as T[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in findAll', { error, filters, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in findAll', { cause: error as Error });
    }
  }
  
  /**
   * Create a new entity
   * @param entity Entity to create
   * @returns Created entity
   */
  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      const { data, error } = await this.getQueryBuilder()
        .insert(entity)
        .select()
        .single();
      
      if (error) {
        this.handleError(error, 'create');
      }
      
      return data as unknown as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in create', { error, entity, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in create', { cause: error as Error });
    }
  }
  
  /**
   * Update an entity
   * @param id Entity ID
   * @param entity Entity data to update
   * @returns Updated entity or null if not found
   */
  async update(id: ID, entity: Partial<T>): Promise<T | null> {
    try {
      // Check if entity exists
      const exists = await this.exists(id);
      
      if (!exists) {
        return null;
      }
      
      const { data, error } = await this.getQueryBuilder()
        .update(entity)
        .eq(this.idField, id as string)
        .select()
        .single();
      
      if (error) {
        this.handleError(error, 'update');
      }
      
      return data as unknown as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in update', { error, id, entity, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in update', { cause: error as Error });
    }
  }
  
  /**
   * Delete an entity
   * @param id Entity ID
   * @returns True if deleted, false if not found
   */
  async delete(id: ID): Promise<boolean> {
    try {
      // Check if entity exists
      const exists = await this.exists(id);
      
      if (!exists) {
        return false;
      }
      
      const { error } = await this.getQueryBuilder()
        .delete()
        .eq(this.idField, id as string);
      
      if (error) {
        this.handleError(error, 'delete');
      }
      
      return true;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in delete', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in delete', { cause: error as Error });
    }
  }
  
  /**
   * Count entities
   * @param filters Optional filters
   * @returns Number of entities
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    try {
      let query = this.getQueryBuilder().select('*', { count: 'exact', head: true });
      // Apply soft delete filter if applicable
      if (this.softDeleteField) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query).is(this.softDeleteField, null);
      }
      // Apply filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (Array.isArray(value)) query = (query).in(key, value);
            else if (typeof value === 'object') {
              const obj = value as Record<string, unknown>;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ('eq' in obj) query = (query).eq(key, obj.eq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('neq' in obj) query = (query).neq(key, obj.neq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gt' in obj) query = (query).gt(key, obj.gt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gte' in obj) query = (query).gte(key, obj.gte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lt' in obj) query = (query).lt(key, obj.lt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lte' in obj) query = (query).lte(key, obj.lte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('like' in obj) query = (query).like(key, `%${obj.like}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('ilike' in obj) query = (query).ilike(key, `%${obj.ilike}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('in' in obj && Array.isArray(obj.in)) query = (query).in(key, obj.in);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('is' in obj) query = (query).is(key, obj.is);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              query = (query).eq(key, value);
            }
          }
        }
      }
      const { count, error } = await query;
      if (error) {
        this.handleError(error, 'count');
      }
      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in count', { error, filters, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in count', { cause: error as Error });
    }
  }
  
  /**
   * Check if an entity exists
   * @param id Entity ID
   * @returns True if exists, false otherwise
   */
  async exists(id: ID): Promise<boolean> {
    try {
      let query = this.getQueryBuilder()
        .select(this.idField, { count: 'exact', head: true })
        .eq(this.idField, id as string);
      // Apply soft delete filter if applicable
      if (this.softDeleteField) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query).is(this.softDeleteField, null);
      }
      const { count, error } = await query;
      if (error) {
        this.handleError(error, 'exists');
      }
      return (count || 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Unexpected error in exists', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in exists', { cause: error as Error });
    }
  }
  
  /**
   * Find entities with pagination
   * @param page Page number (1-based)
   * @param pageSize Page size
   * @param filters Optional filters
   * @returns Paginated result
   */
  async findPaginated(
    page: number,
    pageSize: number,
    filters?: Record<string, unknown>
  ): Promise<PaginatedResult<T>> {
    try {
      // Validate page and pageSize
      if (page < 1) {
        page = 1;
      }
      
      if (pageSize < 1) {
        pageSize = 10;
      }
      
      // Calculate range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Get total count
      const total = await this.count(filters);
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pageSize);
      
      // Get items
      let query = this.getQueryBuilder()
        .select('*')
        .range(from, to);
      
      // Apply soft delete filter if applicable
      if (this.softDeleteField) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query).is(this.softDeleteField, null);
      }
      
      // Apply filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (Array.isArray(value)) query = (query).in(key, value);
            else if (typeof value === 'object') {
              // Handle special operators
              const obj = value as Record<string, unknown>;
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ('eq' in obj) query = (query).eq(key, obj.eq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('neq' in obj) query = (query).neq(key, obj.neq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gt' in obj) query = (query).gt(key, obj.gt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gte' in obj) query = (query).gte(key, obj.gte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lt' in obj) query = (query).lt(key, obj.lt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lte' in obj) query = (query).lte(key, obj.lte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('like' in obj) query = (query).like(key, `%${obj.like}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('ilike' in obj) query = (query).ilike(key, `%${obj.ilike}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('in' in obj && Array.isArray(obj.in)) query = (query).in(key, obj.in);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('is' in obj) query = (query).is(key, obj.is);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              query = (query).eq(key, value);
            }
          }
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        this.handleError(error, 'findPaginated');
      }
      
      return {
        items: data as unknown as T[],
        total,
        page,
        pageSize,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in findPaginated', {
        error,
        page,
        pageSize,
        filters,
        tableName: this.tableName
      });
      
      throw new DatabaseError('Unexpected error in findPaginated', { cause: error as Error });
    }
  }
  
  /**
   * Soft delete an entity
   * @param id Entity ID
   * @returns True if soft deleted, false if not found
   */
  async softDelete(id: ID): Promise<boolean> {
    // Check if soft delete is supported
    if (!this.softDeleteField) {
      throw new Error('Soft delete is not supported for this repository');
    }
    
    try {
      // Check if entity exists
      const exists = await this.exists(id);
      
      if (!exists) {
        return false;
      }
      
      // Soft delete entity
      const updateQuery: { [key: string]: string | Date | null } = {
        [this.softDeleteField]: new Date().toISOString()
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.getQueryBuilder())
        .update(updateQuery)
        .eq(this.idField, id as string);
      
      if (error) {
        this.handleError(error, 'softDelete');
      }
      
      return true;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in softDelete', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in softDelete', { cause: error as Error });
    }
  }
  
  /**
   * Restore a soft deleted entity
   * @param id Entity ID
   * @returns Restored entity or null if not found
   */
  async restore(id: ID): Promise<T | null> {
    // Check if soft delete is supported
    if (!this.softDeleteField) {
      throw new Error('Soft delete is not supported for this repository');
    }
    
    try {
      // Check if entity exists (including deleted)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: checkError } = await (this.getQueryBuilder())
        .select('*')
        .eq(this.idField, id as string)
        .maybeSingle();
      
      if (checkError) {
        this.handleError(checkError, 'restore');
      }
      
      if (!data) {
        return null;
      }
      
      const updateQuery: { [key: string]: string | Date | null } = {
        [this.softDeleteField]: null
      };
      // Restore entity
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: restoredData, error } = await (this.getQueryBuilder())
        .update(updateQuery)
        .eq(this.idField, id as string)
        .select()
        .single();
      
      if (error) {
        this.handleError(error, 'restore');
      }
      
      return restoredData as unknown as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in restore', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in restore', { cause: error as Error });
    }
  }
  
  /**
   * Find all entities including soft deleted ones
   * @param filters Optional filters
   * @returns Array of entities
   */
  async findAllWithDeleted(filters?: Record<string, unknown>): Promise<T[]> {
    // Check if soft delete is supported
    if (!this.softDeleteField) {
      return this.findAll(filters);
    }
    
    try {
      let query = this.getQueryBuilder().select('*');
      
      // Apply filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (Array.isArray(value)) query = (query).in(key, value);
            else if (typeof value === 'object') {
              // Handle special operators
              const obj = value as Record<string, unknown>;
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ('eq' in obj) query = (query).eq(key, obj.eq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('neq' in obj) query = (query).neq(key, obj.neq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gt' in obj) query = (query).gt(key, obj.gt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gte' in obj) query = (query).gte(key, obj.gte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lt' in obj) query = (query).lt(key, obj.lt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lte' in obj) query = (query).lte(key, obj.lte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('like' in obj) query = (query).like(key, `%${obj.like}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('ilike' in obj) query = (query).ilike(key, `%${obj.ilike}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('in' in obj && Array.isArray(obj.in)) query = (query).in(key, obj.in);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('is' in obj) query = (query).is(key, obj.is);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              query = (query).eq(key, value);
            }
          }
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        this.handleError(error, 'findAllWithDeleted');
      }
      
      return data as unknown as T[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in findAllWithDeleted', {
        error,
        filters,
        tableName: this.tableName
      });
      
      throw new DatabaseError('Unexpected error in findAllWithDeleted', { cause: error as Error });
    }
  }
  
  /**
   * Find only soft deleted entities
   * @param filters Optional filters
   * @returns Array of soft deleted entities
   */
  async findDeleted(filters?: Record<string, unknown>): Promise<T[]> {
    // Check if soft delete is supported
    if (!this.softDeleteField) {
      throw new Error('Soft delete is not supported for this repository');
    }
    
    try {
      let query = this.getQueryBuilder()
        .select('*')
        .not(this.softDeleteField, 'is', null);
      
      // Apply filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (Array.isArray(value)) query = (query).in(key, value);
            else if (typeof value === 'object') {
              // Handle special operators
              const obj = value as Record<string, unknown>;
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ('eq' in obj) query = (query).eq(key, obj.eq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('neq' in obj) query = (query).neq(key, obj.neq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gt' in obj) query = (query).gt(key, obj.gt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('gte' in obj) query = (query).gte(key, obj.gte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lt' in obj) query = (query).lt(key, obj.lt);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('lte' in obj) query = (query).lte(key, obj.lte);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('like' in obj) query = (query).like(key, `%${obj.like}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('ilike' in obj) query = (query).ilike(key, `%${obj.ilike}%`);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('in' in obj && Array.isArray(obj.in)) query = (query).in(key, obj.in);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if ('is' in obj) query = (query).is(key, obj.is);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              query = (query).eq(key, value);
            }
          }
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        this.handleError(error, 'findDeleted');
      }
      
      return data as unknown as T[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in findDeleted', {
        error,
        filters,
        tableName: this.tableName
      });
      
      throw new DatabaseError('Unexpected error in findDeleted', { cause: error as Error });
    }
  }
  
  /**
   * Find an entity by ID within a transaction
   * @param id Entity ID
   * @param txnCtx Transaction context
   * @returns Entity or null if not found
   */
  async findByIdTxn(id: ID, txnCtx: { from: (table: string) => unknown }): Promise<T | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (txnCtx.from(this.tableName) as any)
        .select('*')
        .eq(this.idField, id as string)
        .maybeSingle();
      
      if (error) {
        this.handleError(error, 'findByIdTxn');
      }
      
      return data as unknown as T | null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in findByIdTxn', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in findByIdTxn', { cause: error as Error });
    }
  }
  
  /**
   * Create a new entity within a transaction
   * @param entity Entity to create
   * @param txnCtx Transaction context
   * @returns Created entity
   */
  async createTxn(entity: Omit<T, 'id'>, txnCtx: { from: (table: string) => unknown }): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (txnCtx.from(this.tableName) as any)
        .insert(entity)
        .select()
        .single();
      
      if (error) {
        this.handleError(error, 'createTxn');
      }
      
      return data as unknown as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in createTxn', { error, entity, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in createTxn', { cause: error as Error });
    }
  }
  
  /**
   * Update an entity within a transaction
   * @param id Entity ID
   * @param entity Entity data to update
   * @param txnCtx Transaction context
   * @returns Updated entity or null if not found
   */
  async updateTxn(id: ID, entity: Partial<T>, txnCtx: { from: (table: string) => unknown }): Promise<T | null> {
    try {
      // Check if entity exists
      const existingEntity = await this.findByIdTxn(id, txnCtx);
      if (!existingEntity) {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (txnCtx.from(this.tableName) as any)
        .update(entity)
        .eq(this.idField, id as string)
        .select()
        .single();
      
      if (error) {
        this.handleError(error, 'updateTxn');
      }
      
      return data as unknown as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in updateTxn', {
        error,
        id,
        entity,
        tableName: this.tableName
      });
      
      throw new DatabaseError('Unexpected error in updateTxn', { cause: error as Error });
    }
  }
  
  /**
   * Delete an entity within a transaction
   * @param id Entity ID
   * @param txnCtx Transaction context
   * @returns True if deleted, false if not found
   */
  async deleteTxn(id: ID, txnCtx: { from: (table: string) => unknown }): Promise<boolean> {
    try {
      // Check if entity exists
      const existingEntity = await this.findByIdTxn(id, txnCtx);
      if (!existingEntity) {
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (txnCtx.from(this.tableName) as any)
        .delete()
        .eq(this.idField, id as string);
      
      if (error) {
        this.handleError(error, 'deleteTxn');
      }
      
      return true;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      logger.error('Unexpected error in deleteTxn', { error, id, tableName: this.tableName });
      throw new DatabaseError('Unexpected error in deleteTxn', { cause: error as Error });
    }
  }
}
