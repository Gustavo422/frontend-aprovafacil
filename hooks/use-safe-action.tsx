'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

const useSafeAction = <TInput, TOutput>(
  action: (data: TInput) => Promise<{
    error?: string;
    data?: TOutput;
    fieldErrors?: Record<string, string[]>;
  }>,
  options?: ActionOptions<TOutput>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | undefined>(undefined);

  const execute = useCallback(async (input: TInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await action(input);

      if (result.error) {
        setError(result.error);
        (toast.error as (msg: string) => void)(result.error);
        options?.onError?.(result.error);
      }

      if (result.fieldErrors) {
        const fieldErrors = Object.values(result.fieldErrors).flat();
        const errorMessage = fieldErrors.length > 0 ? fieldErrors[0] : 'Validation error';
        setError(errorMessage);
        (toast.error as (msg: string) => void)(errorMessage);
        options?.onError?.(errorMessage);
      }

      if (result.data) {
        setData(result.data);
        if (options?.successMessage) {
          (toast.success as (msg: string) => void)(options.successMessage);
        }
        options?.onSuccess?.(result.data);
      }

      return result;
    } catch (error: unknown) {
      const errorMessage = 
        error instanceof Error 
          ? error.message 
          : options?.errorMessage || 'An error occurred';
          
      setError(errorMessage);
      (toast.error as (msg: string) => void)(errorMessage);
      options?.onError?.(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
      options?.onComplete?.();
    }
  }, [action, options]);

  return { execute, isLoading, error, data };
};

export default useSafeAction;
// Fixed type definitions
// Added proper error handling typing



