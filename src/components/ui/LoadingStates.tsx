import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Interface para configuração do loading
 */
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * Componente de loading spinner
 */
export const LoadingSpinner: React.FC<LoadingProps> = ({
  size = 'md',
  className,
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Componente de loading com dots
 */
export const LoadingDots: React.FC<LoadingProps> = ({
  size = 'md',
  className,
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4'
  };

  const dots = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="flex space-x-1">
        <div
          className={cn(
            'animate-bounce rounded-full bg-blue-600',
            sizeClasses[size]
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={cn(
            'animate-bounce rounded-full bg-blue-600',
            sizeClasses[size]
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={cn(
            'animate-bounce rounded-full bg-blue-600',
            sizeClasses[size]
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {dots}
      </div>
    );
  }

  return dots;
};

/**
 * Componente de loading com pulse
 */
export const LoadingPulse: React.FC<LoadingProps> = ({
  size = 'md',
  className,
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const pulse = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'animate-pulse rounded-full bg-blue-600',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {pulse}
      </div>
    );
  }

  return pulse;
};

/**
 * Componente de skeleton loading
 */
export const LoadingSkeleton: React.FC<{
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'list';
}> = ({ className, lines = 3, variant = 'text' }) => {
  if (variant === 'card') {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-48 bg-gray-200 rounded-lg mb-4" />
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

/**
 * Componente de loading para botões
 */
export const ButtonLoading: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}> = ({ size = 'md', variant = 'primary' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const colorClasses = {
    primary: 'border-white border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    outline: 'border-blue-600 border-t-transparent'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[variant]
      )}
    />
  );
};

/**
 * Componente de loading para tabelas
 */
export const TableLoading: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Componente de loading para cards
 */
export const CardLoading: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className }) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Hook para gerenciar estados de loading
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingText, setLoadingText] = React.useState<string>('');

  const startLoading = React.useCallback((text?: string) => {
    setIsLoading(true);
    if (text) setLoadingText(text);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingText('');
  }, []);

  const withLoading = React.useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    text?: string
  ): Promise<T> => {
    return (async () => {
      try {
        startLoading(text);
        return await asyncFn();
      } finally {
        stopLoading();
      }
    })();
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading
  };
};

/**
 * Componente de loading wrapper
 */
export const LoadingWrapper: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: LoadingProps['size'];
  text?: string;
}> = ({
  loading,
  children,
  fallback,
  variant = 'spinner',
  size = 'md',
  text = 'Carregando...'
}) => {
  if (loading) {
    if (fallback) return <>{fallback}</>;
    
    const LoadingComponent = {
      spinner: LoadingSpinner,
      dots: LoadingDots,
      pulse: LoadingPulse
    }[variant];

    if (LoadingComponent) {
      return <LoadingComponent size={size} text={text} />;
    }

    // Fallback para spinner se variant não for encontrado
    return <LoadingSpinner size={size} text={text} />;
  }

  return <>{children}</>;
}; 