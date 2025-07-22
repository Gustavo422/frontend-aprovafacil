/**
 * Utilitários para debug de requisições de API no frontend
 * 
 * Este módulo fornece funções para registrar e analisar requisições de API,
 * ajudando a identificar problemas de comunicação com o backend.
 */

import { createDebugger } from './debugger';
import { measureAsync } from './performance-debug';
import { DEBUG_CONFIG } from '../config/debug';

// Criar um debugger específico para requisições de API
const apiDebug = createDebugger('api');

/**
 * Interface para opções de debug de API
 */
export interface ApiDebugOptions {
  /**
   * Indica se deve registrar os headers da requisição
   * @default false
   */
  logHeaders?: boolean;
  
  /**
   * Indica se deve registrar o corpo da requisição
   * @default true
   */
  logRequestBody?: boolean;
  
  /**
   * Indica se deve registrar o corpo da resposta
   * @default true
   */
  logResponseBody?: boolean;
  
  /**
   * Tamanho máximo do corpo para log (em caracteres)
   * @default 1000
   */
  maxBodySize?: number;
  
  /**
   * Limiar de tempo para alertas (ms)
   * @default 500
   */
  threshold?: number;
}

/**
 * Wrapper para fetch com debug
 * 
 * @param url - URL da requisição
 * @param options - Opções do fetch
 * @param debugOptions - Opções de debug
 * @returns Promise com a resposta
 * 
 * @example
 * const response = await debugFetch('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 */
export async function debugFetch(
  url: string,
  options?: RequestInit,
  debugOptions?: ApiDebugOptions
): Promise<Response> {
  const {
    logHeaders = false,
    logRequestBody = true,
    logResponseBody = true,
    maxBodySize = 1000,
    threshold = DEBUG_CONFIG.performanceThreshold.api
  } = debugOptions || {};
  
  // Clonar as opções para não modificar o objeto original
  const fetchOptions = options ? { ...options } : {};
  
  // Registrar início da requisição
  const method = fetchOptions.method || 'GET';
  apiDebug.info(`${method} ${url} - Iniciando requisição`);
  
  // Registrar headers se configurado
  if (logHeaders && fetchOptions.headers) {
    apiDebug.debug(`${method} ${url} - Headers: %o`, fetchOptions.headers);
  }
  
  // Registrar corpo da requisição se configurado
  if (logRequestBody && fetchOptions.body) {
    let bodyLog: string;
    
    if (typeof fetchOptions.body === 'string') {
      bodyLog = fetchOptions.body.length > maxBodySize
        ? `${fetchOptions.body.substring(0, maxBodySize)}... (truncado)`
        : fetchOptions.body;
    } else {
      bodyLog = 'Corpo não textual';
    }
    
    apiDebug.debug(`${method} ${url} - Corpo da requisição: %o`, bodyLog);
  }
  
  // Executar a requisição com medição de tempo
  return await measureAsync(
    `${method} ${url}`,
    async () => {
      try {
        const response = await fetch(url, fetchOptions);
        
        // Registrar status da resposta
        if (response.ok) {
          apiDebug.info(`${method} ${url} - Resposta: ${response.status} ${response.statusText}`);
        } else {
          apiDebug.warn(`${method} ${url} - Erro: ${response.status} ${response.statusText}`);
        }
        
        // Registrar corpo da resposta se configurado
        if (logResponseBody) {
          try {
            // Clonar a resposta para não consumir o body
            const clonedResponse = response.clone();
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              const data = await clonedResponse.json();
              apiDebug.debug(`${method} ${url} - Corpo da resposta: %o`, data);
            } else {
              const text = await clonedResponse.text();
              const bodyLog = text.length > maxBodySize
                ? `${text.substring(0, maxBodySize)}... (truncado)`
                : text;
              apiDebug.debug(`${method} ${url} - Corpo da resposta: ${bodyLog}`);
            }
          } catch (error) {
            apiDebug.warn(`${method} ${url} - Erro ao ler corpo da resposta: %o`, error);
          }
        }
        
        return response;
      } catch (error) {
        apiDebug.error(`${method} ${url} - Erro na requisição: %o`, error);
        throw error;
      }
    },
    threshold,
    apiDebug
  );
}

// Tipos auxiliares locais para evitar 'any'
type AxiosInterceptors = {
  request: { use: (onFulfilled: (config: unknown) => unknown, onRejected?: (error: unknown) => unknown) => void };
  response: { use: (onFulfilled: (response: unknown) => unknown, onRejected?: (error: unknown) => unknown) => void };
};
type AxiosLike = { interceptors?: AxiosInterceptors };

/**
 * Wrapper para axios com debug
 * 
 * @param axiosInstance - Instância do axios
 * @param debugOptions - Opções de debug
 * @returns Instância do axios configurada com interceptors para debug
 * 
 * @example
 * import axios from 'axios';
 * const api = debugAxios(axios.create({ baseURL: '/api' }));
 * const response = await api.get('/users');
 */
