import { createServerSupabaseClient } from './supabase';
import { logger } from '@/lib/logger';

export interface SoftDeleteOptions {
  tablenome: string;
  recordId: string;
  userId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface SoftDeleteResult {
  success: boolean;
  error?: string;
  deletedAt?: Date;
}

export class SoftDeleteManager {
  private static instance: SoftDeleteManager;
  private supabase = createServerSupabaseClient();
  private auditLogger: unknown;

  private constructor() {}

  public static getInstance(): SoftDeleteManager {
    if (!SoftDeleteManager.instance) {
      SoftDeleteManager.instance = new SoftDeleteManager();
    }
    return SoftDeleteManager.instance;
  }

  private async initialize() {
    if (!this.auditLogger) {
      // Remover ou comentar a linha: const supabaseClient = await this.supabase;
      // Remover ou comentar a linha: this.auditLogger = getAuditLogger(supabaseClient);
    }
  }

  /**
   * Realiza soft delete de um registro
   */
  async softDelete(options: SoftDeleteOptions): Promise<SoftDeleteResult> {
    try {
      const supabase = await this.supabase;
      const { data, error } = await supabase
        .from(options.tablenome)
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: options.userId,
          delete_reason: options.reason,
          delete_metadata: options.metadata,
        })
        .eq('id', options.recordId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao realizar soft delete:', {
          error: error.message,
          details: error,
          options,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Registro não encontrado ou já deletado',
        };
      }

      logger.info('Soft delete realizado com sucesso:', {
        tablenome: options.tablenome,
        recordId: options.recordId,
        userId: options.userId,
      });

