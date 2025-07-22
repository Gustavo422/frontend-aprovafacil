/**
 * Configuração do sistema de debug
 * 
 * Este arquivo contém as configurações para o sistema de debug,
 * incluindo namespaces padrão e opções de formatação.
 */

import { DebuggerOptions } from '../utils/debugger';

/**
 * Configurações padrão para o sistema de debug
 */
export const DEBUG_CONFIG = {
  /**
   * Prefixo base para todos os namespaces
   */
  baseNamespace: 'app:frontend',
  
  /**
   * Opções padrão para todos os debuggers
   */
  defaultOptions: {
    includeTimestamp: true,
    useColors: true
  } as DebuggerOptions,
  
  /**
   * Namespaces ativados por padrão em ambiente de desenvolvimento
   * (pode ser sobrescrito pela variável localStorage.debug)
   */
  defaultNamespaces: 'app:frontend:*',
  
  /**
   * Namespaces ativados por padrão em ambiente de teste
   */
  testNamespaces: 'app:frontend:error:*',
  
  /**
   * Namespaces ativados por padrão em ambiente de produção
   */
  productionNamespaces: 'app:frontend:error:*,app:frontend:warn:*',
  
  /**
   * Tamanho máximo da mensagem de log (caracteres)
   */
  maxLogLength: 10000,
  
  /**
   * Indica se deve registrar o tempo de execução de operações
   */
  measurePerformance: true,
  
  /**
   * Limiar para alertas de performance (ms)
   */
  performanceThreshold: {
    api: 500,       // Requisições de API
    render: 100,    // Renderização de componentes
    transition: 300 // Transições de página
  }
};

/**
 * Obtém os namespaces de debug com base no ambiente atual
 */
export function getDebugNamespaces(): string {
  // No navegador, a biblioteca debug já verifica localStorage.debug automaticamente
  
  // Caso não esteja definido no localStorage, usar os namespaces padrão com base no ambiente
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  switch (nodeEnv) {
    case 'production':
      return DEBUG_CONFIG.productionNamespaces;
    case 'test':
      return DEBUG_CONFIG.testNamespaces;
    default:
      return DEBUG_CONFIG.defaultNamespaces;
  }
}

/**
 * Obtém as opções de debug com base no namespace
 */
export function getDebugOptions(namespace: string): DebuggerOptions {
  // Opções base
  const options: DebuggerOptions = { ...DEBUG_CONFIG.defaultOptions };
  
  // Personalizar opções com base no namespace
  if (namespace.includes('performance')) {
    options.service = 'performance';
  } else if (namespace.includes('api')) {
    options.service = 'api';
  } else if (namespace.includes('component')) {
    options.service = 'component';
  }
  
  return options;
}