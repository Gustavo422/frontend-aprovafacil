import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function validateAuth() {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
      error: _error,
    } = await supabase.auth.getUser();

    if (!user || _error) {
      return {
        success: false,
        error: 'Não autorizado',
        status: 401,
      };
    }

    // Verificar se o token está próximo de expirar
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry < 5 * 60 * 1000) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          return {
            success: false,
            error: 'Sessão expirada',
            status: 401,
          };
        }
      }
    }

    return {
      success: true,
      user,
      session,
    };
  } catch {
    return false;
  }
}

export function createAuthErrorResponse(message: string = 'Não autorizado', status: number = 401) {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'AUTH_REQUIRED', 
        message,
        timestamp: new Date().toISOString()
      } 
    },
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      } 
    }
  );
} 