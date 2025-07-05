import { logger } from '@/lib/logger';

/**
 * Utilitário para padronizar tratamento de erro em services.
 * Exemplo de uso:
 *   return withServiceErrorHandling(async () => await repository.findAll(...));
 */
export async function withServiceErrorHandling<T>(fn: () => Promise<T>): Promise<{ success: boolean; data: T | null; error?: string }> {
  try {
    const data = await fn();
    return { success: true, data, error: undefined };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Service error', { error });
    return { success: false, data: null, error: errorMsg };
  }
} 