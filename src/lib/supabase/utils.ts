import { type PostgrestError } from '@supabase/supabase-js';
import { type Database } from '@/types/supabase.types';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = PostgrestError;

export async function safeQuery<T extends (...args: any) => any>(
  queryFn: T
): Promise<{ data: DbResultOk<ReturnType<T>> | null; error: DbResultErr | null }> {
  try {
    const { data, error } = await queryFn();
    return { data, error };
  } catch (error) {
    console.error('Database query error:', error);
    return { data: null, error: error as DbResultErr };
  }
}

// Helper function to handle common CRUD operations
export const db = {
  async find<T extends TableName>(
    table: T,
    query: Partial<Tables[T]['Row']> = {},
    columns = '*'
  ) {
    let queryBuilder = supabase.from(table).select(columns);
    
    // Apply filters if provided
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        queryBuilder = queryBuilder.eq(key, value);
      }
    });

    return safeQuery(() => queryBuilder);
  },

  async findById<T extends TableName>(table: T, id: string) {
    return safeQuery(() => supabase.from(table).select('*').eq('id', id).single());
  },

  async create<T extends TableName>(
    table: T,
    data: Omit<Tables[T]['Insert'], 'id' | 'created_at' | 'updated_at'>
  ) {
    return safeQuery(() => 
      supabase
        .from(table)
        .insert([data])
        .select()
        .single()
    );
  },

  async update<T extends TableName>(
    table: T,
    id: string,
    data: Partial<Tables[T]['Update']>
  ) {
    return safeQuery(() =>
      supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  },

  async delete<T extends TableName>(table: T, id: string) {
    return safeQuery(() =>
      supabase
        .from(table)
        .delete()
        .eq('id', id)
    );
  },
};

// Re-export the supabase client with proper typing
import { supabase } from './client';

export { supabase };
