import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios';
import { sharedToast as toast } from '@/features/shared/consolidated-shared';

// Define API response type
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

// Define error response type
interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

// Create an axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: unknown) => {
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponse>) => {
    // Handle errors globally
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || 'An error occurred';
      
      // Handle specific status codes
      switch (status) {
        case 400:
          // Handle validation errors
          if (data.errors) {
            Object.values(data.errors).forEach((messages) => {
              if (Array.isArray(messages)) {
                messages.forEach((message: string) => {
                  toast({ variant: 'destructive', title: 'Erro de Validação', description: message });
                });
              } else if (typeof messages === 'string') {
                toast({ variant: 'destructive', title: 'Erro de Validação', description: messages });
              }
            });
          } else {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: errorMessage });
          }
          break;
          
        case 401:
          // Handle unauthorized
          toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Sua sessão expirou. Por favor, faça login novamente.' });
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Handle forbidden
          toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para acessar este recurso.' });
          break;
          
        case 404:
          // Handle not found
          toast({ variant: 'destructive', title: 'Não Encontrado', description: 'O recurso solicitado não foi encontrado.' });
          break;
          
        case 500:
          // Handle server errors
          toast({ variant: 'destructive', title: 'Erro de rede', description: 'Não foi possível conectar à API.' });
          break;
          
        default:
          toast({ variant: 'destructive', title: 'Erro de requisição', description: error.message });
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast({ variant: 'destructive', title: 'Erro de rede', description: 'Sem resposta do servidor. Verifique sua conexão com a internet.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      toast({ variant: 'destructive', title: 'Erro de requisição', description: 'Erro ao configurar a requisição.' });
    }
    
    return Promise.reject(error);
  }
);

// Helper function for making GET requests
export async function fetchData<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.get<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    // Error is already handled by the interceptor
    throw error;
  }
}

// Helper function for making POST requests
export async function postData<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    // Error is already handled by the interceptor
    throw error;
  }
}

// Helper function for making PUT requests
export async function putData<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.put<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    // Error is already handled by the interceptor
    throw error;
  }
}

// Helper function for making PATCH requests
export async function patchData<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.patch<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    // Error is already handled by the interceptor
    throw error;
  }
}

// Helper function for making DELETE requests
export async function deleteData<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    // Error is already handled by the interceptor
    throw error;
  }
}

export default api;