      return {
        success: true,
        deletedAt: new Date(data.deleted_at),
      };
    } catch (error) {
      logger.error('Erro inesperado ao realizar soft delete:', {
        error: error instanceof Error ? error.message : String(error),
        options,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Restaura um registro deletado via soft delete
   */
  async restore(options: Omit<SoftDeleteOptions, 'reason' | 'metadata'>): Promise<SoftDeleteResult> {
    try {
      const supabase = await this.supabase;
      const { data, error } = await supabase
        .from(options.tablenome)
        .update({
          deleted_at: null,
          deleted_by: null,
          delete_reason: null,
          delete_metadata: null,
        })
        .eq('id', options.recordId)
        .not('deleted_at', 'is', null)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao restaurar registro:', {
          error: error.message,
          details: error,
          options,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Registro não encontrado ou não estava deletado',
        };
      }

      logger.info('Registro restaurado com sucesso:', {
        tablenome: options.tablenome,
        recordId: options.recordId,
        userId: options.userId,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Erro inesperado ao restaurar registro:', {
        error: error instanceof Error ? error.message : String(error),
        options,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Realiza hard delete de um registro (deletado via soft delete)
   */
  async hardDelete(options: Omit<SoftDeleteOptions, 'reason' | 'metadata'>): Promise<SoftDeleteResult> {
    try {
      const supabase = await this.supabase;
      const { error } = await supabase
        .from(options.tablenome)
        .delete()
        .eq('id', options.recordId)
        .not('deleted_at', 'is', null);

      if (error) {
        logger.error('Erro ao realizar hard delete:', {
          error: error.message,
          details: error,
          options,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('Hard delete realizado com sucesso:', {
        tablenome: options.tablenome,
        recordId: options.recordId,
        userId: options.userId,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Erro inesperado ao realizar hard delete:', {
        error: error instanceof Error ? error.message : String(error),
        options,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Lista registros deletados via soft delete
   */
  async listDeleted(
    tablenome: string,
    filters?: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    try {
      const supabase = await this.supabase;
      let query = supabase
        .from(tablenome)
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Erro ao listar registros deletados:', {
          error: error.message,
          details: error,
          tablenome,
          filters,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro inesperado ao listar registros deletados:', {
        error: error instanceof Error ? error.message : String(error),
        tablenome,
        filters,
      });
      return [];
    }
  }

  /**
   * Limpa registros deletados há mais de X dias
   */
  async cleanupOldDeleted(
    tablenome: string,
    daysToKeep: number = 30
  ): Promise<{ deleted: number; errors: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const supabase = await this.supabase;
      const { error } = await supabase
        .from(tablenome)
        .delete()
        .lt('deleted_at', cutoffDate.toISOString())
        .not('deleted_at', 'is', null);

      if (error) {
        logger.error('Erro ao limpar registros antigos:', {
          error: error.message,
          details: error,
          tablenome,
          daysToKeep,
        });
        return { deleted: 0, errors: 1 };
      }

      logger.info('Limpeza de registros antigos concluída:', {
        tablenome,
        daysToKeep,
      });

      return { deleted: 0, errors: 0 };
    } catch (error) {
      logger.error('Erro inesperado ao limpar registros antigos:', {
        error: error instanceof Error ? error.message : String(error),
        tablenome,
        daysToKeep,
      });
      return { deleted: 0, errors: 1 };
    }
  }

  /**
   * Executa hard delete de registros soft deleted antigos
   */
  async hardDeleteOldRecords(
    tablenome: string,
    daysToKeep: number = 365
  ): Promise<number> {
    try {
      const supabaseClient = await this.supabase;
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      ).toISOString();

      // Buscar registros soft deleted antigos
      const { data: oldRecords, error: fetchError } = await supabaseClient
        .from(tablenome)
        .select('id')
        .not('deleted_at', 'is', null)
        .lt('deleted_at', cutoffDate);

      if (fetchError) {
        logger.error('Erro ao buscar registros antigos:', {
          error: fetchError.message,
          details: fetchError,
        });
        return 0;
      }

      if (!oldRecords || oldRecords.length === 0) {
        return 0;
      }

      // Executar hard delete
      const { error } = await supabaseClient
        .from(tablenome)
        .delete()
        .in(
          'id',
          oldRecords.map((record: Record<string, unknown>) => record.id)
        );

      if (error) {
        logger.error('Erro ao executar hard delete:', {
          error: error.message,
          details: error,
        });
        return 0;
      }

      // Registrar no log de auditoria
      await (this.auditLogger as { log: (entry: Record<string, unknown>) => Promise<void> }).log({
        action: 'DELETE',
        tablenome,
        newValues: {
          hard_deleted_count: oldRecords.length,
          cutoff_date: cutoffDate,
          reason: 'Automatic cleanup of old soft deleted records',
        },
      });

      return oldRecords.length;
    } catch (error) {
      logger.error('Erro ao executar hard delete de registros antigos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Busca registros soft deleted
   */
  async getSoftDeletedRecords(
    tablenome: string,
    userId?: string,
    limit: number = 50
  ): Promise<unknown[]> {
    try {
      const supabaseClient = await this.supabase;
      let query = supabaseClient
        .from(tablenome)
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Erro ao buscar registros soft deleted:', {
          error: error.message,
          details: error,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar registros soft deleted:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Verifica se um registro está soft deleted
   */
  async isSoftDeleted(tablenome: string, recordId: string): Promise<boolean> {
    try {
      const supabaseClient = await this.supabase;
      const { data, error } = await supabaseClient
        .from(tablenome)
        .select('deleted_at')
        .eq('id', recordId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.deleted_at !== null;
    } catch (error) {
      logger.error('Erro ao verificar soft delete:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Executa limpeza automática de registros antigos
   */
  async performAutomaticCleanup(): Promise<void> {
    await this.initialize();
    
    const tables = [
      'progresso_usuario_simulado',
      'progresso_usuario_questoes_semanais',
      'progresso_usuario_flashcard',
      'progresso_usuario_apostila',
      'progresso_usuario_mapa_assuntos',
    ];

    const cleanupResults = [];

    for (const table of tables) {
      try {
        const deletedCount = await this.hardDeleteOldRecords(table, 365); // Manter por 1 ano
        if (deletedCount > 0) {
          cleanupResults.push({ table, deletedCount });
        }
      } catch (error) {
        logger.error(`Erro na limpeza da tabela ${table}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Registrar resultado da limpeza
    if (cleanupResults.length > 0) {
      await (this.auditLogger as { log: (entry: Record<string, unknown>) => Promise<void> }).log({
        action: 'DELETE',
        tablenome: 'system',
        newValues: {
          cleanup_results: cleanupResults,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Exporta dados históricos antes do hard delete
   */
  async exportHistoricalData(
    tablenome: string,
    recordIds: string[]
  ): Promise<unknown[]> {
    try {
      const supabaseClient = await this.supabase;
      const { data, error } = await supabaseClient
        .from(tablenome)
        .select('*')
        .in('id', recordIds);

      if (error) {
        logger.error('Erro ao exportar dados históricos:', {
          error: error.message,
          details: error,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao exportar dados históricos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

// Função utilitária para obter instância do gerenciador
export const getSoftDeleteManager = () => SoftDeleteManager.getInstance();

// Middleware para soft delete automático
export async function withSoftDelete(
  options: SoftDeleteOptions
): Promise<SoftDeleteResult> {
  const manager = getSoftDeleteManager();
  return await manager.softDelete(options);
}

export async function withRestore(
  options: Omit<SoftDeleteOptions, 'reason' | 'metadata'>
): Promise<SoftDeleteResult> {
  const manager = getSoftDeleteManager();
  return await manager.restore(options);
}
