import { createServerSupabaseClient } from './supabase';
import { logger } from '@/lib/logger';
import { getAuditLogger } from './audit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';

export class OwnershipValidator {
  private static instance: OwnershipValidator;
  private supabase: SupabaseClient<Database>;
  private auditLogger: ReturnType<typeof getAuditLogger>;

  private constructor() {
    this.supabase = createServerSupabaseClient();
    this.auditLogger = getAuditLogger(this.supabase);
  }

  public static getInstance(): OwnershipValidator {
    if (!OwnershipValidator.instance) {
      OwnershipValidator.instance = new OwnershipValidator();
    }
    return OwnershipValidator.instance;
  }

  /**
   * Verifica se um usuário é o proprietário de um recurso
   */
  async validateOwnership(
    userId: string,
    tableName: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select(resourceUserIdField)
        .eq('id', recordId)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        return false;
      }

      const isOwner = data[resourceUserIdField as keyof typeof data] === userId;

      // Registrar tentativa de acesso
      if (!isOwner) {
        await this.auditLogger.log({
          userId,
          action: 'ACCESS',
          tableName,
          recordId,
          newValues: { unauthorized_access: true },
        });
      }

      return isOwner;
    } catch (error) {
      logger.error('Erro ao validar propriedade:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Verifica se um usuário pode acessar um recurso público
   */
  async validatePublicAccess(
    tableName: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('is_public')
        .eq('id', recordId)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        return false;
      }

      return data.is_public === true;
    } catch (error) {
      logger.error('Erro ao validar acesso público:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Verifica se um usuário pode acessar um recurso (próprio ou público)
   */
  async validateAccess(
    userId: string,
    tableName: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    // Primeiro verifica se é proprietário
    const isOwner = await this.validateOwnership(
      userId,
      tableName,
      recordId,
      resourceUserIdField
    );
    if (isOwner) {
      return true;
    }

    // Se não é proprietário, verifica se é público
    return await this.validatePublicAccess(tableName, recordId);
  }

  /**
   * Filtra recursos por propriedade do usuário
   */
  async filterByOwnership(
    userId: string,
    tableName: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq(resourceUserIdField, userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao filtrar por propriedade:', {
          error: error.message,
          details: error,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao filtrar por propriedade:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Filtra recursos por propriedade ou acesso público
   */
  async filterByAccess(
    userId: string,
    tableName: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .or(`${resourceUserIdField}.eq.${userId},is_public.eq.true`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao filtrar por acesso:', {
          error: error.message,
          details: error,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao filtrar por acesso:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Verifica se um usuário pode criar recursos em nome de outro usuário (admin)
   */
  async validateAdminAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === 'admin';
    } catch (error) {
      logger.error('Erro ao validar acesso de admin:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Verifica se um usuário pode modificar um recurso
   */
  async validateModificationAccess(
    userId: string,
    tableName: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    // Apenas proprietários podem modificar recursos
    return await this.validateOwnership(
      userId,
      tableName,
      recordId,
      resourceUserIdField
    );
  }

  /**
   * Verifica se um usuário pode excluir um recurso
   */
  async validateDeletionAccess(
    userId: string,
    tableName: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    // Apenas proprietários podem excluir recursos
    return await this.validateOwnership(
      userId,
      tableName,
      recordId,
      resourceUserIdField
    );
  }

  /**
   * Obtém recursos compartilhados com um usuário
   */
  async getSharedResources(
    userId: string,
    tableName: string
  ): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('is_public', true)
        .neq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar recursos compartilhados:', {
          error: error.message,
          details: error,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar recursos compartilhados:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Verifica permissões específicas para diferentes tipos de recursos
   */
  async validateResourceAccess(
    userId: string,
    resourceType: 'simulado' | 'questao' | 'apostila' | 'flashcard' | 'plano',
    recordId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    const tableMap = {
      simulado: 'simulados',
      questao: 'questoes_semanais',
      apostila: 'apostilas',
      flashcard: 'flashcards',
      plano: 'planos_estudo',
    };

    const tableName = tableMap[resourceType];
    if (!tableName) {
      return false;
    }

    switch (action) {
      case 'read':
        return await this.validateAccess(userId, tableName, recordId);
      case 'write':
        return await this.validateModificationAccess(
          userId,
          tableName,
          recordId
        );
      case 'delete':
        return await this.validateDeletionAccess(userId, tableName, recordId);
      default:
        return false;
    }
  }
}

// Função utilitária para obter instância do validador
export const getOwnershipValidator = () => OwnershipValidator.getInstance();

// Middleware de validação para uso em Server Actions
export async function withOwnershipValidation<T>(
  userId: string,
  tableName: string,
  recordId: string,
  action: () => Promise<T>,
  resourceUserIdField: string = 'user_id'
): Promise<T | null> {
  const validator = getOwnershipValidator();

  if (
    !(await validator.validateOwnership(
      userId,
      tableName,
      recordId,
      resourceUserIdField
    ))
  ) {
    throw new Error(
      'Acesso negado: você não tem permissão para acessar este recurso'
    );
  }

  return await action();
}

// Middleware de validação para criação de recursos
export async function withCreationValidation<T>(
  userId: string,
  action: () => Promise<T>
): Promise<T> {
  // Para criação, apenas verificar se o usuário está autenticado
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }

  return await action();
}
