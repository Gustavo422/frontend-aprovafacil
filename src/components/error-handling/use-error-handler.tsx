'use client';

import { useState, useCallback } from 'react';
import { getErrorHandler } from '@/src/lib/errors';
import { showErrorToast } from './error-toast';

interface UseErrorHandlerOptions {
  /**
   * Whether to show error toasts
   * @default true
   */
  showToasts?: boolean;
  
  /**
   * Whether to log errors to the console
   * @default true
   */
  logErrors?: boolean;
  
  /**
   * Whether to show error details in toasts
   * @default false
   */
  showDetails?: boolean;
  
  /**
   * Callback to execute when an error occurs
   */
  onError?: (error: unknown) => void;
}

interface ErrorHandlerResult {
  /**
   * The current error
   */
  error: unknown | null;
  
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * Function to handle an error
   */
  handleError: (error: unknown) => void;
  
  /**
   * Function to reset the error state
   */
  resetError: () => void;
  
  /**
   * Function to wrap an async function with error handling
   */
  withErrorHandling: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Hook for handling errors
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): ErrorHandlerResult {
  // Destructure options with defaults
  const {
    showToasts = true,
    logErrors = true,
    onError
  } = options;
  
  // State for the current error
  const [error, setError] = useState<unknown | null>(null);
  
  // Function to handle an error
  const handleError = useCallback((err: unknown) => {
    // Set error state
    setError(err);
    
    // Log error
    if (logErrors) {
      getErrorHandler().logError(err);
    }
    
    // Show toast
    if (showToasts) {
      showErrorToast({
        // showDetails removido pois não faz parte do tipo
      });
    }
    
    // Execute callback
    if (onError) {
      onError(err);
    }
  }, [logErrors, showToasts, onError]);
  
  // Function to reset the error state
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  // Function to wrap an async function with error handling
  const withErrorHandling = useCallback(async (fn: () => Promise<T>): Promise<T> => {
    return fn().catch((err) => {
      handleError(err);
      throw err;
    });
  }, [handleError]);
  
  return {
    error,
    hasError: error !== null,
    handleError,
    resetError,
    withErrorHandling
  };
}
