/**
 * Inicialização automática do sistema de debug
 * 
 * Este arquivo configura automaticamente o sistema de debug
 * quando o aplicativo é carregado.
 */

import { autoInitializeDebug } from './debug-tools';
import apiInterceptor from './api-interceptor';

// Função para inicializar o sistema de debug no cliente
function initializeDebugSystem() {
  if (typeof window === 'undefined') return;

  // Inicializar o sistema de debug
  autoInitializeDebug();

  // Aguardar o DOM estar pronto
  const initializeWhenReady = () => {
    console.log('🔧 Sistema de debug inicializado');
    console.log('📊 Interceptor de API ativo');
    console.log('💡 Use Ctrl+Shift+Z para abrir o painel de debug');
    console.log('🔍 Acesse /debug para a página de debug completa');

    // Adicionar helpers globais para debug
    (window as any).debugHelpers = {
      // Ativar debug para namespaces específicos
      enableDebug: (namespaces = 'app:frontend:*') => {
        localStorage.setItem('debug', namespaces);
        console.log(`🔧 Debug ativado para: ${namespaces}`);
        console.log('🔄 Recarregue a página para aplicar as alterações');
      },

      // Desativar debug
      disableDebug: () => {
        localStorage.removeItem('debug');
        console.log('🔧 Debug desativado');
        console.log('🔄 Recarregue a página para aplicar as alterações');
      },

      // Mostrar ajuda
      showHelp: () => {
        console.log(`
🔧 === SISTEMA DE DEBUG - AJUDA ===

📋 COMANDOS DISPONÍVEIS:
  debugHelpers.enableDebug('app:frontend:*')     - Ativar debug completo
  debugHelpers.enableDebug('app:frontend:api:*') - Ativar apenas debug de API
  debugHelpers.disableDebug()                    - Desativar debug
  debugHelpers.showHelp()                        - Mostrar esta ajuda

🔍 NAMESPACES DISPONÍVEIS:
  - app:frontend:api:*        (requisições de API)
  - app:frontend:component:*  (componentes React)
  - app:frontend:state:*      (gerenciamento de estado)
  - app:frontend:hook:*       (hooks personalizados)
  - app:frontend:error:*      (erros e exceções)
  - app:frontend:performance:* (métricas de performance)
  - app:frontend:*            (todos os namespaces)

🎮 CONTROLES DO PAINEL:
  - Ctrl+Shift+Z              - Alternar painel de debug
  - Clique no botão flutuante - Abrir painel de debug
  - /debug                    - Página completa de debug

📊 INTERCEPTOR DE API:
  apiInterceptor.getCalls()                    - Ver todas as chamadas
  apiInterceptor.getCallsByFilter({hasError: true}) - Ver apenas erros
  apiInterceptor.getStats()                    - Ver estatísticas
  apiInterceptor.exportCalls()                 - Exportar histórico

📝 LOGGING MANUAL:
  addDebugData({type: 'info', title: 'Teste', data: {}}) - Adicionar log manual
  debug_ComponentName.logInfo('Mensagem', dados)        - Log específico do componente

🔄 RECARREGUE A PÁGINA APÓS ALTERAR CONFIGURAÇÕES
        `);
      },

      // Testar conexão com backend
      testBackendConnection: async () => {
        console.log('🔍 Testando conexão com backend...');
        
        try {
          const startTime = performance.now();
          const response = await fetch('/api/health');
          const duration = performance.now() - startTime;
          
          if (response.ok) {
            console.log(`✅ Backend conectado (${duration.toFixed(2)}ms)`);
            const data = await response.json();
            console.log('📊 Dados de health check:', data);
          } else {
            console.log(`❌ Backend retornou erro: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log('❌ Erro ao conectar com backend:', error);
        }
      },

      // Verificar status do sistema
      checkSystemStatus: () => {
        const status = {
          debugEnabled: !!localStorage.getItem('debug'),
          debugNamespaces: localStorage.getItem('debug') || 'Nenhum',
          apiInterceptor: !!(window as any).apiInterceptor,
          debugPanel: !!(window as any).addDebugData,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        };

        console.log('📊 Status do sistema de debug:', status);
        return status;
      },

      // Limpar todos os dados de debug
      clearAllDebugData: () => {
        if ((window as any).clearDebugData) {
          (window as any).clearDebugData();
        }
        if ((window as any).apiInterceptor) {
          (window as any).apiInterceptor.clearCalls();
        }
        console.log('🧹 Todos os dados de debug foram limpos');
      },

      // Exportar todos os dados de debug
      exportAllDebugData: () => {
        const data = {
          timestamp: new Date().toISOString(),
          systemStatus: (window as any).debugHelpers?.checkSystemStatus(),
          apiCalls: (window as any).apiInterceptor?.exportCalls(),
          debugData: 'Use o painel de debug para exportar dados específicos'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-export-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📁 Dados de debug exportados');
      }
    };

    // Expor interceptor de API globalmente
    (window as any).apiInterceptor = {
      getCalls: () => apiInterceptor.getCalls(),
      getCallsByFilter: (filter: any) => apiInterceptor.getCallsByFilter(filter),
      clearCalls: () => apiInterceptor.clearCalls(),
      exportCalls: () => apiInterceptor.exportCalls(),
      setEnabled: (enabled: boolean) => apiInterceptor.setEnabled(enabled),
      setMaxCalls: (max: number) => apiInterceptor.setMaxCalls(max),
      getStats: () => apiInterceptor.getStats()
    };

    // Mostrar mensagem de boas-vindas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`
🎉 === SISTEMA DE DEBUG ATIVO ===

🔧 Para começar a usar:
  debugHelpers.showHelp() - Ver todos os comandos disponíveis
  debugHelpers.testBackendConnection() - Testar conexão com backend
  debugHelpers.checkSystemStatus() - Verificar status do sistema

💡 Dica: Use Ctrl+Shift+Z para abrir o painel de debug rapidamente!
      `);
    }
  };

  // Verificar se o DOM já está pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
  } else {
    // DOM já está pronto, inicializar imediatamente
    initializeWhenReady();
  }
}

// Inicializar quando o módulo for carregado
initializeDebugSystem();

export default {
  apiInterceptor,
  autoInitializeDebug
}; 