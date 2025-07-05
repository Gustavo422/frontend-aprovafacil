'use client';

import { AuthProvider as SupabaseAuthProvider } from '@/features/auth/contexts/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      {children}
    </SupabaseAuthProvider>
  );
}
