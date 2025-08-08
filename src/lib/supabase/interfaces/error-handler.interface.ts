import type { ErrorCategory } from '../enums/error-category.enum';
import type { SupabaseError } from '../types/supabase-error.type';

/**
 * Interface for handling Supabase errors
 */
export interface IErrorHandler {
  /**
   * Handle an error and return a standardized error object
   * @param error The error to handle
   * @returns A standardized error object
   */
  handleError(error: unknown): SupabaseError;
  
  /**
   * Check if an error is a Supabase error
   * @param error The error to check
   * @returns True if the error is a Supabase error, false otherwise
   */
  isSupabaseError(error: unknown): boolean;
  
  /**
   * Check if an error is a network error
   * @param error The error to check
   * @returns True if the error is a network error, false otherwise
   */
  isNetworkError(error: unknown): boolean;
  
  /**
   * Check if an error is an authentication error
   * @param error The error to check
   * @returns True if the error is an authentication error, false otherwise
   */
  isAuthError(error: unknown): boolean;
  
  /**
   * Get the category of an error
   * @param error The error to categorize
   * @returns The error category
   */
  getErrorCategory(error: unknown): ErrorCategory;
  
  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  isRetryableError(error: unknown): boolean;
}
