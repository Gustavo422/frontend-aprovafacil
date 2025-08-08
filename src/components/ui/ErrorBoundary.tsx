import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Interface para configuração do error boundary
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

/**
 * Interface para o estado do error boundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Componente de fallback padrão para erros
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
  className?: string;
}> = ({ error, resetError, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4">
        <div className="mx-auto h-12 w-12 text-red-500">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Algo deu errado
      </h2>
      
      <p className="text-gray-600 mb-4 max-w-md">
        Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Detalhes do erro (desenvolvimento)
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-40">
            <div className="mb-2">
              <strong>Mensagem:</strong> {error.message}
            </div>
            <div className="mb-2">
              <strong>Stack:</strong>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          </div>
        </details>
      )}
      
      <div className="flex space-x-3">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
};

/**
 * Error Boundary principal
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log do erro
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enviar para serviço de monitoramento (ex: Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Aqui você pode integrar com Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  async render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary para componentes específicos
 */
export const ComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}> = ({ children, componentName, fallback }) => {
  const ComponentFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center mb-2">
        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-sm font-medium text-red-800">
          Erro no componente {componentName || 'desconhecido'}
        </h3>
      </div>
      <p className="text-sm text-red-700 mb-3">
        {error.message}
      </p>
      <button
        onClick={resetError}
        className="text-sm text-red-600 hover:text-red-800 underline"
      >
        Tentar novamente
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback || ComponentFallback}>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Error Boundary para rotas
 */
export const RouteErrorBoundary: React.FC<{
  children: React.ReactNode;
  routeName?: string;
}> = ({ children, routeName }) => {
  const RouteFallback: React.FC<{ error: Error; resetError: () => void }> = ({ resetError }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erro na página
          </h1>
          
          <p className="text-gray-600 mb-6">
            {routeName ? `Ocorreu um erro ao carregar a página "${routeName}".` : 'Ocorreu um erro ao carregar esta página.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={resetError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={RouteFallback}>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Hook para capturar erros em componentes funcionais
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Erro capturado pelo hook:', error);
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: !!error
  };
};

/**
 * Componente para exibir erros de forma elegante
 */
export const ErrorDisplay: React.FC<{
  error: Error | string;
  title?: string;
  variant?: 'inline' | 'card' | 'full';
  onRetry?: () => void;
  className?: string;
}> = ({ error, title = 'Erro', variant = 'inline', onRetry, className }) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const variants = {
    inline: (
      <div className={cn('text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3', className)}>
        <div className="flex items-center">
          <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      </div>
    ),
    
    card: (
      <div className={cn('bg-white border border-red-200 rounded-lg p-6 shadow-sm', className)}>
        <div className="flex items-center mb-4">
          <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    ),
    
    full: (
      <div className={cn('min-h-screen flex items-center justify-center bg-gray-50', className)}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    )
  };

  return variants[variant];
}; 