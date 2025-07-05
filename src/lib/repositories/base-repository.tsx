import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type TableName = keyof Database['public']['Tables'] & string;

export abstract class BaseRepository<T extends TableName> {
  protected tableName: T;
  protected client = supabase;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  // Basic CRUD operations
  async findById(id: string | number): Promise<Database['public']['Tables'][T]['Row'] | null> {
    const { data, error } = await this.client
      .from(this.tableName as string)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Nenhum registro encontrado
        return null;
      }
      throw error;
    }
    return data as Database['public']['Tables'][T]['Row'];
  }

  async findAll(
    filters?: Partial<Database['public']['Tables'][T]['Row']>
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    let query = this.client
      .from(this.tableName as string)
      .select('*');

    if (filters) {
      query = query.match(filters);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data as Database['public']['Tables'][T]['Row'][];
  }

  async create(
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const { data: result, error } = await this.client
      .from(this.tableName as string)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result as Database['public']['Tables'][T]['Row'];
  }

  async update(
    id: string | number, 
    data: Partial<Database['public']['Tables'][T]['Update']>
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const { data: result, error } = await this.client
      .from(this.tableName as string)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as Database['public']['Tables'][T]['Row'];
  }

  async delete(id: string | number): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName as string)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Soft delete implementation
  async softDelete(id: string | number): Promise<Database['public']['Tables'][T]['Row']> {
    return this.update(id, {
      deleted_at: new Date().toISOString(),
    } as unknown as Partial<Database['public']['Tables'][T]['Update']>);
  }

  // Pagination support
  async paginate(
    page: number = 1,
    pageSize: number = 10,
    filters?: Partial<Database['public']['Tables'][T]['Row']>
  ): Promise<{
    data: Database['public']['Tables'][T]['Row'][];
    count: number | null;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from(this.tableName as string)
      .select('*', { count: 'exact' });

    if (filters) {
      query = query.match(filters);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      data: data as Database['public']['Tables'][T]['Row'][],
      count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}
