import { createClient } from '@supabase/supabase-js';
import type { CacheType } from './cache-manager';
import { logger } from './logger';

/**
 * Interface para métricas de cache no banco (nomes em português)
 */
export interface CacheMetricRecord {
  operacao: string; // era CacheOperation
  tipo_cache: CacheType;
  chave_cache?: string;
  duracao_ms: number;
  resultado: string; // era CacheOperationResult
  tamanho_bytes?: number;
  mensagem_erro?: string;
  usuario_id?: string;
  id_correlacao?: string;
}

/**
 * Interface para snapshot de cache no banco (nomes em português)
 */
export interface CacheSnapshotRecord {
  tipo_cache: CacheType;
  quantidade_entradas: number;
  tamanho_total_bytes?: number;
  quantidade_expiradas: number;
  quantidade_ativas: number;
  dados_snapshot?: Record<string, unknown>;
}

/**
 * Interface para relacionamento de chaves de cache (nomes em português)
 */
export interface CacheKeyRelationshipRecord {
  chave_principal: string;
  chave_relacionada: string;
  tipo_cache: CacheType;
  tipo_relacionamento?: string;
}

/**
 * Interface para auditoria de cache (nomes em português)
 */
export interface CacheAuditRecord {
  operacao: string | 'batch_operation';
  tipo_cache: CacheType;
  chaves_cache: string[];
  detalhes_operacao?: Record<string, unknown>;
  usuario_id?: string;
  endereco_ip?: string;
  user_agent?: string;
}

/**
 * Interface para configuração de monitoramento (nomes em português)
 */
export interface CacheMonitorConfigRecord {
  chave_config: string;
  valor_config: Record<string, unknown>;
  descricao?: string;
  ativo?: boolean;
}

/**
 * Serviço para integração do cache monitor com o banco de dados
 */
export class CacheDatabaseService {
  private static instance: CacheDatabaseService;
  private readonly supabase!: ReturnType<typeof createClient>;
  private enabled = true;
  private readonly batchSize = 50;
  private pendingMetrics: CacheMetricRecord[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private lastFlush: number = Date.now();

  /**
   * Constructor privado para singleton
   */
  private constructor() {
    // Inicializar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('CacheDatabaseService: Supabase credentials not found, disabling database integration');
      this.enabled = false;
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configurar flush automático
    this.setupAutoFlush();
  }

  /**
   * Obter instância singleton
   */
  public static getInstance(): CacheDatabaseService {
    if (!CacheDatabaseService.instance) {
      CacheDatabaseService.instance = new CacheDatabaseService();
    }
    return CacheDatabaseService.instance;
  }

  /**
   * Configurar flush automático
   */
  private setupAutoFlush(): void {
    if (!this.enabled) return;

    // Flush a cada 30 segundos ou quando atingir o batch size
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000);
  }

  /**
   * Registrar métrica de cache
   */
  public async recordMetric(metric: CacheMetricRecord): Promise<void> {
    if (!this.enabled) return;

    try {
      this.pendingMetrics.push(metric);

      // Flush se atingiu o batch size ou se passou muito tempo
      if (this.pendingMetrics.length >= this.batchSize || 
          Date.now() - this.lastFlush > 60000) {
        await this.flushMetrics();
      }
    } catch (error) {
      logger.error('CacheDatabaseService: Error recording metric', {
        error: error instanceof Error ? error.message : String(error),
        metric
      });
    }
  }