export function debugAxios(
  axiosInstance: unknown,
  debugOptions?: ApiDebugOptions
): unknown {
  const {
    logHeaders = false,
    logRequestBody = true,
    logResponseBody = true,
    maxBodySize = 1000,
    threshold = DEBUG_CONFIG.performanceThreshold.api
  } = debugOptions || {};
  
  // Verificar se axios está disponível
  if (
    !axiosInstance ||
    typeof axiosInstance !== 'object' ||
    axiosInstance === null ||
    !('interceptors' in axiosInstance)
  ) {
    apiDebug.error('debugAxios: instância de axios inválida');
    return axiosInstance;
  }
  
  const instance = axiosInstance as AxiosLike;
  if (instance && 'interceptors' in instance && instance.interceptors) {
    instance.interceptors.request.use(
      (config: unknown) => {
        // Type assertion local para acessar propriedades
        const cfg = config as {
          method?: string;
          url?: string;
          baseURL?: string;
          headers?: Record<string, unknown>;
          data?: unknown;
          _debugRequestTime?: number;
        };
        const { method = 'GET', url = '', baseURL = '' } = cfg;
        const fullUrl = `${baseURL}${url}`;
        if (logHeaders && cfg.headers) {
          apiDebug.debug(`${method.toUpperCase()} ${fullUrl} - Headers: %o`, cfg.headers);
        }
        if (logRequestBody && cfg.data) {
          let bodyLog: string | object;
          if (typeof cfg.data === 'string') {
            bodyLog = cfg.data.length > maxBodySize
              ? `${cfg.data.substring(0, maxBodySize)}... (truncado)`
              : cfg.data;
          } else {
            try {
              const dataStr = JSON.stringify(cfg.data);
              bodyLog = dataStr.length > maxBodySize
                ? { ...cfg.data, _note: '(dados parciais)' }
                : cfg.data;
            } catch {
              bodyLog = 'Corpo não serializável';
            }
          }
          apiDebug.debug(`${method.toUpperCase()} ${fullUrl} - Corpo da requisição: %o`, bodyLog);
        }
        cfg._debugRequestTime = performance.now();
        return config;
      },
      (error: unknown) => {
        apiDebug.error(`Erro ao preparar requisição: %o`, error);
        return Promise.reject(error);
      }
    );

    instance.interceptors.response.use(
      (response: unknown) => {
        const res = response as {
          config?: {
            method?: string;
            url?: string;
            baseURL?: string;
            _debugRequestTime?: number;
          };
          status: number;
          statusText: string;
          data: unknown;
        };
        const { config, status, statusText, data } = res;
        const { method = 'GET', url = '', baseURL = '' } = config || {};
        const fullUrl = `${baseURL || ''}${url || ''}`;
        const endTime = performance.now();
        const startTime = config?._debugRequestTime || endTime;
        const duration = endTime - startTime;
        apiDebug.info(`${method.toUpperCase()} ${fullUrl} - Resposta: ${status} ${statusText} (${duration.toFixed(2)}ms)`);
        if (duration > threshold) {
          apiDebug.warn(`${method.toUpperCase()} ${fullUrl} - Requisição lenta: ${duration.toFixed(2)}ms (acima do limiar de ${threshold}ms)`);
        }
        if (logResponseBody && data) {
          let bodyLog: string | object;
          if (typeof data === 'string') {
            bodyLog = data.length > maxBodySize
              ? `${data.substring(0, maxBodySize)}... (truncado)`
              : data;
          } else {
            try {
              const dataStr = JSON.stringify(data);
              bodyLog = dataStr.length > maxBodySize
                ? { ...data, _note: '(dados parciais)' }
                : data;
            } catch {
              bodyLog = 'Corpo não serializável';
            }
          }
          apiDebug.debug(`${method.toUpperCase()} ${fullUrl} - Corpo da resposta: %o`, bodyLog);
        }
        return response;
      },
      (error: unknown) => {
        const err = error as {
          config?: {
            method?: string;
            url?: string;
            baseURL?: string;
            _debugRequestTime?: number;
          };
          response?: {
            status: number;
            statusText: string;
            data: unknown;
          };
        };
        if (err.config) {
          const { method = 'GET', url = '', baseURL = '' } = err.config;
          const fullUrl = `${baseURL}${url}`;
          const endTime = performance.now();
          const startTime = err.config._debugRequestTime || endTime;
          const duration = endTime - startTime;
          apiDebug.error(`${method.toUpperCase()} ${fullUrl} - Erro após ${duration.toFixed(2)}ms: %o`, err);
          if (err.response) {
            const { status, statusText, data } = err.response;
            apiDebug.error(`${method.toUpperCase()} ${fullUrl} - Resposta de erro: ${status} ${statusText}`);
            if (logResponseBody && data) {
              apiDebug.debug(`${method.toUpperCase()} ${fullUrl} - Corpo do erro: %o`, data);
            }
          }
        } else {
          apiDebug.error(`Erro na requisição: %o`, error);
        }
        return Promise.reject(error);
      }
    );
  }
  return axiosInstance;
}