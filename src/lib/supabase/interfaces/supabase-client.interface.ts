import { SupabaseClient } from '@supabase/supabase-js';
import { ConnectionStatus } from '../enums/connection-status.enum';
import { RetryOptions } from '../types/retry-options.type';

/**
 * Interface for the enhanced Supabase client with additional functionality
 */
export interface ISupabaseClient extends SupabaseClient {
  /**
   * Get the current connection status
   */
  getConnectionStatus(): ConnectionStatus;
  
  /**
   * Reset the client connection
   */
  resetClient(): Promise<void>;
  
  /**
   * Register a callback to be notified of connection status changes
   * @param callback Function to call when connection status changes
   * @returns Function to unregister the callback
   */
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void;
  
  /**
   * Execute a function with retry logic
   * @param operation Function to execute
   * @param options Retry options
   * @returns Result of the operation
   */
  withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
  
  /**
   * Check if the client is healthy and can connect to Supabase
   * @returns True if the client is healthy, false otherwise
   */
  healthCheck(): Promise<boolean>;
}
