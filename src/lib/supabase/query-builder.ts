import { Database } from '@/types/supabase.types';
import { SupabaseClient } from '@supabase/supabase-js';
import type {
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
  PostgrestSingleResponse,
} from '@supabase/postgrest-js';
import { supabase } from './client';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

export class TypedQueryBuilder<T extends TableName> {
  constructor(
    private readonly tableName: T,
    private readonly supabaseClient: SupabaseClient<Database> = supabase
  ) {}

  // Get a query builder for the table
  get query() {
    return this.supabaseClient.from(this.tableName);
  }

  // Helper methods for common operations
  async findById(id: string): Promise<TableRow<T> | null> {
    const { data, error } = await this.query
      .select('*')
      .eq('id', id as string)
      .single();
    
    if (error) throw error;
    return data;
  }

  async findAll(): Promise<TableRow<T>[]> {
    const { data, error } = await this.query.select('*');
    if (error) throw error;
    return data || [];
  }

  async create(
    payload: TableInsert<T>
  ): Promise<PostgrestSingleResponse<TableRow<T>[]>> {
    const { data, error } = await this.query
      .insert(payload as any)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async update(
    id: string,
    payload: Partial<TableUpdate<T>>
  ): Promise<TableRow<T> | null> {
    const { data, error } = await this.query
      .update(payload as any)
      .eq('id', id as string)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.query
      .delete()
      .eq('id', id as string);
      
    if (error) throw error;
    return true;
  }

  // Advanced querying
  async findOneBy(
    column: keyof TableRow<T>,
    value: any
  ): Promise<TableRow<T> | null> {
    const { data, error } = await this.query
      .select('*')
      .eq(column as string, value)
      .single();
      
    if (error) return null;
    return data;
  }

  async findManyBy(
    column: keyof TableRow<T>,
    value: any
  ): Promise<TableRow<T>[]> {
    const { data, error } = await this.query
      .select('*')
      .eq(column as string, value);
      
    if (error) return [];
    return data || [];
  }
}

// Helper function to create a typed query builder
export function createQueryBuilder<T extends TableName>(
  tableName: T,
  client: SupabaseClient<Database> = supabase
): TypedQueryBuilder<T> {
  return new TypedQueryBuilder(tableName, client);
}

// Export types for external use
export type { TableName, TableRow, TableInsert, TableUpdate };

// Example usage:
// const userQuery = createQueryBuilder('users');
// const user = await userQuery.findById('user-id');
