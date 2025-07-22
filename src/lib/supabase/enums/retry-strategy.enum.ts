/**
 * Enum representing different retry strategies for failed operations
 */
export enum RetryStrategy {
  /**
   * No retry attempts will be made
   */
  NONE = 'none',
  
  /**
   * Retry with a fixed delay between attempts
   */
  FIXED = 'fixed',
  
  /**
   * Retry with exponentially increasing delays between attempts
   */
  EXPONENTIAL = 'exponential',
  
  /**
   * Retry with exponentially increasing delays plus random jitter
   */
  EXPONENTIAL_JITTER = 'exponential_jitter'
}
