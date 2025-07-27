'use client';

import React, { useEffect, useState } from 'react';
import DebugButton from './DebugButton';
import DebugPanel from './DebugPanel';

interface DebugProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({ 
  children, 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Função para inicializar o sistema de debug
    const initializeDebug = () => {
      // Verificar se os helpers já existem
      if (typeof window !== 'undefined' && !(window as any).debugHelpers) {
        console.log('🔧 Inicializando sistema de debug...');
        
        // Importar e inicializar dinamicamente
        import('../../utils/init-debug').then(() => {
          console.log('✅ Sistema de debug inicializado com sucesso');
          setIsInitialized(true);
        }).catch((error) => {
          console.error('❌ Erro ao inicializar sistema de debug:', error);
        });
      } else {
        setIsInitialized(true);
      }
    };

    // Aguardar o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeDebug);
    } else {
      initializeDebug();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', initializeDebug);
    };
  }, [enabled]);

  // Função para alternar o painel de debug
  const toggleDebugPanel = () => {
    setIsDebugPanelVisible(prev => !prev);
  };

  // Expor função globalmente para o atalho de teclado
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        toggleDebugPanel();
        console.log('🔧 Painel de debug alternado via atalho de teclado');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  // Verificar se o sistema está funcionando
  useEffect(() => {
    if (!enabled || !isInitialized) return;

    // Verificar se os helpers estão disponíveis
    const checkDebugSystem = () => {
      if (typeof window !== 'undefined') {
        const hasDebugHelpers = !!(window as any).debugHelpers;
        const hasApiInterceptor = !!(window as any).apiInterceptor;
        
        if (!hasDebugHelpers || !hasApiInterceptor) {
          console.warn('⚠️ Sistema de debug não está completamente inicializado');
          console.log('Debug Helpers:', hasDebugHelpers);
          console.log('API Interceptor:', hasApiInterceptor);
        } else {
          console.log('✅ Sistema de debug funcionando corretamente');
        }
      }
    };

    // Verificar após um pequeno delay para garantir que tudo foi carregado
    const timeoutId = setTimeout(checkDebugSystem, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [enabled, isInitialized]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Botão de debug flutuante */}
      <DebugButton 
        position="bottom-right"
        showStats={true}
      />
      
      {/* Painel de debug */}
      <DebugPanel
        isVisible={isDebugPanelVisible}
        onToggle={setIsDebugPanelVisible}
        maxEntries={200}
      />
    </>
  );
};

export default DebugProvider; 