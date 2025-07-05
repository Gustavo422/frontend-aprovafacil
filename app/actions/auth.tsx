'use server';
import { logger } from '@/lib/logger';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuditLogger } from '@/lib/audit';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const supabase = createServerActionClient({ cookies });
  const serverClient = await createServerSupabaseClient();
  const auditLogger = getAuditLogger(serverClient);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Criar perfil do usuário usando o cliente do servidor
  if (data.user) {
    await serverClient.from('users').insert([
      {
        id: data.user.id,
        email,
        nome: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        study_time_minutes: 0,
        total_questions_answered: 0,
        total_correct_answers: 0,
        average_score: 0,
      },
    ]);

    // Registrar criação do usuário no log de auditoria
    await auditLogger.logCreate(data.user.id, 'users', data.user.id, {
      email,
      nome: name,
      created_at: new Date().toISOString(),
    });
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createServerActionClient({ cookies });
  const serverClient = await createServerSupabaseClient();
  const auditLogger = getAuditLogger(serverClient);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Atualizar último login
    await serverClient
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id);

    // Registrar login no log de auditoria
    await auditLogger.logLogin(data.user.id);
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = createServerActionClient({ cookies });
  const serverClient = await createServerSupabaseClient();
  const auditLogger = getAuditLogger(serverClient);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Registrar logout no log de auditoria
    await auditLogger.logLogout(user.id);
  }

  await supabase.auth.signOut();
  redirect('/login');
}

export async function updateUserProfile(
  userId: string,
  updates: Record<string, unknown>
) {
  const serverClient = await createServerSupabaseClient();
  const auditLogger = getAuditLogger(serverClient);

  try {
    // Buscar dados atuais
    const { data: currentData } = await serverClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Atualizar perfil
    const { error } = await serverClient
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { error: error.message };
    }

    // Registrar atualização no log de auditoria
    await auditLogger.logUpdate(
      userId,
      'users',
      userId,
      currentData,
      updates
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    logger.error('Erro ao atualizar perfil:', { error: errorMessage });
    return { error: 'Erro interno do servidor' };
  }
}

export async function deleteUserAccount(userId: string) {
  const serverClient = await createServerSupabaseClient();
  const auditLogger = getAuditLogger(serverClient);

  try {
    // Buscar dados atuais
    const { data: currentData } = await serverClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (typeof currentData !== 'object' || currentData === null) {
      throw new Error('Dados inválidos para log de auditoria');
    }

    // Soft delete do usuário
    const { error } = await serverClient
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { error: error.message };
    }

    // Registrar exclusão no log de auditoria
    await auditLogger.logDelete(userId, 'users', userId, currentData as Record<string, unknown>);

    // Fazer logout
    const supabase = createServerActionClient({ cookies });
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    logger.error('Erro ao excluir conta:', { error: errorMessage });
    return { error: 'Erro interno do servidor' };
  }
}
