import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Interface para configuração do retry automático
 */
interface AutoRetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryCondition?: (error: Error) => boolean;
}

/**
 * Configuração padrão para retry
 */
const DEFAULT_RETRY_CONFIG: AutoRetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  retryCondition: (error: Error) => {
    // Retry apenas para erros de rede e servidor
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    return retryableErrors.some(code => 
      error.message.includes(code) || 
      error.name.includes(code)
    );
  }
};

/**
 * Hook para retry automático
 */
export const useAutoRetry = (config: Partial<AutoRetryConfig> = {}) => {
  const finalConfig = React.useMemo(() => ({ ...DEFAULT_RETRY_CONFIG, ...config }), [config]);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const executeWithRetry = React.useCallback(async <T,>(
    operation: () => Promise<T>,
    onProgress?: (attempt: number, error: Error) => void
  ): Promise<T> => {
    return (async () => {
    let currentAttempt = 0;
    let lastError: Error | null = null;

    while (currentAttempt < finalConfig.maxAttempts) {
      try {
        currentAttempt++;
        setAttempts(currentAttempt);
        setIsRetrying(true);
        setLastError(null);

        const result = await operation();
        
        // Sucesso - resetar estado
        setIsRetrying(false);
        setAttempts(0);
        setLastError(null);
        
        return result;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        setLastError(lastError);

        // Verificar se deve tentar novamente
        if (currentAttempt >= finalConfig.maxAttempts) {
          break;
        }

        if (finalConfig.retryCondition && !finalConfig.retryCondition(lastError)) {
          break;
        }

        // Callback de progresso
        onProgress?.(currentAttempt, lastError);

        // Calcular delay com backoff exponencial
        const delay = Math.min(
          finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier, currentAttempt - 1),
          finalConfig.maxDelayMs
        );

        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Todas as tentativas falharam
    setIsRetrying(false);
    if (lastError) throw lastError;
    throw new Error('Operação falhou, mas nenhum erro foi capturado.');
    })();
  }, [finalConfig]);

  const reset = React.useCallback(() => {
    setIsRetrying(false);
    setAttempts(0);
    setLastError(null);
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    attempts,
    lastError,
    reset,
    maxAttempts: finalConfig.maxAttempts
  };
};

/**
 * Componente de retry automático
 */
export const AutoRetryWrapper: React.FC<{
  children: React.ReactNode;
  config?: Partial<AutoRetryConfig>;
  onRetry?: (attempt: number, error: Error) => void;
  fallback?: React.ComponentType<{ error: Error; retry: () => void; attempts: number }>;
  className?: string;
}> = ({ children, config, fallback, className }) => {
  const { isRetrying, attempts, lastError, reset, maxAttempts } = useAutoRetry(config);

  const DefaultFallback: React.FC<{ error: Error; retry: () => void; attempts: number }> = ({ retry, attempts }) => (
    <div className={cn('p-6 text-center', className)}>
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Erro na operação
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        {attempts >= maxAttempts 
          ? 'Todas as tentativas falharam. Tente novamente mais tarde.'
          : `Tentativa ${attempts} de ${maxAttempts} falhou.`
        }
      </p>
      
      {attempts < maxAttempts && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );

  const FallbackComponent = fallback || DefaultFallback;

  if (lastError && attempts >= maxAttempts) {
    return (
      <FallbackComponent
        error={lastError}
        retry={() => reset()}
        attempts={attempts}
      />
    );
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {isRetrying && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Tentativa {attempts} de {maxAttempts}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook para retry de operações específicas
 */
export const useRetryableOperation = <T,>(
  operation: () => Promise<T>,
  config: Partial<AutoRetryConfig> = {}
) => {
  const { executeWithRetry, isRetrying, attempts, lastError, reset } = useAutoRetry(config);
  const [result, setResult] = React.useState<T | null>(null);

  const execute = React.useCallback(async () => {
    try {
      const data = await executeWithRetry(operation);
      setResult(data);
      return data;
    } catch (error) {
      setResult(null);
      throw error;
    }
  }, [executeWithRetry, operation]);

  return {
    execute,
    result,
    isRetrying,
    attempts,
    lastError,
    reset
  };
};

/**
 * Componente de retry para botões
 */
export const RetryButton: React.FC<{
  onRetry: () => Promise<void>;
  children: React.ReactNode;
  config?: Partial<AutoRetryConfig>;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}> = ({ 
  onRetry, 
  children, 
  config, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  className 
}) => {
  const { executeWithRetry, isRetrying, attempts } = useAutoRetry(config);

  const handleClick = React.useCallback(async () => {
    try {
      await executeWithRetry(onRetry);
    } catch (error) {
      // Erro já tratado pelo hook
      console.error('Retry failed:', error);
    }
  }, [executeWithRetry, onRetry]);

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50'
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isRetrying}
      className={cn(
        'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isRetrying) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isRetrying ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          <span>Tentando... ({attempts})</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Hook para retry de queries
 */
export const useRetryableQuery = <T,>(
  queryFn: () => Promise<T>,
  config: Partial<AutoRetryConfig> = {}
) => {
  const { executeWithRetry, isRetrying, attempts, lastError, reset } = useAutoRetry(config);
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const execute = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await executeWithRetry(queryFn);
      setData(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [executeWithRetry, queryFn]);

  const refetch = React.useCallback(async () => {
    reset();
    return execute();
  }, [reset, execute]);

  return {
    data,
    isLoading: isLoading || isRetrying,
    isRetrying,
    attempts,
    lastError,
    execute,
    refetch,
    reset
  };
};

/**
 * Componente de retry para listas
 */
export const RetryableList: React.FC<{
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  onRetry: () => Promise<void>;
  config?: Partial<AutoRetryConfig>;
  emptyMessage?: string;
  errorMessage?: string;
  className?: string;
}> = ({ 
  items, 
  renderItem, 
  onRetry, 
  config,
  emptyMessage = 'Nenhum item encontrado',
  errorMessage = 'Erro ao carregar itens',
  className 
}) => {
  const { executeWithRetry, isRetrying, attempts, lastError, maxAttempts } = useAutoRetry(config);

  const handleRetry = React.useCallback(async () => {
    try {
      await executeWithRetry(onRetry);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, [executeWithRetry, onRetry]);

  if (lastError && attempts >= maxAttempts) {
    return (
      <div className={cn('text-center p-8', className)}>
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {errorMessage}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Não foi possível carregar os itens. Tente novamente.
        </p>
        
        <RetryButton onRetry={handleRetry}>
          Tentar novamente
        </RetryButton>
      </div>
    );
  }

  if (items.length === 0 && !isRetrying) {
    return (
      <div className={cn('text-center p-8', className)}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className={isRetrying ? 'opacity-50' : ''}>
        {items.map(async (item, index) => renderItem(item, index))}
      </div>
      
      {isRetrying && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Tentativa {attempts} de {maxAttempts}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 