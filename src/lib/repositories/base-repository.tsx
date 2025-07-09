/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/supabase.types';

type TableName = keyof Database['public']['Tables'] & string;

export abstract class BaseRepository<T extends TableName> {
  protected tableName: T;
  protected client = supabase;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  // Basic CRUD operations
  async findById(id: string): Promise<Tables<T> | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id as any)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Nenhum registro encontrado
        return null;
      }
      throw error;
    }
    return data as Tables<T>;
  }

  async findAll(
    filters?: Partial<Tables<T>>
  ): Promise<Tables<T>[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    if (filters) {
      query = query.match(filters);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data as Tables<T>[];
  }

  async create(
    data: TablesInsert<T>
  ): Promise<Tables<T>> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return result as Tables<T>;
  }

  async update(
    id: string, 
    data: Partial<TablesUpdate<T>>
  ): Promise<Tables<T>> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id as any)
      .select()
      .single();

    if (error) throw error;
    return result as Tables<T>;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id as any);

    if (error) throw error;
    return true;
  }

  // Soft delete implementation
  async softDelete(id: string): Promise<Tables<T>> {
    return this.update(id, {
      deleted_at: new Date().toISOString(),
    } as any);
  }

  // Pagination support
  async paginate(
    page: number = 1,
    pageSize: number = 10,
    filters?: Partial<Tables<T>>
  ): Promise<{
    data: Tables<T>[];
    count: number | null;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (filters) {
      query = query.match(filters);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return {
      data: data as Tables<T>[],
      count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}

