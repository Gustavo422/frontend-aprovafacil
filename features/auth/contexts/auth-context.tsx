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

// Auth context interface
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; token?: string }>;
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
    storeTokenInAllStorages(token, expiresIn);
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
          setToken(data.data.token);
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

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ error?: string; token?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
        credentials: 'include', // Important for cookie handling
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Login failed');
        return { error: data.error?.message || 'Error logging in' };
      }

      if (data.success && data.data && data.data.usuario) {
        // Save token
        if (data.data.token) {
          setToken(data.data.token);
        }
        
        setUser(data.data.usuario);
        
        // Check if onboarding is required
        if (data.data.usuario.primeiro_login) {
          try {
            const onboardingResponse = await fetch('/api/onboarding', {
              headers: {
                'Authorization': `Bearer ${data.data.token}`,
              },
            });
            
            if (onboardingResponse.ok) {
              const onboardingData = await onboardingResponse.json();
              if (onboardingData.requiresOnboarding) {
                router.push('/onboarding');
              } else {
                router.push('/');
              }
            } else {
              router.push('/onboarding');
            }
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            router.push('/onboarding');
          }
        } else {
          router.push('/');
        }
        
        return { token: data.data.token };
      } else {
        setError('Invalid credentials');
        return { error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Error during login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      setError(errorMessage);
      return { error: errorMessage };
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