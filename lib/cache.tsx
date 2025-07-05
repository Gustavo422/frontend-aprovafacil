import { createServerSupabaseClient } from './supabase';
import { logger } from '@/lib/logger';

type CacheData = unknown;
type CacheKey = string;

export class CacheManager {
  private static instance: CacheManager;
  private supabase = createServerSupabaseClient();

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Obtém dados do cache
   */
  async get<T = CacheData>(userId: string, key: CacheKey): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_performance_cache')
        .select('cache_data, expires_at')
        .eq('user_id', userId)
        .eq('cache_key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Verificar se o cache expirou
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(userId, key);
        return null;
      }

      return data.cache_data as T;
    } catch (error) {
      logger.error('Erro ao buscar cache:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Armazena dados no cache
   */
  async set(
    userId: string,
    key: CacheKey,
    data: CacheData,
    ttlMinutes: number = 30
  ): Promise<void> {
    try {
      const expiresAt = new Date(
        Date.now() + ttlMinutes * 60 * 1000
      ).toISOString();

      const { error } = await this.supabase
        .from('user_performance_cache')
        .upsert({
          user_id: userId,
          cache_key: key,
          cache_data: data,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Erro ao salvar cache:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao salvar cache:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Remove dados do cache
   */
  async delete(userId: string, key: CacheKey): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_performance_cache')
        .delete()
        .eq('user_id', userId)
        .eq('cache_key', key);

      if (error) {
        logger.error('Erro ao deletar cache:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao deletar cache:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Limpa todo o cache de um usuário
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_performance_cache')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('Erro ao limpar cache do usuário:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao limpar cache do usuário:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Limpa cache expirado
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_performance_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Erro ao limpar cache expirado:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao limpar cache expirado:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Gera chave de cache para dados de desempenho
   */
  static generatePerformanceKey(
    userId: string,
    type: string,
    period?: string
  ): string {
    return `performance_${userId}_${type}${period ? `_${period}` : ''}`;
  }

  /**
   * Gera chave de cache para estatísticas por disciplina
   */
  static generateDisciplineStatsKey(
    userId: string,
    disciplina?: string
  ): string {
    return `discipline_stats_${userId}${disciplina ? `_${disciplina}` : ''}`;
  }

  /**
   * Gera chave de cache para atividades recentes
   */
  static generateRecentActivityKey(userId: string): string {
    return `recent_activity_${userId}`;
  }
}

// Funções utilitárias para cache
export const cacheUtils = {
  /**
   * Obtém dados de desempenho com cache
   */
  async getCachedPerformance(userId: string, type: string, period?: string) {
    const cache = CacheManager.getInstance();
    const key = CacheManager.generatePerformanceKey(userId, type, period);

    let data = await cache.get(userId, key);

    if (!data) {
      // Se não há cache, buscar dados e salvar
      data = await this.fetchPerformanceData(userId, type, period);
      if (data) {
        await cache.set(userId, key, data, 15); // Cache por 15 minutos
      }
    }

    return data;
  },

  /**
   * Busca dados de desempenho do banco
   */
  async fetchPerformanceData(userId: string, type: string, period?: string) {
    const supabase = createServerSupabaseClient();

    // Implementar lógica específica para cada tipo de dados
    switch (type) {
      case 'simulados':
        return await this.fetchSimuladosData(supabase, userId, period);
      case 'questoes':
        return await this.fetchQuestoesData(supabase, userId, period);
      case 'disciplinas':
        return await this.fetchDisciplinasData(supabase, userId, period);
      default:
        return null;
    }
  },

  async fetchSimuladosData(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    userId: string,
    period?: string
  ) {
    let query = supabase
      .from('user_simulado_progress')
      .select(
        `
        *,
        simulados!inner(*)
      `
      )
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (period === 'week') {
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      query = query.gte('completed_at', weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      query = query.gte('completed_at', monthAgo);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar dados de simulados:', {
        error: error.message,
        details: error,
      });
      return null;
    }

    return {
      total: data.length,
      averageScore:
        data.length > 0
          ? data.reduce(
              (acc: number, item: Record<string, unknown>) =>
                acc + (item.score as number),
              0
            ) / data.length
          : 0,
      totalTime: data.reduce(
        (acc: number, item: Record<string, unknown>) =>
          acc + (item.time_taken_minutes as number),
        0
      ),
    };
  },

  async fetchQuestoesData(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    userId: string,
    period?: string
  ) {
    let query = supabase
      .from('user_questoes_semanais_progress')
      .select(
        `
        *,
        questoes_semanais!inner(*)
      `
      )
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (period === 'week') {
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      query = query.gte('completed_at', weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      query = query.gte('completed_at', monthAgo);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar dados de questões:', {
        error: error.message,
        details: error,
      });
      return null;
    }

    return {
      total: data.length,
      averageScore:
        data.length > 0
          ? data.reduce(
              (acc: number, item: Record<string, unknown>) =>
                acc + (item.score as number),
              0
            ) / data.length
          : 0,
    };
  },

  async fetchDisciplinasData(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    userId: string,
    _period?: string
  ) {
    const query = supabase
      .from('user_disciplina_progress')
      .select(
        `
        *,
        disciplinas!inner(*)
      `
      )
      .eq('user_id', userId);

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar dados de disciplinas:', {
        error: error.message,
        details: error,
      });
      return null;
    }

    return data;
  },
};
