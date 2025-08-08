import { ErrorCategory } from '../supabase/enums/error-category.enum';
import type { IErrorHandler } from '../supabase/interfaces/error-handler.interface';
import type { SupabaseError } from '../supabase/types/supabase-error.type';
import { ErrorUtils } from './error-utils';

/**
 * Service for handling errors
 */
export class ErrorHandlerService implements IErrorHandler {
  /**
   * Handle an error and return a standardized error object
   * @param error The error to handle
   * @returns A standardized error object
   */
  handleError(error: unknown): SupabaseError {
    // Convert to BaseError
    const baseError = ErrorUtils.toBaseError(error);
    
    // Create standardized error object
    return {
      message: baseError.message,
      category: baseError.category,
      originalError: error,
      statusCode: baseError.statusCode,
      code: baseError.code,
      retryable: baseError.retryable,
      details: baseError.details,
      timestamp: baseError.timestamp
    };
  }
  
  /**
   * Check if an error is a Supabase error
   * @param error The error to check
   * @returns True if the error is a Supabase error, false otherwise
   */
  isSupabaseError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    
    const potentialSupabaseError = error as unknown;
    
    // Check for Supabase API error structure
    return (
      typeof potentialSupabaseError === 'object' &&
      potentialSupabaseError !== null &&
      'status' in potentialSupabaseError &&
      'message' in potentialSupabaseError
    );
  }
  
  /**
   * Check if an error is a network error
   * @param error The error to check
   * @returns True if the error is a network error, false otherwise
   */
  isNetworkError(error: unknown): boolean {
    // Convert to BaseError
    const baseError = ErrorUtils.toBaseError(error);
    
    // Check category
    return baseError.category === ErrorCategory.NETWORK;
  }
  
  /**
   * Check if an error is an authentication error
   * @param error The error to check
   * @returns True if the error is an authentication error, false otherwise
   */
  isAuthError(error: unknown): boolean {
    // Convert to BaseError
    const baseError = ErrorUtils.toBaseError(error);
    
    // Check category
    return baseError.category === ErrorCategory.AUTH;
  }
  
  /**
   * Get the category of an error
   * @param error The error to categorize
   * @returns The error category
   */
  getErrorCategory(error: unknown): ErrorCategory {
    // Convert to BaseError
    const baseError = ErrorUtils.toBaseError(error);
    
    // Return category
    return baseError.category;
  }
  
  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  isRetryableError(error: unknown): boolean {
    return ErrorUtils.isRetryable(error);
  }
  
  /**
   * Log an error
   * @param error The error to log
   * @param context Additional context
   */
  logError(error: unknown, context?: Record<string, unknown>): void {
    // Convert to BaseError
    const baseError = ErrorUtils.toBaseError(error);
    
    // Log error
    console.error('[ErrorHandler]', {
      error: baseError,
      context
    });
  }
  
  /**
   * Get a user-friendly error message
   * @param error The error to get a message for
   * @returns User-friendly error message
   */
  getUserFriendlyMessage(error: unknown): string {
    return ErrorUtils.getUserFriendlyMessage(error);
  }
}

/**
 * Singleton instance of the error handler service
 */
let instance: ErrorHandlerService | null = null;

/**
 * Get the singleton instance of the error handler service
 * @returns Error handler service instance
 */
export function getErrorHandler(): ErrorHandlerService {
  if (!instance) {
    instance = new ErrorHandlerService();
  }
  
  return instance;
}

export default getErrorHandler;
