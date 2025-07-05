'use client';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardRef, useCallback, useState } from 'react';

type SafeButtonProps<TInput, TOutput> = ButtonProps & {
  /**
   * The async function to execute when the button is clicked
   * Should return an object with the shape: { data?: TOutput, error?: string, fieldErrors?: Record<string, string[]> }
   */
  action: (input: TInput) => Promise<{
    data?: TOutput;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  }>;
  /**
   * The input to pass to the action function
   */
  input?: TInput;
  /**
   * Callback when the action is successful
   */
  onSuccess?: (data: TOutput) => void;
  /**
   * Callback when the action fails
   */
  onError?: (error: string) => void;
  /**
   * Callback when the action completes (success or error)
   */
  onComplete?: () => void;
  /**
   * Custom error message to show when the action fails
   */
  errorMessage?: string;
  /**
   * Custom success message to show when the action succeeds
   */
  successMessage?: string;
  /**
   * Whether to show a loading spinner when the action is in progress
   * @default true
   */
  showSpinner?: boolean;
  /**
   * Whether to disable the button when the action is in progress
   * @default true
   */
  disableOnLoading?: boolean;
};

const SafeButton = forwardRef(
  <TInput = void, TOutput = void>(
    {
      action,
      input,
      onSuccess,
      onError,
      onComplete,
      errorMessage,
      successMessage,
      showSpinner = true,
      disableOnLoading = true,
      children,
      className,
      disabled,
      onClick,
      ...props
    }: SafeButtonProps<TInput, TOutput>,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    const [isExecuting, setIsExecuting] = useState(false);

    const handleClick = useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        // Call the original onClick handler if provided
        if (onClick) {
          onClick(e);
        }

        // Prevent default form submission if the button is inside a form
        if (e && 'preventDefault' in e) {
          e.preventDefault();
        }

        setIsExecuting(true);

        try {
          const result = await action(input as TInput);

          if (result.error) {
            toast(result.error, 'error');
            onError?.(result.error);
          } else if (result.data) {
            if (successMessage) {
              toast(successMessage, 'success');
            }
            onSuccess?.(result.data);
          }
        } catch (error) {
          const errorMsg = 
            error instanceof Error 
              ? error.message 
              : errorMessage || 'An error occurred';
              
          toast(errorMsg, 'error');
          onError?.(errorMsg);
        } finally {
          setIsExecuting(false);
          onComplete?.();
        }
      },
      [action, input, onClick, onError, onSuccess, onComplete, errorMessage, successMessage]
    );

    const isLoading = isExecuting;
    const isDisabled = disabled || (disableOnLoading && isLoading);

    return (
      <Button
        ref={ref}
        className={cn('relative', className)}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {showSpinner && isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </Button>
    );
  }
);

// Add display name for debugging
SafeButton.displayName = 'SafeButton';

export { SafeButton };

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // This is a simple implementation that can be enhanced with a proper toast library
  const toastElement = document.createElement('div');
  toastElement.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
  } text-white`;
  toastElement.textContent = message;
  document.body.appendChild(toastElement);
  
  // Remove the toast after 5 seconds
  setTimeout(() => {
    toastElement.remove();
  }, 5000);
}
