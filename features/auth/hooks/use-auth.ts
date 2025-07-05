'use client';

import { useAuth as useAuthContext } from '../contexts/auth-context';

export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    session: context.session,
    loading: context.loading,
    initialized: context.initialized,
    signIn: context.signIn,
    signUp: context.signUp,
    signOut: context.signOut,
  };
}

// Re-export types for convenience
export type { Session } from '@supabase/supabase-js';
