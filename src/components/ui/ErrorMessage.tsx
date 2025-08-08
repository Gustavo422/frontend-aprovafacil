import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Interface para configuração de mensagens de erro
 */
interface ErrorMessageProps {
  error: Error | string;
  title?: string;
  variant?: 'inline' | 'card' | 'full' | 'toast';
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  duration?: number;
}

/**
 * Mapeamento de códigos de erro para mensagens amigáveis
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string; suggestion?: string }> = {
  // Erros de autenticação
  'UNAUTHORIZED': {
    title: 'Acesso Negado',
    message: 'Você precisa estar logado para acessar esta funcionalidade.',
    suggestion: 'Faça login para continuar.'
  },
  'FORBIDDEN': {
    title: 'Permissão Negada',
    message: 'Você não tem permissão para realizar esta ação.',
    suggestion: 'Entre em contato com o administrador se acredita que isso é um erro.'
  },
  'TOKEN_EXPIRED': {
    title: 'Sessão Expirada',
    message: 'Sua sessão expirou. Por favor, faça login novamente.',
    suggestion: 'Clique em "Fazer Login" para renovar sua sessão.'
  },

  // Erros de rede
  'NETWORK_ERROR': {
    title: 'Erro de Conexão',
    message: 'Não foi possível conectar ao servidor.',
    suggestion: 'Verifique sua conexão com a internet e tente novamente.'
  },
  'TIMEOUT': {
    title: 'Tempo Limite Excedido',
    message: 'A requisição demorou muito para responder.',
    suggestion: 'Tente novamente em alguns instantes.'
  },
  'SERVER_ERROR': {
    title: 'Erro do Servidor',
    message: 'Ocorreu um erro interno no servidor.',
    suggestion: 'Tente novamente mais tarde ou entre em contato com o suporte.'
  },

  // Erros de validação
  'VALIDATION_ERROR': {
    title: 'Dados Inválidos',
    message: 'Alguns dados fornecidos estão incorretos.',
    suggestion: 'Verifique os campos destacados e tente novamente.'
  },
  'REQUIRED_FIELD': {
    title: 'Campo Obrigatório',
    message: 'Este campo é obrigatório.',
    suggestion: 'Preencha todos os campos obrigatórios.'
  },

  // Erros específicos do concurso
  'CONCURSO_NOT_FOUND': {
    title: 'Concurso Não Encontrado',
    message: 'O concurso solicitado não foi encontrado.',
    suggestion: 'Verifique se o concurso ainda está ativo.'
  },
  'CONCURSO_NOT_CONFIGURED': {
    title: 'Concurso Não Configurado',
    message: 'Você precisa selecionar um concurso para continuar.',
    suggestion: 'Selecione um concurso na barra superior.'
  },
  'CONCURSO_INACTIVE': {
    title: 'Concurso Inativo',
    message: 'Este concurso não está mais ativo.',
    suggestion: 'Selecione um concurso ativo para continuar.'
  },

  // Erros de conteúdo
  'CONTENT_NOT_FOUND': {
    title: 'Conteúdo Não Encontrado',
    message: 'O conteúdo solicitado não está disponível.',
    suggestion: 'Verifique se o conteúdo ainda existe ou foi movido.'
  },
  'CONTENT_UNAVAILABLE': {
    title: 'Conteúdo Indisponível',
    message: 'Este conteúdo não está disponível no momento.',
    suggestion: 'Tente novamente mais tarde.'
  },

  // Erros de simulado
  'SIMULADO_NOT_FOUND': {
    title: 'Simulado Não Encontrado',
    message: 'O simulado solicitado não foi encontrado.',
    suggestion: 'Verifique se o simulado ainda está disponível.'
  },
  'SIMULADO_COMPLETED': {
    title: 'Simulado Já Concluído',
    message: 'Este simulado já foi concluído.',
    suggestion: 'Acesse os resultados ou escolha outro simulado.'
  },

  // Erros de flashcard
  'FLASHCARD_NOT_FOUND': {
    title: 'Flashcard Não Encontrado',
    message: 'O flashcard solicitado não foi encontrado.',
    suggestion: 'Verifique se o flashcard ainda está disponível.'
  },

  // Erros de apostila
  'APOSTILA_NOT_FOUND': {
    title: 'Apostila Não Encontrada',
    message: 'A apostila solicitada não foi encontrada.',
    suggestion: 'Verifique se a apostila ainda está disponível.'
  },

  // Erros genéricos
  'UNKNOWN_ERROR': {
    title: 'Erro Inesperado',
    message: 'Ocorreu um erro inesperado.',
    suggestion: 'Tente novamente ou entre em contato com o suporte.'
  },
  'DEFAULT': {
    title: 'Erro',
    message: 'Algo deu errado.',
    suggestion: 'Tente novamente.'
  }
};

/**
 * Função para obter mensagem de erro amigável
 */
