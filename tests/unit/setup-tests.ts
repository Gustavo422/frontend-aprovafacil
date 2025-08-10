import { vi } from 'vitest';

// Mock next/navigation useRouter to avoid requiring App Router in unit tests
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

// Mock useToast hook used by AuthProvider
vi.mock('@/features/shared/hooks/use-toast', () => {
  return {
    useToast: () => ({ toast: vi.fn() }),
  };
});

// Mock Auth context to avoid real auth flows in unit tests
vi.mock('@/features/auth/contexts/auth-context', () => {
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children as any,
    useAuth: () => ({
      user: { id: 'user-1', email: 'u@e.com', nome: 'User' },
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      checkAuth: vi.fn().mockResolvedValue(true),
      getToken: () => 'test-token',
    }),
  };
});

// Mock Concurso context to force an active concurso and token presence
vi.mock('@/contexts/ConcursoContext', () => {
  return {
    ConcursoProvider: ({ children }: { children: React.ReactNode }) => children as any,
    useConcurso: () => ({
      activeConcursoId: 'concurso-1',
      state: { isLoading: false },
      hasSelectedConcurso: true,
      token: 'test-token',
    }),
  };
});


