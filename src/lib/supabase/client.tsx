import { createClient } from '@supabase/supabase-js';
import type {
  SupabaseClient,
  Session,
  User,
  AuthChangeEvent,
  AuthSession,
} from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.types';

declare global {
  interface Window {
    ENV: {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    };
  }
}

// Helper types for better type safety
type Schema = Database['public'];
type Tables = Schema['Tables'];
type TableName = keyof Tables;

type TableRow<T extends TableName> = Tables[T] extends { Row: infer R } ? R : never;
type TableInsert<T extends TableName> = Tables[T] extends { Insert: infer I } ? I : never;
type TableUpdate<T extends TableName> = Tables[T] extends { Update: infer U } ? U : never;

// Type for Supabase response with data
type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
  status: number;
  statusText: string;
};

// Use environment variables from window.ENV for client-side usage
const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_SUPABASE_URL) {
    return window.ENV.NEXT_PUBLIC_SUPABASE_URL;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined' && window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
};

// Create a new Supabase client for the given context
const createSupabaseClient = (): SupabaseClient<Database> => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
};

// Create a singleton instance for client-side usage
let browserClient: SupabaseClient<Database> | null = null;

// Function to get or create the browser client
export const getBrowserClient = (): SupabaseClient<Database> => {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side');
  }
  
  if (!browserClient) {
    browserClient = createSupabaseClient();
  }
  
  return browserClient;
};

// For backward compatibility, export a client that works in both environments
export const supabase = (typeof window !== 'undefined' 
  ? getBrowserClient() 
  : createSupabaseClient()
);

// Re-export types from Supabase
export type { Session, User, AuthChangeEvent, AuthSession, Database };

// Export table types for external use
export type { TableName, TableRow, TableInsert, TableUpdate };

// Helper function to get typed table
export function getTable<T extends TableName>(tableName: T) {
  return supabase.from(tableName);
}

// Auth helpers
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async (): Promise<AuthSession | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Error handling
export class SupabaseError extends Error {
  status: number;
  details: string;
  hint?: string;
  code?: string;

  constructor(error: any) {
    super(error?.message || 'An unknown error occurred');
    this.name = 'SupabaseError';
    this.status = error?.status || 500;
    this.details = error?.details || 'An error occurred with the database';
    this.hint = error?.hint;
    this.code = error?.code;
  }
}

// Helper to handle Supabase errors
function handleSupabaseError<T>(result: { data: T | null; error: any }): T {
  if (result.error) {
    throw new SupabaseError(result.error);
  }
  if (!result.data) {
    throw new SupabaseError({ message: 'No data returned', status: 404 });
  }
  return result.data;
}

// Typed query builder for common operations
type QueryBuilder<T extends TableName> = {
  findById(id: string): Promise<TableRow<T> | null>;
  insert(payload: TableInsert<T>): Promise<TableRow<T> | null>;
  update(id: string, payload: Partial<TableUpdate<T>>): Promise<TableRow<T> | null>;
  delete(id: string): Promise<boolean>;
};

// Helper function to create a typed query builder
export function createQuery<T extends TableName>(tableName: T): QueryBuilder<T> {
  return {
    async findById(id: string) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new SupabaseError(error);
      return data;
    },
    
    async insert(payload: TableInsert<T>) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload as any)
        .select()
        .single();
      
      if (error) throw new SupabaseError(error);
      return data;
    },
    
    async update(id: string, payload: Partial<TableUpdate<T>>) {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new SupabaseError(error);
      return data;
    },
    
    async delete(id: string) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw new SupabaseError(error);
      return true;
    },
  };
}
