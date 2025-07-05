type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const entry = this.formatMessage(level, message, context);

    if (this.isDevelopment) {
      // In development, use console with colors
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        reset: '\x1b[0m', // Reset
      };

      // eslint-disable-next-line no-console
      console.log(
        `${colors[level]}[${level.toUpperCase()}]${colors.reset} ${entry.message}`
      );
      if (context) {
        // eslint-disable-next-line no-console
        console.log(`${colors.debug}Context:${colors.reset}`, context);
      }
    } else {
      // In production, you might want to send to a logging service
      // For now, we'll just store in memory or send to a service
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // In production, implement your logging service here
    // Example: Sentry, LogRocket, etc.
    if (process.env.LOGGING_SERVICE_URL) {
      // Send to external logging service
      fetch(process.env.LOGGING_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silently fail if logging service is unavailable
      });
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = Logger.getInstance();
