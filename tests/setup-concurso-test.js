// Mock setup for concurso preference tests
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock the error toast functions
vi.mock('../utils/error-toast', () => ({
  showErrorToast: vi.fn(),
  showErrorToastFromStatus: vi.fn(),
  showNetworkErrorToast: vi.fn()
}));

// Mock the API error handler
vi.mock('../utils/api-error-handler', () => ({
  handleApiResponse: vi.fn(),
  isAuthError: (status) => status === 401 || status === 403,
  isServerError: (status) => status >= 500,
  isClientError: (status) => status >= 400 && status < 500,
  getErrorMessageFromStatus: vi.fn()
}));

// Mock the error handler
vi.mock('../utils/error-handler', () => ({
  getStatusCodeFromError: vi.fn((error) => {
    const match = error.match(/\[(SERVER_ERROR|ERROR):(\d+)\]/);
    return match ? parseInt(match[2], 10) : undefined;
  }),
  cleanErrorMessage: vi.fn((error) => error.replace(/\[(SERVER_ERROR|ERROR):\d+\]\s*/, '')),
  isDatabaseSchemaError: vi.fn((error) => 
    error.toLowerCase().includes('banco de dados') || 
    error.toLowerCase().includes('database') ||
    error.toLowerCase().includes('schema') ||
    error.toLowerCase().includes('db_schema_error')
  ),
  getErrorTypeFromMessage: vi.fn((message, statusCode) => {
    if (statusCode) {
      if (statusCode >= 500) return 'server';
      if (statusCode === 401 || statusCode === 403) return 'auth';
      if (statusCode >= 400 && statusCode < 500) return 'validation';
    }
    
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('banco de dados') || 
        lowerMsg.includes('database') || 
        lowerMsg.includes('schema')) {
      return 'server';
    }
    
    if (lowerMsg.includes('servidor') || 
        lowerMsg.includes('server') || 
        lowerMsg.includes('internal')) {
      return 'server';
    }
    
    if (lowerMsg.includes('autenticação') || 
        lowerMsg.includes('credenciais') || 
        lowerMsg.includes('login')) {
      return 'auth';
    }
    
    return 'generic';
  })
}));