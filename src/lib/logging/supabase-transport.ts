import { supabase } from '@/src/lib/supabase';
import { LogEntry, LogLevel, LogTransport } from './index';

/**
 * Supabase log transport
 */
export class SupabaseLogTransport implements LogTransport {
  /**
   * Buffer for log entries
   */
  private buffer: LogEntry[] = [];
  
  /**
   * Flush interval
   */
  private flushInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new Supabase log transport
   * @param options Transport options
   */
  constructor(
    private readonly options: {
      /**
       * Table name
       */
      tableName?: string;
      
      /**
       * Minimum log level
       */
      minLevel?: LogLevel;
      
      /**
       * Maximum buffer size
       */
      maxBufferSize?: number;
      
      /**
       * Flush interval in milliseconds
       */
      flushIntervalMs?: number;
      usuario_id?: string | null; // Novo campo para receber o usuario_id
    } = {}
  ) {
    // Set default options
    this.options = {
      tableName: 'logs',
      minLevel: LogLevel.INFO,
      maxBufferSize: 10,
      flushIntervalMs: 10000,
      ...options
    };
    
    // Start flush interval
    this.startFlushInterval();
  }
  
  /**
   * Log a message
   * @param entry Log entry
   */
  log(entry: LogEntry): void {
    // Check if log level is enabled
    if (!this.isLevelEnabled(entry.level)) {
      return;
    }
    
    // Add entry to buffer
    this.buffer.push(entry);
    
    // Flush if buffer is full
    if (this.buffer.length >= this.options.maxBufferSize!) {
      this.flush().catch(error => {
        console.error('Error flushing logs to Supabase:', error);
      });
    }
  }
  
  /**
   * Start the flush interval
   */
  private startFlushInterval(): void {
    // Clear any existing interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Start new interval
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush().catch(error => {
          console.error('Error flushing logs to Supabase:', error);
        });
      }
    }, this.options.flushIntervalMs);
  }
  
  /**
   * Flush logs to Supabase
   */
  async flush(): Promise<void> {
    // Check if buffer is empty
    if (this.buffer.length === 0) {
      return;
    }
    
    // Copy buffer and clear
    const entries = [...this.buffer];
    this.buffer = [];
    
    try {
      // Usar usuario_id do options
      const usuarioId = this.options.usuario_id;
      
      // Convert entries to Supabase format
      const logs = entries.map(entry => ({
        level: entry.level,
        message: entry.message,
        logger_name: entry.name,
        timestamp: entry.timestamp.toISOString(),
        acao: 'log',
        nome_tabela: 'logs',
        metadata: {
          ...entry.meta,
          usuario_id: usuarioId,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        }
      }));
      
      // Insert logs into Supabase
      const { error } = await supabase
        .from('logs_auditoria')
        .insert(logs);
      
      if (error) {
        console.error('Error inserting logs into Supabase:', error);
        
        // Put logs back in buffer
        this.buffer = [...entries, ...this.buffer];
        
        // Limit buffer size
        if (this.buffer.length > this.options.maxBufferSize! * 2) {
          this.buffer = this.buffer.slice(-this.options.maxBufferSize!);
        }
      }
    } catch (error) {
      console.error('Error flushing logs to Supabase:', error);
      
      // Put logs back in buffer
      this.buffer = [...entries, ...this.buffer];
      
      // Limit buffer size
      if (this.buffer.length > this.options.maxBufferSize! * 2) {
        this.buffer = this.buffer.slice(-this.options.maxBufferSize!);
      }
    }
  }
  
  /**
   * Stop the transport
   */
  async stop(): Promise<void> {
    // Clear flush interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining logs
    await this.flush();
  }
  
  /**
   * Check if a log level is enabled
   * @param level Log level to check
   * @returns True if the log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.SILENT];
    const minLevelIndex = levels.indexOf(this.options.minLevel!);
    const levelIndex = levels.indexOf(level);
    
    return levelIndex >= minLevelIndex;
  }
}

/**
 * Add Supabase log transport to the logging service
 */
export function addSupabaseLogTransport(): void {
  // Import dynamically to avoid circular dependencies
  import('./index').then(({ getLoggingService }) => {
    // Add transport
    getLoggingService().addTransport(
      new SupabaseLogTransport({
        minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO
      })
    );
  });
}
