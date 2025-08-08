import axios from 'axios'
import { setupDebugInterceptors } from './debug-interceptor'

// Configuração do Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Rotas que precisam do filtro de concurso
const ROUTES_REQUIRING_CONCURSO_FILTER = [
  '/api/apostilas',
  '/api/simulados',
  '/api/questoes-semanais',
  '/api/flashcards',
  '/api/mapa-assuntos',
  '/api/conteudo/filtrado',
  '/api/dashboard/stats',
  '/api/dashboard/enhanced-stats',
  '/api/dashboard/activities',
];

// Rotas que NÃO precisam do filtro de concurso
const ROUTES_EXCLUDED_FROM_FILTER = [
  '/api/auth',
  '/api/user/concurso-preference',
  '/api/concursos',
  '/api/concurso-categorias',
  '/api/categorias',
  // '/api/onboarding' removido
  '/api/admin',
  '/api/monitor',
  '/api/health',
  '/api/docs',
];

class ApiClient {
  private readonly client: ReturnType<typeof axios.create>
  private activeConcursoId: string | null = null

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

  // Método para definir o concurso ativo
  setActiveConcurso(concursoId: string | null): void {
    this.activeConcursoId = concursoId;
    
    if (process.env.NODE_ENV === 'development' && 
        (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
         typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
      console.log('[DEBUG] 🎯 Concurso ativo definido:', concursoId);
      console.trace('Stack trace do setActiveConcurso');
    }
  }

  // Método para obter o concurso ativo
  getActiveConcurso(): string | null {
    return this.activeConcursoId;
  }

  // Verificar se a rota precisa do filtro de concurso
  private needsConcursoFilter(path: string): boolean {
    const needsFilter = ROUTES_REQUIRING_CONCURSO_FILTER.some(route => 
      path.startsWith(route)
    );
    
    const isExcluded = ROUTES_EXCLUDED_FROM_FILTER.some(route => 
      path.startsWith(route)
    );

    if (process.env.NODE_ENV === 'development' && 
        (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
         typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
      console.log('[DEBUG] 🔍 Verificando se a rota precisa de filtro de concurso:', {
        path,
        needsFilter,
        isExcluded,
        activeConcursoId: this.activeConcursoId,
        result: needsFilter && !isExcluded
      });
    }

    return needsFilter && !isExcluded;
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
                token: `${token.substring(0, 20) }...`,
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

        // Adicionar filtro de concurso automaticamente
        const path = config.url || '';
        if (this.needsConcursoFilter(path) && this.activeConcursoId) {
          // Para requisições GET, adicionar como query parameter
          if (config.method?.toLowerCase() === 'get') {
            config.params = {
              ...config.params,
              concurso_id: this.activeConcursoId
            };
          }
          // Para requisições POST/PUT/PATCH, adicionar ao body
          else if (['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
            config.data = {
              ...config.data,
              concurso_id: this.activeConcursoId
            };
          }

          // Log de debug para filtro de concurso
          if (process.env.NODE_ENV === 'development' && 
              (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
               typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
            console.log('[DEBUG] 🎯 Filtro de concurso aplicado automaticamente:', {
              concursoId: this.activeConcursoId,
              url: config.url,
              method: config.method,
              params: config.params,
              data: config.data
            });
          }
        } else if (this.needsConcursoFilter(path) && !this.activeConcursoId) {
          // Log de debug quando precisa de filtro mas não há concurso ativo
          if (process.env.NODE_ENV === 'development' && 
              (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
               typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
            console.warn('[DEBUG] ⚠️ Rota precisa de filtro de concurso mas não há concurso ativo:', {
              url: config.url,
              method: config.method
            });
          }
        }

        return config
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (error: any) => {
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
              // Se não conseguir renovar, fazer logout
              await this.signOut();
              return Promise.reject(error);
            }

            const refreshData = await refreshResponse.json();
            
            if (refreshData.success) {
              // Tentar a requisição original novamente
              const originalRequest = error.config;
              originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
              
              return this.client(originalRequest);
            } 
              await this.signOut();
              return Promise.reject(error);
            
          } catch (refreshError) {
            console.error('Erro ao renovar token:', refreshError);
            await this.signOut();
            return Promise.reject(error);
          }
        }

        // Handle 400 errors (concurso não configurado)
        if (error.response?.status === 400 && error.response?.data?.code === 'CONCURSO_NOT_CONFIGURED') {
          console.error('[DEBUG] ❌ Erro 400 - Concurso não configurado:', {
            url: error.config?.url,
            method: error.config?.method,
            response: error.response?.data
          });
          
          // Emitir evento para notificar que precisa selecionar concurso
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('concurso-not-configured', {
              detail: { 
                message: error.response?.data?.error || 'Concurso não configurado',
                url: error.config?.url 
              }
            }));
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async getSession() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
    }
    return null;
  }

  private getAuthToken(): string | null {
    try {
      // Tentar obter do localStorage primeiro
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) return token;
      }

      // Tentar obter dos cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
      if (tokenCookie) {
        return tokenCookie.split('=')[1];
      }
    } catch (error) {
      console.warn('Erro ao obter token de autenticação:', error);
    }
    return null;
  }

  private async signOut() {
    try {
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      // Fazer logout via API
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Redirecionar para login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

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

// Instância singleton do cliente API
const apiClient = new ApiClient()

export default apiClient

// Exportar métodos para gerenciar o concurso ativo
export const setActiveConcurso = (concursoId: string | null) => {
  apiClient.setActiveConcurso(concursoId);
};

export const getActiveConcurso = () => {
  return apiClient.getActiveConcurso();
};

// Hook para usar o cliente API com concurso ativo
export const useApiClient = () => {
  return {
    client: apiClient,
    setActiveConcurso: apiClient.setActiveConcurso.bind(apiClient),
    getActiveConcurso: apiClient.getActiveConcurso.bind(apiClient),
  };
};





