'use client';

import React, { ReactElement } from 'react';
import { getErrorHandler } from '@/src/lib/errors';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  /**
   * The error that occurred
   */
  error: Error;
  
  /**
   * Function to reset the error state
   */
  resetError: () => void;
  
  /**
   * Whether to show the error details
   * @default false
   */
  showDetails?: boolean;
  
  /**
   * Custom title for the error message
   */
  title?: string;
  
  /**
   * Custom description for the error message
   */
  description?: string;
  
  /**
   * Custom label for the retry button
   */
  retryLabel?: string;
}

/**
 * Fallback component to render when an error occurs
 */
export function ErrorFallback({
  error,
  resetError,
  showDetails = false,
  title = 'Algo deu errado',
  description,
  retryLabel = 'Tentar novamente'
}: ErrorFallbackProps): ReactElement {
  // Get user-friendly error message
  const errorMessage = description || getErrorHandler().getUserFriendlyMessage(error);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-red-200 bg-red-50 text-red-900 min-h-[200px] w-full">
      <div className="flex flex-col items-center text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-red-800">{errorMessage}</p>
          
          {showDetails && (
            <details className="mt-4 text-left">
              <summary className="text-sm font-medium cursor-pointer">Detalhes t�cnicos</summary>
              <pre className="mt-2 p-4 bg-red-100 rounded text-xs overflow-auto max-h-[200px]">
                {error.name}: {error.message}
                {error.stack && error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <Button
          variant="outline"
          className="mt-4 border-red-300 hover:bg-red-100 hover:text-red-900"
          onClick={resetError}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </Button>
      </div>
    </div>
  );
}