const getErrorMessage = (error: Error | string): { title: string; message: string; suggestion?: string } => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Tentar encontrar código de erro específico
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(code) || errorMessage.toLowerCase().includes(code.toLowerCase())) {
      return message;
    }
  }

  // Verificar por padrões comuns
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    return ERROR_MESSAGES.FORBIDDEN;
  }
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return ERROR_MESSAGES.CONTENT_NOT_FOUND;
  }
  if (errorMessage.includes('500') || errorMessage.includes('server error')) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (errorMessage.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  return ERROR_MESSAGES.DEFAULT;
};

/**
 * Componente de mensagem de erro inline
 */
export const InlineErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  severity = 'error',
  className
}) => {
  const { title, message } = getErrorMessage(error);
  
  const severityStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const severityIcons = {
    error: (
      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    warning: (
      <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={cn(
      'flex items-start p-3 border rounded-md',
      severityStyles[severity],
      className
    )}
    >
      <div className="flex-shrink-0 mr-3">
        {severityIcons[severity]}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </div>
  );
};

/**
 * Componente de mensagem de erro em card
 */
export const CardErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  severity = 'error',
  showDetails = false,
  onRetry,
  onDismiss,
  className
}) => {
  const { title, message, suggestion } = getErrorMessage(error);
  const errorDetails = typeof error === 'string' ? error : error.stack;
  
  const severityStyles = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={cn(
      'border rounded-lg p-6 shadow-sm',
      severityStyles[severity],
      className
    )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          
          {suggestion && (
            <p className="text-sm text-gray-500 mt-2">
              <strong>Sugestão:</strong> {suggestion}
            </p>
          )}
          
          {showDetails && errorDetails && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Detalhes técnicos
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-auto max-h-40">
                <pre className="whitespace-pre-wrap">{errorDetails}</pre>
              </div>
            </details>
          )}
          
          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de toast de erro
 */
export const ErrorToast: React.FC<ErrorMessageProps> = ({
  error,
  onDismiss,
  duration = 5000,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const { title, message } = getErrorMessage(error);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 transform transition-all duration-300',
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      className
    )}
    >
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">{title}</p>
            <p className="text-sm text-red-700 mt-1">{message}</p>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss?.(), 300);
              }}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal de mensagem de erro
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  variant = 'inline',
  ...props
}) => {
  switch (variant) {
    case 'inline':
      return <InlineErrorMessage {...props} />;
    case 'card':
      return <CardErrorMessage {...props} />;
    case 'toast':
      return <ErrorToast {...props} />;
    case 'full':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <CardErrorMessage {...props} className="max-w-md w-full mx-4" />
        </div>
      );
    default:
      return <InlineErrorMessage {...props} />;
  }
};

/**
 * Hook para gerenciar mensagens de erro
 */
export const useErrorMessage = () => {
  const [errors, setErrors] = React.useState<Array<{
    id: string;
    error: Error | string;
    variant?: ErrorMessageProps['variant'];
    severity?: ErrorMessageProps['severity'];
  }>>([]);

  const addError = React.useCallback((
    error: Error | string,
    variant: ErrorMessageProps['variant'] = 'toast',
    severity: ErrorMessageProps['severity'] = 'error'
  ) => {
    const id = Date.now().toString();
    setErrors(prev => [...prev, { id, error, variant, severity }]);

    // Auto-remove toast errors after 5 seconds
    if (variant === 'toast') {
      setTimeout(() => {
        setErrors(prev => prev.filter(error => error.id !== id));
      }, 5000);
    }
  }, []);

  const removeError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearAllErrors
  };
}; 