/**
 * Enum representing the possible connection states for the Supabase client
 */
export enum ConnectionStatus {
  /**
   * The client is successfully connected to Supabase
   */
  CONNECTED = 'connected',
  
  /**
   * The client is disconnected from Supabase
   */
  DISCONNECTED = 'disconnected',
  
  /**
   * The client is currently attempting to connect to Supabase
   */
  CONNECTING = 'connecting',
  
  /**
   * The client encountered an error while connecting to Supabase
   */
  ERROR = 'error',
  
  /**
   * The client connection is degraded (some operations may fail)
   */
  DEGRADED = 'degraded',
  
  /**
   * The client is reconnecting after a connection failure
   */
  RECONNECTING = 'reconnecting'
}
