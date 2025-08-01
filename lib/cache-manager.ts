import { createClient } from './supabase';
import { logger } from './logger';
import { queryClient } from '@/src/providers/query-client';

/**
 * Tipos de cache
 */
export enum CacheType {
  MEMORY = 'memory',
  SUPABASE = 'supabase',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
}

/**
 * Opções de cache
 */
export interface CacheOptions {
  /**
   * Tipo de cache
   */
  type?: CacheType;
  
  /**
   * Tempo de vida em minutos
   */
  ttlMinutes?: number;
  
  /**
   * Chaves relacionadas para invalidação
   */
  relatedKeys?: string[];
  
  /**
   * Se deve usar cache otimista
   */
  optimistic?: boolean;
}

/**
 * Dados de cache
 */
export interface CacheEntry<T = unknown> {
  /**
   * Dados armazenados
   */
  data: T;
  
  /**
   * Data de expiração
   */
  expiresAt: Date;
  
  /**
   * Data de criação
   */
  createdAt: Date;
  
  /**
   * Chaves relacionadas
   */
  relatedKeys?: string[];
}

/**
 * Gerenciador de cache centralizado
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private keyRelationships: Map<string, Set<string>> = new Map();
  private pendingInvalidations: Set<string> = new Set();
  private invalidationTimeout: ReturnType<typeof setTimeout> | null = null;
  
  private constructor() {
    // Inicializar limpeza periódica de cache expirado apenas no cliente
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000); // A cada 5 minutos
    }
  }
  
  /**
   * Obtém instância singleton
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  /**
   * Registra relações entre chaves
   */
  private registerKeyRelationships(key: string, relatedKeys?: string[]): void {
    if (!relatedKeys || relatedKeys.length === 0) return;
    
    // Registrar relações bidirecionais
    relatedKeys.forEach(relatedKey => {
      // Relacionamento: relatedKey -> key
      if (!this.keyRelationships.has(relatedKey)) {
        this.keyRelationships.set(relatedKey, new Set());
      }
      this.keyRelationships.get(relatedKey)!.add(key);
      
      // Relacionamento: key -> relatedKey
      if (!this.keyRelationships.has(key)) {
        this.keyRelationships.set(key, new Set());
      }
      this.keyRelationships.get(key)!.add(relatedKey);
    });
  }
  
  /**
   * Obtém todas as chaves relacionadas recursivamente
   */
  private getAllRelatedKeys(key: string, visited: Set<string> = new Set()): Set<string> {
    if (visited.has(key)) return visited;
    
    visited.add(key);
    
    const relatedKeys = this.keyRelationships.get(key);
    if (relatedKeys) {
      relatedKeys.forEach(relatedKey => {
        if (!visited.has(relatedKey)) {
          this.getAllRelatedKeys(relatedKey, visited);
        }
      });
    }
    
    return visited;
  }
  
  /**
   * Agenda invalidação em lote
   */
  private scheduleBatchInvalidation(): void {
    if (this.invalidationTimeout) return;
    
    this.invalidationTimeout = setTimeout(() => {
      this.processPendingInvalidations();
      this.invalidationTimeout = null;
    }, 50); // Agrupar invalidações em 50ms
  }
  
  /**
   * Processa invalidações pendentes
   */
  private processPendingInvalidations(): void {
    if (this.pendingInvalidations.size === 0) return;
    
    const keysToInvalidate = Array.from(this.pendingInvalidations);
    this.pendingInvalidations.clear();
    
    // Invalidar no React Query
    keysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key.split(':') });
    });
    
    logger.debug('Cache invalidado em lote', { keys: keysToInvalidate });
  }
  
  /**
   * Limpa cache expirado
   */
  private cleanExpiredCache(): void {
    const now = new Date();
    let expiredCount = 0;
    
    // Limpar cache em memória
    this.memoryCache.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      logger.debug(`Limpeza de cache: ${expiredCount} itens expirados removidos`);
    }
    
    // Limpar cache no Supabase apenas se estivermos no cliente
    if (typeof window !== 'undefined') {
      this.clearExpiredSupabaseCache().catch(error => {
        logger.error('Erro ao limpar cache expirado no Supabase', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }
  
  /**
   * Obtém dados do cache em memória
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    // Verificar se expirou
    if (entry.expiresAt < new Date()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Armazena dados no cache em memória
   */
  private setInMemory<T>(
    key: string,
    data: T,
    ttlMinutes: number = 5,
    relatedKeys?: string[]
  ): void {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    
    this.memoryCache.set(key, {
      data,
      expiresAt,
      createdAt: new Date(),
      relatedKeys
    });
    
    this.registerKeyRelationships(key, relatedKeys);
  }
  
  /**
   * Obtém dados do cache no localStorage
   */
  private getFromLocalStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`cache:${key}`);
      if (!item) return null;
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verificar se expirou
      if (new Date(entry.expiresAt) < new Date()) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      logger.error('Erro ao ler cache do localStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
  
  /**
   * Armazena dados no cache no localStorage
   */
  private setInLocalStorage<T>(
    key: string,
    data: T,
    ttlMinutes: number = 30,
    relatedKeys?: string[]
  ): void {
    if (typeof window === 'undefined') return;
    
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const entry: CacheEntry<T> = {
        data,
        expiresAt,
        createdAt: new Date(),
        relatedKeys
      };
      
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      this.registerKeyRelationships(key, relatedKeys);
    } catch (error) {
      logger.error('Erro ao salvar cache no localStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  /**
   * Obtém dados do cache no sessionStorage
   */
  private getFromSessionStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = sessionStorage.getItem(`cache:${key}`);
      if (!item) return null;
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verificar se expirou
      if (new Date(entry.expiresAt) < new Date()) {
        sessionStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      logger.error('Erro ao ler cache do sessionStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
  
  /**
   * Armazena dados no cache no sessionStorage
   */
  private setInSessionStorage<T>(
    key: string,
    data: T,
    ttlMinutes: number = 30,
    relatedKeys?: string[]
  ): void {
    if (typeof window === 'undefined') return;
    
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const entry: CacheEntry<T> = {
        data,
        expiresAt,
        createdAt: new Date(),
        relatedKeys
      };
      
      sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
      this.registerKeyRelationships(key, relatedKeys);
    } catch (error) {
      logger.error('Erro ao salvar cache no sessionStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  /**
   * Obtém dados do cache no Supabase
   */
  async getFromSupabase<T>(usuarioId: string, key: string): Promise<T | null> {
    try {
      // Só executar no lado do cliente
      if (typeof window === 'undefined') {
        return null;
      }
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_performance_cache')
        .select('cache_data, expires_at, related_keys')
        .eq('usuario_id', usuarioId)
        .eq('cache_key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Verificar se o cache expirou
      if (new Date(data.expires_at) < new Date()) {
        await this.deleteFromSupabase(usuarioId, key);
        return null;
      }
      
      // Registrar relações entre chaves
      if (data.related_keys) {
        this.registerKeyRelationships(key, data.related_keys);
      }

      return data.cache_data as T;
    } catch (error) {
      logger.error('Erro ao buscar cache do Supabase:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Armazena dados no cache no Supabase
   */
  async setInSupabase<T>(
    usuarioId: string,
    key: string,
    data: T,
    ttlMinutes: number = 30,
    relatedKeys?: string[]
  ): Promise<void> {
    try {
      // Só executar no lado do cliente
      if (typeof window === 'undefined') {
        return;
      }
      
      const supabase = createClient();
      const expiresAt = new Date(
        Date.now() + ttlMinutes * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from('user_performance_cache')
        .upsert({
          usuario_id: usuarioId,
          cache_key: key,
          cache_data: data,
          expires_at: expiresAt,
          related_keys: relatedKeys,
          atualizado_em: new Date().toISOString(),
        });

      if (error) {
        logger.error('Erro ao salvar cache no Supabase:', {
          error: error.message,
          details: error,
        });
      }
      
      this.registerKeyRelationships(key, relatedKeys);
    } catch (error) {
      logger.error('Erro ao salvar cache no Supabase:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Remove dados do cache no Supabase
   */
  async deleteFromSupabase(usuarioId: string, key: string): Promise<void> {
    try {
      // Só executar no lado do cliente
      if (typeof window === 'undefined') {
        return;
      }
      
      const supabase = createClient();
      const { error } = await supabase
        .from('user_performance_cache')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('cache_key', key);

      if (error) {
        logger.error('Erro ao deletar cache do Supabase:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao deletar cache do Supabase:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Limpa todo o cache de um usuário no Supabase
   */
  async clearUserSupabaseCache(usuarioId: string): Promise<void> {
    try {
      // Só executar no lado do cliente
      if (typeof window === 'undefined') {
        return;
      }
      
      const supabase = createClient();
      const { error } = await supabase
        .from('user_performance_cache')
        .delete()
        .eq('usuario_id', usuarioId);

      if (error) {
        logger.error('Erro ao limpar cache do usuário no Supabase:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao limpar cache do usuário no Supabase:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Limpa cache expirado no Supabase
   */
  async clearExpiredSupabaseCache(): Promise<void> {
    try {
      // Só executar no lado do cliente
      if (typeof window === 'undefined') {
        return;
      }
      
      const supabase = createClient();
      const { error } = await supabase
        .from('user_performance_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Erro ao limpar cache expirado no Supabase:', {
          error: error.message,
          details: error,
        });
      }
    } catch (error) {
      logger.error('Erro ao limpar cache expirado no Supabase:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  /**
   * Obtém dados do cache
   */
  async get<T>(key: string, options: CacheOptions & { usuarioId?: string } = {}): Promise<T | null> {
    const { type = CacheType.MEMORY, usuarioId } = options;
    
    switch (type) {
      case CacheType.MEMORY:
        return this.getFromMemory<T>(key);
      
      case CacheType.LOCAL_STORAGE:
        return this.getFromLocalStorage<T>(key);
      
      case CacheType.SESSION_STORAGE:
        return this.getFromSessionStorage<T>(key);
      
      case CacheType.SUPABASE:
        if (!usuarioId) {
          logger.error('usuarioId é obrigatório para cache no Supabase');
          return null;
        }
        return this.getFromSupabase<T>(usuarioId, key);
      
      default:
        return null;
    }
  }
  
  /**
   * Armazena dados no cache
   */
  async set<T>(key: string, data: T, options: CacheOptions & { usuarioId?: string } = {}): Promise<void> {
    const {
      type = CacheType.MEMORY,
      ttlMinutes = 5,
      relatedKeys,
      usuarioId
    } = options;
    
    switch (type) {
      case CacheType.MEMORY:
        this.setInMemory<T>(key, data, ttlMinutes, relatedKeys);
        break;
      
      case CacheType.LOCAL_STORAGE:
        this.setInLocalStorage<T>(key, data, ttlMinutes, relatedKeys);
        break;
      
      case CacheType.SESSION_STORAGE:
        this.setInSessionStorage<T>(key, data, ttlMinutes, relatedKeys);
        break;
      
      case CacheType.SUPABASE:
        if (!usuarioId) {
          logger.error('usuarioId é obrigatório para cache no Supabase');
          return;
        }
        await this.setInSupabase<T>(usuarioId, key, data, ttlMinutes, relatedKeys);
        break;
    }
    
    // Atualizar cache do React Query também
    queryClient.setQueryData(key.split(':'), data);
  }
  
  /**
   * Remove dados do cache
   */
  async delete(key: string, options: CacheOptions & { usuarioId?: string } = {}): Promise<void> {
    const { type = CacheType.MEMORY, usuarioId } = options;
    
    switch (type) {
      case CacheType.MEMORY:
        this.memoryCache.delete(key);
        break;
      
      case CacheType.LOCAL_STORAGE:
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cache:${key}`);
        }
        break;
      
      case CacheType.SESSION_STORAGE:
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`cache:${key}`);
        }
        break;
      
      case CacheType.SUPABASE:
        if (!usuarioId) {
          logger.error('usuarioId é obrigatório para cache no Supabase');
          return;
        }
        await this.deleteFromSupabase(usuarioId, key);
        break;
    }
    
    // Invalidar no React Query
    queryClient.invalidateQueries({ queryKey: key.split(':') });
  }
  
  /**
   * Invalida uma chave de cache e suas relacionadas
   */
  async invalidate(key: string, options: CacheOptions & { usuarioId?: string } = {}): Promise<void> {
    const { type = CacheType.MEMORY, usuarioId } = options;
    
    // Obter todas as chaves relacionadas
    const allRelatedKeys = Array.from(this.getAllRelatedKeys(key));
    
    // Invalidar cada chave
    for (const relatedKey of allRelatedKeys) {
      switch (type) {
        case CacheType.MEMORY:
          this.memoryCache.delete(relatedKey);
          break;
        
        case CacheType.LOCAL_STORAGE:
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`cache:${relatedKey}`);
          }
          break;
        
        case CacheType.SESSION_STORAGE:
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`cache:${relatedKey}`);
          }
          break;
        
        case CacheType.SUPABASE:
          if (!usuarioId) {
            logger.error('usuarioId é obrigatório para cache no Supabase');
            continue;
          }
          await this.deleteFromSupabase(usuarioId, relatedKey);
          break;
      }
      
      // Adicionar à lista de invalidações pendentes
      this.pendingInvalidations.add(relatedKey);
    }
    
    // Agendar invalidação em lote
    this.scheduleBatchInvalidation();
  }
  
  /**
   * Limpa todo o cache
   */
  async clear(options: { type?: CacheType; usuarioId?: string } = {}): Promise<void> {
    const { type = CacheType.MEMORY, usuarioId } = options;
    
    switch (type) {
      case CacheType.MEMORY:
        this.memoryCache.clear();
        break;
      
      case CacheType.LOCAL_STORAGE:
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache:')) {
              localStorage.removeItem(key);
            }
          });
        }
        break;
      
      case CacheType.SESSION_STORAGE:
        if (typeof window !== 'undefined') {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('cache:')) {
              sessionStorage.removeItem(key);
            }
          });
        }
        break;
      
      case CacheType.SUPABASE:
        if (!usuarioId) {
          logger.error('usuarioId é obrigatório para limpar cache no Supabase');
          return;
        }
        await this.clearUserSupabaseCache(usuarioId);
        break;
    }
    
    // Invalidar todas as queries
    queryClient.invalidateQueries();
  }
  
  /**
   * Atualiza dados no cache de forma otimista
   */
  async optimisticUpdate<T>(
    key: string,
    updateFn: (oldData: T | null) => T,
    options: CacheOptions & { usuarioId?: string } = {}
  ): Promise<T> {
    
    // Obter dados atuais
    const oldData = await this.get<T>(key, options);
    
    // Aplicar atualização
    const newData = updateFn(oldData);
    
    // Salvar no cache
    await this.set(key, newData, options);
    
    return newData;
  }
}

// Instância global do gerenciador de cache
export const cacheManager = CacheManager.getInstance();

/**
 * Funções utilitárias para cache
 */
export const cacheUtils = {
  /**
   * Gera chave de cache para dados de desempenho
   */
  generatePerformanceKey(
    usuarioId: string,
    type: string,
    period?: string
  ): string {
    return `performance:${usuarioId}:${type}${period ? `:${period}` : ''}`;
  },

  /**
   * Gera chave de cache para estatísticas por disciplina
   */
  generateDisciplinaStatsKey(
    usuarioId: string,
    disciplina?: string
  ): string {
    return `disciplina:stats:${usuarioId}${disciplina ? `:${disciplina}` : ''}`;
  },

  /**
   * Gera chave de cache para atividades recentes
   */
  generateRecentActivityKey(usuarioId: string): string {
    return `activity:recent:${usuarioId}`;
  },
  
  /**
   * Gera chave de cache para entidade
   */
  generateEntityKey(
    entityType: string,
    id: string
  ): string {
    return `entity:${entityType}:${id}`;
  },
  
  /**
   * Gera chave de cache para lista de entidades
   */
  generateEntityListKey(
    entityType: string,
    filters?: Record<string, unknown>
  ): string {
    let key = `entity:${entityType}:list`;
    
    if (filters && Object.keys(filters).length > 0) {
      const filterString = Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${String(value)}`)
        .sort()
        .join('&');
      
      if (filterString) {
        key += `:${filterString}`;
      }
    }
    
    return key;
  }
};