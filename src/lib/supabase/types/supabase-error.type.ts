import type { ErrorCategory } from '../enums/error-category.enum';

/**
 * Standardized Supabase error type
 */
export type SupabaseError = {
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error category
   */
  category: ErrorCategory;
  
  /**
   * Original error object
   */
  originalError: unknown;
  
  /**
   * HTTP status code (if applicable)
   */
  statusCode?: number;
  
  /**
   * Error code from Supabase (if available)
   */
  code?: string;
  
  /**
   * Whether the error is retryable
   */
  retryable: boolean;
  
  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: Date;
};
