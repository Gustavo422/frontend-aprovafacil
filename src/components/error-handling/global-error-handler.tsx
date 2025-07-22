'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { getErrorHandler } from '@/src/lib/errors';
import { showErrorToast } from './error-toast';
import type { JSX } from 'react';

interface GlobalErrorHandlerProps {
  /**
   * Children to render
   */
  children: React.ReactNode;
  
  /**
   * Whether to show error toasts for unhandled errors
   * @default true
   */
  showToasts?: boolean;
  
  /**
   * Whether to log errors to the console
   * @default true
   */
  logErrors?: boolean;
}

/**
 * Component that sets up global error handling
 */
export function GlobalErrorHandler({
  children,
  showToasts = true,
  logErrors = true
}: GlobalErrorHandlerProps): JSX.Element {
  useEffect(() => {
    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log error
      if (logErrors) {
        getErrorHandler().logError(event.reason, { type: 'unhandledRejection' });
      }
      
      // Show toast
      if (showToasts) {
        showErrorToast({
          title: 'Erro não tratado'
        });
      }
      
      // Prevent default handling
      event.preventDefault();
    };
    
    // Handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      // Log error
      if (logErrors) {
        getErrorHandler().logError(event.error || event.message, { type: 'uncaughtError' });
      }
      
      // Show toast
      if (showToasts) {
        showErrorToast({
          title: 'Erro não tratado'
        });
      }
      
      // Prevent default handling
      event.preventDefault();
    };
    
    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [showToasts, logErrors]);
  
  return <>{children}</>;
}
