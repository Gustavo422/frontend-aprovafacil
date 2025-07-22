import { RetryStrategy } from './enums/retry-strategy.enum';
import { RetryHandler } from './retry-handler';

/**
 * Utility class to demonstrate and test different retry strategies
 */
export class RetryDemo {
  private retryHandler: RetryHandler;
  
  constructor() {
    this.retryHandler = new RetryHandler();
  }
  
  /**
   * Simulate a function that fails a certain number of times before succeeding
   * @param failCount Number of times to fail before succeeding
   * @param errorMessage Error message to throw
   * @returns A promise that resolves after failCount failures
   */
  simulateFailures<T>(failCount: number, successValue: T): () => Promise<T> {
    let attempts = 0;
    
    return async () => {
      attempts++;
      
      if (attempts <= failCount) {
        console.log(`Attempt ${attempts}: Failing as expected`);
        throw new Error(`Failure (attempt ${attempts})`);
      }
      
      console.log(`Attempt ${attempts}: Succeeding`);
      return successValue;
    };
  }
  
  /**
   * Demonstrate different retry strategies
   */
  async demonstrateStrategies(): Promise<void> {
    const strategies = [
      { name: 'No Retry', strategy: RetryStrategy.NONE },
      { name: 'Fixed Delay', strategy: RetryStrategy.FIXED },
      { name: 'Exponential Backoff', strategy: RetryStrategy.EXPONENTIAL },
      { name: 'Exponential Backoff with Jitter', strategy: RetryStrategy.EXPONENTIAL_JITTER }
    ];
    
    for (const { name, strategy } of strategies) {
      console.log(`\n--- Testing ${name} Strategy ---`);
      
      try {
        // Create a function that fails 3 times then succeeds
        const operation = this.simulateFailures(3, 'Success!');
        
        // Execute with retry
        const result = await this.retryHandler.withRetry(operation, {
          maxAttempts: 5,
          baseDelay: 100, // Short delay for demo purposes
          strategy,
          onRetry: (error, attempt, delay) => {
            console.log(`Retry ${attempt} scheduled in ${delay}ms due to: ${error}`);
          }
        });
        
        console.log(`Result: ${result}`);
      } catch (error) {
        console.error(`Strategy ${name} failed: ${error}`);
      }
    }
  }
  
  /**
   * Generate a visual representation of retry delays for different strategies
   * @param attempts Number of attempts to simulate
   * @param baseDelay Base delay in milliseconds
   * @returns Object with delays for each strategy
   */
  generateDelayComparison(attempts: number, baseDelay = 1000): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    
    // For each strategy
    for (const strategy of Object.values(RetryStrategy)) {
      const delays: number[] = [];
      
      // For each attempt
      for (let attempt = 1; attempt <= attempts; attempt++) {
        const delay = this.retryHandler.calculateRetryDelay(attempt, {
          maxAttempts: attempts,
          baseDelay,
          maxDelay: 30000,
          strategy: strategy as RetryStrategy,
          shouldRetry: () => true,
          onRetry: () => {}
        });
        
        delays.push(delay);
      }
      
      result[strategy] = delays;
    }
    
    return result;
  }
}

// Export singleton instance
export const retryDemo = new RetryDemo();
export default retryDemo;
