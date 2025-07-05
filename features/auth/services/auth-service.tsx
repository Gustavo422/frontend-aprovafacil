import { createClient } from '@/lib/supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface AuthResponse {
  session: Session | null;
  user: User | null;
  error?: Error | null;
}

export function useAuthService() {
  const supabase = createClient();

  const getSession = async (): Promise<{ session: Session | null; user: User | null }> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Error getting session', { error });
        throw error;
      }

      return {
        session: data.session,
        user: data.session?.user ?? null,
      };
    } catch (error) {
      logger.error('Failed to get session', { error });
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Sign in error', { error });
        throw error;
      }

      logger.info('Sign in successful', { userId: data.user?.id });
      
      return {
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      logger.error('Sign in failed', { error });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        logger.error('Sign up error', { error });
        throw error;
      }

      logger.info('Sign up successful', { userId: data.user?.id });
      
      return {
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      logger.error('Sign up failed', { error });
      throw error;
    }
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out error', { error });
        throw error;
      }

      logger.info('Sign out successful');
      return { error: null };
    } catch (error) {
      logger.error('Sign out failed', { error });
      return { error: error as Error };
    }
  };

  const onAuthStateChange = (
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed', { event, userId: session?.user?.id });
      callback(event, session);
    });

    return {
      subscription: data.subscription,
    };
  };

  return {
    getSession,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
  };
}
