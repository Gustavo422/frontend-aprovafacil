import React from 'react';
import { AlertTriangle, ServerCrash, ShieldX } from 'lucide-react';
import { Alert, Alerttitulo, Alertdescricao } from '@/components/ui/alert';

export type ErrorType = 'server' | 'auth' | 'validation' | 'generic';

interface ErrorMessageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  className?: string;
}

const getErrorDefaults = (type: ErrorType) => {
  switch (type) {
    case 'server':
      return {
        icon: <ServerCrash className="h-4 w-4" />,
        title: 'Erro no servidor',
        message: 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.'
      };
    case 'auth':
      return {
        icon: <ShieldX className="h-4 w-4" />,
        title: 'Erro de autenticação',
        message: 'Suas credenciais são inválidas ou sua sessão expirou.'
      };
    case 'validation':
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Erro de validação',
        message: 'Verifique os dados informados e tente novamente.'
      };
    default:
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Erro',
        message: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
      };
  }
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = 'generic',
  title,
  message,
  className
}) => {
  const defaults = getErrorDefaults(type);
  
  return (
    <Alert variant="destructive" className={className}>
      {defaults.icon}
      <Alerttitulo>{title || defaults.title}</Alerttitulo>
      <Alertdescricao>{message || defaults.message}</Alertdescricao>
    </Alert>
  );
};

/**
 * Helper function to determine error type based on HTTP status code
 */
export const getErrorTypeFromStatus = (status?: number): ErrorType => {
  if (!status) return 'generic';
  
  if (status === 401 || status === 403) {
    return 'auth';
  } else if (status >= 400 && status < 500) {
    return 'validation';
  } else if (status >= 500) {
    return 'server';
  }
  
  return 'generic';
};

/**
 * Helper function to get appropriate error message based on HTTP status code
 */
export const getErrorMessageFromStatus = (status?: number, defaultMessage?: string): string => {
  if (!status) return defaultMessage || 'Ocorreu um erro inesperado';
  
  switch (status) {
    case 400:
      return 'Requisição inválida. Verifique os dados enviados.';
    case 401:
      return 'Você não está autenticado. Faça login para continuar.';
    case 403:
      return 'Você não tem permissão para acessar este recurso.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 422:
      return 'Os dados fornecidos são inválidos. Verifique e tente novamente.';
    case 500:
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    case 503:
      return 'Serviço indisponível. Tente novamente mais tarde.';
    default:
      return defaultMessage || 'Ocorreu um erro inesperado';
  }
};