import type { SupabaseClient } from '@supabase/supabase-js';
import { ConnectionStatus } from './enums/connection-status.enum';
import type { RetryOptions } from './types/retry-options.type';
import type { SupabaseOptions } from './types/supabase-options.type';
import type { ConnectionPool, ConnectionPoolOptions} from './connection-pool';
import { getConnectionPool } from './connection-pool';
import { withRetry } from './retry-handler';
import { SupabaseErrorHandler } from './error-handler';

/**
 * Options for the pooled Supabase client
 */
export interface PooledClientOptions extends SupabaseOptions {
  /**
   * Connection pool options
   */
  pool?: ConnectionPoolOptions;
}

/**
 * Pooled Supabase client that uses a connection pool
 */
export class PooledSupabaseClient {
  private readonly pool: ConnectionPool;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private readonly options: SupabaseOptions;
  private readonly errorHandler: SupabaseErrorHandler;
  private activeClient: SupabaseClient | null = null;
  
  /**
   * Create a new pooled Supabase client
   * @param supabaseUrl Supabase URL
   * @param supabaseKey Supabase API key
   * @param options Client options
   */
  constructor(
    private readonly supabaseUrl: string,
    private readonly supabaseKey: string,
    options?: PooledClientOptions
  ) {
    // Validate required environment variables
    this.validateEnvironment();
    
    // Extract pool options
    const poolOptions = options?.pool;
    
    // Store options
    this.options = options || {};
    
    // Create error handler
    this.errorHandler = new SupabaseErrorHandler();
    
    // Get connection pool
    this.pool = getConnectionPool(supabaseUrl, supabaseKey, poolOptions, options);
    
    // Set initial status
    this.setStatus(ConnectionStatus.CONNECTING);
    
    // Initialize client
    this.initialize();
  }
  
  /**
   * Initialize the client
   */
  private async initialize(): Promise<void> {
    try {
      // Check connection
      const isHealthy = await this.healthCheck();
      
      if (isHealthy) {
        this.setStatus(ConnectionStatus.CONNECTED);
      } else {
        this.setStatus(ConnectionStatus.ERROR);
      }
    } catch (error) {
      this.setStatus(ConnectionStatus.ERROR);
      console.error('[PooledSupabaseClient] Failed to initialize:', error);
    }
  }
  
  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    if (!this.supabaseUrl) {
      throw new Error('Supabase URL is required');
    }
    
    if (!this.supabaseKey) {
      throw new Error('Supabase API key is required');
    }
    
    // Validate URL format
    try {
      new URL(this.supabaseUrl);
    } catch {
      throw new Error(`Invalid Supabase URL: ${this.supabaseUrl}`);
    }
  }
  
  /**
   * Set the connection status and notify listeners
   * @param status New connection status
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.notifyStatusListeners();
    }
  }
  
  /**
   * Notify all status listeners of the current status
   */
  private notifyStatusListeners(): void {
    for (const listener of this.statusListeners) {
      try {
        listener(this.status);
      } catch (error) {
        console.error('[PooledSupabaseClient] Error in status listener:', error);
      }
    }
  }
  
  /**
   * Get a client from the pool
   */
  private getClient(): SupabaseClient {
    // If we already have an active client, return it
    if (this.activeClient) {
      return this.activeClient;
    }
    
    // Get a client from the pool
    const client = this.pool.getConnection();
    
    // Store as active client
    this.activeClient = client;
    
    return client;
  }
  
  /**
   * Release the active client back to the pool
   */
  private releaseClient(): void {
    if (this.activeClient) {
      this.pool.releaseConnection(this.activeClient);
      this.activeClient = null;
    }
  }
  
  /**
   * Get the current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Reset the client connection
   */
  async resetClient(): Promise<void> {
    // Release the active client
    this.releaseClient();
    
    // Set status to connecting
    this.setStatus(ConnectionStatus.CONNECTING);
    
    // Initialize client
    await this.initialize();
  }
  
  /**
   * Register a callback to be notified of connection status changes
   * @param callback Function to call when connection status changes
   * @returns Function to unregister the callback
   */
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    
    // Call immediately with current status
    callback(this.status);
    
    // Return function to remove listener
    return () => {
      this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * Execute a function with retry logic
   * @param operation Function to execute
   * @param options Retry options
   * @returns Result of the operation
   */
  async withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T> {
    return withRetry(operation, {
      ...this.options.retry,
      ...options
    });
  }
  
  /**
   * Check if the client is healthy and can connect to Supabase
   * @returns True if the client is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Get a client from the pool
      const client = this.getClient();
      
      // Simple query to check if the connection is working
      const { error } = await client.from('health_check').select('*').limit(1);
      
      // Release the client back to the pool
      this.releaseClient();
      
      if (error) {
        console.error('[PooledSupabaseClient] Health check failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[PooledSupabaseClient] Health check failed:', error);
      return false;
    }
  }
  
  // Forward all SupabaseClient methods
  
  get auth() {
    return this.getClient().auth;
  }
  
  get storage() {
    return this.getClient().storage;
  }
  
  get functions() {
    return this.getClient().functions;
  }
  
  get realtime() {
    return this.getClient().realtime;
  }
  
  // Os métodos abaixo acessavam propriedades protegidas do SupabaseClient, o que não é permitido.
  // Por padrão, não exponha essas propriedades. Se necessário, exponha apenas métodos públicos documentados.
  // get realtimeUrl() { return undefined; }
  // get authUrl() { return undefined; }
  // get storageUrl() { return undefined; }
  // get functionsUrl() { return undefined; }
  // get rest() { return undefined; }
  // get storageKey() { return undefined; }
  // get headers() { return undefined; }
  // get schema() { return undefined; }
  // getChannels() { return []; }
  // removeChannel(channel: string) { return undefined; }
  // removeAllChannels() { return undefined; }

  from<TableName extends string, S = unknown>(table: TableName) {
    return this.getClient().from<TableName, S>(table);
  }
  rpc<FnName extends string, S = unknown>(fn: FnName, params?: S extends { Args: infer A } ? A : Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getClient().rpc<FnName, S>(fn, params as any);
  }
  
  channel(name: string) {
    return this.getClient().channel(name);
  }
}

/**
 * Singleton instance of the pooled Supabase client
 */
let instance: PooledSupabaseClient | null = null;

/**
 * Get the singleton instance of the pooled Supabase client
 * @param supabaseUrl Supabase URL
 * @param supabaseKey Supabase API key
 * @param options Client options
 * @returns Pooled Supabase client instance
 */
export function getPooledSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: PooledClientOptions
): PooledSupabaseClient {
  if (!instance) {
    instance = new PooledSupabaseClient(supabaseUrl, supabaseKey, options);
  }
  
  return instance;
}

export default getPooledSupabaseClient;
