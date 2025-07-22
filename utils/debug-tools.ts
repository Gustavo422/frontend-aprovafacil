/**
 * Exportação centralizada de todas as ferramentas de debug para o frontend
 * 
 * Este arquivo exporta todas as ferramentas de debug disponíveis no projeto,
 * facilitando a importação e uso em outros módulos.
 */

// Exportar ferramentas básicas de debug
export * from './debugger';

// Exportar ferramentas de performance
export * from './performance-debug';

// Exportar ferramentas de API
export * from './api-debug';

// Exportar configurações
export * from '../config/debug';

/**
 * Inicializa o sistema de debug para o frontend
 * 
 * Esta função configura o sistema de debug com base no ambiente atual
 * e nas configurações fornecidas.
 * 
 * @param options - Opções de inicialização (opcional)
 */
export async function initializeDebugSystem(options?: {
  enableAll?: boolean;
  namespaces?: string;
}): Promise<void> {
  const { enableAll, namespaces } = options || {};
  
  // Importar funções necessárias
  const { enableAllDebug, configureDebug } = await import('./debugger');
  const { getDebugNamespaces } = await import('../config/debug');
  
  // Configurar com base nas opções
  if (enableAll) {
    enableAllDebug();
  } else if (namespaces) {
    configureDebug(namespaces);
  } else {
    // Usar configuração padrão baseada no ambiente
    configureDebug(getDebugNamespaces());
  }
  
  // Registrar inicialização
  const debug = (await import('./debugger')).createDebugger('system');
  debug.info(`Sistema de debug inicializado (ambiente: ${process.env.NODE_ENV || 'development'})`);
}

/**
 * Função para garantir compatibilidade com ambiente de browser
 * 
 * Esta função verifica se o código está sendo executado em um navegador
 * e configura o sistema de debug adequadamente.
 */
export function setupBrowserDebug(): void {
  // Verificar se estamos em um ambiente de browser
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    // No navegador, a biblioteca debug já verifica localStorage.debug automaticamente
    // Mas podemos adicionar algumas configurações adicionais
    
    // Adicionar helper ao objeto window para facilitar a ativação/desativação do debug
    if (process.env.NODE_ENV !== 'production') {
      const debugHelpers = {
        enableDebug: (namespaces = 'app:frontend:*') => {
          localStorage.setItem('debug', namespaces);
          console.log(`Debug ativado para: ${namespaces}`);
          console.log('Recarregue a página para aplicar as alterações.');
        },
        disableDebug: () => {
          localStorage.removeItem('debug');
          console.log('Debug desativado. Recarregue a página para aplicar as alterações.');
        },
        showDebugHelp: () => {
          console.log(`
=== Ajuda do Sistema de Debug ===

Para ativar o debug:
  debugHelpers.enableDebug('app:frontend:*')

Para ativar categorias específicas:
  debugHelpers.enableDebug('app:frontend:api:*,app:frontend:component:*')

Para desativar o debug:
  debugHelpers.disableDebug()

Namespaces disponíveis:
  - app:frontend:component:* (componentes)
  - app:frontend:hook:* (hooks)
  - app:frontend:service:* (serviços)
  - app:frontend:state:* (gerenciamento de estado)
  - app:frontend:router:* (rotas e navegação)
  - app:frontend:api:* (requisições de API)
  - app:frontend:auth:* (autenticação)
  - app:frontend:render:* (renderização)
  - app:frontend:cache:* (cache)
  - app:frontend:system:* (sistema)
  - app:frontend:performance:* (performance)
  - app:frontend:validation:* (validação)

Recarregue a página após alterar as configurações.
          `);
        }
      };
      
      // Adicionar ao objeto window para acesso via console
      (window as { debugHelpers?: typeof debugHelpers }).debugHelpers = debugHelpers;
      
      // Registrar mensagem no console se o debug estiver ativado
      const currentDebug = localStorage.getItem('debug');
      if (currentDebug) {
        console.log(`Debug ativado para: ${currentDebug}`);
        console.log('Use debugHelpers.showDebugHelp() para mais informações.');
      }
    }
  }
}

/**
 * Função para inicializar o sistema de debug automaticamente
 * 
 * Esta função é executada automaticamente quando este módulo é importado,
 * configurando o sistema de debug com base no ambiente atual.
 */
export function autoInitializeDebug(): void {
  // Configurar o sistema de debug
  initializeDebugSystem();
  
  // Configurar helpers para ambiente de browser
  setupBrowserDebug();
}

// Inicializar automaticamente se não estivermos em um ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  autoInitializeDebug();
}