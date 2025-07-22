import { RetryOptions } from './types/retry-options.type';
import { wrapWithRetry } from './retry-handler';

/**
 * Type for a constructor function
 */
type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Decorator factory for making a method retryable
 * @param options Retry options
 * @returns Method decorator
 */
export function Retryable(options?: Partial<RetryOptions>) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: unknown[]): unknown {
      return wrapWithRetry(originalMethod.bind(this), options)(...args);
    };
    
    return descriptor;
  };
}

/**
 * Class decorator that makes all async methods of a class retryable
 * @param options Retry options
 * @returns Class decorator
 */
export function RetryableClass(options?: Partial<RetryOptions>) {
  return function <T extends Constructor>(constructor: T): T {
    // Get all method names from the prototype
    const methodNames = Object.getOwnPropertyNames(constructor.prototype)
      .filter(name => name !== 'constructor' && typeof constructor.prototype[name] === 'function');
    
    // Apply retryable to each method
    for (const methodName of methodNames) {
      const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, methodName);
      
      if (descriptor && typeof descriptor.value === 'function') {
        // Only apply to async methods
        const originalMethod = descriptor.value;
        
        // Check if the method is async (returns a Promise)
        if (originalMethod.constructor.name === 'AsyncFunction' || 
            originalMethod.toString().includes('return __awaiter(this,') ||
            originalMethod.toString().includes('async ')) {
          
          Object.defineProperty(constructor.prototype, methodName, {
            ...descriptor,
            value: function (...args: unknown[]) {
              return wrapWithRetry(originalMethod.bind(this), options)(...args);
            }
          });
        }
      }
    }
    
    return constructor;
  };
}

/**
 * Function to make all async methods of a repository retryable
 * @param repository Repository instance
 * @param options Retry options
 * @returns Repository with retryable methods
 */
export function makeRepositoryRetryable<T extends object>(
  repository: T,
  options?: Partial<RetryOptions>
): T {
  const prototype = Object.getPrototypeOf(repository);
  const methodNames = Object.getOwnPropertyNames(prototype)
    .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
  
  const retryableRepository = Object.create(prototype);
  
  // Copy all properties from the original repository
  Object.getOwnPropertyNames(repository).forEach(prop => {
    const descriptor = Object.getOwnPropertyDescriptor(repository, prop);
    if (descriptor) {
      Object.defineProperty(retryableRepository, prop, descriptor);
    }
  });
  
  // Make async methods retryable
  for (const methodName of methodNames) {
    const originalMethod = prototype[methodName];
    
    // Check if the method is async (returns a Promise)
    if (originalMethod.constructor.name === 'AsyncFunction' || 
        originalMethod.toString().includes('return __awaiter(this,') ||
        originalMethod.toString().includes('async ')) {
      
      retryableRepository[methodName] = function (...args: unknown[]) {
        return wrapWithRetry(originalMethod.bind(this), options)(...args);
      };
    } else {
      retryableRepository[methodName] = originalMethod;
    }
  }
  
  return retryableRepository as T;
}