  /**
   * Flush métricas pendentes para o banco
   */
  private async flushMetrics(): Promise<void> {
    if (!this.enabled || this.pendingMetrics.length === 0) return;

    try {
      const metricsToFlush = [...this.pendingMetrics];
      this.pendingMetrics = [];

      const { error } = await this.supabase
        .from('metricas_cache')
        .insert(metricsToFlush as unknown as Record<string, unknown>[]);

      if (error) {
        logger.error('CacheDatabaseService: Error flushing metrics', {
          error: error.message,
          count: metricsToFlush.length
        });
        
        // Recolocar métricas na fila em caso de erro
        this.pendingMetrics.unshift(...metricsToFlush);
      } else {
        this.lastFlush = Date.now();
        logger.debug('CacheDatabaseService: Flushed metrics', {
          count: metricsToFlush.length
        });
      }
    } catch (error) {
      logger.error('CacheDatabaseService: Error in flushMetrics', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Recolocar métricas na fila em caso de erro
      this.pendingMetrics.unshift(...this.pendingMetrics);
    }
  }

  /**
   * Registrar snapshot de cache
   */
  public async recordSnapshot(snapshot: CacheSnapshotRecord): Promise<void> {
    if (!this.enabled) return;

    try {
      const { error } = await this.supabase
        .from('snapshots_cache')
        .insert(snapshot as unknown as Record<string, unknown>);

      if (error) {
        logger.error('CacheDatabaseService: Error recording snapshot', {
          error: error.message,
          snapshot
        });
      } else {
        logger.debug('CacheDatabaseService: Recorded snapshot', {
          tipo_cache: snapshot.tipo_cache,
          quantidade_entradas: snapshot.quantidade_entradas
        });
      }
    } catch (error) {
      logger.error('CacheDatabaseService: Error in recordSnapshot', {
        error: error instanceof Error ? error.message : String(error),
        snapshot
      });
    }
  }

  /**
   * Registrar relacionamento de chaves de cache
   */
  public async recordKeyRelationship(relationship: CacheKeyRelationshipRecord): Promise<void> {
    if (!this.enabled) return;

    try {
      const { error } = await this.supabase
        .from('relacionamentos_chaves_cache')
        .insert(relationship as unknown as Record<string, unknown>);

      if (error && !error.message.includes('duplicate key')) {
        logger.error('CacheDatabaseService: Error recording key relationship', {
          error: error.message,
          relationship
        });
      } else if (!error) {
        logger.debug('CacheDatabaseService: Recorded key relationship', {
          chave_principal: relationship.chave_principal,
          chave_relacionada: relationship.chave_relacionada
        });
      }
    } catch (error) {
      logger.error('CacheDatabaseService: Error in recordKeyRelationship', {
        error: error instanceof Error ? error.message : String(error),
        relationship
      });
    }
  }

  /**
   * Registrar auditoria de cache
   */
  public async recordAudit(audit: CacheAuditRecord): Promise<void> {
    if (!this.enabled) return;

    try {
      const { error } = await this.supabase
        .from('log_auditoria_cache')
        .insert(audit as unknown as Record<string, unknown>);

      if (error) {
        logger.error('CacheDatabaseService: Error recording audit', {
          error: error.message,
          audit
        });
      } else {
        logger.debug('CacheDatabaseService: Recorded audit', {
          operacao: audit.operacao,
          chaves_cache_count: audit.chaves_cache.length
        });
      }
    } catch (error) {
      logger.error('CacheDatabaseService: Error in recordAudit', {
        error: error instanceof Error ? error.message : String(error),
        audit
      });
    }
  }

  /**
   * Obter estatísticas de cache
   */
  public async getCacheStatistics(options: {
    tipo_cache?: CacheType;
    data_inicio?: Date;
    data_fim?: Date;
  } = {}): Promise<unknown[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.supabase
        .rpc('obter_estatisticas_cache', {
          p_tipo_cache: options.tipo_cache,
          p_data_inicio: options.data_inicio?.toISOString(),
          p_data_fim: options.data_fim?.toISOString()
        });

      if (error) {
        logger.error('CacheDatabaseService: Error getting cache statistics', {
          error: error.message,
          options
        });
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getCacheStatistics', {
        error: error instanceof Error ? error.message : String(error),
        options
      });
      return [];
    }
  }

  /**
   * Obter métricas de cache por operação
   */
  public async getCacheMetricsByOperation(options: {
    operacao?: string; // era CacheOperation
    tipo_cache?: CacheType;
    limite?: number;
    offset?: number;
  } = {}): Promise<unknown[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.supabase
        .rpc('obter_metricas_cache_por_operacao', {
          p_operacao: options.operacao,
          p_tipo_cache: options.tipo_cache,
          p_limite: options.limite || 100,
          p_offset: options.offset || 0
        });

      if (error) {
        logger.error('CacheDatabaseService: Error getting cache metrics', {
          error: error.message,
          options
        });
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getCacheMetricsByOperation', {
        error: error instanceof Error ? error.message : String(error),
        options
      });
      return [];
    }
  }

  /**
   * Obter relacionamentos de chaves de cache
   */
  public async getCacheKeyRelationships(chave_cache: string, tipo_cache?: CacheType): Promise<unknown[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.supabase
        .rpc('obter_relacionamentos_chave_cache', {
          p_chave_cache: chave_cache,
          p_tipo_cache: tipo_cache
        });

      if (error) {
        logger.error('CacheDatabaseService: Error getting key relationships', {
          error: error.message,
          chave_cache,
          tipo_cache
        });
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getCacheKeyRelationships', {
        error: error instanceof Error ? error.message : String(error),
        chave_cache,
        tipo_cache
      });
      return [];
    }
  }

  /**
   * Obter configuração de monitoramento
   */
  public async getMonitorConfig(chave_config: string): Promise<Record<string, unknown> | null> {
    if (!this.enabled) return null;

    try {
      const { data, error } = await this.supabase
        .from('configuracoes_monitor_cache')
        .select('valor_config')
        .eq('chave_config', chave_config)
        .eq('ativo', true)
        .single();

      if (error) {
        logger.error('CacheDatabaseService: Error getting monitor config', {
          error: error.message,
          chave_config
        });
        return null;
      }

      const valor = data?.valor_config;
      if (valor && typeof valor === 'object' && valor !== null) {
        return valor as Record<string, unknown>;
      }
      return null;
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getMonitorConfig', {
        error: error instanceof Error ? error.message : String(error),
        chave_config
      });
      return null;
    }
  }

  /**
   * Salvar configuração de monitoramento
   */
  public async saveMonitorConfig(config: CacheMonitorConfigRecord): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const { error } = await this.supabase
        .from('configuracoes_monitor_cache')
        .upsert(config as unknown as Record<string, unknown>, { onConflict: 'chave_config' });

      if (error) {
        logger.error('CacheDatabaseService: Error saving monitor config', {
          error: error.message,
          config
        });
        return false;
      }

      logger.debug('CacheDatabaseService: Saved monitor config', {
        chave_config: config.chave_config
      });
      return true;
    } catch (error) {
      logger.error('CacheDatabaseService: Error in saveMonitorConfig', {
        error: error instanceof Error ? error.message : String(error),
        config
      });
      return false;
    }
  }

  /**
   * Obter estatísticas resumidas (usando view)
   */
  public async getSummaryStats(): Promise<unknown[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.supabase
        .from('estatisticas_resumidas_cache')
        .select('*');

      if (error) {
        logger.error('CacheDatabaseService: Error getting summary stats', {
          error: error.message
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getSummaryStats', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Obter operações lentas (usando view)
   */
  public async getSlowOperations(): Promise<unknown[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.supabase
        .from('operacoes_lentas_cache')
        .select('*')
        .order('duracao_ms', { ascending: false });

      if (error) {
        logger.error('CacheDatabaseService: Error getting slow operations', {
          error: error.message
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getSlowOperations', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Obter erros de cache (usando view)
   */
  public async getCacheErrors(): Promise<unknown[]> {
    if (!this.enabled) return [];

    try {
      const { data, error } = await this.supabase
        .from('erros_cache')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        logger.error('CacheDatabaseService: Error getting cache errors', {
          error: error.message
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('CacheDatabaseService: Error in getCacheErrors', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Limpar métricas antigas
   */
  public async cleanupOldMetrics(daysToKeep = 30): Promise<number> {
    if (!this.enabled) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { count, error } = await this.supabase
        .from('metricas_cache')
        .delete()
        .lt('criado_em', cutoffDate.toISOString())
        .select('id');

      if (error) {
        logger.error('CacheDatabaseService: Error cleaning up old metrics', {
          error: error.message,
          daysToKeep
        });
        return 0;
      }

      logger.info('CacheDatabaseService: Cleaned up old metrics', {
        deleted_count: count,
        cutoff_date: cutoffDate.toISOString()
      });

      return count || 0;
    } catch (error) {
      logger.error('CacheDatabaseService: Error in cleanupOldMetrics', {
        error: error instanceof Error ? error.message : String(error),
        daysToKeep
      });
      return 0;
    }
  }

  /**
   * Habilitar/desabilitar o serviço
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled && this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    } else if (enabled && !this.flushInterval) {
      this.setupAutoFlush();
    }
  }

  /**
   * Verificar se o serviço está habilitado
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Destruir o serviço
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush final
    this.flushMetrics();
  }
}

// Export singleton instance
export const cacheDatabaseService = CacheDatabaseService.getInstance();