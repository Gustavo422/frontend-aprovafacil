import type { ComponentType, LazyExoticComponent } from 'react';
import React, { Suspense, lazy } from 'react';
import Image from 'next/image';

/**
 * Interface para configuração do lazy loader
 */
interface LazyLoaderProps {
  fallback?: React.ReactNode;
  errorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Interface para componente lazy
 */
interface LazyComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<Record<string, unknown>> | LazyExoticComponent<any>;
  props?: Record<string, unknown>;
}

/**
 * Componente de loading padrão
 */
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    <span className="ml-2 text-gray-600">Carregando...</span>
  </div>
);

/**
 * Error boundary padrão
 */
class DefaultErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoader Error:', error, errorInfo);
  }

  async render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 text-red-600">
          <div className="text-center">
            <div className="text-xl font-semibold mb-2">Erro ao carregar componente</div>
            <div className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || 'Erro desconhecido'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Componente LazyLoader principal
 */
export const LazyLoader: React.FC<LazyLoaderProps & LazyComponentProps> = ({
  component: Component,
  props = {},
  fallback = <DefaultFallback />,
  errorBoundary: ErrorBoundary = DefaultErrorBoundary,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (error) {
    return (
      <ErrorBoundary>
        <div className="flex items-center justify-center p-8 text-red-600">
          <div className="text-center">
            <div className="text-xl font-semibold mb-2">Erro ao carregar componente</div>
            <div className="text-sm text-gray-500 mb-4">{error.message}</div>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={fallback}
      >
        <Component
          {...props}
          onLoad={() => setIsLoaded(true)}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Hook para criar componentes lazy com configuração
 */
export function useLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoaderProps = {}
) {
  const LazyComponent = React.useMemo(() => {
    return lazy(importFn);
  }, [importFn]);

  const LazyWrapper = React.useCallback((props: Record<string, unknown>) => {
    return (
      <LazyLoader
        component={LazyComponent}
        props={props}
        {...options}
      />
    );
  }, [LazyComponent, options]);

  return LazyWrapper;
}

/**
 * Componente para lazy loading de imagens
 */
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className = '', placeholder, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder && (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          )}
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
          <span className="text-red-500 text-sm">Erro ao carregar imagem</span>
        </div>
      )}
      
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={500}
        height={300}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

/**
 * Componente para lazy loading de listas
 */
export const LazyList: React.FC<{
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  pageSize?: number;
  threshold?: number;
  className?: string;
}> = ({ 
  items, 
  renderItem, 
  pageSize = 20, 
  threshold = 100,
  className = '' 
}) => {
  const [visibleItems, setVisibleItems] = React.useState(pageSize);
  const [isLoading, setIsLoading] = React.useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const loadMore = React.useCallback(() => {
    if (isLoading || visibleItems >= items.length) return;
    
    setIsLoading(true);
    
    // Simular delay de carregamento
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + pageSize, items.length));
      setIsLoading(false);
    }, 300);
  }, [isLoading, visibleItems, items.length, pageSize]);

  React.useEffect(() => {
    if (sentinelRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadMore();
            }
          });
        },
        { rootMargin: `${threshold}px` }
      );

      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, threshold]);

  return (
    <div className={className}>
      {items.slice(0, visibleItems).map(async (item, index) => renderItem(item, index))}
      
      {visibleItems < items.length && (
        <div ref={sentinelRef} className="flex justify-center p-4">
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          ) : (
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Carregar mais
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 