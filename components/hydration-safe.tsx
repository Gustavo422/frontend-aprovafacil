'use client';

import { useEffect, useState } from 'react';

interface HydrationSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  suppressWarnings?: boolean;
}

export function HydrationSafe({ 
  children, 
  fallback, 
  suppressWarnings = true 
}: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Aguardar um pouco mais para garantir que todas as extensões do navegador
    // tenham tempo de modificar o DOM
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Capturar erros de hidratação
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('hydration') || event.message.includes('cz-shortcut-listen')) {
        if (suppressWarnings) {
          event.preventDefault();
          setHasError(true);
          // Forçar re-render após erro de hidratação
          setTimeout(() => {
            setIsHydrated(true);
            setHasError(false);
          }, 200);
        }
      }
    };

    // Capturar rejeições de promises não tratadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [suppressWarnings]);

  // Se houve erro de hidratação, mostrar fallback por mais tempo
  if (!isHydrated || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export function ClientOnly({ children, fallback }: HydrationSafeProps) {
  return <HydrationSafe fallback={fallback}>{children}</HydrationSafe>;
}

// Componente específico para lidar com extensões do navegador
export function BrowserExtensionSafe({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguardar que todas as extensões do navegador terminem de modificar o DOM
    const checkExtensions = () => {
      const body = document.body;
      if (body) {
        // Verificar se há atributos de extensões
        const hasExtensionAttributes = body.hasAttribute('cz-shortcut-listen') || 
                                     body.hasAttribute('data-extension-attributes');
        
        if (hasExtensionAttributes) {
          // Aguardar um pouco mais se há extensões
          setTimeout(() => setIsReady(true), 300);
        } else {
          setIsReady(true);
        }
      } else {
        setIsReady(true);
      }
    };

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkExtensions);
    } else {
      checkExtensions();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', checkExtensions);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Inicializando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 



