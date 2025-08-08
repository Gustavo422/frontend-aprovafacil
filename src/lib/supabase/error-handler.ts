import { ErrorCategory } from './enums/error-category.enum';
import type { IErrorHandler } from './interfaces/error-handler.interface';
import type { SupabaseError } from './types/supabase-error.type';

/**
 * Implementation of the error handler for Supabase errors
 */
export class SupabaseErrorHandler implements IErrorHandler {
  /**
   * Handle an error and return a standardized error object
   * @param error The error to handle
   * @returns A standardized error object
   */
  handleError(error: unknown): SupabaseError {
    const category = this.getErrorCategory(error);
    const retryable = this.isRetryableError(error);
    
    let message = 'An unknown error occurred';
    let statusCode: number | undefined = undefined;
    let code: string | undefined = undefined;
    let details: Record<string, unknown> | undefined = undefined;
    
    if (error instanceof Error) {
      message = error.message;
    }
    
    // Handle Supabase API error
    if (this.isSupabaseError(error)) {
      const supabaseError = error;
      
      if (typeof supabaseError === 'object' && supabaseError !== null && 'error' in supabaseError) {
        const errorObj = supabaseError.error as Record<string, unknown>;
        if (typeof errorObj.message === 'string') {
          message = errorObj.message;
        }
        if (typeof errorObj.code === 'string') {
          code = errorObj.code;
        }
        if (typeof errorObj.details === 'object') {
          details = errorObj.details as Record<string, unknown>;
        }
      }
      
      if (typeof supabaseError === 'object' && supabaseError !== null && 'status' in supabaseError) {
        const status = (supabaseError as Record<string, unknown>).status;
        if (typeof status === 'number') {
          statusCode = status;
        }
      }
    }
    
    // Handle fetch error
    if (this.isNetworkError(error)) {
      message = 'Network error occurred while connecting to Supabase';
      statusCode = 0; // Network error
    }
    
    // Handle auth error
    if (this.isAuthError(error)) {
      const authError = error as Record<string, unknown>;
      if (typeof authError.message === 'string') {
        message = authError.message;
      } else {
        message = 'Authentication error';
      }
      if (typeof authError.status === 'number') {
        statusCode = authError.status;
      } else {
        statusCode = 401;
      }
      if (typeof authError.code === 'string') {
        code = authError.code;
      }
    }
    
    return {
      message,
      category,
      originalError: error,
      statusCode,
      code,
      retryable,
      details,
      timestamp: new Date()
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
      (typeof potentialSupabaseError === 'object' && potentialSupabaseError !== null && 'error' in potentialSupabaseError && typeof (potentialSupabaseError.error as Record<string, unknown>).message === 'string') &&
      ((typeof potentialSupabaseError === 'object' && potentialSupabaseError !== null && 'status' in potentialSupabaseError || (typeof potentialSupabaseError === 'object' && potentialSupabaseError !== null && 'statusCode' in potentialSupabaseError)) && (typeof potentialSupabaseError === 'object' && potentialSupabaseError !== null && 'status' in potentialSupabaseError || (typeof potentialSupabaseError === 'object' && potentialSupabaseError !== null && 'statusCode' in potentialSupabaseError)) !== undefined)
    );
  }
  
