import axios from 'axios'

// Configuração do Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

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
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (config: any) => {
        // Adicionar token de autenticação se disponível
        try {
          const session = await this.getSession()
          
          if (session?.access_token) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${session.access_token}`,
            }
          }
        } catch (error) {
          // Se não conseguir obter a sessão, continua sem token
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
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        return await res.json()
      }
      return null
    } catch {
      return null
    }
  }

  private async signOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // Ignora erros no logout
    }
  }

  // Métodos HTTP
  async get<T = unknown>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  async post<T = unknown>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put<T = unknown>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async patch<T = unknown>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.patch(url, data, config)
    return response.data
  }

  async delete<T = unknown>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }

  // Método para upload de arquivos
  async upload<T = unknown>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const config: Record<string, unknown> = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: { loaded: number; total: number }) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }

    const response = await this.client.post(url, formData, config)
    return response.data
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient()

// Funções de conveniência para uso direto
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.upload.bind(apiClient),
}

export default api




