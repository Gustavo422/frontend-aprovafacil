import React from 'react';
import { ErrorDisplay } from './error-display';
import { ErrorType } from './error-message';

interface PageErrorProps {
  title?: string;
  message?: string;
  statusCode?: number;
  errorType?: ErrorType;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

/**
 * A full-page error component that can be used to display errors
 */
export const PageError: React.FC<PageErrorProps> = ({
  title,
  message,
  statusCode,
  errorType,
  onRetry,
  showHomeButton = true,
  showBackButton = true
}) => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <ErrorDisplay
        title={title}
        message={message}
        statusCode={statusCode}
        errorType={errorType}
        onRetry={onRetry}
        showHomeButton={showHomeButton}
        showBackButton={showBackButton}
      />
    </div>
  );
};