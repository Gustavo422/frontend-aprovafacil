import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/features/shared/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, isAuthenticated, signIn, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  // Setup mocks
  const mockPush = vi.fn();
  const mockToast = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    
    // Setup cookie mock
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    
    // Setup router mock
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    // Setup toast mock
    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
    
    // Setup fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });
  });

  it('initializes with loading state and checks auth on mount', async () => {
    // Mock localStorage to return null for token
    (window.localStorage.getItem as any).mockReturnValue(null);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should start with loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // After checking auth, should not be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
  });

  it('handles successful sign in', async () => {
    // Mock successful login response
    const mockUser = { id: '123', email: 'test@example.com', nome: 'Test User' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          token: 'test-token',
          usuario: mockUser,
        },
      }),
    });
    
    // Mock successful me endpoint
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockUser,
      }),
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Trigger sign in
    act(() => {
      screen.getByText('Sign In').click();
    });
    
    // Should set loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // After sign in, should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      
      // Should store token
      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
      
      // Should redirect
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('handles sign out', async () => {
    // Mock successful logout
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    // Mock token in localStorage
    (window.localStorage.getItem as any).mockReturnValue('test-token');
    
    // Setup initial authenticated state
    const mockUser = { id: '123', email: 'test@example.com', nome: 'Test User' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockUser,
      }),
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete and set user
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });
    
    // Trigger sign out
    act(() => {
      screen.getByText('Sign Out').click();
    });
    
    // After sign out, should not be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      
      // Should clear token
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token_expiry');
      
      // Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login');
      
      // Should show toast
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Logout realizado com sucesso',
      }));
    });
  });

  it('handles failed authentication check', async () => {
    // Mock token in localStorage
    (window.localStorage.getItem as any).mockReturnValue('invalid-token');
    
    // Mock failed auth check
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { message: 'Invalid token' },
      }),
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // After failed auth check, should clear token and not be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });
});