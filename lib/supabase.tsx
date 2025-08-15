import { createBrowserClient } from '@supabase/ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from './database.types'
import { getSupabaseEnv } from '@/src/lib/env';

// Cliente para uso no lado do cliente (componentes)
export const createClient = () => {
  try {
    const { url, key } = getSupabaseEnv();
    return createBrowserClient<Database>(url, key);
  } catch (error) {
    console.error('Erro ao criar cliente Supabase (client):', error);
    throw error;
  }
};

// Cliente para uso no lado do servidor (API routes, Server Actions)
export const createServerSupabaseClient = async () => {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const { url, key } = getSupabaseEnv();
    return createServerClient<Database>(
      url,
      key,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {}
          },
        },
      }
    );
  } catch (error) {
    console.error('Erro ao criar cliente Supabase do servidor:', error);
    throw error;
  }
};

// Removido: criação global de cliente para evitar falhas de build/prerender




