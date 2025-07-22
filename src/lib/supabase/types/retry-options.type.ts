import { RetryStrategy } from '../enums/retry-strategy.enum';

/**
 * Options for retry behavior
 */
export type RetryOptions = {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;
  
  /**
   * Base delay between retry attempts in milliseconds
   * @default 1000
   */
  baseDelay?: number;
  
  /**
   * Maximum delay between retry attempts in milliseconds
   * @default 30000
   */
  maxDelay?: number;
  
  /**
   * Retry strategy to use
   * @default RetryStrategy.EXPONENTIAL_JITTER
   */
  strategy?: RetryStrategy;
  
  /**
   * Function to determine if an error should be retried
   * @param error The error to check
   * @param attempt The current attempt number (1-based)
   * @returns True if the error should be retried, false otherwise
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  
  /**
   * Function to call before each retry attempt
   * @param error The error that caused the retry
   * @param attempt The current attempt number (1-based)
   * @param delay The delay before the next attempt in milliseconds
   */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
};
