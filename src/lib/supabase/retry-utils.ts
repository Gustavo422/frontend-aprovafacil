import { RetryStrategy } from './enums/retry-strategy.enum';
import { RetryOptions } from './types/retry-options.type';

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
 * Calculate delay for retry based on the strategy
 * @param attempt Current attempt number (1-based)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number, options: Required<RetryOptions>): number {
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
      // Add random jitter between 0 and maxValue
      return Math.random() * maxValue;
      
    default:
      return baseDelay;
  }
}

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
  const mergedOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
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
      const delay = calculateRetryDelay(attempt, mergedOptions);
      
      // Notify about retry
      onRetry(error, attempt, delay);
      
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
