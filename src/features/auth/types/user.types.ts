
import type { Database } from '@/src/types/supabase.types';

type UserRow = Database['public']['Tables']['usuarios']['Row'];

/**
 * Tipo para as estatísticas do usuário que podem ser atualizadas
 * Este tipo é usado nos formulários e operações de atualização
 */
export type usuariostatsUpdate = {
  total_questoes_respondidas?: number;
  total_acertos?: number; // CORRETO conforme schema
  tempo_estudo_minutos?: number;
  pontuacao_media?: number;
};

/**
 * Tipo completo do usuário com todos os campos necessários para a aplicação
 * Baseado no schema real do banco de dados
 */
export interface AppUser {
  id: string;
  nome: string;
  email: string;
  ultimo_login?: string;
  criado_em: string;
  atualizado_em: string;
  tempo_estudo_minutos: number;
  total_questoes_respondidas: number;
  total_acertos: number; // CORRETO conforme schema
  pontuacao_media: number;
  ativo: boolean;
  role?: string;
  created_at?: string;
  aud?: string;
}

/**
 * Converte um UserRow do banco de dados para o tipo AppUser
 */
export function mapUserRowToAppUser(userRow: {
  id: string;
  nome: string;
  email: string;
  ultimo_login?: Date | string | null;
  criado_em: string;
  atualizado_em: string;
  tempo_estudo_minutos?: number;
  total_questoes_respondidas?: number;
  total_acertos?: number; // CORRETO conforme schema
  pontuacao_media?: number;
  ativo?: boolean;
}): AppUser {
  return {
    id: userRow.id,
    nome: userRow.nome,
    email: userRow.email,
    ultimo_login: userRow.ultimo_login ? String(userRow.ultimo_login) : undefined,
    criado_em: userRow.criado_em,
    atualizado_em: userRow.atualizado_em,
    tempo_estudo_minutos: userRow.tempo_estudo_minutos || 0,
    total_questoes_respondidas: userRow.total_questoes_respondidas || 0,
    total_acertos: userRow.total_acertos || 0, // CORRETO conforme schema
    pontuacao_media: userRow.pontuacao_media || 0,
    ativo: userRow.ativo ?? true
  };
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
