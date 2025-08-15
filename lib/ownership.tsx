import { logger } from '@/lib/logger';
import { createServerSupabaseClient } from './supabase';

type Resource = 'apostila' | 'simulado' | 'plano-estudo' | 'recurso-geral' | 'simulados' | 'planos_estudos';

/**
 * Define o campo de ID de usuário padrão para 'usuario_id'.
 * Centraliza a referência à coluna de usuário para facilitar futuras manutenções.
 */
const DEFAULT_usuario_id_FIELD = 'usuario_id';

/**
 * Verifica se um usuário é o proprietário de um recurso específico.
 *
 * @param resource - O nome do recurso (tabela) a ser verificado.
 * @param resourceId - O ID do recurso.
 * @param usuarioId - O ID do usuário a ser verificado.
 * @param resourceUserIdField - O nome da coluna que armazena o ID do usuário na tabela do recurso.
 * @returns True se o usuário for o proprietário, caso contrário, false.
 */
export async function checkOwnership(
  resource: Resource,
  resourceId: string,
  usuarioId: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<boolean> {
  if (!resourceId || !usuarioId) {
    console.warn('checkOwnership: ID do recurso ou do usuário não fornecido.');
    return false;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from(resource)
      .select(resourceUserIdField)
      .eq('id', resourceId)
      .single();

    if (error || !data) {
      return false;
    }

    const isOwner = data[resourceUserIdField as keyof typeof data] === usuarioId;

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
 * Verifica se um usuário é proprietário de um simulado.
 *
 * @param simuladoId - O ID do simulado.
 * @param usuarioId - O ID do usuário.
 * @returns Verdadeiro se o usuário for o proprietário, caso contrário, falso.
 */
export async function isSimuladoOwner(simuladoId: string, usuarioId: string): Promise<boolean> {
  return checkOwnership('simulados', simuladoId, usuarioId, 'usuario_id');
}

/**
 * Verifica se um usuário é o proprietário de um plano de estudos.
 * @param planoEstudoId - O ID do plano de estudos.
 * @param usuarioId - O ID do usuário.
 * @returns Verdadeiro se o usuário for o proprietário, caso contrário, falso.
 */
export async function isPlanoEstudoOwner(planoEstudoId: string, usuarioId: string): Promise<boolean> {
  return checkOwnership('planos_estudos', planoEstudoId, usuarioId, 'usuario_id');
}

/**
 * Função de fábrica para criar verificadores de propriedade genéricos.
 *
 * @param resource - O tipo de recurso (tabela).
 * @param resourceUserIdField - O campo que armazena o ID do usuário no recurso.
 * @returns Uma função que verifica a propriedade para o recurso especificado.
 */
const createOwnershipChecker =
  (resource: Resource, resourceUserIdField: string = DEFAULT_usuario_id_FIELD) =>
  async (resourceId: string, usuarioId: string): Promise<boolean> => {
    return checkOwnership(resource, resourceId, usuarioId, resourceUserIdField);
  };

/**
 * Verifica se um usuário pode acessar um recurso genérico.
 * Este é um exemplo e pode ser adaptado para tabelas que não se encaixam
 * nos modelos de apostila, simulado ou plano de estudo.
 *
 * @param resourceId - O ID do recurso genérico.
 * @param usuarioId - O ID do usuário.
 * @returns Verdadeiro se o usuário for o proprietário, caso contrário, falso.
 */
export const canAccessGeneralResource = createOwnershipChecker('recurso-geral', 'usuario_id');

/**
 * Verifica se um usuário pode acessar um recurso público
 */
export async function validatePublicAccess(
  tablenome: string,
  recordId: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from(tablenome)
      .select('publico')
      .eq('id', recordId)
      .single();

    if (error || !data) {
      return false;
    }

    return (data as any).publico === true;
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
export async function validateAccess(
  usuarioId: string,
  tablenome: string,
  recordId: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<boolean> {
  // Primeiro verifica se é proprietário
  const isOwner = await checkOwnership(
    'recurso-geral', // Assuming 'recurso-geral' is the generic resource type
    recordId,
    usuarioId,
    resourceUserIdField
  );
  if (isOwner) {
    return true;
  }

  // Se não é proprietário, verifica se é público
  return await validatePublicAccess(tablenome, recordId);
}

/**
 * Filtra recursos por propriedade do usuário
 */
export async function filterByOwnership(
  usuarioId: string,
  tablenome: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<unknown[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from(tablenome)
      .select('*')
      .eq(resourceUserIdField, usuarioId)
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
export async function filterByAccess(
  usuarioId: string,
  tablenome: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<unknown[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from(tablenome)
      .select('*')
      .or(`${resourceUserIdField}.eq.${usuarioId},publico.eq.true`)
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
export async function validateAdminAccess(usuarioId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', usuarioId)
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
export async function validateModificationAccess(
  usuarioId: string,
  tablenome: string,
  recordId: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<boolean> {
  // Verifica se é proprietário ou admin
  const isOwner = await checkOwnership(
    'recurso-geral', // Assuming 'recurso-geral' is the generic resource type
    recordId,
    usuarioId,
    resourceUserIdField
  );
  if (isOwner) {
    return true;
  }

  return await validateAdminAccess(usuarioId);
}

/**
 * Verifica se um usuário pode deletar um recurso
 */
export async function validateDeletionAccess(
  usuarioId: string,
  tablenome: string,
  recordId: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<boolean> {
  // Verifica se é proprietário ou admin
  const isOwner = await checkOwnership(
    'recurso-geral', // Assuming 'recurso-geral' is the generic resource type
    recordId,
    usuarioId,
    resourceUserIdField
  );
  if (isOwner) {
    return true;
  }

  return await validateAdminAccess(usuarioId);
}

/**
 * Obtém recursos compartilhados com um usuário
 */
export async function getSharedResources(
  usuarioId: string,
  tablenome: string
): Promise<unknown[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from(tablenome)
      .select('*')
      .or(`shared_with.cs.{${usuarioId}},publico.eq.true`)
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
export async function validateResourceAccess(
  usuarioId: string,
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
  const resourceUserIdField = DEFAULT_usuario_id_FIELD;

  switch (action) {
    case 'read':
      return await validateAccess(usuarioId, tablenome, recordId, resourceUserIdField);
    case 'write':
      return await validateModificationAccess(usuarioId, tablenome, recordId, resourceUserIdField);
    case 'delete':
      return await validateDeletionAccess(usuarioId, tablenome, recordId, resourceUserIdField);
    default:
      return false;
  }
}

/**
 * Validador de propriedade de alto nível para uso em APIs ou middlewares.
 *
 * @param resource - O tipo de recurso.
 * @param resourceId - O ID do recurso.
 * @param usuarioId - O ID do usuário.
 * @param resourceUserIdField - O campo de ID do usuário no recurso.
 * @returns Retorna true se a propriedade for verificada.
 * @throws Lança um erro se a propriedade não puder ser verificada.
 */
export async function validateOwnership(
  resource: Resource,
  resourceId: string,
  usuarioId: string,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<boolean> {
  const isOwner = await checkOwnership(
    resource,
    resourceId,
    usuarioId,
    resourceUserIdField
  );
  if (!isOwner) {
    throw new Error(`Usuário com ID ${usuarioId} não é o proprietário do recurso com ID ${resourceId} do tipo ${resource}.`);
  }
  return isOwner;
}

// Utility functions
export async function withOwnershipValidation<T>(
  usuarioId: string,
  tablenome: string,
  recordId: string,
  action: () => Promise<T>,
  resourceUserIdField: string = DEFAULT_usuario_id_FIELD
): Promise<T | null> {
  const hasAccess = await validateAccess(usuarioId, tablenome, recordId, resourceUserIdField);
  
  if (!hasAccess) {
    return null;
  }
  
  return await action();
}

export async function withCreationValidation<T>(
  usuarioId: string,
  action: () => Promise<T>
): Promise<T> {
  // Para criação, apenas verifica se o usuário está autenticado
  // A validação específica deve ser feita na action
  return await action();
}
