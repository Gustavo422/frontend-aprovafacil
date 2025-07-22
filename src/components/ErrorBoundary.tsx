import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props do ErrorBoundary
 */
interface ErrorBoundaryProps {
  /**
   * Componentes filhos
   */
  children: ReactNode;
  
  /**
   * Componente de fallback personalizado
   */
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  
  /**
   * Callback executado quando um erro é capturado
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /**
   * Se deve mostrar detalhes do erro (apenas em desenvolvimento)
   */
  showErrorDetails?: boolean;
  
  /**
   * Título personalizado para a tela de erro
   */
  errorTitle?: string;
  
  /**
   * Mensagem personalizada para a tela de erro
   */
  errorMessage?: string;
}

/**
 * State do ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Componente de boundary de erro
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  /**
   * Captura erros durante a renderização
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  /**
   * Captura informações adicionais sobre o erro
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Chamar callback de erro se fornecido
    this.props.onError?.(error, errorInfo);
    
    // Log do erro
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    // Enviar erro para serviço de monitoramento (ex: Sentry)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      this.reportError(error, errorInfo);
    }
  }
  
  /**
   * Reportar erro para serviço de monitoramento
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Implementar integração com serviço de monitoramento
    // Exemplo com fetch para API própria:
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.error('Erro ao reportar erro:', err);
      });
    } catch (err) {
      console.error('Erro ao reportar erro:', err);
    }
  }
  
  /**
   * Resetar o estado de erro
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };
  
  /**
   * Recarregar a página
   */
  reloadPage = () => {
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      // Se há um componente de fallback personalizado, usá-lo
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }
      
      // Componente de fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Ícone de erro */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              {/* Título */}
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {this.props.errorTitle || 'Ops! Algo deu errado'}
              </h2>
              
              {/* Mensagem */}
              <p className="mt-2 text-sm text-gray-600">
                {this.props.errorMessage || 
                  'Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.'
                }
              </p>
              
              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {this.props.showErrorDetails && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Detalhes do erro:
                  </h3>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        {'\n\nStack trace:\n'}
                        {this.state.error.stack}
                      </>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent stack:\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}
              
              {/* Ações */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.resetError}
                  className="
                    inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
                    rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transition ease-in-out duration-150
                  "
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tentar novamente
                </button>
                
                <button
                  onClick={this.reloadPage}
                  className="
                    inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium 
                    rounded-md text-gray-700 bg-white hover:bg-gray-50 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transition ease-in-out duration-150
                  "
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Recarregar página
                </button>
              </div>
              
              {/* Link para suporte */}
              <div className="mt-6">
                <p className="text-xs text-gray-500">
                  Se o problema persistir, entre em contato com nosso{' '}
                  <a
                    href="/suporte"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    suporte técnico
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Hook para usar ErrorBoundary de forma funcional
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Componente de ErrorBoundary específico para rotas
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      errorTitle="Página não encontrada"
      errorMessage="A página que você está procurando pode ter sido movida ou não existe mais."
      onError={(error, errorInfo) => {
        // Log específico para erros de rota
        console.error('Erro de rota:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Componente de ErrorBoundary específico para formulários
 */
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      errorTitle="Erro no formulário"
      errorMessage="Ocorreu um erro ao processar o formulário. Tente novamente."
      onError={(error, errorInfo) => {
        // Log específico para erros de formulário
        console.error('Erro de formulário:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}