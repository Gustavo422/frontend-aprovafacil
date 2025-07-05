import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { fullName?: string; avatarUrl?: string | null }) => Promise<User>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {!auth.loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * Componente de proteção de rota
 * Redireciona para a página de login se o usuário não estiver autenticado
 */
type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string;
  redirectTo?: string;
};

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirecionar para a página de login se não estiver autenticado
      router.push(redirectTo);
    } else if (!loading && isAuthenticated && requiredRole === 'admin' && !isAdmin) {
      // Redirecionar para a página inicial se não tiver permissão de admin
      router.push('/');
    }
  }, [isAuthenticated, loading, router, redirectTo, requiredRole, isAdmin]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Componente para redirecionar usuários autenticados
 * Útil para páginas de login/registro
 */
type GuestRouteProps = {
  children: ReactNode;
  redirectTo?: string;
};

export function GuestRoute({ children, redirectTo = '/' }: GuestRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
