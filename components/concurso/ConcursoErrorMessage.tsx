import React from 'react';
import { useConcurso } from '@/contexts/ConcursoContext';
import { ApiErrorDisplay } from '@/components/ui/api-error-display';
import { getStatusCodeFromError } from '@/utils/error-handler';

interface ConcursoErrorMessageProps {
  className?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ConcursoErrorMessage: React.FC<ConcursoErrorMessageProps> = ({
  className,
  onRetry,
  compact = true
}) => {
  const { state, loadUserPreference } = useConcurso();
  const { error } = state;
  
  if (!error) return null;
  
  // Extract status code from error message if present
  const statusCode = getStatusCodeFromError(error);
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      loadUserPreference();
    }
  };
  
  return (
    <ApiErrorDisplay
      error={error}
      statusCode={statusCode}
      compact={compact}
      className={className}
      onRetry={handleRetry}
    />
  );
};