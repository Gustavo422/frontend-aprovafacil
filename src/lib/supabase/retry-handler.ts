import { RetryStrategy } from './enums/retry-strategy.enum';
import type { RetryOptions } from './types/retry-options.type';
import { SupabaseErrorHandler } from './error-handler';

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  strategy: RetryStrategy.EXPONENTIAL_JITTER,
  shouldRetry: () => true,
  onRetry: () => {}
};

/**
 * Class for handling retry logic with various strategies
 */
export class RetryHandler {
  private readonly errorHandler: SupabaseErrorHandler;
  
  constructor() {
    this.errorHandler = new SupabaseErrorHandler();
  }
  
  /**
   * Calculate delay for retry based on the strategy
   * @param attempt Current attempt number (1-based)
   * @param options Retry options
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(attempt: number, options: Required<RetryOptions>): number {
    const { baseDelay, maxDelay, strategy } = options;
    
    switch (strategy) {
      case RetryStrategy.NONE:
        return 0;
        
      case RetryStrategy.FIXED:
        return Math.min(baseDelay, maxDelay);
        
      case RetryStrategy.EXPONENTIAL:
        // Exponential backoff: baseDelay * 2^(attempt-1)
        return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
      case RetryStrategy.EXPONENTIAL_JITTER:
        // Exponential backoff with jitter
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const maxValue = Math.min(exponentialDelay, maxDelay);
        // Add random jitter between 0.5 and 1.0 of maxValue
        return (0.5 + Math.random() * 0.5) * maxValue;
        
      default:
        return baseDelay;
    }
  }
  
  /**
   * Default shouldRetry function that uses the error handler to determine if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  defaultShouldRetry(error: unknown): boolean {
    return this.errorHandler.isRetryableError(error);
  }
  
  /**
   * Execute a function with retry logic
   * @param operation Function to execute
   * @param options Retry options
   * @returns Result of the operation
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const mergedOptions: Required<RetryOptions> = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
      // If no shouldRetry function is provided, use the default one
      shouldRetry: options?.shouldRetry || ((error) => this.defaultShouldRetry(error))
    };
    
    const { maxAttempts, shouldRetry, onRetry } = mergedOptions;
    
    let attempt = 1;
    let lastError: unknown;
    
    while (attempt <= maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
          throw error;
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt, mergedOptions);
        
        // Notify about retry
        onRetry(error, attempt, delay);
        
        // Log retry attempt
        console.debug(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms`, error);
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment attempt counter
        attempt++;
      }
    }
    
    // This should never happen due to the throw in the catch block,
    // but TypeScript needs it for type safety
    throw lastError;
  }
  
  /**
   * Create a retryable version of a function
   * @param fn Function to make retryable
   * @param options Retry options
   * @returns Retryable function
   */
  public wrapWithRetry<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, options?: RetryOptions): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      return this.withRetry(async () => fn(...args), options) as ReturnType<T>;
    }) as unknown as T;
  }
}

// Create singleton instance
const retryHandler = new RetryHandler();

/**
 * Execute a function with retry logic
 * @param operation Function to execute
 * @param options Retry options
 * @returns Result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  return retryHandler.withRetry(operation, options);
}

/**
 * Create a retryable version of a function
 * @param fn Function to make retryable
 * @param options Retry options
 * @returns Retryable function
 */
export function wrapWithRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: Partial<RetryOptions>
): T {
  return retryHandler.wrapWithRetry(fn, options);
}

export default retryHandler;
