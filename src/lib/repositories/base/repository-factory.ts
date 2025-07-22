import { BaseRepository } from './base-repository';
import { CachedRepository, CacheOptions } from './cached-repository';

/**
 * Repository factory options
 */
export interface RepositoryFactoryOptions {
  /**
   * Whether to use caching
   * @default false
   */
  useCache?: boolean;
  
  /**
   * Cache options
   */
  cacheOptions?: CacheOptions;
  
  /**
   * ID field name
   * @default 'id'
   */
  idField?: string;
  
  /**
   * Soft delete field name
   */
  softDeleteField?: string;
}

/**
 * Repository factory
 */
export class RepositoryFactory {
  /**
   * Create a repository for a table
   * @param tableName Table name
   * @param options Repository options
   * @returns Repository instance
   */
  static createRepository<T extends { id: ID }, ID = string>(
    tableName: string,
    options: RepositoryFactoryOptions = {}
  ): BaseRepository<T, ID> {
    const {
      useCache = false,
      cacheOptions,
      idField = 'id',
      softDeleteField
    } = options;
    
    if (useCache) {
      return new CachedRepository<T, ID>(
        tableName,
        cacheOptions,
        idField,
        softDeleteField
      );
    }
    // Não é permitido instanciar BaseRepository diretamente, pois é abstrata.
    throw new Error('BaseRepository is abstract. Use a concrete repository implementation.');
  }
}
