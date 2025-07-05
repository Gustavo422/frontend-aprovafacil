import { BaseRepository } from './base-repository';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

// Tipos específicos para o repositório de usuários
type UserTable = Database['public']['Tables']['users'];
type UserRow = UserTable['Row'];
type UserInsert = UserTable['Insert'];
type UserUpdate = UserTable['Update'];

// Tipo para as estatísticas do usuário
type UserStatsUpdate = {
  questionsAnswered?: number;
  correctAnswers?: number;
  studyTimeMinutes?: number;
};

export class UserRepository extends BaseRepository<'users'> {
  // Expor o cliente de forma segura
  public readonly client = supabase;

  constructor() {
    super('users');
  }

  // Métodos específicos para usuários
  async findByEmail(email: string): Promise<UserRow | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Nenhum registro encontrado
        return null;
      }
      throw error;
    }
    return data;
  }

  /**
   * Atualiza as estatísticas do usuário
   * @param userId ID do usuário
   * @param stats Objeto com as estatísticas a serem atualizadas
   * @returns Usuário atualizado
   */
  async updateUserStats(
    userId: string, 
    stats: UserStatsUpdate
  ): Promise<UserRow> {
    const updates: Partial<UserUpdate> = {};
    
    if (stats.questionsAnswered !== undefined) {
      updates.total_questions_answered = stats.questionsAnswered;
    }
    
    if (stats.correctAnswers !== undefined) {
      updates.total_correct_answers = stats.correctAnswers;
    }
    
    if (stats.studyTimeMinutes !== undefined) {
      updates.study_time_minutes = stats.studyTimeMinutes;
    }
    
    // Atualiza a média de acertos
    if (stats.questionsAnswered !== undefined && stats.correctAnswers !== undefined) {
      updates.average_score = stats.correctAnswers / Math.max(1, stats.questionsAnswered) * 100;
    }
    
    return this.update(userId, updates);
  }

  /**
   * Sobrescreve o método de exclusão para impedir a exclusão direta de usuários
   * @throws {Error} Sempre lança um erro, pois a exclusão direta não é permitida
   */
  async delete(): Promise<never> {
    throw new Error('Não é permitido excluir usuários diretamente. Use desativarConta() em vez disso.');
  }

  /**
   * Desativa a conta de um usuário
   * @param userId ID do usuário a ser desativado
   * @returns Promise que resolve quando a conta for desativada
   * @throws {Error} Se ocorrer um erro ao desativar a conta
   */
  async deactivateAccount(userId: string): Promise<boolean> {
    try {
      const { error } = await this.client.rpc('desativar_conta', { 
        user_id: userId 
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      throw new Error('Falha ao desativar a conta do usuário');
    }
  }
}
