import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseOptions } from './types/supabase-options.type';

/**
 * Options for the connection pool
 */
export interface ConnectionPoolOptions {
  /**
   * Minimum number of connections to keep in the pool
   * @default 1
   */
  minConnections?: number;
  
  /**
   * Maximum number of connections to allow in the pool
   * @default 5
   */
  maxConnections?: number;
  
  /**
   * Time in milliseconds after which an idle connection is removed from the pool
   * @default 60000 (1 minute)
   */
  idleTimeoutMs?: number;
  
  /**
   * Time in milliseconds after which a connection is considered stale and refreshed
   * @default 300000 (5 minutes)
   */
  maxConnectionAgeMs?: number;
  
  /**
   * Whether to validate connections before use
   * @default true
   */
  validateOnBorrow?: boolean;
  
  /**
   * Whether to log pool events
   * @default false
   */
  debug?: boolean;
}

/**
 * Default connection pool options
 */
const DEFAULT_POOL_OPTIONS: Required<ConnectionPoolOptions> = {
  minConnections: 1,
  maxConnections: 5,
  idleTimeoutMs: 60000,
  maxConnectionAgeMs: 300000,
  validateOnBorrow: true,
  debug: false
};

/**
 * Connection object in the pool
 */
interface PooledConnection {
  /**
   * The Supabase client instance
   */
  client: SupabaseClient;
  
  /**
   * Whether the connection is currently in use
   */
  inUse: boolean;
  
  /**
   * When the connection was created
   */
  createdAt: Date;
  
  /**
   * When the connection was last used
   */
  lastUsedAt: Date;
  
  /**
   * Unique ID for the connection
   */
  id: string;
}

/**
 * Connection pool for Supabase clients
 */
export class ConnectionPool {
  private supabaseUrl: string;
  private supabaseKey: string;
  private options: Required<ConnectionPoolOptions>;
  private supabaseOptions: SupabaseOptions;
  private pool: PooledConnection[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new connection pool
   * @param supabaseUrl Supabase URL
   * @param supabaseKey Supabase API key
   * @param options Connection pool options
   * @param supabaseOptions Options for Supabase clients
   */
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    options?: ConnectionPoolOptions,
    supabaseOptions?: SupabaseOptions
  ) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    
    // Merge options with defaults
    this.options = {
      ...DEFAULT_POOL_OPTIONS,
      ...options
    };
    
    this.supabaseOptions = supabaseOptions || {};
    
    // Initialize the pool
    this.initialize();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }
  
  /**
   * Initialize the connection pool
   */
  private initialize(): void {
    // Create minimum number of connections
    for (let i = 0; i < this.options.minConnections; i++) {
      this.createConnection();
    }
  }
  
  /**
   * Create a new connection
   * @returns The created connection
   */
  private createConnection(): PooledConnection {
    const now = new Date();
    
    const client = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        persistSession: this.supabaseOptions.persistSession,
        detectSessionInUrl: this.supabaseOptions.detectSessionInUrl,
        autoRefreshToken: this.supabaseOptions.autoRefreshToken
      },
      global: {
        headers: this.supabaseOptions.headers || {}
      }
    });
    
    const connection: PooledConnection = {
      client,
      inUse: false,
      createdAt: now,
      lastUsedAt: now,
      id: `conn_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.pool.push(connection);
    this.logDebug('Created new connection: ', connection.id);
    
    return connection;
  }
  
  /**
   * Get a connection from the pool
   * @returns A Supabase client
   */
  getConnection(): SupabaseClient {
    // Find an available connection
    let connection = this.pool.find(conn => !conn.inUse);
    
    // If no connection is available, create a new one if possible
    if (!connection && this.pool.length < this.options.maxConnections) {
      connection = this.createConnection();
    }
    
    // If still no connection, throw an error
    if (!connection) {
      throw new Error('No connections available in the pool');
    }
    
    // Mark the connection as in use
    connection.inUse = true;
    connection.lastUsedAt = new Date();
    this.logDebug('Borrowed connection: ', connection.id);
    
    // If validation is enabled, validate the connection
    if (this.options.validateOnBorrow) {
      this.validateConnection(connection).catch(error => {
        this.logDebug('Connection validation failed: ', error);
        
        // Release the connection
        this.releaseConnection(connection.client);
        
        // Create a new connection
        const newConnection = this.createConnection();
        newConnection.inUse = true;
        newConnection.lastUsedAt = new Date();
        
        // Return the new connection
        return newConnection.client;
      });
    }
    
    return connection.client;
  }
  
  /**
   * Release a connection back to the pool
   * @param client The Supabase client to release
   */
  releaseConnection(client: SupabaseClient): void {
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsedAt = new Date();
      this.logDebug('Released connection: ', connection.id);
    }
  }
  
  /**
   * Validate a connection
   * @param connection The connection to validate
   * @returns True if the connection is valid, false otherwise
   */
  private async validateConnection(connection: PooledConnection): Promise<boolean> {
    // Simulate validation logic
    const isValid = true;
    if (!isValid) {
      this.logDebug('Connection validation failed: ', connection.id);
    }
    return isValid;
  }
  
  /**
   * Start the cleanup interval
   */
  private startCleanupInterval(): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Start new interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(this.options.idleTimeoutMs, 60000)); // Run at least every minute
  }
  
  /**
   * Clean up idle and stale connections
   */
  private cleanup(): void {
    // Remove stale or idle connections
    const now = new Date();
    this.pool = this.pool.filter(conn => {
      const isStale = now.getTime() - conn.createdAt.getTime() > this.options.maxConnectionAgeMs;
      const isIdle = !conn.inUse && now.getTime() - conn.lastUsedAt.getTime() > this.options.idleTimeoutMs;
      if (isStale || isIdle) {
        this.logDebug('Removed connection: ', conn.id);
      }
      return !(isStale || isIdle);
    });
    
    // Ensure minimum connections
    while (this.pool.length < this.options.minConnections) {
      this.createConnection();
    }
  }
  
  /**
   * Log a debug message
   * @param message Debug message
   * @param details Additional details
   */
  private logDebug(message: string, details?: unknown): void {
    if (this.options.debug) {
      console.debug('[ConnectionPool] ', message, details || '');
    }
  }
  
  /**
   * Get the number of connections in the pool
   */
  getPoolSize(): number {
    return this.pool.length;
  }
  
  /**
   * Get the number of active connections in the pool
   */
  getActiveConnectionCount(): number {
    return this.pool.filter(conn => conn.inUse).length;
  }
  
  /**
   * Get the number of idle connections in the pool
   */
  getIdleConnectionCount(): number {
    return this.pool.filter(conn => !conn.inUse).length;
  }
  
  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    this.logDebug(`Closing pool with ${this.pool.length} connections (${this.getActiveConnectionCount()} active, ${this.getIdleConnectionCount()} idle)`);
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear the pool
    this.pool = [];
  }
}

/**
 * Singleton instance of the connection pool
 */
let instance: ConnectionPool | null = null;

/**
 * Get the singleton instance of the connection pool
 * @param supabaseUrl Supabase URL
 * @param supabaseKey Supabase API key
 * @param options Connection pool options
 * @param supabaseOptions Options for Supabase clients
 * @returns Connection pool instance
 */
export function getConnectionPool(
  supabaseUrl: string,
  supabaseKey: string,
  options?: ConnectionPoolOptions,
  supabaseOptions?: SupabaseOptions
): ConnectionPool {
  if (!instance) {
    instance = new ConnectionPool(supabaseUrl, supabaseKey, options, supabaseOptions);
  }
  
  return instance;
}

export default getConnectionPool;
