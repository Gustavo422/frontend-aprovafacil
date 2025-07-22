import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/src/types/supabase.types';

type UserRow = Database['public']['Tables']['usuarios']['Row'];

/**
 * Tipo para as estatísticas do usuário que podem ser atualizadas
 * Este tipo é usado nos formulários e operações de atualização
 */
export type usuariostatsUpdate = {
  total_questoes_respondidas?: number;
  total_resposta_corretas?: number;
  tempo_estudo_minutos?: number;
  pontuacao_media?: number;
};

/**
 * Tipo completo do usuário com todos os campos necessários para a aplicação
 * Baseado no schema real do banco de dados
 */
export interface AppUser extends Omit<SupabaseUser, 'user_metadata' | 'app_metadata'> {
  // Campos obrigatórios do Supabase Auth
  id: string;
  email: string;
  criado_em: string;
  atualizado_em: string;
  
  // Campos do banco de dados
  nome: string;
  ativo: boolean;
  role: string;
  total_questoes_respondidas: number;
  total_resposta_corretas: number;
  tempo_estudo_minutos: number;
  pontuacao_media: number;
  ultimo_login?: string;
  
  // Campos calculados para compatibilidade
  total_questions?: number;
  total_correct?: number;
  total_time_minutes?: number;
  score?: number;
  created_at: string;
}

/**
 * Converte um UserRow do banco de dados para o tipo AppUser
 */
export function mapUserRowToAppUser(userRow: UserRow | null): AppUser | null {
  if (!userRow) return null;

  // Calcular valores derivados
  const totalQuestions = userRow.total_questoes_respondidas || 0;
  const correctAnswers = userRow.total_acertos || 0;
  const studyTime = userRow.tempo_estudo_minutos || 0;
  const avgScore = userRow.pontuacao_media || 0;
  
  // Mapear campos do banco para o formato esperado pelo frontend
  const appUser: AppUser = {
    // Campos obrigatórios do Supabase
    id: userRow.id ?? '',
    email: userRow.email ?? '',
    criado_em: userRow.criado_em ?? '',
    atualizado_em: userRow.atualizado_em ?? '',
    aud: 'authenticated', // Campo obrigatório do Supabase
    
    // Campos do banco de dados
    nome: userRow.nome || userRow.email.split('@')[0],
    // ativo e role não existem no banco, definir valores padrão
    ativo: true,
    role: 'user',
    total_questoes_respondidas: totalQuestions,
    total_resposta_corretas: correctAnswers,
    tempo_estudo_minutos: studyTime,
    pontuacao_media: avgScore,
    
    // Campos calculados
    total_questions: totalQuestions,
    total_correct: correctAnswers,
    total_time_minutes: studyTime,
    score: avgScore,
    created_at: userRow.criado_em ?? '',
  };

  return appUser;
}

/**
 * Atualiza um UserRow com as estatísticas fornecidas
 */
export function updateusuariostats(
  user: UserRow,
  stats: usuariostatsUpdate
): UserRow {
  return {
    ...user,
    total_questoes_respondidas: stats.total_questoes_respondidas ?? user.total_questoes_respondidas,
    tempo_estudo_minutos: stats.tempo_estudo_minutos ?? user.tempo_estudo_minutos,
    pontuacao_media: stats.pontuacao_media ?? user.pontuacao_media,
    atualizado_em: new Date().toISOString(),
  };
}
