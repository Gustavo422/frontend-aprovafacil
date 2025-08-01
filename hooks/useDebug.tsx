'use client';

import { useCallback, useEffect, useState } from 'react';

interface DebugData {
  type: 'api' | 'component' | 'state' | 'error' | 'info';
  title: string;
  data: any;
  metadata?: {
    url?: string;
    method?: string;
    status?: number;
    duration?: number;
    component?: string;
  };
}

interface UseDebugOptions {
  componentName?: string;
  autoLogProps?: boolean;
  autoLogState?: boolean;
  autoLogEffects?: boolean;
}

export function useDebug(options: UseDebugOptions = {}) {
  const { componentName, autoLogProps, autoLogState, autoLogEffects } = options;
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);

  // Função para adicionar dados de debug
  const addDebugData = useCallback((data: Omit<DebugData, 'id' | 'timestamp'>) => {
    if (typeof window !== 'undefined' && (window as any).addDebugData) {
      (window as any).addDebugData({
        ...data,
        metadata: {
          ...data.metadata,
          component: componentName
        }
      });
    }
    
    // Também logar no console para desenvolvimento
    console.log(`${data.title}:`, data.data);
  }, [componentName]);

  // Função para logar props
  const logProps = useCallback((props: any, propName = 'props') => {
    addDebugData({
      type: 'component',
      title: `${componentName || 'Component'} - Props (${propName})`,
      data: props
    });
  }, [addDebugData, componentName]);

  // Função para logar estado
  const logState = useCallback((state: any, stateName = 'state') => {
    addDebugData({
      type: 'state',
      title: `${componentName || 'Component'} - Estado (${stateName})`,
      data: state
    });
  }, [addDebugData, componentName]);

  // Função para logar efeitos
  const logEffect = useCallback((effectName: string, dependencies: any[] = []) => {
    addDebugData({
      type: 'component',
      title: `${componentName || 'Component'} - Efeito (${effectName})`,
      data: { dependencies }
    });
  }, [addDebugData, componentName]);

  // Função para logar erros
  const logError = useCallback((error: any, context = '') => {
    addDebugData({
      type: 'error',
      title: `${componentName || 'Component'} - Erro${context ? ` (${context})` : ''}`,
      data: error
    });
  }, [addDebugData, componentName]);

  // Função para logar informações de API
  const logApiCall = useCallback((
    url: string,
    method: string,
    requestData?: any,
    responseData?: any,
    status?: number,
    duration?: number
  ) => {
    addDebugData({
      type: 'api',
      title: `${method.toUpperCase()} ${url}`,
      data: {
        request: requestData,
        response: responseData
      },
      metadata: {
        url,
        method,
        status,
        duration
      }
    });
  }, [addDebugData]);

  // Função para logar informações gerais
  const logInfo = useCallback((message: string, data?: any) => {
    addDebugData({
      type: 'info',
      title: `${componentName || 'Component'} - ${message}`,
      data
    });
  }, [addDebugData, componentName]);

  // Função para alternar visibilidade do painel de debug
  const toggleDebugPanel = useCallback(() => {
    setIsDebugPanelVisible(prev => !prev);
  }, []);

  // Função para mostrar o painel de debug
  const showDebugPanel = useCallback(() => {
    setIsDebugPanelVisible(true);
  }, []);

  // Função para esconder o painel de debug
  const hideDebugPanel = useCallback(() => {
    setIsDebugPanelVisible(false);
  }, []);

  // Função para limpar dados de debug
  const clearDebugData = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).clearDebugData) {
      (window as any).clearDebugData();
    }
  }, []);

  // Função para exportar dados de debug
  const exportDebugData = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).exportDebugData) {
      (window as any).exportDebugData();
    }
  }, []);

  // Log automático de props se configurado
  useEffect(() => {
    if (autoLogProps && componentName) {
      logInfo('Componente montado', { componentName });
    }
  }, [autoLogProps, componentName, logInfo]);

  // Expor funções globalmente para uso via console
  useEffect(() => {
    if (typeof window !== 'undefined' && componentName) {
      const debugHelpers = {
        logProps,
        logState,
        logEffect,
        logError,
        logApiCall,
        logInfo,
        toggleDebugPanel,
        showDebugPanel,
        hideDebugPanel,
        clearDebugData,
        exportDebugData
      };

      (window as any)[`debug_${componentName}`] = debugHelpers;
    }

    return () => {
      if (typeof window !== 'undefined' && componentName) {
        delete (window as any)[`debug_${componentName}`];
      }
    };
  }, [
    componentName,
    logProps,
    logState,
    logEffect,
    logError,
    logApiCall,
    logInfo,
    toggleDebugPanel,
    showDebugPanel,
    hideDebugPanel,
    clearDebugData,
    exportDebugData
  ]);

  return {
    // Funções de log
    logProps,
    logState,
    logEffect,
    logError,
    logApiCall,
    logInfo,
    
    // Controle do painel
    isDebugPanelVisible,
    toggleDebugPanel,
    showDebugPanel,
    hideDebugPanel,
    
    // Utilitários
    clearDebugData,
    exportDebugData,
    
    // Helper para uso rápido
    debug: {
      props: logProps,
      state: logState,
      effect: logEffect,
      error: logError,
      api: logApiCall,
      info: logInfo
    }
  };
}

// Hook especializado para debug de API
export function useApiDebug(componentName?: string) {
  const { logApiCall, logError, logInfo } = useDebug({ componentName });

  const debugApiCall = useCallback((
    url: string,
    method: string,
    requestData?: any,
    fetcher?: () => Promise<any>
  ): Promise<any | null> => {
    const startTime = performance.now();
    
    return (async () => {
      try {
        logInfo(`Iniciando requisição ${method.toUpperCase()} ${url}`, { requestData });
        
        if (!fetcher) {
          throw new Error('Fetcher function não fornecida');
        }

        const response = await fetcher();
        const duration = performance.now() - startTime;
        
        logApiCall(url, method, requestData, response, 200, duration);
        
        return response;
      } catch (error: any) {
        const duration = performance.now() - startTime;
        
        logError(error, `API Call ${method.toUpperCase()} ${url}`);
        logApiCall(url, method, requestData, error, error.status || 500, duration);
        
        return null;
      }
    })();
  }, [logApiCall, logError, logInfo]);

  return {
    debugApiCall,
    logApiCall,
    logError,
    logInfo
  };
}

// Hook especializado para debug de estado
export function useStateDebug<T>(
  initialState: T,
  stateName: string,
  componentName?: string
) {
  const [state, setState] = useState<T>(initialState);
  const { logState } = useDebug({ componentName });

  const setStateWithDebug = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(prevState) : newState;
      
      logState({
        previous: prevState,
        current: nextState,
        change: typeof newState === 'function' ? 'function' : 'value'
      }, stateName);
      
      return nextState;
    });
  }, [logState, stateName]);

  // Log estado inicial
  useEffect(() => {
    logState(state, `${stateName} (inicial)`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setStateWithDebug] as const;
}

export default useDebug; 