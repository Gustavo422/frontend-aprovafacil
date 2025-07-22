import { RetryOptions } from './retry-options.type';

/**
 * Options for configuring the Supabase client
 */
export type SupabaseOptions = {
  /**
   * Retry options for failed operations
   */
  retry?: RetryOptions;
  
  /**
   * Connection timeout in milliseconds
   * @default 10000
   */
  connectionTimeout?: number;
  
  /**
   * Whether to automatically reconnect on connection failure
   * @default true
   */
  autoReconnect?: boolean;
  
  /**
   * Maximum number of reconnection attempts
   * @default 5
   */
  maxReconnectAttempts?: number;
  
  /**
   * Whether to persist the authentication state
   * @default true
   */
  persistSession?: boolean;
  
  /**
   * Whether to detect and maintain session state
   * @default true
   */
  detectSessionInUrl?: boolean;
  
  /**
   * Whether to automatically refresh the token before it expires
   * @default true
   */
  autoRefreshToken?: boolean;
  
  /**
   * Headers to include in all requests
   */
  headers?: Record<string, string>;
  
  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
};
