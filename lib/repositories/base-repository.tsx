import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger';
import { errorHandler, DatabaseError } from '../error-handler';
// Tipos básicos para o repositório
interface BaseEntity {
  id: string;
  criado_em?: string;
  atualizado_em?: string;
}

interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}
export abstract class BaseRepository<T extends BaseEntity> {
	protected client: SupabaseClient | null;
  protected tablenome: string;

	constructor(tablenome: string) {
		this.tablenome = tablenome;
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		this.client = url && key ? createClient(url, key) : null;
	}

	protected getClient(): SupabaseClient {
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		if (!this.client) {
			if (!url || !key) {
				throw new DatabaseError('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
			}
			this.client = createClient(url, key);
		}
		return this.client;
	}

  protected async executeQuery<R>(
    queryFn: () => Promise<{ data: R | null; error: unknown }>
  ): Promise<ApiResponse<R>> {
    try {
		const { data, error } = await queryFn();

      if (error) {
        logger.error('Database query error', { error, table: this.tablenome });
        throw new DatabaseError('Database operation failed', error);
      }

      return { data: data || undefined };
    } catch (error) {
      const appError = errorHandler.handleError(
        error,
        `BaseRepository.${this.tablenome}`
      );
      return { error: appError.message };
    }
  }

  public async findById(id: string): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
		const result = await this.getClient()
        .from(this.tablenome)
        .select('*')
        .eq('id', id)
        .single();
      return result;
    });
  }

  public async findAll(
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<T[]>> {
		let query = this.getClient()
      .from(this.tablenome)
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
    data: Omit<T, 'id' | 'criado_em' | 'atualizado_em'>
  ): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
		const result = await this.getClient()
        .from(this.tablenome)
        .insert(data)
        .select()
        .single();
      return result;
    });
  }

  public async update(
    id: string,
    data: Partial<Omit<T, 'id' | 'criado_em'>>
  ): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
		const result = await this.getClient()
        .from(this.tablenome)
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return result;
    });
  }

  public async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.executeQuery(async () => {
		const { error } = await this.getClient()
        .from(this.tablenome)
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
		const result = await this.getClient()
        .from(this.tablenome)
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
		const result = await this.getClient()
        .from(this.tablenome)
        .select('*')
        .eq(field as string, value)
        .single();
      return result;
    });
  }
}
