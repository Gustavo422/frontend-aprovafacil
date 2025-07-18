'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { useAuthService } from '../services/auth-service';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const authService = useAuthService();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Timeout de 10 segundos para evitar loading infinito
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout ao conectar com Supabase'));
          }, 10000);
        });

        const authPromise = authService.getSession();
        
        const result = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as { session: Session | null; user: User | null };
        
        const { session: currentSession, user: currentUser } = result;
        
        clearTimeout(timeoutId);
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentUser);
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        logger.error('Failed to initialize auth', { error });
        if (mounted) {
          // Em caso de erro, definir como não autenticado mas não em loading
          setSession(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
          // Log adicional para debug
          console.warn('Auth initialization failed, continuing as unauthenticated:', error);
        }
      }
    };

    // Aguardar um pouco antes de inicializar para evitar problemas de hidratação
    const initTimer = setTimeout(() => {
      initializeAuth();
    }, 100);

    const { subscription } = authService.onAuthStateChange((event, session) => {
      logger.info('Auth state changed', { event, userId: session?.user?.id });
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      clearTimeout(initTimer);
      subscription?.unsubscribe();
    };
  }, [authService]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { session: newSession, user: newUser } = await authService.signIn(email, password);
      setSession(newSession);
      setUser(newUser);
    } catch (error) {
      logger.error('Sign in failed', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { session: newSession, user: newUser } = await authService.signUp(email, password, name);
      setSession(newSession);
      setUser(newUser);
    } catch (error) {
      logger.error('Sign up failed', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      logger.error('Sign out failed', { error });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
