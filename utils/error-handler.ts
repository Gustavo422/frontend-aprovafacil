import { isAuthError, isServerError } from './api-error-handler';

/**
 * Utility functions for handling errors in the UI
 */

/**
 * Extract status code from error message if present
 * Format: [SERVER_ERROR:500] Error message or [ERROR:404] Error message
 */
export function getStatusCodeFromError(errorMsg: string): number | undefined {
  const match = errorMsg.match(/\[(SERVER_ERROR|ERROR):(\d+)\]/);
  return match ? parseInt(match[2], 10) : undefined;
}

/**
 * Clean error message by removing the status code prefix
 */
export function cleanErrorMessage(errorMsg: string): string {
  return errorMsg.replace(/\[(SERVER_ERROR|ERROR):\d+\]\s*/, '');
}

/**
 * Determine if an error is related to database schema issues
 */
export function isDatabaseSchemaError(errorMsg: string): boolean {
  return errorMsg.toLowerCase().includes('banco de dados') || 
         errorMsg.toLowerCase().includes('database') ||
         errorMsg.toLowerCase().includes('schema') ||
         errorMsg.toLowerCase().includes('db_schema_error');
}

/**
 * Get appropriate error type based on error message and status code
 */
export function getErrorTypeFromMessage(errorMsg: string, statusCode?: number): 'auth' | 'server' | 'validation' | 'generic' {
  // First check status code if available
  if (statusCode) {
    if (isServerError(statusCode)) return 'server';
    if (isAuthError(statusCode)) return 'auth';
    if (statusCode >= 400 && statusCode < 500) return 'validation';
  }
  
  // Then check message content
  const lowerMsg = errorMsg.toLowerCase();
  
  // Database schema errors should always be server errors, not auth errors
  if (isDatabaseSchemaError(lowerMsg)) {
    return 'server';
  }
  
  if (lowerMsg.includes('servidor') || 
      lowerMsg.includes('server') || 
      lowerMsg.includes('internal')) {
    return 'server';
  }
  
  if (lowerMsg.includes('autenticação') || 
      lowerMsg.includes('credenciais') || 
      lowerMsg.includes('login') ||
      lowerMsg.includes('auth')) {
    return 'auth';
  }
  
  if (lowerMsg.includes('validação') || 
      lowerMsg.includes('dados') || 
      lowerMsg.includes('inválido')) {
    return 'validation';
  }
  
  return 'generic';
}