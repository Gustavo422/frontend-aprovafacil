import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../login-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/features/shared/hooks/use-toast';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock the hooks
vi.mock('@/features/auth/hooks/use-auth');
vi.mock('@/features/shared/hooks/use-toast');

describe('LoginForm', () => {
  // Setup mock functions
  const mockSignIn = vi.fn();
  const mockToast = vi.fn();
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (useAuth as any).mockReturnValue({
      signIn: mockSignIn,
    });
    
    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('renders the form correctly', () => {
    render(<LoginForm />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByText(/esqueceu sua senha/i)).toBeInTheDocument();
    expect(screen.getByText(/não tem uma conta/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<LoginForm />);
    
    // Submit form without filling inputs
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/insira um e-mail válido/i)).toBeInTheDocument();
      expect(screen.getByText(/senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    // Mock successful login
    mockSignIn.mockResolvedValue({ token: 'test-token' });
    
    const onSuccessMock = vi.fn();
    render(<LoginForm onSuccess={onSuccessMock} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'password123' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    // Check if signIn was called with correct values
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Login realizado com sucesso!'
      }));
      expect(onSuccessMock).toHaveBeenCalled();
      expect(document.cookie).toContain('auth_token=test-token');
    });
  });

  it('handles failed login', async () => {
    // Mock failed login
    mockSignIn.mockResolvedValue({ error: 'Credenciais inválidas' });
    
    render(<LoginForm />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    
    // Check if error toast was shown
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Erro ao fazer login',
        descricao: 'Credenciais inválidas',
        variant: 'destructive'
      }));
    });
  });

  it('toggles password visibility', () => {
    render(<LoginForm />);
    
    // Password should be hidden initially
    const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    
    // Click the eye icon to show password
    fireEvent.click(screen.getByRole('button', { name: '' }));
    
    // Password should now be visible
    expect(passwordInput.type).toBe('text');
    
    // Click again to hide
    fireEvent.click(screen.getByRole('button', { name: '' }));
    
    // Password should be hidden again
    expect(passwordInput.type).toBe('password');
  });

  it('blocks login after 3 failed attempts', async () => {
    // Mock failed login
    mockSignIn.mockResolvedValue({ error: 'Credenciais inválidas' });
    
    render(<LoginForm />);
    
    // Helper function to attempt login
    const attemptLogin = () => {
      fireEvent.change(screen.getByLabelText(/e-mail/i), {
        target: { value: 'test@example.com' },
      });
      
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: 'wrongpassword' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    };
    
    // First attempt
    attemptLogin();
    
    await waitFor(() => {
      expect(screen.getByText(/tentativa 1 de 3/i)).toBeInTheDocument();
    });
    
    // Second attempt
    attemptLogin();
    
    await waitFor(() => {
      expect(screen.getByText(/tentativa 2 de 3/i)).toBeInTheDocument();
    });
    
    // Third attempt
    attemptLogin();
    
    // Should be blocked now
    await waitFor(() => {
      expect(screen.getByText(/conta temporariamente bloqueada/i)).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Muitas tentativas de login',
        descricao: 'Sua conta foi temporariamente bloqueada por 5 minutos.',
        variant: 'destructive'
      }));
    });
  });
});