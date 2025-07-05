import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserRow } from '@/types/database.types';

/**
 * Tipo para as estatísticas do usuário que podem ser atualizadas
 * Este tipo é usado nos formulários e operações de atualização
 */
export type UserStatsUpdate = {
  total_questions_answered?: number;
  total_correct_answers?: number;
  study_time_minutes?: number;
  average_score?: number;
};

/**
 * Tipo completo do usuário com todos os campos necessários para a aplicação
 * Inclui campos do Supabase Auth e campos adicionais do banco de dados
 */
export interface AppUser extends Omit<SupabaseUser, 'user_metadata' | 'app_metadata'> {
  // Campos obrigatórios do Supabase Auth
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  
  // Campos do banco de dados
  nome: string | null;
  total_questions_answered: number;
  total_correct_answers: number;
  study_time_minutes: number;
  average_score: number;
  
  // Campos opcionais para compatibilidade
  full_name?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  role?: string;
  
  // Campos calculados para compatibilidade
  total_questions?: number;
  total_correct?: number;
  total_time_minutes?: number;
  score?: number;
}

/**
 * Converte um UserRow do banco de dados para o tipo AppUser
 */
export function mapUserRowToAppUser(userRow: UserRow | null): AppUser | null {
  if (!userRow) return null;

  // Calcular valores derivados
  const totalQuestions = userRow.total_questions_answered || 0;
  const correctAnswers = userRow.total_correct_answers || 0;
  const studyTime = userRow.study_time_minutes || 0;
  const avgScore = userRow.average_score || 0;
  
  // Mapear campos do banco para o formato esperado pelo frontend
  const appUser: AppUser = {
    // Campos obrigatórios do Supabase
    id: userRow.id,
    email: userRow.email,
    created_at: userRow.created_at,
    updated_at: userRow.updated_at,
    aud: 'authenticated', // Campo obrigatório do Supabase
    
    // Campos do banco de dados
    nome: userRow.nome || userRow.email.split('@')[0],
    total_questions_answered: totalQuestions,
    total_correct_answers: correctAnswers,
    study_time_minutes: studyTime,
    average_score: avgScore,
    
    // Campos para compatibilidade
    full_name: userRow.nome,
    is_active: true, // Valor padrão
    role: 'user', // Valor padrão
    
    // Campos calculados
    total_questions: totalQuestions,
    total_correct: correctAnswers,
    total_time_minutes: studyTime,
    score: avgScore,
  };

  return appUser;
}

/**
 * Atualiza um UserRow com as estatísticas fornecidas
 */
export function updateUserStats(
  user: UserRow,
  stats: UserStatsUpdate
): UserRow {
  return {
    ...user,
    total_questions_answered: stats.total_questions_answered ?? user.total_questions_answered,
    total_correct_answers: stats.total_correct_answers ?? user.total_correct_answers,
    study_time_minutes: stats.study_time_minutes ?? user.study_time_minutes,
    average_score: stats.average_score ?? user.average_score,
    updated_at: new Date().toISOString(),
  };
}
