/**
 * Sistema de debug avançado para o frontend
 * 
 * Este módulo fornece uma interface completa para criar instâncias de debug com namespaces padronizados,
 * permitindo logs detalhados e categorizados durante o desenvolvimento.
 * 
 * Baseado na biblioteca 'debug' (https://github.com/debug-js/debug)
 */

import debug from 'debug';

/**
 * Prefixo base para todos os namespaces de debug do aplicativo
 */
const BASE_NAMESPACE = 'app:frontend';

/**
 * Níveis de log suportados
 */
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

/**
 * Interface para as opções de criação de um debugger
 */
export interface DebuggerOptions {
    /**
     * Indica se deve incluir o timestamp nos logs
     * @default true
     */
    includeTimestamp?: boolean;

    /**
     * Indica se deve colorir a saída no console
     * @default true
     */
    useColors?: boolean;

    /**
     * Serviço a ser usado nos logs
     * @default 'debug'
     */
    service?: string;
}

/**
 * Interface para uma função de debug
 */
export interface DebugFunction {
    (format: unknown, ...args: unknown[]): void;
    enabled: boolean;
    namespace: string;

    /**
     * Métodos adicionais para diferentes níveis de log
     */
    debug(format: unknown, ...args: unknown[]): void;
    info(format: unknown, ...args: unknown[]): void;
    warn(format: unknown, ...args: unknown[]): void;
    error(format: unknown, ...args: unknown[]): void;

    /**
     * Método para criar um sub-namespace
     */
    extend(namespace: string): DebugFunction;
}

/**
 * Cria uma instância de debug avançada com namespace padronizado
 * 
 * @param namespace - O namespace específico para esta instância (será prefixado com BASE_NAMESPACE)
 * @param options - Opções de configuração para o debugger
 * @returns Uma função de debug configurada com métodos adicionais
 * 
 * @example
 * // Criar um debugger para o módulo de autenticação
 * const authDebug = createDebugger('auth');
 * authDebug('Usuário autenticado: %s', username);
 * authDebug.info('Login bem-sucedido');
 * authDebug.error('Falha na autenticação: %o', error);
 */
export function createDebugger(namespace: string, options: DebuggerOptions = {}): DebugFunction {
    const {
        includeTimestamp = true,
    } = options;

    // Criar a instância base de debug
    const fullNamespace = `${BASE_NAMESPACE}:${namespace}`;
    const debugInstance = debug(fullNamespace);

    // Configurar cores se necessário
    // if (typeof debugInstance.useColors === 'boolean' && !useColors) {
    //     debugInstance.useColors = false;
    // }

    // Função principal de debug com métodos adicionais
    const enhancedDebug = function (format: unknown, ...args: unknown[]): void {
        // Chamar a função de debug original
        debugInstance(format, ...args);
    } as DebugFunction;

    // Copiar propriedades da instância original
    enhancedDebug.enabled = debugInstance.enabled;
    enhancedDebug.namespace = debugInstance.namespace;

    // Adicionar método para criar sub-namespaces
    enhancedDebug.extend = function (subNamespace: string): DebugFunction {
        return createDebugger(`${namespace}:${subNamespace}`, options);
    };

    // Adicionar métodos para diferentes níveis de log
    enhancedDebug.debug = function (format: unknown, ...args: unknown[]): void {
        if (debugInstance.enabled) {
            const prefix = '%c[DEBUG]%c ';
            enhancedDebug(prefix + format, 'color: blue; font-weight: bold', 'color: inherit', ...args);
        }
    };

    enhancedDebug.info = function (format: unknown, ...args: unknown[]): void {
        if (debugInstance.enabled) {
            const prefix = '%c[INFO]%c ';
            enhancedDebug(prefix + format, 'color: green; font-weight: bold', 'color: inherit', ...args);
        }
    };

    enhancedDebug.warn = function (format: unknown, ...args: unknown[]): void {
        if (debugInstance.enabled) {
            const prefix = '%c[WARN]%c ';
            enhancedDebug(prefix + format, 'color: orange; font-weight: bold', 'color: inherit', ...args);
        }
    };

    enhancedDebug.error = function (format: unknown, ...args: unknown[]): void {
        if (debugInstance.enabled) {
            const prefix = '%c[ERROR]%c ';
            enhancedDebug(prefix + format, 'color: red; font-weight: bold', 'color: inherit', ...args);
        }
    };

    // Modificar o método de log para incluir timestamp se necessário
    if (includeTimestamp && typeof debugInstance.log === 'function') {
        const originalLog = debugInstance.log;
        debugInstance.log = function (args: string, ...rest: unknown[]): void {
            const timestamp = new Date().toISOString();
            args = `[${timestamp}] ${args}`;
            return originalLog.call(this, args, ...rest);
        };
    }

    return enhancedDebug;
}

