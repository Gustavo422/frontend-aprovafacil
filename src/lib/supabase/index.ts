// Enums
export { ConnectionStatus } from './enums/connection-status.enum';
export { ErrorCategory } from './enums/error-category.enum';
export { RetryStrategy } from './enums/retry-strategy.enum';

// Interfaces
export type { ISupabaseClient } from './interfaces/supabase-client.interface';
export type { IConnectionManager } from './interfaces/connection-manager.interface';
export type { IErrorHandler } from './interfaces/error-handler.interface';

// Types
export type { RetryOptions } from './types/retry-options.type';
export type { SupabaseError } from './types/supabase-error.type';
export type { SupabaseOptions } from './types/supabase-options.type';

// Classes
export { EnhancedSupabaseClient, getSupabaseClient } from './enhanced-client';
export { PooledSupabaseClient, getPooledSupabaseClient } from './pooled-client';
export { ConnectionPool, getConnectionPool } from './connection-pool';
export { SupabaseErrorHandler } from './error-handler';
export { RetryHandler } from './retry-handler';
export { RetryDemo } from './retry-demo';
export { ConnectionMonitorService, getConnectionMonitor } from './connection-monitor';
export { ConnectionLogger, getConnectionLogger } from './connection-logger';

// Functions
export { withRetry, wrapWithRetry } from './retry-handler';
export { Retryable, RetryableClass, makeRepositoryRetryable } from './retry-decorators';
export { validateEnvironmentVariables, getEnv } from './env-utils';

// React components and hooks
export { SupabaseProvider, useSupabase } from './supabase-provider';
export { useConnectionStatus } from './use-connection-status';
export { ConnectionStatusIndicator } from './connection-status-indicator';

// Default export
export { default as supabase } from './client';
