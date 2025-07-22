import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ConcursoProvider, useConcurso } from '../contexts/ConcursoContext';
import { ConcursoErrorMessage } from '../components/concurso/ConcursoErrorMessage';
import '@testing-library/jest-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import './setup-concurso-test';

// Test component that uses the context
const TestComponent = () => {
  const { state, loadUserPreference } = useConcurso();
  
  return (
    <div>
      <div data-testid="loading">{state.isLoading ? 'Loading...' : 'Not loading'}</div>
      <div data-testid="error">{state.error || 'No error'}</div>
      <div data-testid="has-context">{state.context ? 'Has context' : 'No context'}</div>
      <button onClick={() => loadUserPreference()}>Load Preferences</button>
      <ConcursoErrorMessage />
    </div>
  );
};

describe('Concurso Preference Frontend', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should handle successful preference loading', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'pref-123',
          usuario_id: 'user-123',
          concurso_id: 'concurso-123',
          categoria_id: 'categoria-123',
          pode_alterar_ate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ativo: true
        },
        canChange: false,
        daysUntilChange: 30
      })
    });

    // Render component
    render(
      <ConcursoProvider>
        <TestComponent />
      </ConcursoProvider>
    );

    // Wait for context to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('has-context')).toHaveTextContent('Has context');
    });

    // Verify no error is displayed
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.queryByText(/Erro/)).not.toBeInTheDocument();
  });

  it('should handle database schema errors correctly', async () => {
    // Mock database schema error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Erro de banco de dados',
        details: 'Problema com a estrutura da tabela de preferências',
        code: 'DB_SCHEMA_ERROR'
      })
    });

    // Render component
    render(
      <ConcursoProvider>
        <TestComponent />
      </ConcursoProvider>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('No error');
    });

    // Verify error message is displayed correctly
    expect(screen.getByTestId('error')).toHaveTextContent('SERVER_ERROR:500');
    
    // Error should be displayed as server error, not auth error
    const errorMessage = await screen.findByText(/Erro no banco de dados/i);
    expect(errorMessage).toBeInTheDocument();
    
    // Should not show "Invalid credential" message
    expect(screen.queryByText(/credenciais/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/autenticação/i)).not.toBeInTheDocument();
  });

  it('should handle general server errors correctly', async () => {
    // Mock general server error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      })
    });

    // Render component
    render(
      <ConcursoProvider>
        <TestComponent />
      </ConcursoProvider>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('No error');
    });

    // Verify error message is displayed correctly
    expect(screen.getByTestId('error')).toHaveTextContent('SERVER_ERROR:500');
    
    // Error should be displayed as server error, not auth error
    const errorMessage = await screen.findByText(/Erro no servidor/i);
    expect(errorMessage).toBeInTheDocument();
    
    // Should not show "Invalid credential" message
    expect(screen.queryByText(/credenciais/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/autenticação/i)).not.toBeInTheDocument();
  });

  it('should handle authentication errors correctly', async () => {
    // Mock authentication error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Não autorizado',
        code: 'UNAUTHORIZED'
      })
    });

    // Render component
    render(
      <ConcursoProvider>
        <TestComponent />
      </ConcursoProvider>
    );

    // For auth errors, we should clear the context but not show an error
    await waitFor(() => {
      expect(screen.getByTestId('has-context')).toHaveTextContent('No context');
    });

    // No error should be displayed for auth errors during initial load
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('should handle empty preferences correctly', async () => {
    // Mock empty preference response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: null,
        canChange: true,
        daysUntilChange: 0,
        isFallback: true,
        message: 'Nenhuma preferência encontrada para este usuário'
      })
    });

    // Render component
    render(
      <ConcursoProvider>
        <TestComponent />
      </ConcursoProvider>
    );

    // Wait for context to be cleared
    await waitFor(() => {
      expect(screen.getByTestId('has-context')).toHaveTextContent('No context');
    });

    // No error should be displayed
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('should handle network errors correctly', async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    // Render component
    render(
      <ConcursoProvider>
        <TestComponent />
      </ConcursoProvider>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('No error');
    });

    // Verify error message is displayed correctly
    expect(screen.getByTestId('error')).toHaveTextContent('Erro de conexão');
  });
});