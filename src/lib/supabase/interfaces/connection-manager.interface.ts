import { ConnectionStatus } from '../enums/connection-status.enum';
import { ISupabaseClient } from './supabase-client.interface';

/**
 * Interface for managing Supabase connections
 */
export interface IConnectionManager {
  /**
   * Get the Supabase client instance
   */
  getClient(): ISupabaseClient;
  
  /**
   * Reset the connection to Supabase
   */
  resetConnection(): Promise<void>;
  
  /**
   * Get the current connection status
   */
  getStatus(): ConnectionStatus;
  
  /**
   * Register a callback to be notified of connection status changes
   * @param callback Function to call when connection status changes
   * @returns Function to unregister the callback
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void;
  
  /**
   * Initialize the connection manager
   */
  initialize(): Promise<void>;
  
  /**
   * Check if the connection is healthy
   */
  healthCheck(): Promise<boolean>;
}
