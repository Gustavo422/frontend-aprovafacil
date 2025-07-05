import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as AppUser } from '@/types/supabase.types';
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Extended type that includes both Supabase and our custom user properties
type User = SupabaseUser & Partial<AppUser>;

/**
 * Hook personalizado para gerenciar autenticação
 * Fornece o usuário atual, estado de carregamento e funções de autenticação
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Verificar a autenticação ao montar o componente
  useEffect(() => {
    const checkAuthAndSubscribe = async () => {
      await checkAuth();
      
      // Configurar listener para mudanças de autenticação
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      // Limpar subscription ao desmontar
      return () => {
        subscription.unsubscribe();
      };
    };

    checkAuthAndSubscribe();
  }, []);

  /**
   * Verifica se o usuário está autenticado
   */
  const checkAuth = async () => {
    try {
      setLoading(true);
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        // Fetch additional user data from your users table if needed
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();
        
        // Combine Supabase user with additional user data
        setUser({
          ...supabaseUser,
          ...userData
        });
      } else {
        setUser(null);
      }
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao verificar autenticação');
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o login
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      
      if (data?.user) {
        // Fetch additional user data after successful login
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        setUser({
          ...data.user,
          ...userData
        });
      }
      
      setError(null);
      return user;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao fazer login');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o registro de um novo usuário
   */
  const signUp = async (email: string, password: string, userData: Partial<AppUser>) => {
    try {
      setLoading(true);
      
      // First create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.nome,
            // Add any other fields you want to store in auth.users table
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      if (authData?.user) {
        // Create user profile in your users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              nome: userData.nome,
              // Set default values for required fields
              is_active: true,
              role: 'user',
              study_time_minutes: 0,
              total_questions_answered: 0,
              total_correct_answers: 0,
              average_score: 0,
              ...userData
            },
          ])
          .select()
          .single();
        
        if (profileError) throw profileError;
        
        // Combine auth user with profile data
        setUser({
          ...authData.user,
          ...profileData
        });
      }
      
      setError(null);
      return user;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao registrar');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza o logout
   */
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao fazer logout');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envia email de redefinição de senha
   */
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setError(null);
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error('Erro ao enviar email de redefinição de senha');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza os dados do usuário
   */
  const updateProfile = async (updates: Partial<AppUser>) => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      // Update the user state with the new data
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);
      setError(null);
      
      return updatedUser;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar perfil');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica se o usuário tem uma determinada role
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    // Check both user_metadata and app_metadata for role
    return user.user_metadata?.role === role || 
           user.app_metadata?.role === role ||
           (user as any).role === role; // Check the role from the users table
  };

  return {
    // User state
    user,
    loading,
    error,
    
    // Authentication state
    isAuthenticated: !!user,
    isAdmin: hasRole('admin'),
    
    // Authentication methods
    signIn,
    signUp,
    logout,
    resetPassword,
    updateProfile,
    checkAuth,
    
    // Aliases for backward compatibility
    login: signIn,
    register: signUp,
  };
}

export default useAuth;
