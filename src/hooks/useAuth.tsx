import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useMutation } from './useMutation';
import { useQuery } from './useQuery';
import { setCookie, removeCookie } from '@/lib/cookie-utils';

/**
 * Dados do usuário
 */
export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  primeiro_login: boolean;
  ultimo_login?: Date;
  total_questoes_respondidas: number;
  total_acertos: number;
  tempo_estudo_minutos: number;
  pontuacao_media: number;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Dados de login
 */
export interface LoginData {
  email: string;
  senha: string;
}

/**
 * Resposta do login
 */
export interface LoginResponse {
  usuario: User;
  token: string;
}

/**
 * Dados para criação de usuário
 */
export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
}

/**
 * Contexto de autenticação
 */
interface AuthContextType {
  /**
   * Usuário atual
   */
  user: User | null;
  
  /**
   * Token de autenticação
   */
  token: string | null;
  
  /**
   * Se está autenticado
   */
  isAuthenticated: boolean;
  
  /**
   * Se está carregando dados de autenticação
   */
  isLoading: boolean;
  
  /**
   * Fazer login
   */
  login: (data: LoginData) => Promise<void>;
  
  /**
   * Fazer logout
   */
  logout: () => void;
  
  /**
   * Registrar usuário
   */
  register: (data: RegisterData) => Promise<void>;
  
  /**
   * Atualizar perfil
   */
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  /**
   * Alterar senha
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  /**
   * Status do login
   */
  loginStatus: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
  
  /**
   * Status do registro
   */
  registerStatus: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
}

// Contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Chaves para localStorage
 */
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user'
};

/**
 * Serviço de API para autenticação
 */
class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no login');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro no login');
    }
    
    return result.data;
  }
  
  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no registro');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro no registro');
    }
    
    return result.data;
  }
  
  async validateToken(token: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Token inválido');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Token inválido');
    }
    
    return result.data;
  }
  
  async updateProfile(token: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar perfil');
    }
    
    return result.data;
  }
  
  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao alterar senha');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao alterar senha');
    }
  }
}

const authService = new AuthService();

/**
 * Provider de autenticação
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mutação para login
  const loginMutation = useMutation(authService.login, {
    onSuccess: (data) => {
      setUser(data.usuario);
      setToken(data.token);
      
      // Armazenar no localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.usuario));
      
      // Armazenar em cookie para acesso pelo servidor
      setCookie('auth_token', data.token, { 
        path: '/',
        sameSite: 'lax',
        secure: window.location.protocol === 'https:'
      });
      
      console.log('Login bem-sucedido!');
      console.log('Token:', data.token.substring(0, 10) + '...');
      console.log('Usuário:', data.usuario.nome);
    }
  });
  
  // Mutação para registro
  const registerMutation = useMutation(authService.register);
  
  // Mutação para atualizar perfil
  const updateProfileMutation = useMutation(
    (data: Partial<User>) => {
      if (!token) throw new Error('Token não disponível');
      return authService.updateProfile(token, data);
    },
    {
      onSuccess: (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }
    }
  );
  
  // Mutação para alterar senha
  const changePasswordMutation = useMutation(
    ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      if (!token) throw new Error('Token não disponível');
      return authService.changePassword(token, currentPassword, newPassword);
    }
  );
  
  // Query para validar token
  const { refetch: validateToken } = useQuery(
    ['auth', 'validate', token ?? ''],
    () => {
      if (!token) throw new Error('Token não disponível');
      return authService.validateToken(token);
    },
    {
      enabled: false,
      onSuccess: (validatedUser) => {
        setUser(validatedUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(validatedUser));
      },
      onError: () => {
        // Token inválido, fazer logout
        logout();
      }
    }
  );
  
  // Função de login
  const login = useCallback(async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  }, [loginMutation]);
  
  // Função de logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    
    // Remover do localStorage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    // Remover cookie
    removeCookie('auth_token', '/');
  }, []);
  
  // Função de registro
  const register = useCallback(async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);
  
  // Função para atualizar perfil
  const updateProfile = useCallback(async (data: Partial<User>) => {
    await updateProfileMutation.mutateAsync(data);
  }, [updateProfileMutation]);
  
  // Função para alterar senha
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  }, [changePasswordMutation]);
  
  // Efeito para carregar dados do localStorage
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          
          // Validar token
          await validateToken();
        }
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuthData();
  }, [validateToken, logout]);
  
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    loginStatus: {
      isLoading: loginMutation.isLoading,
      isError: loginMutation.isError,
      error: loginMutation.error
    },
    registerStatus: {
      isLoading: registerMutation.isLoading,
      isError: registerMutation.isError,
      error: registerMutation.error
    }
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  return {
    isAuthenticated,
    isLoading,
    shouldRedirect: !isLoading && !isAuthenticated
  };
}

export function usePermissions() {
  const { user } = useAuth();
  const hasRole = useCallback((role: string) => user?.role === role, [user]);
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isUser = useCallback(() => hasRole('user'), [hasRole]);
  return {
    hasRole,
    isAdmin,
    isUser,
    userRole: user?.role
  };
}