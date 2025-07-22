'use client';

import React from 'react';
import { toast } from '@/features/shared/hooks/use-toast';

interface ErrorToastOptions {
  /**
   * Custom title for the error message
   */
  title?: string;
  
  /**
   * Custom description for the error message
   */
  description?: string;
  
  /**
   * Duration in milliseconds
   * @default 5000
   */
  duration?: number;
  
  /**
   * Whether to show the error details
   * @default false
   */
  showDetails?: boolean;
}

/**
 * Show an error toast
 */
export function showErrorToast({
  title = 'Erro',
  duration = 5000
}: Pick<ErrorToastOptions, 'title' | 'duration'>): void {
  // Show toast
  toast({
    variant: 'destructive',
    title: typeof title === 'string' ? title : 'Erro',
    duration
  });
}

/**
 * Component that shows an error toast when an error occurs
 */
export function ErrorToast({
  title,
  duration
}: Pick<ErrorToastOptions, 'title' | 'duration'>): null {
  // Show toast on mount
  React.useEffect(() => {
    showErrorToast({
      title,
      duration
    });
  }, [title, duration]);
  
  // This component doesn't render anything
  return null;
}
