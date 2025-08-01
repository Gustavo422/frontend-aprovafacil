import { useEffect, useState } from 'react';
import { enableDebugMode, disableDebugMode } from '../lib/debug-interceptor.js';

interface DebugInfo {
  isEnabled: boolean;
  timestamp: string;
  requests: number;
  responses: number;
  errors: number;
}

export function useDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    isEnabled: false,
    timestamp: new Date().toISOString(),
    requests: 0,
    responses: 0,
    errors: 0
  });

  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    // Verificar se está em modo debug
    const checkDebugMode = () => {
      const isDebug = process.env.NODE_ENV === 'development' && 
                     (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
                      typeof window !== 'undefined' && window.location.search.includes('debug=true'));
      
      setIsDebugMode(isDebug);
      setDebugInfo(prev => ({ ...prev, isEnabled: isDebug }));
    };

    checkDebugMode();

    // Listener para mudanças na URL
    const handleUrlChange = () => {
      checkDebugMode();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleUrlChange);
      window.addEventListener('pushstate', handleUrlChange);
      window.addEventListener('replacestate', handleUrlChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleUrlChange);
        window.removeEventListener('pushstate', handleUrlChange);
        window.removeEventListener('replacestate', handleUrlChange);
      }
    };
  }, []);

  const enableDebug = () => {
    enableDebugMode();
    setIsDebugMode(true);
    setDebugInfo(prev => ({ 
      ...prev, 
      isEnabled: true, 
      timestamp: new Date().toISOString() 
    }));

    // Adicionar parâmetro debug à URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('debug', 'true');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const disableDebug = () => {
    disableDebugMode();
    setIsDebugMode(false);
    setDebugInfo(prev => ({ 
      ...prev, 
      isEnabled: false, 
      timestamp: new Date().toISOString() 
    }));

    // Remover parâmetro debug da URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('debug');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const toggleDebug = () => {
    if (isDebugMode) {
      disableDebug();
    } else {
      enableDebug();
    }
  };

  const clearStats = () => {
    setDebugInfo(prev => ({
      ...prev,
      requests: 0,
      responses: 0,
      errors: 0,
      timestamp: new Date().toISOString()
    }));
  };

  return {
    isDebugMode,
    debugInfo,
    enableDebug,
    disableDebug,
    toggleDebug,
    clearStats
  };
}

// Hook para monitorar requisições HTTP
export function useHttpDebug() {
  const [stats, setStats] = useState({
    requests: 0,
    responses: 0,
    errors: 0,
    lastRequest: null as any,
    lastResponse: null as any,
    lastError: null as any
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Interceptar logs do console para contar requisições
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('📤 Frontend Request:')) {
        setStats(prev => ({
          ...prev,
          requests: prev.requests + 1,
          lastRequest: { timestamp: new Date().toISOString(), message }
        }));
      } else if (message.includes('✅ Frontend Response:') || message.includes('⚠️ Frontend Response:')) {
        setStats(prev => ({
          ...prev,
          responses: prev.responses + 1,
          lastResponse: { timestamp: new Date().toISOString(), message }
        }));
      }
      
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('❌ Frontend Error:')) {
        setStats(prev => ({
          ...prev,
          errors: prev.errors + 1,
          lastError: { timestamp: new Date().toISOString(), message }
        }));
      }
      
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  return stats;
}

export default useDebug; 