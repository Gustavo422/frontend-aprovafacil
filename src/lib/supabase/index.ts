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
// Re-exports de logger removidos para evitar inicialização precoce de cliente

// Functions
export { withRetry, wrapWithRetry } from './retry-handler';
export { Retryable, RetryableClass, makeRepositoryRetryable } from './retry-decorators';
export { validateEnvironmentVariables, getEnv } from './env-utils';

// React components and hooks
export { SupabaseProvider, useSupabase } from './supabase-provider';
export { useConnectionStatus } from './use-connection-status';
export { ConnectionStatusIndicator } from './connection-status-indicator';

// Default export
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Função para criar cliente Supabase com configurações adequadas
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(url, key, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });
}

// Criação lazy (evita erro quando variáveis não estão definidas em build/import)
let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient {
  if (!cachedClient) {
    // Deferir a checagem até runtime para evitar erro no import durante build/prerender
    cachedClient = createSupabaseClient();
  }
  return cachedClient;
}
