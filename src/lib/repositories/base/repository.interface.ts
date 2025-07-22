/**
 * Base repository interface for CRUD operations
 * @template T Entity type
 * @template ID ID type
 */
export interface IRepository<T, ID> {
  /**
   * Find an entity by ID
   * @param id Entity ID
   * @returns Entity or null if not found
   */
  findById(id: ID): Promise<T | null>;
  
  /**
   * Find all entities
   * @param filters Optional filters
   * @returns Array of entities
   */
  findAll(filters?: Record<string, unknown>): Promise<T[]>;
  
  /**
   * Create a new entity
   * @param entity Entity to create
   * @returns Created entity
   */
  create(entity: Omit<T, 'id'>): Promise<T>;
  
  /**
   * Update an entity
   * @param id Entity ID
   * @param entity Entity data to update
   * @returns Updated entity or null if not found
   */
  update(id: ID, entity: Partial<T>): Promise<T | null>;
  
  /**
   * Delete an entity
   * @param id Entity ID
   * @returns True if deleted, false if not found
   */
  delete(id: ID): Promise<boolean>;
  
  /**
   * Count entities
   * @param filters Optional filters
   * @returns Number of entities
   */
  count(filters?: Record<string, unknown>): Promise<number>;
  
  /**
   * Check if an entity exists
   * @param id Entity ID
   * @returns True if exists, false otherwise
   */
  exists(id: ID): Promise<boolean>;
}

/**
 * Base repository interface with pagination
 * @template T Entity type
 * @template ID ID type
 */
export interface IPaginatedRepository<T, ID> extends IRepository<T, ID> {
  /**
   * Find entities with pagination
   * @param page Page number (1-based)
   * @param pageSize Page size
   * @param filters Optional filters
   * @returns Paginated result
   */
  findPaginated(
    page: number,
    pageSize: number,
    filters?: Record<string, unknown>
  ): Promise<PaginatedResult<T>>;
}

/**
 * Paginated result
 * @template T Entity type
 */
export interface PaginatedResult<T> {
  /**
   * Items in the current page
   */
  items: T[];
  
  /**
   * Total number of items
   */
  total: number;
  
  /**
   * Current page number (1-based)
   */
  page: number;
  
  /**
   * Page size
   */
  pageSize: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Whether there is a previous page
   */
  hasPrevious: boolean;
  
  /**
   * Whether there is a next page
   */
  hasNext: boolean;
}

/**
 * Base repository interface with soft delete
 * @template T Entity type
 * @template ID ID type
 */
export interface ISoftDeleteRepository<T, ID> extends IRepository<T, ID> {
  /**
   * Soft delete an entity
   * @param id Entity ID
   * @returns True if soft deleted, false if not found
   */
  softDelete(id: ID): Promise<boolean>;
  
  /**
   * Restore a soft deleted entity
   * @param id Entity ID
   * @returns Restored entity or null if not found
   */
  restore(id: ID): Promise<T | null>;
  
  /**
   * Find all entities including soft deleted ones
   * @param filters Optional filters
   * @returns Array of entities
   */
  findAllWithDeleted(filters?: Record<string, unknown>): Promise<T[]>;
  
  /**
   * Find only soft deleted entities
   * @param filters Optional filters
   * @returns Array of soft deleted entities
   */
  findDeleted(filters?: Record<string, unknown>): Promise<T[]>;
}

/**
 * Base repository interface with transactions
 * @template T Entity type
 * @template ID ID type
 * @template TxnCtx Transaction context type
 */
export interface ITransactionalRepository<T, ID, TxnCtx = unknown> extends IRepository<T, ID> {
  /**
   * Find an entity by ID within a transaction
   * @param id Entity ID
   * @param txnCtx Transaction context
   * @returns Entity or null if not found
   */
  findByIdTxn(id: ID, txnCtx: TxnCtx): Promise<T | null>;
  
  /**
   * Create a new entity within a transaction
   * @param entity Entity to create
   * @param txnCtx Transaction context
   * @returns Created entity
   */
  createTxn(entity: Omit<T, 'id'>, txnCtx: TxnCtx): Promise<T>;
  
  /**
   * Update an entity within a transaction
   * @param id Entity ID
   * @param entity Entity data to update
   * @param txnCtx Transaction context
   * @returns Updated entity or null if not found
   */
  updateTxn(id: ID, entity: Partial<T>, txnCtx: TxnCtx): Promise<T | null>;
  
  /**
   * Delete an entity within a transaction
   * @param id Entity ID
   * @param txnCtx Transaction context
   * @returns True if deleted, false if not found
   */
  deleteTxn(id: ID, txnCtx: TxnCtx): Promise<boolean>;
}

/**
 * Base repository interface with all features
 * @template T Entity type
 * @template ID ID type
 * @template TxnCtx Transaction context type
 */
export interface IFullRepository<T, ID, TxnCtx = unknown> extends
  IRepository<T, ID>,
  IPaginatedRepository<T, ID>,
  ISoftDeleteRepository<T, ID>,
  ITransactionalRepository<T, ID, TxnCtx> {
}
