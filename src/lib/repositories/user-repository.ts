import { getLogger } from '@/src/lib/logging';
import { CachedRepository } from '@/src/lib/repositories/base';
import { AppUser, mapUserRowToAppUser } from '@/src/features/auth/types/user.types';
import { supabase } from '@/src/lib/supabase';
import { DatabaseError } from '@/src/lib/errors';
import type { TablesUpdate, TablesInsert } from '@/types/supabase.types';

const logger = getLogger('UserRepository');

/**
 * User stats type
 */
export type UserStats = {
  total_questoes_respondidas: number;
  total_acertos: number;
  tempo_estudo_minutos: number;
  pontuacao_media: number;
};

/**
 * User preferences type
 */
export type UserPreferences = {
  tema: 'light' | 'dark' | 'system';
  notificacoes_email: boolean;
  notificacoes_push: boolean;
};

/**
 * User repository for managing user data
 */
export class UserRepository extends CachedRepository<AppUser> {
  /**
   * Create a new user repository
   */
  constructor() {
    super('usuarios', {
      ttl: 300000, // 5 minutes
      cacheById: true,
      cacheAll: false
    });
  }
  
  /**
   * Get the current user profile
   * @returns User profile or null if not authenticated
   */
  async getProfile(): Promise<AppUser | null> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.warn('Failed to get current user', { error: authError });
        return null;
      }
      
      // Get user from database
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        logger.error('Failed to get user profile', { error });
        throw new DatabaseError('Failed to get user profile: ' + error.message);
      }
      
      return mapUserRowToAppUser(data);
    } catch (error) {
      logger.error('Error in getProfile', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to get user profile', { cause: error as Error });
    }
  }
  
  /**
   * Update the current user profile
   * @param data Profile data to update
   * @returns Updated user profile or null if not authenticated
   */
  async updateProfile(data: Partial<AppUser>): Promise<AppUser | null> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.warn('Failed to get current user', { error: authError });
        return null;
      }
      // Atualizar apenas campos permitidos pelo tipo TablesUpdate<'usuarios'>
      const updateData: TablesUpdate<'usuarios'> = {
        nome: data.nome,
        atualizado_em: new Date().toISOString(),
      };
       
      const { data: updatedData, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to update user profile', { error });
        throw new DatabaseError('Failed to update user profile: ' + error.message);
      }
      
      // Invalidate cache
      this.invalidateByIdCache(user.id);
      
      return mapUserRowToAppUser(updatedData);
    } catch (error) {
      logger.error('Error in updateProfile', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to update user profile', { cause: error as Error });
    }
  }
  
  /**
   * Get user stats
   * @returns User stats or null if not authenticated
   */
  async getStats(): Promise<UserStats | null> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.warn('Failed to get current user', { error: authError });
        return null;
      }
      
      // Get user from database
      const { data, error } = await supabase
        .from('usuarios')
        .select('total_questoes_respondidas, total_acertos, tempo_estudo_minutos, pontuacao_media')
        .eq('id', user.id)
        .single();
      
      if (error) {
        logger.error('Failed to get user stats', { error });
        throw new DatabaseError('Failed to get user stats: ' + error.message);
      }
      
      return {
        total_questoes_respondidas: data.total_questoes_respondidas || 0,
        total_acertos: data.total_acertos || 0,
        tempo_estudo_minutos: data.tempo_estudo_minutos || 0,
        pontuacao_media: data.pontuacao_media || 0
      };
    } catch (error) {
      logger.error('Error in getStats', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to get user stats', { cause: error as Error });
    }
  }
  
  /**
   * Update user stats
   * @param stats Stats to update
   * @returns Updated stats or null if not authenticated
   */
  async updateStats(stats: Partial<UserStats>): Promise<UserStats | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.warn('Failed to get current user', { error: authError });
        return null;
      }
      // Atualizar apenas campos permitidos pelo tipo TablesUpdate<'usuarios'>
      const updateData: TablesUpdate<'usuarios'> = {
        total_questoes_respondidas: stats.total_questoes_respondidas,
        total_acertos: stats.total_acertos,
        tempo_estudo_minutos: stats.tempo_estudo_minutos,
        pontuacao_media: stats.pontuacao_media,
        atualizado_em: new Date().toISOString(),
      };
       
      const { data: updatedData, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', user.id)
        .select('total_questoes_respondidas, total_acertos, tempo_estudo_minutos, pontuacao_media')
        .single();
      if (error) {
        logger.error('Failed to update user stats', { error });
        throw new DatabaseError('Failed to update user stats: ' + error.message);
      }
      this.invalidateByIdCache(user.id);
      return {
        total_questoes_respondidas: updatedData.total_questoes_respondidas || 0,
        total_acertos: updatedData.total_acertos || 0,
        tempo_estudo_minutos: updatedData.tempo_estudo_minutos || 0,
        pontuacao_media: updatedData.pontuacao_media || 0
      };
    } catch (error) {
      logger.error('Error in updateStats', { error });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user stats', { cause: error as Error });
    }
  }
  
  /**
   * Get user preferences
   * @returns User preferences or null if not authenticated
   */
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.warn('Failed to get current user', { error: authError });
        return null;
      }
      
      // Get user preferences from database
      const { data, error } = await supabase
        .from('preferencias_usuario')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();
      
      if (error) {
        logger.error('Failed to get user preferences', { error });
        throw new DatabaseError('Failed to get user preferences: ' + error.message);
      }
      
      // If no preferences found, return defaults
      if (!data) {
        return {
          tema: 'system',
          notificacoes_email: true,
          notificacoes_push: true
        };
      }
      
      return {
        tema: (data.tema as 'light' | 'dark' | 'system') || 'system',
        notificacoes_email: data.notificacoes_email ?? true,
        notificacoes_push: data.notificacoes_push ?? true
      };
    } catch (error) {
      logger.error('Error in getPreferences', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to get user preferences', { cause: error as Error });
    }
  }
  
  /**
   * Update user preferences
   * @param prefs Preferences to update
   * @returns Updated preferences or null if not authenticated
   */
  async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.warn('Failed to get current user', { error: authError });
        return null;
      }
      const { data: existingPrefs, error: checkError } = await supabase
        .from('preferencias_usuario')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();
      if (checkError) {
        logger.error('Failed to check user preferences', { error: checkError });
        throw new DatabaseError('Failed to check user preferences: ' + checkError.message);
      }
      let result;
      if (existingPrefs) {
        const updateData: TablesUpdate<'preferencias_usuario'> = {
          tema: (prefs.tema !== undefined ? prefs.tema : existingPrefs.tema) as 'light' | 'dark' | 'system',
          notificacoes_email: prefs.notificacoes_email !== undefined
            ? prefs.notificacoes_email
            : existingPrefs.notificacoes_email,
          notificacoes_push: prefs.notificacoes_push !== undefined
            ? prefs.notificacoes_push
            : existingPrefs.notificacoes_push,
          atualizado_em: new Date().toISOString(),
        };
         
        const { data, error } = await supabase
          .from('preferencias_usuario')
          .update(updateData)
          .eq('usuario_id', user.id)
          .select()
          .single();
        if (error) {
          logger.error('Failed to update user preferences', { error });
          throw new DatabaseError('Failed to update user preferences: ' + error.message);
        }
        result = data;
      } else {
        const insertData: TablesInsert<'preferencias_usuario'> = {
          usuario_id: user.id,
          tema: (prefs.tema || 'system') as 'light' | 'dark' | 'system',
          notificacoes_email: prefs.notificacoes_email !== undefined ? prefs.notificacoes_email : true,
          notificacoes_push: prefs.notificacoes_push !== undefined ? prefs.notificacoes_push : true
        };
         
        const { data, error } = await supabase
          .from('preferencias_usuario')
          .insert([insertData])
          .select()
          .single();
        if (error) {
          logger.error('Failed to create user preferences', { error });
          throw new DatabaseError('Failed to create user preferences: ' + error.message);
        }
        result = data;
      }
      return {
        tema: result.tema as 'light' | 'dark' | 'system',
        notificacoes_email: result.notificacoes_email,
        notificacoes_push: result.notificacoes_push
      };
    } catch (error) {
      logger.error('Error in updatePreferences', { error });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user preferences', { cause: error as Error });
    }
  }
  
  /**
   * Find a user by email
   * @param email Email to search for
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<AppUser | null> {
    try {
      // Get user from database
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        logger.error('Failed to find user by email', { error, email });
        throw new DatabaseError('Failed to find user by email: ' + error.message);
      }
      
      return mapUserRowToAppUser(data);
    } catch (error) {
      logger.error('Error in findByEmail', { error, email });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to find user by email', { cause: error as Error });
    }
  }
  
  /**
   * Update user stats by user ID
   * @param userId User ID
   * @param stats Stats to update
   * @returns Updated user or null if not found
   */
  async updateusuariostats(userId: string, stats: Partial<UserStats>): Promise<AppUser | null> {
    try {
      const updateData: TablesUpdate<'usuarios'> = {
        total_questoes_respondidas: stats.total_questoes_respondidas,
        total_acertos: stats.total_acertos,
        tempo_estudo_minutos: stats.tempo_estudo_minutos,
        pontuacao_media: stats.pontuacao_media,
        atualizado_em: new Date().toISOString(),
      };
       
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      if (error) {
        logger.error('Failed to update user stats', { error, userId });
        throw new DatabaseError('Failed to update user stats: ' + error.message);
      }
      this.invalidateByIdCache(userId);
      return mapUserRowToAppUser(data);
    } catch (error) {
      logger.error('Error in updateusuariostats', { error, userId });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user stats', { cause: error as Error });
    }
  }
  
  /**
   * Deactivate a user account
   * @param userId User ID
   * @returns True if successful, false otherwise
   */
  async deactivateAccount(userId: string): Promise<boolean> {
    try {
      const updateData: TablesUpdate<'usuarios'> = {
        ativo: false,
        atualizado_em: new Date().toISOString(),
      };
       
      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userId);
      if (error) {
        logger.error('Failed to deactivate user account', { error, userId });
        throw new DatabaseError('Failed to deactivate user account: ' + error.message);
      }
      this.invalidateByIdCache(userId);
      return true;
    } catch (error) {
      logger.error('Error in deactivateAccount', { error, userId });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to deactivate user account', { cause: error as Error });
    }
  }
  
  /**
   * Activate a user account
   * @param userId User ID
   * @returns True if successful, false otherwise
   */
  async activateAccount(userId: string): Promise<boolean> {
    try {
      const updateData: TablesUpdate<'usuarios'> = {
        ativo: true,
        atualizado_em: new Date().toISOString(),
      };
       
      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userId);
      if (error) {
        logger.error('Failed to activate user account', { error, userId });
        throw new DatabaseError('Failed to activate user account: ' + error.message);
      }
      this.invalidateByIdCache(userId);
      return true;
    } catch (error) {
      logger.error('Error in activateAccount', { error, userId });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to activate user account', { cause: error as Error });
    }
  }
  
  /**
   * Get active users count
   * @returns Number of active users
   */
  async getActiveUsersCount(): Promise<number> {
    try {
      // Ajuste para contagem de usuários ativos
      const { count, error } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      
      if (error) {
        logger.error('Failed to get active users count', { error });
        throw new DatabaseError('Failed to get active users count: ' + error.message);
      }
      
      return count || 0;
    } catch (error) {
      logger.error('Error in getActiveUsersCount', { error });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to get active users count', { cause: error as Error });
    }
  }
  
  /**
   * Get users registered in the last days
   * @param days Number of days
   * @returns Number of users registered in the last days
   */
  async getUsersRegisteredInLastDays(days: number): Promise<number> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - days);
      
      const { count, error } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .gte('criado_em', date.toISOString());
      
      if (error) {
        logger.error('Failed to get users registered in last days', { error, days });
        throw new DatabaseError('Failed to get users registered in last days: ' + error.message);
      }
      
      return count || 0;
    } catch (error) {
      logger.error('Error in getUsersRegisteredInLastDays', { error, days });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to get users registered in last days', { cause: error as Error });
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;
