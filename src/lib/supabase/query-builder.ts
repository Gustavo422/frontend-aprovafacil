import { supabase } from './client'
import type { Database, Tables } from '@/types/supabase.types'

export class QueryBuilder<T extends keyof Database['public']['Tables']> {
  private table: T
  private query: ReturnType<typeof supabase.from>

  constructor(table: T) {
    this.table = table
    this.query = supabase.from(table).select('*')
  }

  /**
   * Add a WHERE clause
   */
  where(column: string, operator: string, value: unknown): this {
    switch (operator) {
      case '=':
      case 'eq':
        this.query = this.query.eq(column, value)
        break
      case '!=':
      case 'neq':
        this.query = this.query.neq(column, value)
        break
      case '>':
      case 'gt':
        this.query = this.query.gt(column, value)
        break
      case '>=':
      case 'gte':
        this.query = this.query.gte(column, value)
        break
      case '<':
      case 'lt':
        this.query = this.query.lt(column, value)
        break
      case '<=':
      case 'lte':
        this.query = this.query.lte(column, value)
        break
      case 'like':
        this.query = this.query.like(column, value)
        break
      case 'ilike':
        this.query = this.query.ilike(column, value)
        break
      case 'in':
        this.query = this.query.in(column, value)
        break
      case 'is':
        this.query = this.query.is(column, value)
        break
      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }
    return this
  }

  /**
   * Add an OR condition
   */
  or(conditions: string): this {
    this.query = this.query.or(conditions)
    return this
  }

  /**
   * Add ordering
   */
  orderBy(column: string, ascending: boolean = true): this {
    this.query = this.query.order(column, { ascending })
    return this
  }

  /**
   * Add limit
   */
  limit(count: number): this {
    this.query = this.query.limit(count)
    return this
  }

  /**
   * Add range (pagination)
   */
  range(from: number, to: number): this {
    this.query = this.query.range(from, to)
    return this
  }

  /**
   * Select specific columns
   */
  select(columns: string): this {
    this.query = supabase.from(this.table).select(columns)
    return this
  }

  /**
   * Get single result
   */
  async single(): Promise<Tables<T> | null> {
    const { data, error } = await this.query.single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }
    
    return data as Tables<T>
  }

  /**
   * Get multiple results
   */
  async execute(): Promise<Tables<T>[]> {
    const { data, error } = await this.query
    
    if (error) throw error
    return data as Tables<T>[]
  }

  /**
   * Get results with count
   */
  async executeWithCount(): Promise<{ data: Tables<T>[]; count: number }> {
    const { data, count, error } = await this.query
    
    if (error) throw error
    return { data: data as Tables<T>[], count: count || 0 }
  }

  /**
   * Check if any records exist
   */
  async exists(): Promise<boolean> {
    const { count, error } = await this.query.select('id', { count: 'exact', head: true })
    
    if (error) throw error
    return (count || 0) > 0
  }
}

/**
 * Factory function to create a query builder
 */
export function createQueryBuilder<T extends keyof Database['public']['Tables']>(
  table: T
): QueryBuilder<T> {
  return new QueryBuilder(table)
}

/**
 * Convenience functions for common queries
 */
export const QueryHelpers = {
  /**
   * Find active records
   */
  findActive<T extends keyof Database['public']['Tables']>(table: T) {
    return createQueryBuilder(table).where('is_active', 'eq', true)
  },

  /**
   * Find by user ID
   */
  findByUser<T extends keyof Database['public']['Tables']>(table: T, userId: string) {
    return createQueryBuilder(table).where('user_id', 'eq', userId)
  },

  /**
   * Find recent records
   */
  findRecent<T extends keyof Database['public']['Tables']>(table: T, limit: number = 10) {
    return createQueryBuilder(table)
      .orderBy('created_at', false)
      .limit(limit)
  },

  /**
   * Search by text
   */
  search<T extends keyof Database['public']['Tables']>(
    table: T, 
    column: string, 
    searchTerm: string
  ) {
    return createQueryBuilder(table).where(column, 'ilike', `%${searchTerm}%`)
  },

  /**
   * Find by date range
   */
  findByDateRange<T extends keyof Database['public']['Tables']>(
    table: T,
    dateColumn: string,
    startDate: string,
    endDate: string
  ) {
    return createQueryBuilder(table)
      .where(dateColumn, 'gte', startDate)
      .where(dateColumn, 'lte', endDate)
  }
}

export default QueryBuilder

