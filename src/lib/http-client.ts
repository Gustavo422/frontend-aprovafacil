/**
 * Cliente HTTP para fazer requisições autenticadas
 */
class HttpClient {
  private baseURL: string;
  
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }
  
  /**
   * Adiciona o token de autenticação aos cabeçalhos
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }
  
  /**
   * Trata erros de resposta
   */
  private handleError(response: Response): void {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }
  
  /**
   * Processa a resposta
   */
  private async processResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      this.handleError(response);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * Faz uma requisição GET
   */
  async get<T = unknown>(url: string, params?: Record<string, string>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await fetch(`${this.baseURL}${url}${queryString}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return this.processResponse<T>(response);
  }
  
  /**
   * Faz uma requisição POST
   */
  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    
    return this.processResponse<T>(response);
  }
  
  /**
   * Faz uma requisição PUT
   */
  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    
    return this.processResponse<T>(response);
  }
  
  /**
   * Faz uma requisição DELETE
   */
  async delete<T = unknown>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return this.processResponse<T>(response);
  }
}

// Instância padrão do cliente HTTP
export const httpClient = new HttpClient();

// Hook para usar o cliente HTTP
export function useHttpClient() {
  return httpClient;
}