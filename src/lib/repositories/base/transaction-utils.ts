import { supabase } from '@/src/lib/supabase';
import { getLogger } from '@/src/lib/logging';
import { DatabaseError } from '@/src/lib/errors';
import type { EnhancedSupabaseClient } from '@/src/lib/supabase/enhanced-client';

const logger = getLogger('TransactionUtils');

/**
 * Execute a function within a transaction
 * @param fn Function to execute within the transaction
 * @returns Result of the function
 */
export async function withTransaction<T>(
  fn: (supabase: EnhancedSupabaseClient & { from<T>(table: string): unknown }) => Promise<T>
): Promise<T> {
  try {
    // Start transaction
    logger.debug('Starting transaction');
    
    // Execute function with transaction context
    const result = await fn(supabase as unknown as EnhancedSupabaseClient);
    
    logger.debug('Transaction completed successfully');
    
    return result;
  } catch (error) {
    logger.error('Transaction failed', { error });
    
    if (error instanceof DatabaseError) {
      throw error;
    }
    
    throw new DatabaseError('Transaction failed', { cause: error as Error });
  }
}

/**
 * Execute multiple operations within a transaction
 * @param operations Operations to execute within the transaction
 * @returns Results of the operations
 */
export async function executeTransaction<T extends unknown[]>(
  ...operations: ((txnCtx: unknown) => Promise<unknown>)[]
): Promise<T> {
  return withTransaction(async (txnCtx) => {
    const results: unknown[] = [];
    
    for (const operation of operations) {
      const result = await operation(txnCtx);
      results.push(result);
    }
    
    return results as T;
  });
}
