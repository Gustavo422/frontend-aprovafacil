import { createBrowserClient } from '@supabase/ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from './database.types'

// Verificar variáveis de ambiente
const checkEnvVars = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    // Retornar valores padrão para evitar crash
    return { 
      url: url || 'https://placeholder.supabase.co', 
      key: key || 'placeholder-key' 
    }
  }
  
  return { url, key }
}

// Cliente para uso no lado do cliente (componentes)
export const createClient = () => {
  try {
    const { url, key } = checkEnvVars()
    
    // Verificar se as URLs são válidas
    if (!url || url === 'https://placeholder.supabase.co') {
      return createBrowserClient<Database>(
        'http://127.0.0.1:54321',
        key || 'placeholder-key'
      )
    }
    
    return createBrowserClient<Database>(url, key)
  } catch {
    return createBrowserClient<Database>(
      'http://127.0.0.1:54321',
      'public-anon-key'
    )
  }
}

// Cliente para uso no lado do servidor (API routes, Server Actions)
export const createServerSupabaseClient = async () => {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const { url, key } = checkEnvVars()

    return createServerClient<Database>(
      url,
      key,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch {
    throw new Error('Erro ao criar cliente Supabase do servidor')
  }
}

// Cliente para uso em route handlers
export const createRouteHandlerClient = async () => {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const { url, key } = checkEnvVars()

    return createServerClient<Database>(
      url,
      key,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
  } catch {
    throw new Error('Erro ao criar cliente Supabase do route handler')
  }
}

// Manter compatibilidade com código existente
export const supabase = createClient()

