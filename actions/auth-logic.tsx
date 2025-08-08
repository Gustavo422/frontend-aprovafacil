import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { AuditLogger } from '@/lib/audit';

export async function signInLogic(email: string, password: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        senha: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || 'Erro no login' };
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }

    if (data.user) {
      // Registrar login no log de auditoria
      const auditResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/audit/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          usuario_id: data.user.id,
          action: 'LOGIN',
          table_nome: 'usuarios',
          record_id: data.user.id,
          new_values: {
            ultimo_login_at: new Date().toISOString(),
          },
        }),
      });

      if (!auditResponse.ok) {
        console.warn('Falha ao registrar log de auditoria para login');
      }
    }

    return { success: true };
  } catch (error) {
    return { error: 'Erro interno do servidor' };
  }
} 