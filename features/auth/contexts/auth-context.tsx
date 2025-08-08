'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/features/shared/hooks/use-toast';
import { storeTokenInAllStorages, clearAllTokens, synchronizeToken } from '../utils/token-sync';
import { getStoredToken, isTokenExpired } from '../utils/storage-utils';

// User interface
export interface User {
  id: string;
  email: string;
  nome: string;
  role?: string;
  primeiro_login?: boolean;
}

// Enhanced sign-in result interface
export interface SignInResult {
  error?: string;
  token?: string;
  errorCode?: string;
  suggestions?: string[];
}

// Auth context interface
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  getToken: () => string | null;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token check interval in milliseconds
const TOKEN_CHECK_INTERVAL = 60000; // 1 minute

export function AuthProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    // Synchronize tokens between storage methods
    synchronizeToken();
    checkAuth();
  }, []);

  // Check token expiration periodically
  useEffect(() => {
    if (!user) return;

    const checkTokenInterval = setInterval(() => {
      // If token expires in less than 5 minutes, refresh it
      if (isTokenExpired(5 * 60)) {
        refreshToken();
      }
    }, TOKEN_CHECK_INTERVAL); // Check every minute

    return () => clearInterval(checkTokenInterval);
  }, [user]);

  // Get token from storage
  const getToken = (): string | null => {
    return getStoredToken();
  };

  // Set token in storage
  const setToken = (token: string, expiresIn: number = 7 * 24 * 60 * 60) => {
    // Sempre usar 7 dias de expiração
    storeTokenInAllStorages(token, 60 * 60 * 24 * 7);
  };

  // Clear token from storage
  const clearToken = () => {
    clearAllTokens();
  };

  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookie handling
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          // Sempre usar 7 dias de expiração
          setToken(data.data.token, 60 * 60 * 24 * 7);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if token exists
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return false;
      }

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include', // Important for cookie handling
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.data) {
          setUser(userData.data);
          setLoading(false);
          return true;
        }
      }
      
      // Token invalid, clear it
      clearToken();
      setUser(null);
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearToken();
      setUser(null);
      setError('Failed to verify authentication');
      setLoading(false);
      return false;
    }
  };

  // Sign in with enhanced error handling
  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Log sign-in attempt
      console.log('[AUTH-CONTEXT] Starting sign-in process for:', email.replace(/(.{2}).*@/, '$1***@'));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
        credentials: 'include', // Important for cookie handling
      });

      const data = await response.json();
      
      console.log('[AUTH-CONTEXT] Login response received:', {
        status: response.status,
        success: data.success,
        hasError: !!data.error,
        errorCode: data.error?.code
      });

      if (!response.ok) {
        const errorMessage = data.error?.message || 'Login failed';
        const errorCode = data.error?.code || 'UNKNOWN_ERROR';
        const suggestions = data.error?.suggestions || ['Tente novamente'];
        
        console.error('[AUTH-CONTEXT] Login failed:', {
          status: response.status,
          errorCode,
          errorMessage,
          suggestions
        });
        
        setError(errorMessage);
        
        return { 
          error: errorMessage,
          errorCode,
          suggestions
        };
      }

      if (data.success && data.data && data.data.usuario) {
        console.log('[AUTH-CONTEXT] Login successful for user:', {
          userId: data.data.usuario.id,
          email: data.data.usuario.email?.replace(/(.{2}).*@/, '$1***@'),
          role: data.data.usuario.role,
          firstLogin: data.data.usuario.primeiro_login
        });

        // Save token
        if (data.data.token) {
          // Sempre usar 7 dias de expiração
          setToken(data.data.token, 60 * 60 * 24 * 7);
          console.log('[AUTH-CONTEXT] Token stored successfully');
        }
        
        setUser(data.data.usuario);
        
        // Lógica de redirecionamento simplificada
        // A informação de `primeiro_login` já está no objeto do usuário.
        console.log('[AUTH-CONTEXT] Login successful, redirecting to dashboard');
        router.push('/');
        
        return { token: data.data.token };
      } else {
        const errorMessage = 'Invalid response format from server';
        console.error('[AUTH-CONTEXT] Invalid response structure:', {
          success: data.success,
          hasData: !!data.data,
          hasUser: !!data.data?.usuario,
          hasToken: !!data.data?.token
        });
        
        setError(errorMessage);
        return { 
          error: errorMessage,
          errorCode: 'INVALID_RESPONSE',
          suggestions: ['Tente novamente', 'Se o problema persistir, entre em contato com o suporte']
        };
      }
    } catch (error) {
      console.error('[AUTH-CONTEXT] Network or unexpected error during login:', error);
      
      let errorMessage = 'Erro de conexão';
      let errorCode = 'NETWORK_ERROR';
      let suggestions = ['Verifique sua conexão com a internet', 'Tente novamente'];
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Não foi possível conectar ao servidor';
          suggestions = [
            'Verifique sua conexão com a internet',
            'Confirme se o servidor está funcionando',
            'Tente novamente em alguns minutos'
          ];
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Tempo limite de conexão excedido';
          errorCode = 'TIMEOUT_ERROR';
          suggestions = [
            'Sua conexão pode estar lenta',
            'Tente novamente',
            'Verifique sua conexão com a internet'
          ];
        } else {
          errorMessage = error.message;
          errorCode = 'UNKNOWN_ERROR';
        }
      }
      
      setError(errorMessage);
      return { 
        error: errorMessage,
        errorCode,
        suggestions
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Get token for logout request
      const token = getToken();
      
      if (token) {
        // Call logout endpoint - this will clear HTTP-only cookies on the server
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookie handling
        }).catch(err => console.error('Error calling logout endpoint:', err));
      }
      
      // Clear client-side token storage
      clearToken();
      setUser(null);
      
      // Redirect to login
      router.push('/login');
      
      toast({
        title: 'Logout realizado com sucesso',
        descricao: 'Você foi desconectado com segurança.',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Erro ao fazer logout',
        descricao: 'Ocorreu um erro ao tentar desconectar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signOut,
    checkAuth,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};