import { jest } from '@jest/globals';
import type { Session } from '@supabase/gotrue-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Define um tipo para o cliente Supabase mockado, usando tipos genéricos do Jest
type MockSupabaseClient = {
  [K in keyof SupabaseClient]: SupabaseClient[K] extends (...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any
    ? jest.MockedFunction<SupabaseClient[K]>
    : MockSupabaseClient[K];
};

// Cria um cliente Supabase mockado com tipos fortes
export const mockSupabaseClient: MockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn((_event: string, _callback: (event: string, session: Session | null) => void) => {
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  },
} as unknown as MockSupabaseClient;

// Mock das funções de criação de cliente
export const createBrowserClient = jest.fn(() => mockSupabaseClient);
export const createServerClient = jest.fn(() => mockSupabaseClient);
