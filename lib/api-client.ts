/**
 * Cliente API para fazer requisições autenticadas
 */

/**
 * Opções para requisições
 */
interface RequestOptions extends RequestInit {
  /**
   * Parâmetros de consulta
   */
  params?: Record<string, string>;
}

/**
 * Cliente API
 */
export class ApiClient {
  /**
   * URL base da API
   */
  private readonly baseUrl: string;
  
  /**
   * Construtor
   * @param baseUrl URL base da API
   */
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Faz uma requisição GET
   * @param endpoint Endpoint da API
   * @param options Opções da requisição
   * @returns Resposta da requisição
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }
  
  /**
   * Faz uma requisição POST
   * @param endpoint Endpoint da API
   * @param data Dados a serem enviados
   * @param options Opções da requisição
   * @returns Resposta da requisição
   */
  async post<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  /**
   * Faz uma requisição PUT
   * @param endpoint Endpoint da API
   * @param data Dados a serem enviados
   * @param options Opções da requisição
   * @returns Resposta da requisição
   */
  async put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  /**
   * Faz uma requisição DELETE
   * @param endpoint Endpoint da API
   * @param options Opções da requisição
   * @returns Resposta da requisição
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
  
  /**
   * Faz uma requisição
   * @param endpoint Endpoint da API
   * @param options Opções da requisição
   * @returns Resposta da requisição
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    // Construir URL com parâmetros de consulta
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }
    
    // Adicionar cabeçalhos padrão
    const headers = new Headers(fetchOptions.headers);
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Adicionar token de autenticação, se disponível
    const token = localStorage.getItem('auth_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Fazer requisição
    const response = await fetch(url, {
      ...fetchOptions,
      headers
    });
    
    // Verificar se a resposta é bem-sucedida
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    // Retornar dados da resposta
    return response.json();
  }
}

// Instância padrão do cliente API
export const apiClient = new ApiClient();

// Hooks para usar o cliente API
export function useApi() {
  return apiClient;
}