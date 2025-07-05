import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger';
import { errorHandler, DatabaseError } from '../error-handler';
import { BaseEntity, ApiResponse, PaginatedResponse } from '../../types';

export abstract class BaseRepository<T extends BaseEntity> {
  protected client: SupabaseClient;
  protected tableName: string;

  constructor(tableName: string) {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.tableName = tableName;
  }

  protected async executeQuery<R>(
    queryFn: () => Promise<{ data: R | null; error: unknown }>
  ): Promise<ApiResponse<R>> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        logger.error('Database query error', { error, table: this.tableName });
        throw new DatabaseError('Database operation failed', error);
      }

      return { data: data || undefined };
    } catch (error) {
      const appError = errorHandler.handleError(
        error,
        `BaseRepository.${this.tableName}`
      );
      return { error: appError.message };
    }
  }

  public async findById(id: string): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      return result;
    });
  }

  public async findAll(
    limit?: number,
    offset?: number
  ): Promise<PaginatedResponse<T>> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    return this.executeQuery(async () => {
      const result = await query;
      return result;
    });
  }

  public async create(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      const result = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
      return result;
    });
  }

  public async update(
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at'>>
  ): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      const result = await this.client
        .from(this.tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return result;
    });
  }

  public async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.executeQuery(async () => {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      return { data: !error, error };
    });
  }

  public async findByField(
    field: keyof T,
    value: unknown
  ): Promise<ApiResponse<T[]>> {
    return this.executeQuery(async () => {
      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq(field as string, value);
      return result;
    });
  }

  public async findOneByField(
    field: keyof T,
    value: unknown
  ): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      const result = await this.client
        .from(this.tableName)
        .select('*')
        .eq(field as string, value)
        .single();
      return result;
    });
  }
}
