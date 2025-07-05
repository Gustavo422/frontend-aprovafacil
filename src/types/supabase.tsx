import { Database } from '@/lib/supabase/client';

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
    ): import('@supabase/supabase-js').SupabaseQueryBuilder<
      Database['public']['Tables'][T]['Row'],
      Database['public']['Tables'][T]['Insert'],
      Database['public']['Tables'][T]['Update']
    >;
  }
}

// Export database types for use in other files
export type { Database } from '@/lib/supabase/client';
