/**
 * Interceptor de API para debug automático
 * 
 * Este módulo intercepta todas as requisições de API e as registra
 * automaticamente no sistema de debug.
 */

import { createDebugger } from './debugger';

const debug = createDebugger('api-interceptor');

interface ApiRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: any;
  duration: number;
  timestamp: number;
}

interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  body?: any;
  duration: number;
  timestamp: number;
}

interface ApiCall {
  request: ApiRequest;
  response?: ApiResponse;
  error?: ApiError;
}

class ApiInterceptor {
  private calls: ApiCall[] = [];
  private maxCalls = 100;
  private isEnabled = true;

  constructor() {
    this.setupGlobalFetch();
    this.setupGlobalXMLHttpRequest();
  }

  /**
   * Configura interceptação do fetch global
   */
  private setupGlobalFetch(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!this.isEnabled) {
        return originalFetch(input, init);
      }

      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      const startTime = performance.now();
      const requestTimestamp = Date.now();

      // Preparar dados da requisição
      const request: ApiRequest = {
        url,
        method,
        headers: init?.headers as Record<string, string> || {},
        body: init?.body,
        timestamp: requestTimestamp
      };

      try {
        // Executar a requisição original
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Preparar dados da resposta
        const responseData: ApiResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: this.extractHeaders(response.headers),
          duration,
          timestamp: Date.now()
        };

