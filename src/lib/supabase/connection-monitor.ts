import { ConnectionStatus } from './enums/connection-status.enum';
import type { ISupabaseClient } from './interfaces/supabase-client.interface';

/**
 * Options for the connection monitor
 */
export interface ConnectionMonitorOptions {
  /**
   * Interval in milliseconds between health checks
   * @default 30000 (30 seconds)
   */
  healthCheckInterval?: number;
  
  /**
   * Whether to automatically attempt to reconnect on connection failure
   * @default true
   */
  autoReconnect?: boolean;
  
  /**
   * Maximum number of reconnection attempts
   * @default 5
   */
  maxReconnectAttempts?: number;
  
  /**
   * Whether to log connection events
   * @default true
   */
  enableLogging?: boolean;
  
  /**
   * Callback to execute when a connection event occurs
   */
  onConnectionEvent?: (status: ConnectionStatus, details?: Record<string, unknown>) => void;
}

/**
 * Default connection monitor options
 */
const DEFAULT_MONITOR_OPTIONS: Required<ConnectionMonitorOptions> = {
  healthCheckInterval: 30000,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  enableLogging: true,
  onConnectionEvent: () => {}
};

/**
 * Service for monitoring Supabase connection status
 */
export class ConnectionMonitorService {
  private readonly client: ISupabaseClient;
  private readonly options: Required<ConnectionMonitorOptions>;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionListeners: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private lastStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private readonly connectionLogs: Array<{
    timestamp: Date;
    status: ConnectionStatus;
    details?: Record<string, unknown>;
  }> = [];
  
  /**
   * Create a new connection monitor service
   * @param client Supabase client to monitor
   * @param options Connection monitor options
   */
  constructor(
    client: ISupabaseClient,
    options?: ConnectionMonitorOptions
  ) {
    this.client = client;
    
    // Merge options with defaults
    this.options = {
      ...DEFAULT_MONITOR_OPTIONS,
      ...options
    };
    
    // Initialize the service
    this.initialize();
  }
  
  /**
   * Initialize the connection monitor
   */
  private initialize(): void {
    // Start health check interval
    this.startHealthCheck();
    
    // Listen for connection status changes from the client
    if (typeof this.client.onConnectionStatusChange === 'function') {
      this.client.onConnectionStatusChange(this.handleStatusChange.bind(this));
    }
  }
  
  /**
   * Start the health check interval
   */
  private startHealthCheck(): void {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Start new interval
    this.healthCheckInterval = setInterval(
      this.performHealthCheck.bind(this),
      this.options.healthCheckInterval
    );
    
    // Perform initial health check
    this.performHealthCheck();
  }
  
  /**
   * Perform a health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const isHealthy = await this.client.healthCheck();
      
      if (isHealthy) {
        this.handleStatusChange(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;
      } else {
        this.handleStatusChange(ConnectionStatus.ERROR);
        this.handleReconnect();
      }
    } catch (error) {
      this.logEvent('Health check failed', { error });
      this.handleStatusChange(ConnectionStatus.ERROR);
      this.handleReconnect();
    }
  }
  
  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (!this.options.autoReconnect || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.logEvent('Not reconnecting: auto reconnect disabled or max attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    this.logEvent(`Reconnecting (attempt ${this.reconnectAttempts})`);
    this.handleStatusChange(ConnectionStatus.RECONNECTING);
    
    // Attempt to reset the client connection
    this.resetConnection().catch(error => {
      this.logEvent('Reconnection failed', { error });
    });
  }
  
  /**
   * Handle a status change
   * @param status New connection status
   */
  private handleStatusChange(status: ConnectionStatus): void {
    if (this.lastStatus !== status) {
      this.lastStatus = status;
      
      // Log the status change
      this.logEvent(`Connection status changed to ${status}`);
      
      // Record in connection logs
      this.connectionLogs.push({
        timestamp: new Date(),
        status
      });
      
      // Limit log size
      if (this.connectionLogs.length > 100) {
        this.connectionLogs.shift();
      }
      
      // Notify listeners
      this.notifyListeners();
      
      // Execute callback
      this.options.onConnectionEvent(status);
    }
  }
  
  /**
   * Notify all connection listeners
   */
  private notifyListeners(): void {
    for (const listener of this.connectionListeners) {
      try {
        listener(this.lastStatus);
      } catch (error) {
        this.logEvent('Error in connection listener', { error });
      }
    }
  }
  
  /**
   * Log an event
   * @param message Event message
   * @param details Event details
   */
  private logEvent(message: string, details?: Record<string, unknown>): void {
    if (this.options.enableLogging) {
      console.log(`[ConnectionMonitor] ${message}`, details || '');
    }
  }
  
  /**
   * Get the Supabase client
   */
  getClient(): ISupabaseClient {
    return this.client;
  }
  
  /**
   * Reset the connection to Supabase
   */
  async resetConnection(): Promise<void> {
    this.logEvent('Resetting connection');
    
    try {
      await this.client.resetClient();
      
      // Perform health check after reset
      await this.performHealthCheck();
    } catch (error) {
      this.logEvent('Error resetting connection', { error });
      throw error;
    }
  }
  
  /**
   * Get the current connection status
   */
  getStatus(): ConnectionStatus {
    return this.lastStatus;
  }
  
  /**
   * Register a callback to be notified of connection status changes
   * @param callback Function to call when connection status changes
   * @returns Function to unregister the callback
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Call immediately with current status
    callback(this.lastStatus);
    
    // Return function to remove listener
    return () => {
      this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * Check if the connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    return await this.client.healthCheck();
  }
  
  /**
   * Get the connection logs
   */
  getConnectionLogs(): Array<{
    timestamp: Date;
    status: ConnectionStatus;
    details?: Record<string, unknown>;
  }> {
    return [...this.connectionLogs];
  }
  
  /**
   * Stop the connection monitor
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

/**
 * Get the singleton instance of the connection monitor service
 * @param client Supabase client to monitor
 * @param options Connection monitor options
 * @returns Connection monitor service instance
 */
export function getConnectionMonitor(
  client?: ISupabaseClient,
  options?: ConnectionMonitorOptions
): ConnectionMonitorService {
  if (!client) {
    throw new Error('Supabase client is required');
  }
  return new ConnectionMonitorService(client, options);
}

export default getConnectionMonitor;
