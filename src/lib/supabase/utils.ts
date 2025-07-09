/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { Database, Tables } from '@/types/supabase.types'

// Generic utility functions for Supabase operations
export class SupabaseUtils {
  /**
   * Generic function to get a single record by ID
   */
  static async getById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<Tables<T> | null> {
    const { data, error } = await supabase
      .from(table as any)
      .select('*')
      .eq('id', id as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No record found
      }
      throw error
    }

    return data as Tables<T>
  }

  /**
   * Generic function to get all records from a table
   */
  static async getAll<T extends keyof Database['public']['Tables']>(
    table: T,
    options?: {
      orderBy?: string
      ascending?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<Tables<T>[]> {
    let query = supabase.from(table as any).select('*')

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Tables<T>[]
  }

  /**
   * Generic function to create a record
   */
  static async create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<Tables<T>> {
    const { data: result, error } = await supabase
      .from(table as any)
      .insert(data as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select()
      .single()

    if (error) throw error
    return result as Tables<T>
  }

  /**
   * Generic function to update a record
   */
  static async update<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    data: Database['public']['Tables'][T]['Update']
  ): Promise<Tables<T>> {
    const { data: result, error } = await supabase
      .from(table as any)
      .update(data as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .eq('id', id as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select()
      .single()

    if (error) throw error
    return result as Tables<T>
  }

  /**
   * Generic function to delete a record
   */
  static async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<void> {
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq('id', id as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    if (error) throw error
  }

  /**
   * Generic function to soft delete a record (set is_active to false)
   */
  static async softDelete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<Tables<T>> {
    // Não é possível acessar o schema do supabase-js, então assumimos que pode ter is_active
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      is_active: false,
    };
    const { data: result, error } = await supabase
      .from(table as any)
      .update(updateData as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .eq('id', id as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select()
      .single()

    if (error) throw error
    return result as Tables<T>
  }

  // Função auxiliar para aplicar filtros dinamicamente sem inferência profunda do TS
  private static applyFilters(query: any, filters?: Record<string, unknown>) {
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key as any, value as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
    return query;
  }

  /**
   * Generic function to count records
   */
  static async count<T extends keyof Database['public']['Tables']>(
    table: T,
    filters?: Record<string, unknown>
  ): Promise<number> {
    let query = supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true });

    query = SupabaseUtils.applyFilters(query, filters);

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  /**
   * Generic function for paginated queries
   */
  static async paginate<T extends keyof Database['public']['Tables']>(
    table: T,
    page: number = 1,
    pageSize: number = 10,
    options?: {
      orderBy?: string
      ascending?: boolean
      filters?: Record<string, unknown>
    }
  ): Promise<{
    data: Tables<T>[]
    count: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(table as any)
      .select('*', { count: 'exact' });

    query = SupabaseUtils.applyFilters(query, options?.filters);

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return {
      data: data as Tables<T>[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  /**
   * Function to check if a record exists
   */
  static async exists<T extends keyof Database['public']['Tables']>(
    table: T,
    filters: Record<string, unknown>
  ): Promise<boolean> {
    let query = supabase
      .from(table as any)
      .select('id', { count: 'exact', head: true });

    query = SupabaseUtils.applyFilters(query, filters);

    const { count, error } = await query;

    if (error) throw error;
    return (count || 0) > 0;
  }

  /**
   * Function to get active records only
   */
  static async getActive<T extends keyof Database['public']['Tables']>(
    table: T,
    options?: {
      orderBy?: string
      ascending?: boolean
      limit?: number
    }
  ): Promise<Tables<T>[]> {
    let query = supabase
      .from(table as any)
      .select('*')
      .eq('is_active', true as any) // eslint-disable-line @typescript-eslint/no-explicit-any

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Tables<T>[]
  }
}

export default SupabaseUtils

