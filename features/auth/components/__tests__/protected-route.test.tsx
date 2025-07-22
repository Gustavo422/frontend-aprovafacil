'use client';

import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../protected-route';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { useToast } from '@/features/shared/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock the hooks
vi.mock('@/features/auth/contexts/auth-context');
vi.mock('@/features/shared/hooks/use-toast');
vi.mock('next/navigation');

describe('ProtectedRoute', () => {
  // Setup common mocks
  const mockPush = vi.fn();
  const mockToast = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock router
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    // Mock pathname
    (usePathname as any).mockReturnValue('/protected-page');
    
    // Mock toast
    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
  });
  
  it('should show loading component while checking authentication', () => {
    // Mock auth context with loading state
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      checkAuth: vi.fn().mockResolvedValue(false),
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  it('should redirect to login when user is not authenticated', async () => {
    // Mock auth context with unauthenticated state
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      checkAuth: vi.fn().mockResolvedValue(false),
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should redirect to login
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=%2Fprotected-page');
    });
    
    // Should show toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Acesso restrito',
      variant: 'destructive',
    }));
  });
  
  it('should render children when user is authenticated', async () => {
    // Mock auth context with authenticated state
    (useAuth as any).mockReturnValue({
      user: { id: '1', email: 'user@example.com', nome: 'Test User', role: 'user' },
      loading: false,
      checkAuth: vi.fn().mockResolvedValue(true),
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should render children after authentication check
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
  
  it('should redirect to home when user does not have required role', async () => {
    // Mock auth context with authenticated state but wrong role
    (useAuth as any).mockReturnValue({
      user: { id: '1', email: 'user@example.com', nome: 'Test User', role: 'user' },
      loading: false,
      checkAuth: vi.fn().mockResolvedValue(true),
    });
    
    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    
    // Should redirect to home
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
    
    // Should show toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Acesso negado',
      variant: 'destructive',
    }));
  });
  
  it('should render children when user has one of the required roles', async () => {
    // Mock auth context with authenticated state and correct role
    (useAuth as any).mockReturnValue({
      user: { id: '1', email: 'user@example.com', nome: 'Test User', role: 'admin' },
      loading: false,
      checkAuth: vi.fn().mockResolvedValue(true),
    });
    
    render(
      <ProtectedRoute requiredRole={['user', 'admin']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should render children after authentication check
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
  
  it('should use custom loading component when provided', () => {
    // Mock auth context with loading state
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      checkAuth: vi.fn().mockResolvedValue(false),
    });
    
    render(
      <ProtectedRoute
        loadingComponent={<div>Custom Loading...</div>}
      >
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should show custom loading component
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  it('should redirect to custom fallback URL when specified', async () => {
    // Mock auth context with unauthenticated state
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      checkAuth: vi.fn().mockResolvedValue(false),
    });
    
    render(
      <ProtectedRoute fallbackUrl="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should redirect to custom login URL
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login?returnUrl=%2Fprotected-page');
    });
  });
  
  it('should not include return URL when redirectAfterLogin is false', async () => {
    // Mock auth context with unauthenticated state
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      checkAuth: vi.fn().mockResolvedValue(false),
    });
    
    render(
      <ProtectedRoute redirectAfterLogin={false}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should redirect to login without return URL
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});