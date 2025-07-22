// Interfaces
export type {
  IRepository,
  IPaginatedRepository,
  ISoftDeleteRepository,
  ITransactionalRepository,
  IFullRepository,
  PaginatedResult
} from './repository.interface';

// Base implementation
export { BaseRepository } from './base-repository';

// Cached repository
export { CachedRepository } from './cached-repository';
export type { CacheOptions } from './cached-repository';

// Repository factory
export { RepositoryFactory } from './repository-factory';
export type { RepositoryFactoryOptions } from './repository-factory';

// Transaction utilities
export { withTransaction, executeTransaction } from './transaction-utils';