  /**
   * Check if an error is a network error
   * @param error The error to check
   * @returns True if the error is a network error, false otherwise
   */
  isNetworkError(error: unknown): boolean {
    if (!error) {
      return false;
    }
    
    // Check for fetch error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('offline') ||
        error.name === 'TypeError' ||
        error.name === 'AbortError'
      );
    }
    
    return false;
  }
  
  /**
   * Check if an error is an authentication error
   * @param error The error to check
   * @returns True if the error is an authentication error, false otherwise
   */
  isAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    
    const potentialAuthError = error as Record<string, unknown>;
    
    // Check for auth error structure
    if ((potentialAuthError).name === 'AuthApiError' || (potentialAuthError).name === 'AuthError') {
      return true;
    }
    
    // Check for status code
    if ((potentialAuthError).status === 401 || (potentialAuthError).status === 403) {
      return true;
    }
    
    // Check for error message
    let errorMessage = '';
    if (
      potentialAuthError &&
      typeof potentialAuthError === 'object' &&
      'message' in potentialAuthError &&
      typeof (potentialAuthError as { message: unknown }).message === 'string'
    ) {
      errorMessage = ((potentialAuthError as { message: string }).message).toLowerCase();
    }
    return (
      errorMessage.includes('auth') ||
      errorMessage.includes('login') ||
      errorMessage.includes('token') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden')
    );
  }
  
  /**
   * Get the category of an error
   * @param error The error to categorize
   * @returns The error category
   */
  getErrorCategory(error: unknown): ErrorCategory {
    if (this.isAuthError(error)) {
      return ErrorCategory.AUTH;
    }
    
    if (this.isNetworkError(error)) {
      return ErrorCategory.NETWORK;
    }
    
    if (this.isSupabaseError(error)) {
      const supabaseError = error as Record<string, unknown>;
      
      // Check for rate limiting
      if (typeof supabaseError === 'object' && supabaseError !== null && 'status' in supabaseError && supabaseError.status === 429) {
        return ErrorCategory.RATE_LIMIT;
      }
      if (typeof supabaseError === 'object' && supabaseError !== null && 'error' in supabaseError) {
        const errorObj = supabaseError.error as Record<string, unknown>;
        if (errorObj.code === 'too_many_requests') {
          return ErrorCategory.RATE_LIMIT;
        }
      }
      // Check for permission errors
      if (typeof supabaseError === 'object' && supabaseError !== null && 'status' in supabaseError && supabaseError.status === 403) {
        return ErrorCategory.PERMISSION;
      }
      if (typeof supabaseError === 'object' && supabaseError !== null && 'error' in supabaseError) {
        const errorObj = supabaseError.error as Record<string, unknown>;
        if (errorObj.code === 'permission_denied') {
          return ErrorCategory.PERMISSION;
        }
      }
      // Check for validation errors
      if (typeof supabaseError === 'object' && supabaseError !== null && 'status' in supabaseError && supabaseError.status === 422) {
        return ErrorCategory.VALIDATION;
      }
      if (typeof supabaseError === 'object' && supabaseError !== null && 'error' in supabaseError) {
        const errorObj = supabaseError.error as Record<string, unknown>;
        if (errorObj.code === 'validation_error') {
          return ErrorCategory.VALIDATION;
        }
      }
      // Check for database errors
      if (
        (typeof supabaseError === 'object' && supabaseError !== null && 'error' in supabaseError)
      ) {
        const errorObj = supabaseError.error as Record<string, unknown>;
        if (typeof errorObj.code === 'string' && (errorObj.code.startsWith('22') || errorObj.code.startsWith('23') || errorObj.code.startsWith('42'))) {
          return ErrorCategory.DATABASE;
        }
      }
      // Check for storage errors
      if (typeof supabaseError === 'object' && supabaseError !== null && 'error' in supabaseError) {
        const errorObj = supabaseError.error as Record<string, unknown>;
        if (typeof errorObj.message === 'string' && errorObj.message.toLowerCase().includes('storage')) {
          return ErrorCategory.STORAGE;
        }
      }
    }
    
    // Check for configuration errors
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes('config') ||
       error.message.toLowerCase().includes('environment') ||
       error.message.toLowerCase().includes('api key') ||
       error.message.toLowerCase().includes('url'))
    ) {
      return ErrorCategory.CONFIG;
    }
    
    return ErrorCategory.UNKNOWN;
  }
  
  /**
   * Check if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  isRetryableError(error: unknown): boolean {
    // Network errors are generally retryable
    if (this.isNetworkError(error)) {
      return true;
    }
    
    // Check for specific status codes that are retryable
    if (this.isSupabaseError(error)) {
      const supabaseError = error as Record<string, unknown>;
      const status = supabaseError.status ?? supabaseError.statusCode;
      
      // 5xx errors are server errors and generally retryable
      if (typeof status === 'number' && status >= 500 && status < 600) {
        return true;
      }
      
      // 429 is too many requests, retryable after a delay
      if (typeof status === 'number' && status === 429) {
        return true;
      }
      
      // 408 is request timeout, retryable
      if (typeof status === 'number' && status === 408) {
        return true;
      }
    }
    
    // Auth errors are generally not retryable without user intervention
    if (this.isAuthError(error)) {
      return false;
    }
    
    return false;
  }
}
