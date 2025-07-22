// Base error classes
export { BaseError } from './base-error';
export {
  AuthError,
  ConfigError,
  DatabaseError,
  NetworkError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TimeoutError,
  ValidationError
} from './error-types';

// Error utilities
export { ErrorUtils } from './error-utils';
export { ErrorHandlerService, getErrorHandler } from './error-handler';

// Default export
export { default } from './error-handler';
