import React from 'react';
import { ErrorDisplay } from './error-display';
import { ErrorMessage, ErrorType } from './error-message';
import { 
  getStatusCodeFromError, 
  cleanErrorMessage, 
  getErrorTypeFromMessage,
  isDatabaseSchemaError
} from '@/utils/error-handler';

interface ApiErrorDisplayProps {
  error?: string | null;
  statusCode?: number;
  className?: string;
  compact?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

/**
 * Component for displaying API errors with appropriate messages based on error type
 * Ensures server errors are not interpreted as authentication errors
 */
export const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  statusCode: propStatusCode,
  className = '',
  compact = false,
  onRetry,
  showHomeButton = true,
  showBackButton = false
}) => {
  if (!error && !propStatusCode) return null;
  
  // Extract status code from error message if present and not provided as prop
  const extractedStatusCode = error ? getStatusCodeFromError(error) : undefined;
  const statusCode = propStatusCode || extractedStatusCode;
  
  // Clean error message by removing the status code prefix
  const cleanedMessage = error ? cleanErrorMessage(error) : '';
  
  // Determine error type based on status code and message content
  const errorType: ErrorType = getErrorTypeFromMessage(cleanedMessage, statusCode);
  
  // Set title and message based on error type
  let title: string;
  let message: string = cleanedMessage;
  
  switch (errorType) {
    case 'server':
      title = isDatabaseSchemaError(cleanedMessage) 
        ? 'Erro no banco de dados' 
        : 'Erro no servidor';
      message = isDatabaseSchemaError(cleanedMessage)
        ? 'Ocorreu um erro no banco de dados. Nossa equipe foi notificada e está trabalhando na solução.'
        : (message || 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.');
      break;
    case 'auth':
      title = 'Erro de autenticação';
      message = message || 'Suas credenciais são inválidas ou sua sessão expirou.';
      break;
    case 'validation':
      title = 'Erro de validação';
      message = message || 'Verifique os dados informados e tente novamente.';
      break;
    default:
      title = 'Erro';
      message = message || 'Ocorreu um erro inesperado. Por favor, tente novamente.';
  }
  
  // Use compact version for inline errors
  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        <ErrorMessage
          type={errorType}
          title={title}
          message={message}
        />
        {onRetry && (
          <div className="flex justify-end">
            <button
              onClick={onRetry}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 12a9 9 0 0 0 6 8.5l2-4.5"></path>
                <path d="M12 16l-2 4.5"></path>
                <path d="M12 16h4"></path>
              </svg>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Use full error display for page-level errors
  return (
    <ErrorDisplay
      errorType={errorType}
      title={title}
      message={message}
      statusCode={statusCode}
      onRetry={onRetry}
      showHomeButton={showHomeButton}
      showBackButton={showBackButton}
      className={className}
    />
  );
};