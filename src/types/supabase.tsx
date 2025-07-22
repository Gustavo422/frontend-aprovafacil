import { Database } from '@/types/supabase.types';

declare global {
  // Extend the Window interface to include ENV variables
  interface Window {
    ENV: {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    };
  }

  // Type for the Supabase client with database types
  type SupabaseClient = ReturnType<typeof import('@supabase/supabase-js').createClient<Database>>;
  
  // Type for the Supabase client with the from method properly typed
  interface TypedSupabaseClient extends SupabaseClient {
    from<T extends keyof Database['public']['Tables']>(
      table: T
    ): ReturnType<SupabaseClient['from']>;
  }
}

// Export database types for use in other files
export type { Database } from '@/types/supabase.types';



