import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorDisplay } from '../components/ui/error-display';
import { ApiErrorDisplay } from '../components/ui/api-error-display';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';

describe('Error Display Components', () => {
  it('should display server errors correctly', () => {
    render(
      <ErrorDisplay 
        title="Erro no servidor" 
        message="Ocorreu um erro no servidor" 
        errorType="server"
        statusCode={500}
      />
    );
    
    expect(screen.getByText('Erro no servidor')).toBeInTheDocument();
    expect(screen.getByText('Ocorreu um erro no servidor')).toBeInTheDocument();
    expect(screen.getByText('Código de erro: 500')).toBeInTheDocument();
  });
  
  it('should display auth errors correctly', () => {
    render(
      <ErrorDisplay 
        title="Erro de autenticação" 
        message="Suas credenciais são inválidas" 
        errorType="auth"
        statusCode={401}
      />
    );
    
    expect(screen.getByText('Erro de autenticação')).toBeInTheDocument();
    expect(screen.getByText('Suas credenciais são inválidas')).toBeInTheDocument();
    expect(screen.getByText('Código de erro: 401')).toBeInTheDocument();
  });
  
  it('should display database schema errors as server errors', () => {
    render(
      <ApiErrorDisplay 
        error="[SERVER_ERROR:500] Erro de banco de dados: column does not exist"
        statusCode={500}
      />
    );
    
    expect(screen.getByText('Erro no banco de dados')).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro no banco de dados/)).toBeInTheDocument();
    expect(screen.getByText('Código de erro: 500')).toBeInTheDocument();
  });
  
  it('should not display database errors as auth errors', () => {
    render(
      <ApiErrorDisplay 
        error="[SERVER_ERROR:500] Erro de banco de dados: column does not exist"
        statusCode={500}
      />
    );
    
    expect(screen.queryByText('Erro de autenticação')).not.toBeInTheDocument();
    expect(screen.queryByText(/credenciais/i)).not.toBeInTheDocument();
  });
});