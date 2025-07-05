'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/gotrue-js';
import { supabase } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    // Verificar a sessão inicial
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setUser(session?.user ?? null);
      } catch {
        // Erro ao verificar sessão
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        // Não alteramos o estado de loading aqui para evitar flashes na interface
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redireciona para a página de login após o logout
      router.push('/login');
      router.refresh(); // Força a atualização da rota
    } catch {
      // Erro durante o logout
    }
  }, [router]);

  return { user, loading, signOut };
}
