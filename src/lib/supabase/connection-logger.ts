import { ConnectionStatus } from './enums/connection-status.enum';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Interface for connection log entry
 */
export interface ConnectionLogEntry {
  id?: string;
  usuario_id?: string | null;
  timestamp: Date;
  event_type: string;
  status: string;
  error_message?: string | null;
  request_path?: string | null;
  request_method?: string | null;
  response_status?: number | null;
  duration_ms?: number | null;
  client_info?: Record<string, unknown> | null;
}

/**
 * Service for logging connection events to Supabase
 */
export class ConnectionLogger {
  private enabled: boolean;
  private usuarioId: string | null = null;
  private buffer: ConnectionLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxBufferSize: number;
  private flushIntervalMs: number;
  
  /**
   * Create a new connection logger
   * @param enabled Whether logging is enabled
   * @param maxBufferSize Maximum number of logs to buffer before flushing
   * @param flushIntervalMs Interval in milliseconds to flush logs
   * @param usuario_id The ID of the user associated with the logs. If null, it will be fetched.
   */
  constructor(
    enabled = true,
    maxBufferSize = 10,
    flushIntervalMs = 30000,
    usuario_id: string | null = null
  ) {
    this.enabled = enabled;
    this.maxBufferSize = maxBufferSize;
    this.flushIntervalMs = flushIntervalMs;
    this.usuarioId = usuario_id;
    
    // Start flush interval
    this.startFlushInterval();
    
    // Get current user ID if not provided
    if (!this.usuarioId) {
      this.getCurrentUserId().catch(() => {
        // Ignore errors
      });
    }
  }
  
  /**
   * Start the flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(() => {
      this.flush().catch(error => {
        console.error('[ConnectionLogger] Error flushing logs:', error);
      });
    }, this.flushIntervalMs);
  }
  
  /**
   * Get the current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getUser();
      this.usuarioId = data.user?.id || null;
      return this.usuarioId;
    } catch (error) {
      console.error('[ConnectionLogger] Error getting user ID:', error);
      return null;
    }
  }
  
  /**
   * Log a connection event
   * @param eventType Type of event
   * @param status Connection status
   * @param details Additional details
   * @param usuario_id The ID of the user associated with the log. If null, it will be fetched.
   */
  async logEvent(
    eventType: string,
    status: ConnectionStatus | string,
    details?: {
      error?: Error | unknown;
      request?: {
        path?: string;
        method?: string;
      };
      response?: {
        status?: number;
      };
      duration?: number;
      clientInfo?: Record<string, unknown>;
    },
    usuario_id?: string | null
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }
    
    // Use usuario_id from argument or from this.usuarioId
    const usuarioId = usuario_id ?? this.usuarioId;
    
    // Ensure user ID is set
    if (!usuarioId) {
      await this.getCurrentUserId();
    }
    
    // Create log entry
    const logEntry: ConnectionLogEntry = {
      usuario_id: usuarioId,
      timestamp: new Date(),
      event_type: eventType,
      status: status.toString(),
      error_message: details?.error instanceof Error ? details.error.message : null,
      request_path: details?.request?.path || null,
      request_method: details?.request?.method || null,
      response_status: details?.response?.status || null,
      duration_ms: details?.duration || null,
      client_info: details?.clientInfo || null
    };
    
    // Add to buffer
    this.buffer.push(logEntry);
    
    // Flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }
  
  /**
   * Flush logs to Supabase
   */
  async flush(): Promise<void> {
    if (!this.enabled || this.buffer.length === 0) {
      return;
    }
    
    // Copy buffer and clear
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      // Insert logs into Supabase
      const logsWithRequiredFields = logs.map(log => ({
        ...log,
        acao: log.event_type || 'connection_event',
        nome_tabela: 'connection_logs',
      }));
      const { error } = await supabase
        .from('logs_auditoria')
        .insert(logsWithRequiredFields);
      
      if (error) {
        console.error('[ConnectionLogger] Error inserting logs:', error);
        
        // Put logs back in buffer
        this.buffer = [...logs, ...this.buffer];
        
        // Limit buffer size
        if (this.buffer.length > this.maxBufferSize * 2) {
          this.buffer = this.buffer.slice(-this.maxBufferSize);
        }
      }
    } catch (error) {
      console.error('[ConnectionLogger] Error flushing logs:', error);
      
      // Put logs back in buffer
      this.buffer = [...logs, ...this.buffer];
      
      // Limit buffer size
      if (this.buffer.length > this.maxBufferSize * 2) {
        this.buffer = this.buffer.slice(-this.maxBufferSize);
      }
    }
  }
  
  /**
   * Enable or disable logging
   * @param enabled Whether logging is enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Stop the logger
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining logs
    this.flush().catch(error => {
      console.error('[ConnectionLogger] Error flushing logs on stop:', error);
    });
  }
}

/**
 * Singleton instance of the connection logger
 */
let instance: ConnectionLogger | null = null;

/**
 * Get the singleton instance of the connection logger
 * @param enabled Whether logging is enabled
 * @param maxBufferSize Maximum number of logs to buffer before flushing
 * @param flushIntervalMs Interval in milliseconds to flush logs
 * @param usuario_id The ID of the user associated with the logs. If null, it will be fetched.
 * @returns Connection logger instance
 */
export function getConnectionLogger(
  enabled = true,
  maxBufferSize = 10,
  flushIntervalMs = 30000,
  usuario_id: string | null = null
): ConnectionLogger {
  if (!instance) {
    instance = new ConnectionLogger(enabled, maxBufferSize, flushIntervalMs, usuario_id);
  }
  
  return instance;
}

export default getConnectionLogger;
