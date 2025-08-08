/**
 * Authentication Logger
 * Provides comprehensive logging for authentication flows with different levels and contexts
 */

import type { AuthError} from './auth-error-types';
import { formatAuthErrorForLogging, isCriticalAuthError } from './auth-error-types';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error | AuthError;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// Logger configuration
interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  logLevel: LogLevel;
  includeStackTrace: boolean;
  sanitizeTokens: boolean;
}

class AuthLogger {
  private config: LoggerConfig;
  private readonly sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      includeStackTrace: process.env.NODE_ENV === 'development',
      sanitizeTokens: true,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    if (!this.config.sanitizeTokens) return context;

    const sanitized = { ...context };
    
    // Sanitize common token fields
    const tokenFields = ['token', 'accessToken', 'refreshToken', 'authToken', 'authorization'];
    
    for (const field of tokenFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        const token = sanitized[field];
        if (token.length > 8) {
          sanitized[field] = `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
        } else {
          sanitized[field] = '[REDACTED]';
        }
      }
    }

    // Sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeContext(sanitized[key] as Record<string, unknown>);
      }
    }

    return sanitized;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | AuthError,
    userId?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeContext(context) : undefined,
      error,
      userId,
      sessionId: this.sessionId,
      requestId: context?.requestId as string | undefined
    };
  }

  private formatLogMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      `[AUTH-${entry.sessionId}]`,
      entry.message
    ];

    if (entry.userId) {
      parts.push(`[User: ${entry.userId}]`);
    }

    if (entry.context) {
      parts.push(`Context: ${JSON.stringify(entry.context)}`);
    }

    if (entry.error) {
      if ('category' in entry.error) {
        // AuthError
        parts.push(`AuthError: ${formatAuthErrorForLogging(entry.error)}`);
      } else {
        // Regular Error
        parts.push(`Error: ${entry.error.message}`);
        if (this.config.includeStackTrace && entry.error.stack) {
          parts.push(`Stack: ${entry.error.stack}`);
        }
      }
    }

    return parts.join(' ');
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleLogging) return;

    const message = this.formatLogMessage(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${message}`);
        break;
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemoteLogging) return;

    try {
      // In a real implementation, this would send to a logging service
      // For now, we'll just store it locally or send to a monitoring endpoint
      await fetch('/api/logs/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      }).catch(err => {
        // Fallback to console if remote logging fails
        console.warn('Failed to send log to remote service:', err);
        this.logToConsole(entry);
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.warn('Failed to send log to remote service:', error);
      this.logToConsole(entry);
    }
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | AuthError,
    userId?: string
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error, userId);
    
    // Always log to console in development or for critical errors
    if (this.config.enableConsoleLogging || level === LogLevel.CRITICAL) {
      this.logToConsole(entry);
    }

    // Log to remote service if enabled
    if (this.config.enableRemoteLogging) {
      await this.logToRemote(entry);
    }
  }

  // Public logging methods
  async debug(message: string, context?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context, undefined, userId);
  }

  async info(message: string, context?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log(LogLevel.INFO, message, context, undefined, userId);
  }

  async warn(message: string, context?: Record<string, unknown>, error?: Error, userId?: string): Promise<void> {
    await this.log(LogLevel.WARN, message, context, error, userId);
  }

  async error(message: string, error?: Error | AuthError, context?: Record<string, unknown>, userId?: string): Promise<void> {
    const level = error && 'severity' in error && isCriticalAuthError(error) 
      ? LogLevel.CRITICAL 
      : LogLevel.ERROR;
    await this.log(level, message, context, error, userId);
  }

  async critical(message: string, error?: Error | AuthError, context?: Record<string, unknown>, userId?: string): Promise<void> {
    await this.log(LogLevel.CRITICAL, message, context, error, userId);
  }

  // Authentication-specific logging methods
  async logLoginAttempt(email: string, context?: Record<string, unknown>): Promise<void> {
    await this.info('Login attempt started', {
      email: this.config.sanitizeTokens ? this.maskEmail(email) : email,
      ...context
    });
  }

  async logLoginSuccess(userId: string, email: string, context?: Record<string, unknown>): Promise<void> {
    await this.info('Login successful', {
      email: this.config.sanitizeTokens ? this.maskEmail(email) : email,
      ...context
    }, userId);
  }

  async logLoginFailure(email: string, error: AuthError, context?: Record<string, unknown>): Promise<void> {
    await this.error('Login failed', error, {
      email: this.config.sanitizeTokens ? this.maskEmail(email) : email,
      errorCode: error.code,
      errorCategory: error.category,
      ...context
    });
  }

  async logLogoutAttempt(userId: string, context?: Record<string, unknown>): Promise<void> {
    await this.info('Logout attempt started', context, userId);
  }

  async logLogoutSuccess(userId: string, context?: Record<string, unknown>): Promise<void> {
    await this.info('Logout successful', context, userId);
  }

  async logTokenRefresh(userId: string, success: boolean, context?: Record<string, unknown>): Promise<void> {
    if (success) {
      await this.info('Token refresh successful', context, userId);
    } else {
      await this.warn('Token refresh failed', context, undefined, userId);
    }
  }

  async logAuthCheck(userId: string | null, success: boolean, context?: Record<string, unknown>): Promise<void> {
    await this.debug(`Authentication check ${success ? 'passed' : 'failed'}`, context, userId || undefined);
  }

  async logNetworkError(endpoint: string, error: Error, context?: Record<string, unknown>): Promise<void> {
    await this.error(`Network error accessing ${endpoint}`, error, {
      endpoint,
      ...context
    });
  }

  async logConfigurationError(error: AuthError, context?: Record<string, unknown>): Promise<void> {
    await this.critical('Authentication configuration error', error, context);
  }

  async logRateLimitHit(email: string, context?: Record<string, unknown>): Promise<void> {
    await this.warn('Rate limit hit for authentication', {
      email: this.config.sanitizeTokens ? this.maskEmail(email) : email,
      ...context
    });
  }

  async logSecurityEvent(event: string, userId?: string, context?: Record<string, unknown>): Promise<void> {
    await this.critical(`Security event: ${event}`, undefined, context, userId);
  }

  // Utility methods
  private maskEmail(email: string): string {
    if (!email?.includes('@')) return '[INVALID_EMAIL]';
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return `${localPart}@${domain}`;
    
    return `${localPart.substring(0, 2)}***@${domain}`;
  }

  // Get session ID for correlation
  getSessionId(): string {
    return this.sessionId;
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
export const authLogger = new AuthLogger();

// Export for testing or custom instances
export { AuthLogger };