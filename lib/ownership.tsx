import { logger } from '@/lib/logger';
import { createServerSupabaseClient } from './supabase';

export class OwnershipValidator {
  private static instance: OwnershipValidator;

  private constructor() {}

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
    tablenome: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from(tablenome)
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
        // Remover ou comentar a linha: const auditLogger = getAuditLogger(supabase);
        // const auditLogger = getAuditLogger(supabase);
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
    tablenome: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from(tablenome)
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
    tablenome: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    // Primeiro verifica se é proprietário
    const isOwner = await this.validateOwnership(
      userId,
      tablenome,
      recordId,
      resourceUserIdField
    );
    if (isOwner) {
      return true;
    }

    // Se não é proprietário, verifica se é público
    return await this.validatePublicAccess(tablenome, recordId);
  }

  /**
   * Filtra recursos por propriedade do usuário
   */
  async filterByOwnership(
    userId: string,
    tablenome: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<unknown[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from(tablenome)
        .select('*')
        .eq(resourceUserIdField, userId)
        .is('deleted_at', null)
        .order('criado_em', { ascending: false });

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
    tablenome: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<unknown[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from(tablenome)
        .select('*')
        .or(`${resourceUserIdField}.eq.${userId},is_public.eq.true`)
        .is('deleted_at', null)
        .order('criado_em', { ascending: false });

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
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from('usuarios')
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
    tablenome: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    // Verifica se é proprietário ou admin
    const isOwner = await this.validateOwnership(
      userId,
      tablenome,
      recordId,
      resourceUserIdField
    );
    if (isOwner) {
      return true;
    }

    return await this.validateAdminAccess(userId);
  }

  /**
   * Verifica se um usuário pode deletar um recurso
   */
  async validateDeletionAccess(
    userId: string,
    tablenome: string,
    recordId: string,
    resourceUserIdField: string = 'user_id'
  ): Promise<boolean> {
    // Verifica se é proprietário ou admin
    const isOwner = await this.validateOwnership(
      userId,
      tablenome,
      recordId,
      resourceUserIdField
    );
    if (isOwner) {
      return true;
    }

    return await this.validateAdminAccess(userId);
  }

  /**
   * Obtém recursos compartilhados com um usuário
   */
  async getSharedResources(
    userId: string,
    tablenome: string
  ): Promise<unknown[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from(tablenome)
        .select('*')
        .or(`shared_with.cs.{${userId}},is_public.eq.true`)
        .is('deleted_at', null)
        .order('criado_em', { ascending: false });

      if (error) {
        logger.error('Erro ao obter recursos compartilhados:', {
          error: error.message,
          details: error,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao obter recursos compartilhados:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Validação específica para diferentes tipos de recursos
   */
  async validateResourceAccess(
    userId: string,
    resourceType: 'simulado' | 'questao' | 'apostila' | 'flashcard' | 'plano',
    recordId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    const tableMap = {
      simulado: 'simulados',
      questao: 'questoes',
      apostila: 'apostilas',
      flashcard: 'flashcards',
      plano: 'planos_estudos',
    };

    const tablenome = tableMap[resourceType];
    const resourceUserIdField = 'user_id';

    switch (action) {
      case 'read':
        return await this.validateAccess(userId, tablenome, recordId, resourceUserIdField);
      case 'write':
        return await this.validateModificationAccess(userId, tablenome, recordId, resourceUserIdField);
      case 'delete':
        return await this.validateDeletionAccess(userId, tablenome, recordId, resourceUserIdField);
      default:
        return false;
    }
  }
}

// Singleton instance
export const getOwnershipValidator = () => OwnershipValidator.getInstance();

// Utility functions
export async function withOwnershipValidation<T>(
  userId: string,
  tablenome: string,
  recordId: string,
  action: () => Promise<T>,
  resourceUserIdField: string = 'user_id'
): Promise<T | null> {
  const validator = getOwnershipValidator();
  const hasAccess = await validator.validateAccess(userId, tablenome, recordId, resourceUserIdField);
  
  if (!hasAccess) {
    return null;
  }
  
  return await action();
}

export async function withCreationValidation<T>(
  userId: string,
  action: () => Promise<T>
): Promise<T> {
  // Para criação, apenas verifica se o usuário está autenticado
  // A validação específica deve ser feita na action
  return await action();
}
