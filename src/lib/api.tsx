import axios from 'axios'
import { setupDebugInterceptors } from './debug-interceptor.js'

// Configuração do Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

class ApiClient {
  private client: ReturnType<typeof axios.create>

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    
    // Configurar interceptors de debug se estiver em modo debug
    if (process.env.NODE_ENV === 'development' && 
        (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
         typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
      setupDebugInterceptors(this.client)
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (config: any) => {
        // Adicionar token de autenticação se disponível
        try {
          const token = this.getAuthToken()
          
          if (token) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${token}`,
            }
            
            // Log de debug para autenticação
            if (process.env.NODE_ENV === 'development' && 
                (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
                 typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
              console.log('[DEBUG] 🔐 Token de autenticação adicionado:', {
                token: token.substring(0, 20) + '...',
                url: config.url,
                method: config.method
              });
            }
          } else {
            // Log de debug quando não há token
            if (process.env.NODE_ENV === 'development' && 
                (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
                 typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
              console.warn('[DEBUG] ⚠️ Nenhum token de autenticação encontrado para:', {
                url: config.url,
                method: config.method
              });
            }
          }
        } catch (error) {
          // Se não conseguir obter o token, continua sem token
          console.warn('Não foi possível obter token de autenticação:', error)
        }

        return config
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => {
        return response
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (error: any) => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
          console.error('[DEBUG] ❌ Erro 401 - Token inválido ou expirado:', {
            url: error.config?.url,
            method: error.config?.method,
            response: error.response?.data
          });
          
          // Tentar renovar o token via API
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
            });
            
            if (!refreshResponse.ok) {
              // Se não conseguir renovar, redirecionar para login
              await this.signOut()
              window.location.href = '/auth/login'
            }
          } catch {
            // Se não conseguir renovar, redirecionar para login
            await this.signOut()
            window.location.href = '/auth/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Métodos de autenticação via API
  private async getSession() {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Erro ao obter sessão:', error)
    }
    return null
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Tentar múltiplas fontes de token
    const tokenSources = [
      () => localStorage.getItem('auth_token'),
      () => localStorage.getItem('authToken'),
      () => sessionStorage.getItem('auth_token'),
      () => sessionStorage.getItem('authToken')
    ];
    
    for (const getToken of tokenSources) {
      const token = getToken();
      if (token) {
        return token;
      }
    }
    
    return null;
  }

  private async signOut() {
    if (typeof window === 'undefined') return;
    
    // Limpar todos os tokens
    const tokenKeys = ['auth_token', 'authToken'];
    tokenKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Fazer logout no backend
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erro ao fazer logout no backend:', error);
    }
  }

  // Métodos públicos da API
  async get(endpoint: string, config = {}) {
    return this.client.get(endpoint, config)
  }

  async post(endpoint: string, data = {}, config = {}) {
    return this.client.post(endpoint, data, config)
  }

  async put(endpoint: string, data = {}, config = {}) {
    return this.client.put(endpoint, data, config)
  }

  async delete(endpoint: string, config = {}) {
    return this.client.delete(endpoint, config)
  }

  async patch(endpoint: string, data = {}, config = {}) {
    return this.client.patch(endpoint, data, config)
  }
}

// Exportar instância única
export const apiClient = new ApiClient()

// Exportar métodos diretos para conveniência
export const api = {
  get: (endpoint: string, config = {}) => apiClient.get(endpoint, config),
  post: (endpoint: string, data = {}, config = {}) => apiClient.post(endpoint, data, config),
  put: (endpoint: string, data = {}, config = {}) => apiClient.put(endpoint, data, config),
  delete: (endpoint: string, config = {}) => apiClient.delete(endpoint, config),
  patch: (endpoint: string, data = {}, config = {}) => apiClient.patch(endpoint, data, config),
}

export default apiClient





