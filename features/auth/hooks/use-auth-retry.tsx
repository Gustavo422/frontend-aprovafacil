'use client';

import { useState } from 'react';



interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, delay: number) => void;
  enableRetry?: boolean;
}

interface SupabaseError extends Error {
  message: string;
  [key: string]: unknown;
}

interface OperationResult<T> {
  data?: T;
  error?: SupabaseError | null;
}

export function useAuthRetry() {
  const [isRetrying, setIsRetrying] = useState(false);

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Define retryWithBackoff function first
  const retryWithBackoff = async <T,>(
    fn: () => Promise<OperationResult<T>>,
    options: RetryOptions = {}
  ): Promise<OperationResult<T>> => {
    const {
      maxRetries = 0,
      baseDelay = 1000,
      onRetry,
      enableRetry = false,
    } = options;
    
    const actualMaxRetries = enableRetry ? maxRetries : 0;

    for (let attempt = 0; attempt <= actualMaxRetries; attempt++) {
      try {
        setIsRetrying(false);
        const result = await fn();

        if (result?.error) {
          const error = result.error;
          const errorMessage = error?.message || '';

          if (errorMessage.includes('rate limit') && enableRetry && attempt < actualMaxRetries) {
            const delayMs = baseDelay * Math.pow(2, attempt);
            setIsRetrying(true);

            onRetry?.(attempt + 1, delayMs);
            await delay(delayMs);
            continue;
          }
          return { error };
        }
        return result;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (!errorMessage.includes('rate limit') || !enableRetry || attempt === actualMaxRetries) {
          setIsRetrying(false);
          return { 
            error: { 
              message: errorMessage,
              name: 'Error',
            } as SupabaseError 
          };
        }

        const delayMs = baseDelay * Math.pow(2, attempt);
        setIsRetrying(true);

        onRetry?.(attempt + 1, delayMs);
        await delay(delayMs);
      }
    }

    setIsRetrying(false);
    return { 
      error: { 
        message: 'Maximum retry attempts reached',
        name: 'MaxRetryError'
      } as SupabaseError 
    };
  };

  // Then define retryWithBackoffEnabled which uses retryWithBackoff
  const retryWithBackoffEnabled = <T,>(
    fn: () => Promise<OperationResult<T>>,
    options: Omit<RetryOptions, 'enableRetry'> = {}
  ): Promise<OperationResult<T>> => {
    return retryWithBackoff(fn, {
      ...options,
      enableRetry: true,
      maxRetries: options.maxRetries ?? 3,
    });
  };

  const getRateLimitMessage = (error: unknown): string => {
    if (!error) return 'Ocorreu um erro. Tente novamente.';
    
    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
    
    return errorMessage.includes('rate limit')
      ? 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
      : errorMessage || 'Ocorreu um erro. Tente novamente.';
  };

  return {
    retryWithBackoff,
    retryWithBackoffEnabled,
    getRateLimitMessage,
    isRetrying,
  } as const;
}
