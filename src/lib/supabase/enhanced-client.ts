import { createClient, SupabaseClient as OriginalSupabaseClient, RealtimeChannelOptions, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';
import { ConnectionStatus } from './enums/connection-status.enum';
import { RetryOptions } from './types/retry-options.type';
import { SupabaseOptions } from './types/supabase-options.type';
import { withRetry } from './retry-handler';
import { SupabaseErrorHandler } from './error-handler';
import { RetryStrategy } from './enums/retry-strategy.enum';

/**
 * Default Supabase options
 */
const DEFAULT_OPTIONS: Required<SupabaseOptions> = {
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    strategy: RetryStrategy.EXPONENTIAL_JITTER
  },
  connectionTimeout: 10000,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  persistSession: true,
  detectSessionInUrl: true,
  autoRefreshToken: true,
  headers: {},
  debug: false
};

/**
 * Enhanced Supabase client with additional functionality
 */
export class EnhancedSupabaseClient {
  private client: OriginalSupabaseClient<Database>;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private options: Required<SupabaseOptions>;
  private errorHandler: SupabaseErrorHandler;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  /**
   * Create a new enhanced Supabase client
   * @param supabaseUrl Supabase URL
   * @param supabaseKey Supabase API key
   * @param options Client options
   */
  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    options?: SupabaseOptions
  ) {
    // Validate required environment variables
    this.validateEnvironment();
    
    // Merge options with defaults
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Create error handler
    this.errorHandler = new SupabaseErrorHandler();
    
    // Create Supabase client
    this.client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: this.options.persistSession,
        detectSessionInUrl: this.options.detectSessionInUrl,
        autoRefreshToken: this.options.autoRefreshToken
      },
      global: {
        headers: this.options.headers
      }
    });
    
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
        this.reconnectAttempts = 0;
      } else {
        this.setStatus(ConnectionStatus.ERROR);
        this.handleReconnect();
      }
    } catch (error: unknown) {
      this.setStatus(ConnectionStatus.ERROR);
      this.logError('Failed to initialize Supabase client', error);
      this.handleReconnect();
    }
    
    // Set up auth state change listener
    this.client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.logDebug('User signed out');
      } else if (event === 'SIGNED_IN') {
        this.logDebug('User signed in');
      } else if (event === 'TOKEN_REFRESHED') {
        this.logDebug('Token refreshed');
      }
    });
  }
  
  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (!this.options.autoReconnect || this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.logDebug('Not reconnecting: auto reconnect disabled or max attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.logDebug(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.setStatus(ConnectionStatus.RECONNECTING);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        const isHealthy = await this.healthCheck();
        
        if (isHealthy) {
          this.setStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          this.logDebug('Reconnected successfully');
        } else {
          this.setStatus(ConnectionStatus.ERROR);
          this.handleReconnect();
        }
      } catch (error: unknown) {
        this.setStatus(ConnectionStatus.ERROR);
        this.logError('Failed to reconnect', error);
        this.handleReconnect();
      }
    }, delay);
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
      } catch (error: unknown) {
        this.logError('Error in status listener', error);
      }
    }
  }
  
  /**
   * Log an error message
   * @param message Error message
   * @param error Error object
   */
  private logError(message: string, error: unknown): void {
    console.error(`[Supabase] ${message}:`, error);
  }
  
  /**
   * Log a debug message
   * @param message Debug message
   */
  private logDebug(message: string): void {
    if (this.options.debug) {
      console.debug(`[Supabase] ${message}`);
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
    this.logDebug('Resetting Supabase client');
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Create a new client instance
    this.client = createClient<Database>(this.supabaseUrl, this.supabaseKey, {
      auth: {
        persistSession: this.options.persistSession,
        detectSessionInUrl: this.options.detectSessionInUrl,
        autoRefreshToken: this.options.autoRefreshToken
      },
      global: {
        headers: this.options.headers
      }
    });
    
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
      // Simple query to check if the connection is working
      const { error } = await this.client.from('health_check').select('*').limit(1);
      
      if (error) {
        this.logError('Health check failed', error);
        return false;
      }
      
      return true;
    } catch (error: unknown) {
      this.logError('Health check failed', error);
      return false;
    }
  }
  
  // Forward all SupabaseClient methods
  
  get auth() {
    return this.client.auth;
  }
  
  get storage() {
    return this.client.storage;
  }
  
  get functions() {
    return this.client.functions;
  }
  
  get realtime() {
    return this.client.realtime;
  }
  
  removeChannel(channel: RealtimeChannel) {
    // Implementação compatível com ISupabaseClient
    // Se necessário, adapte para remover pelo nome ou referência
    return this.client.removeChannel(channel);
  }
  removeAllChannels() {
    return this.client.removeAllChannels();
  }
  
  from<TableName extends keyof Database['public']['Tables']>(
    table: TableName
  ) {
    return this.client.from(table);
  }
  
  rpc<FnName extends keyof Database['public']['Functions']>(
    fn: FnName, 
    params?: Database['public']['Functions'][FnName]['Args']
  ) {
    return this.client.rpc(fn, params);
  }
  
  channel(name: string, opts?: RealtimeChannelOptions): RealtimeChannel {
    return this.client.channel(name, opts);
  }
  
  // Propriedades delegadas para compatibilidade com ISupabaseClient
  get realtimeUrl() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).realtimeUrl;
  }
  get authUrl() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).authUrl;
  }
  get storageUrl() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).storageUrl;
  }
  get functionsUrl() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).functionsUrl;
  }
  get restUrl() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).restUrl;
  }
  get schema() {
    return this.client.schema;
  }
  get headers() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).headers;
  }
  get fetch() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).fetch;
  }
  get shouldThrowOnError() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).shouldThrowOnError;
  }
  get telemetry() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).telemetry;
  }
  get rest() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.client as any).rest;
  }
}

/**
 * Singleton instance of the enhanced Supabase client
 */
let instance: EnhancedSupabaseClient | null = null;

/**
 * Get the singleton instance of the enhanced Supabase client
 * @param supabaseUrl Supabase URL
 * @param supabaseKey Supabase API key
 * @param options Client options
 * @returns Enhanced Supabase client instance
 */
export function getSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseOptions
): EnhancedSupabaseClient {
  if (!instance) {
    instance = new EnhancedSupabaseClient(supabaseUrl, supabaseKey, options);
  }
  
  return instance;
}
