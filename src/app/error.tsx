'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { getErrorHandler } from '@/src/lib/errors';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import type { JSX } from 'react';

interface ErrorPageProps {
  /**
   * The error that occurred
   */
  error: Error;
  
  /**
   * Function to reset the error state
   */
  reset: () => void;
}

/**
 * Next.js error page component
 */
export default function ErrorPage({ error, reset }: ErrorPageProps): JSX.Element {
  // Log error on mount
  useEffect(() => {
    getErrorHandler().logError(error, { source: 'next-error-page' });
  }, [error]);
  
  // Get user-friendly error message
  const errorMessage = getErrorHandler().getUserFriendlyMessage(error);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border border-red-100">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Algo deu errado</h1>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              P�gina inicial
            </Button>
            
            <Button
              className="flex-1"
              onClick={reset}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="w-full text-left">
              <summary className="text-sm font-medium cursor-pointer text-gray-500">Detalhes t�cnicos</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-[300px] text-gray-800">
                {error.name}: {error.message}
                {error.stack && error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
