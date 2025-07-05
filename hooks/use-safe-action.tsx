'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

type ActionState<TInput, TOutput> = {
  fieldErrors?: Record<string, string[]> | null;
  error?: string | null;
  data?: TOutput;
};

type Action<TInput, TOutput> = (
  data: TInput
) => Promise<ActionState<TInput, TOutput>>;

export const useSafeAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
    errorMessage?: string;
    successMessage?: string;
  }
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | undefined>(undefined);

  const execute = useCallback(
    async (input: TInput) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(input);

        if (result.error) {
          setError(result.error);
          toast.error(result.error);
          options?.onError?.(result.error);
        }

        if (result.fieldErrors) {
          const fieldErrors = Object.values(result.fieldErrors).flat();
          const errorMessage = fieldErrors.length > 0 ? fieldErrors[0] : 'Validation error';
          setError(errorMessage);
          toast.error(errorMessage);
          options?.onError?.(errorMessage);
        }

        if (result.data) {
          setData(result.data);
          if (options?.successMessage) {
            toast.success(options.successMessage);
          }
          options?.onSuccess?.(result.data);
        }

        return result;
      } catch (error) {
        console.error('Error in useSafeAction:', error);
        const errorMessage = 
          error instanceof Error 
            ? error.message 
            : options?.errorMessage || 'An error occurred';
            
        setError(errorMessage);
        toast.error(errorMessage);
        options?.onError?.(errorMessage);
        return { error: errorMessage };
      } finally {
        setIsLoading(false);
        options?.onComplete?.();
      }
    },
    [action, options]
  );

  return {
    execute,
    isLoading,
    error,
    data,
  };
};

export default useSafeAction;