/**
 * Cria instâncias de debug para diferentes camadas da aplicação
 */
export const debuggers = {
    /**
     * Debug para componentes
     */
    component: createDebugger('component'),

    /**
     * Debug para hooks
     */
    hook: createDebugger('hook'),

    /**
     * Debug para serviços
     */
    service: createDebugger('service'),

    /**
     * Debug para gerenciamento de estado
     */
    state: createDebugger('state'),

    /**
     * Debug para rotas e navegação
     */
    router: createDebugger('router'),

    /**
     * Debug para requisições de API
     */
    api: createDebugger('api'),

    /**
     * Debug para autenticação e autorização
     */
    auth: createDebugger('auth'),

    /**
     * Debug para renderização
     */
    render: createDebugger('render'),

    /**
     * Debug para operações de cache
     */
    cache: createDebugger('cache'),

    /**
     * Debug para operações de sistema (inicialização, configuração, etc.)
     */
    system: createDebugger('system'),

    /**
     * Debug para operações de performance
     */
    performance: createDebugger('performance'),

    /**
     * Debug para validação de dados
     */
    validation: createDebugger('validation')
};

/**
 * Função auxiliar para criar um debugger para um módulo específico dentro de uma camada
 * 
 * @param layer - A camada da aplicação (component, hook, service, etc.)
 * @param module - O nome do módulo específico
 * @param options - Opções de configuração para o debugger
 * @returns Uma função de debug configurada
 * 
 * @example
 * // Criar um debugger para o componente de login
 * const loginDebug = createModuleDebugger('component', 'login');
 * loginDebug('Renderizando formulário de login');
 * loginDebug.info('Login bem-sucedido');
 */
export function createModuleDebugger(layer: string, module: string, options: DebuggerOptions = {}) {
    return createDebugger(`${layer}:${module}`, options);
}

/**
 * Configura o debug para o ambiente atual
 * 
 * @param namespaces - Namespaces a serem ativados
 */
export function configureDebug(namespaces?: string): void {
    if (namespaces) {
        debug.enable(namespaces);
    }
}

/**
 * Ativa todos os namespaces de debug do aplicativo
 */
export function enableAllDebug(): void {
    debug.enable(`${BASE_NAMESPACE}:*`);
}

/**
 * Desativa todos os namespaces de debug do aplicativo
 */
export function disableAllDebug(): void {
    debug.disable();
}

/**
 * Retorna os namespaces atualmente habilitados
 */
export function getEnabledNamespaces(): string {
    return debug.disable();
}

/**
 * Ativa o debug no navegador
 *
 * Para ativar o debug no navegador, abra o console do navegador e execute:
 *
 * ```javascript
 * localStorage.debug = 'app:frontend:*'
 * ```
 *
 * Para ativar apenas logs específicos:
 *
 * ```javascript
 * localStorage.debug = 'app:frontend:component:*,app:frontend:api:*'
 * ```
 *
 * Para desativar todos os logs:
 *
 * ```javascript
 * localStorage.removeItem('debug')
 * ```
 */

// Configurar debug com base no localStorage (já é feito automaticamente pela biblioteca)