        // Tentar extrair o corpo da resposta
        try {
          const clonedResponse = response.clone();
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            responseData.body = await clonedResponse.json();
          } else {
            responseData.body = await clonedResponse.text();
          }
        } catch (error) {
          responseData.body = 'Erro ao ler corpo da resposta';
        }

        // Registrar a chamada
        this.addCall({ request, response: responseData });

        // Logar no console se for erro
        if (!response.ok) {
          debug.warn(`${method} ${url} - Erro ${response.status}: ${response.statusText}`);
        } else {
          debug.info(`${method} ${url} - Sucesso (${duration.toFixed(2)}ms)`);
        }

        return response;
      } catch (error: any) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Preparar dados do erro
        const errorData: ApiError = {
          message: error.message || 'Erro desconhecido',
          duration,
          timestamp: Date.now()
        };

        // Registrar a chamada com erro
        this.addCall({ request, error: errorData });

        debug.error(`${method} ${url} - Erro após ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    };
  }

  /**
   * Configura interceptação do XMLHttpRequest (para compatibilidade)
   */
  private setupGlobalXMLHttpRequest(): void {
    if (typeof window === 'undefined') return;

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, user?: string, password?: string) {
      (this as any)._debugMethod = method;
      (this as any)._debugUrl = url.toString();
      (this as any)._debugStartTime = performance.now();
      (this as any)._debugTimestamp = Date.now();
      
      return originalOpen.call(this, method, url, async ?? true, user, password);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      const method = (this as any)._debugMethod;
      const url = (this as any)._debugUrl;
      const startTime = (this as any)._debugStartTime;
      const requestTimestamp = (this as any)._debugTimestamp;

      if (!apiInterceptor.isEnabled || !method || !url) {
        return originalSend.call(this, body);
      }

      // Preparar dados da requisição
      const request: ApiRequest = {
        url,
        method,
        body,
        timestamp: requestTimestamp
      };

      // Interceptar eventos
      this.addEventListener('load', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const responseData: ApiResponse = {
          status: this.status,
          statusText: this.statusText,
          duration,
          timestamp: Date.now()
        };

        // Tentar extrair o corpo da resposta
        try {
          const contentType = this.getResponseHeader('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData.body = JSON.parse(this.responseText);
          } else {
            responseData.body = this.responseText;
          }
        } catch (error) {
          responseData.body = 'Erro ao ler corpo da resposta';
        }

        apiInterceptor.addCall({ request, response: responseData });

        if (!this.status.toString().startsWith('2')) {
          debug.warn(`${method} ${url} - Erro ${this.status}: ${this.statusText}`);
        } else {
          debug.info(`${method} ${url} - Sucesso (${duration.toFixed(2)}ms)`);
        }
      });

      this.addEventListener('error', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const errorData: ApiError = {
          message: 'Erro de rede',
          duration,
          timestamp: Date.now()
        };

        apiInterceptor.addCall({ request, error: errorData });
        debug.error(`${method} ${url} - Erro de rede após ${duration.toFixed(2)}ms`);
      });

      return originalSend.call(this, body);
    };
  }

  /**
   * Extrai headers de um Headers object
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Adiciona uma chamada de API ao histórico
   */
  private addCall(call: ApiCall): void {
    this.calls.unshift(call);
    
    // Manter apenas as últimas chamadas
    if (this.calls.length > this.maxCalls) {
      this.calls = this.calls.slice(0, this.maxCalls);
    }

    // Adicionar ao painel de debug se disponível
    if (typeof window !== 'undefined' && (window as any).addDebugData) {
      const debugData = {
        type: 'api' as const,
        title: `${call.request.method.toUpperCase()} ${call.request.url}`,
        data: call,
        metadata: {
          url: call.request.url,
          method: call.request.method,
          status: call.response?.status || call.error?.status,
          duration: call.response?.duration || call.error?.duration
        }
      };

      (window as any).addDebugData(debugData);
    }
  }

  /**
   * Obtém todas as chamadas de API
   */
  getCalls(): ApiCall[] {
    return [...this.calls];
  }

  /**
   * Obtém chamadas de API filtradas
   */
  getCallsByFilter(filter: {
    method?: string;
    url?: string;
    status?: number;
    hasError?: boolean;
  }): ApiCall[] {
    return this.calls.filter(call => {
      if (filter.method && call.request.method !== filter.method) return false;
      if (filter.url && !call.request.url.includes(filter.url)) return false;
      if (filter.status && call.response?.status !== filter.status) return false;
      if (filter.hasError !== undefined) {
        const hasError = !!call.error;
        if (hasError !== filter.hasError) return false;
      }
      return true;
    });
  }

  /**
   * Limpa o histórico de chamadas
   */
  clearCalls(): void {
    this.calls = [];
    debug.info('Histórico de chamadas de API limpo');
  }

  /**
   * Exporta o histórico de chamadas
   */
  exportCalls(): string {
    const data = {
      timestamp: new Date().toISOString(),
      totalCalls: this.calls.length,
      calls: this.calls
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Habilita ou desabilita a interceptação
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    debug.info(`Interceptação de API ${enabled ? 'habilitada' : 'desabilitada'}`);
  }

  /**
   * Define o número máximo de chamadas a manter
   */
  setMaxCalls(max: number): void {
    this.maxCalls = max;
    if (this.calls.length > max) {
      this.calls = this.calls.slice(0, max);
    }
  }

  /**
   * Obtém estatísticas das chamadas
   */
  getStats() {
    const total = this.calls.length;
    const successful = this.calls.filter(call => call.response && call.response.status.toString().startsWith('2')).length;
    const errors = this.calls.filter(call => call.error || (call.response && !call.response.status.toString().startsWith('2'))).length;
    
    const avgDuration = this.calls
      .filter(call => call.response)
      .reduce((sum, call) => sum + (call.response?.duration || 0), 0) / Math.max(successful, 1);

    return {
      total,
      successful,
      errors,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration: avgDuration.toFixed(2)
    };
  }
}

// Criar instância global
const apiInterceptor = new ApiInterceptor();

// Expor globalmente para uso via console
if (typeof window !== 'undefined') {
  (window as any).apiInterceptor = {
    getCalls: () => apiInterceptor.getCalls(),
    getCallsByFilter: (filter: any) => apiInterceptor.getCallsByFilter(filter),
    clearCalls: () => apiInterceptor.clearCalls(),
    exportCalls: () => apiInterceptor.exportCalls(),
    setEnabled: (enabled: boolean) => apiInterceptor.setEnabled(enabled),
    setMaxCalls: (max: number) => apiInterceptor.setMaxCalls(max),
    getStats: () => apiInterceptor.getStats()
  };
}

export default apiInterceptor; 