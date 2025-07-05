// Re-export all Supabase utilities
export * from './client';
export * from './utils';
export * from './query-builder';

// Export types
export type { 
  Database, 
  Json 
} from '@/types/supabase.types';

export type { 
  Session, 
  User, 
  SupabaseClient 
} from '@supabase/supabase-js';

export type {
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
  PostgrestResponse,
  PostgrestSingleResponse
} from '@supabase/postgrest-js';

// Re-export commonly used types
export type { 
  TableName, 
  TableRow, 
  TableInsert, 
  TableUpdate, 
  SupabaseResponse 
} from './client';

// Export the query builder factory function
export { createQueryBuilder } from './query-builder';

// Export the default supabase client as a named export
export { supabase } from './client';

// Helper type for API responses
export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
  status: number;
  message?: string;
};
