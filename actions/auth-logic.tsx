import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { AuditLogger } from '@/lib/audit';

export async function signInLogic(email: string, password: string, deps: {
  supabase: SupabaseClient,
  serverClient: SupabaseClient<Database>,
  auditLogger: AuditLogger,
}) {
  const { supabase, serverClient, auditLogger } = deps;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await serverClient
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id);

    await auditLogger.logLogin(data.user.id);
  }

  return { success: true };
} 