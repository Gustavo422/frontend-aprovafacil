import React from 'react';
import { ApiErrorDisplay } from '@/components/ui/api-error-display';
import { cn } from '@/lib/utils';

interface ConcursoErrorMessageProps {
  error: string;
  className?: string;
  onRetry?: () => void;
}

export function ConcursoErrorMessage({ 
  error, 
  className
}: ConcursoErrorMessageProps) {
  return (
    <div className={cn("w-full", className)}>
      <ApiErrorDisplay
        error={error}
        className={className}
      />
    </div>
  );
}