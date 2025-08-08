/**
 * Authentication Error Types and Utilities
 * Provides comprehensive error handling for authentication flows
 */

// Authentication error categories
export enum AuthErrorCategory {
  NETWORK = 'NETWORK',
  CREDENTIALS = 'CREDENTIALS',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  TOKEN = 'TOKEN',
  CONFIGURATION = 'CONFIGURATION'
}

// Authentication error severity levels
export enum AuthErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Detailed authentication error interface
export interface AuthError {
  category: AuthErrorCategory;
  severity: AuthErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  details?: string;
  suggestions: string[];
  isRetryable: boolean;
  retryAfter?: number;
  timestamp: string;
  context?: Record<string, unknown>;
}

// Authentication result interface
export interface AuthResult {
  success: boolean;
  data?: {
    token: string;
    usuario: Record<string, unknown>;
    expiresIn: number;
  };
  error?: AuthError;
  metadata?: {
    responseTime: number;
    attempt: number;
    backendUrl?: string;
  };
}

// Predefined authentication errors
export const AUTH_ERRORS = {
  // Network errors
  NETWORK_TIMEOUT: {
    category: AuthErrorCategory.NETWORK,
    severity: AuthErrorSeverity.MEDIUM,
    code: 'NETWORK_TIMEOUT',
    message: 'Request timeout while connecting to authentication server',
    userMessage: 'A conexão com o servidor demorou muito para responder',
    suggestions: [
      'Verifique sua conexão com a internet',
      'Tente novamente em alguns segundos',
      'Se o problema persistir, entre em contato com o suporte'
    ],
    isRetryable: true,
    retryAfter: 5
  },
  
  NETWORK_UNAVAILABLE: {
    category: AuthErrorCategory.NETWORK,
    severity: AuthErrorSeverity.HIGH,
    code: 'NETWORK_UNAVAILABLE',
    message: 'Unable to connect to authentication server',
    userMessage: 'Não foi possível conectar ao servidor de autenticação',
    suggestions: [
      'Verifique sua conexão com a internet',
      'Confirme se o servidor está funcionando',
      'Tente novamente em alguns minutos'
    ],
    isRetryable: true,
    retryAfter: 30
  },

  // Credential errors
  INVALID_CREDENTIALS: {
    category: AuthErrorCategory.CREDENTIALS,
    severity: AuthErrorSeverity.LOW,
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password provided',
    userMessage: 'Email ou senha incorretos',
    suggestions: [
      'Verifique se digitou o email corretamente',
      'Confirme se a senha está correta',
      'Use "Esqueci minha senha" se necessário'
    ],
    isRetryable: true
  },

  ACCOUNT_LOCKED: {
    category: AuthErrorCategory.CREDENTIALS,
    severity: AuthErrorSeverity.HIGH,
    code: 'ACCOUNT_LOCKED',
    message: 'Account temporarily locked due to multiple failed attempts',
    userMessage: 'Conta temporariamente bloqueada por múltiplas tentativas',
    suggestions: [
      'Aguarde alguns minutos antes de tentar novamente',
      'Use "Esqueci minha senha" para redefinir',
      'Entre em contato com o suporte se necessário'
    ],
    isRetryable: false
  },

  // Server errors
  SERVER_ERROR: {
    category: AuthErrorCategory.SERVER,
    severity: AuthErrorSeverity.HIGH,
    code: 'SERVER_ERROR',
    message: 'Internal server error during authentication',
    userMessage: 'Erro interno do servidor durante a autenticação',
    suggestions: [
      'Tente novamente em alguns minutos',
      'Se o problema persistir, entre em contato com o suporte',
      'Verifique se há atualizações do sistema'
    ],
    isRetryable: true,
    retryAfter: 60
  },

  DATABASE_ERROR: {
    category: AuthErrorCategory.SERVER,
    severity: AuthErrorSeverity.CRITICAL,
    code: 'DATABASE_ERROR',
    message: 'Database connection error during authentication',
    userMessage: 'Erro de conexão com o banco de dados',
    suggestions: [
      'Tente novamente em alguns minutos',
      'Entre em contato com o suporte técnico',
      'Verifique se há manutenções programadas'
    ],
    isRetryable: true,
    retryAfter: 120
  },

  // Validation errors
  INVALID_EMAIL_FORMAT: {
    category: AuthErrorCategory.VALIDATION,
    severity: AuthErrorSeverity.LOW,
    code: 'INVALID_EMAIL_FORMAT',
    message: 'Invalid email format provided',
    userMessage: 'Formato de email inválido',
    suggestions: [
      'Verifique se o email está no formato correto',
      'Exemplo: usuario@exemplo.com',
      'Remova espaços em branco extras'
    ],
    isRetryable: true
  },

  PASSWORD_TOO_SHORT: {
    category: AuthErrorCategory.VALIDATION,
    severity: AuthErrorSeverity.LOW,
    code: 'PASSWORD_TOO_SHORT',
    message: 'Password does not meet minimum length requirements',
    userMessage: 'Senha muito curta',
    suggestions: [
      'A senha deve ter pelo menos 6 caracteres',
      'Use uma combinação de letras e números',
      'Considere usar caracteres especiais'
    ],
    isRetryable: true
  },

  // Rate limiting errors
  TOO_MANY_REQUESTS: {
    category: AuthErrorCategory.RATE_LIMIT,
    severity: AuthErrorSeverity.MEDIUM,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts',
    userMessage: 'Muitas tentativas de login',
    suggestions: [
      'Aguarde alguns minutos antes de tentar novamente',
      'Use "Esqueci minha senha" se necessário',
      'Entre em contato com o suporte se o problema persistir'
    ],
    isRetryable: false,
    retryAfter: 300
  },

  // Token errors
  TOKEN_EXPIRED: {
    category: AuthErrorCategory.TOKEN,
    severity: AuthErrorSeverity.MEDIUM,
    code: 'TOKEN_EXPIRED',
    message: 'Authentication token has expired',
    userMessage: 'Sessão expirada',
    suggestions: [
      'Faça login novamente',
      'Suas credenciais ainda são válidas',
      'Use "Lembrar-me" para sessões mais longas'
    ],
    isRetryable: false
  },

  TOKEN_INVALID: {
    category: AuthErrorCategory.TOKEN,
    severity: AuthErrorSeverity.HIGH,
    code: 'TOKEN_INVALID',
    message: 'Invalid or malformed authentication token',
    userMessage: 'Token de autenticação inválido',
    suggestions: [
      'Faça login novamente',
      'Limpe os dados do navegador se necessário',
      'Entre em contato com o suporte se o problema persistir'
    ],
    isRetryable: false
  },

  // Configuration errors
  BACKEND_URL_MISSING: {
    category: AuthErrorCategory.CONFIGURATION,
    severity: AuthErrorSeverity.CRITICAL,
    code: 'BACKEND_URL_MISSING',
    message: 'Backend URL configuration is missing',
    userMessage: 'Configuração do servidor não encontrada',
    suggestions: [
      'Entre em contato com o suporte técnico',
      'Verifique se há atualizações do sistema',
      'Tente recarregar a página'
    ],
    isRetryable: false
  },

  ENVIRONMENT_INVALID: {
    category: AuthErrorCategory.CONFIGURATION,
    severity: AuthErrorSeverity.CRITICAL,
    code: 'ENVIRONMENT_INVALID',
    message: 'Invalid environment configuration',
    userMessage: 'Configuração do ambiente inválida',
    suggestions: [
      'Entre em contato com o suporte técnico',
      'Verifique se há atualizações do sistema',
      'Tente acessar novamente mais tarde'
    ],
    isRetryable: false
  }
} as const;

/**
 * Creates an authentication error with timestamp and context
 */
export function createAuthError(
  errorTemplate: typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS],
  details?: string,
  context?: Record<string, unknown>
): AuthError {
  return {
    ...errorTemplate,
    suggestions: [...errorTemplate.suggestions], // Convert readonly array to mutable
    details,
    context,
    timestamp: new Date().toISOString()
  };
}

/**
 * Maps HTTP status codes to authentication errors
 */
export function mapHttpStatusToAuthError(
  status: number,
  responseData?: { error?: string },
  context?: Record<string, unknown>
): AuthError {
  switch (status) {
    case 400:
      if (responseData?.error?.includes('email')) {
        return createAuthError(AUTH_ERRORS.INVALID_EMAIL_FORMAT, responseData.error, context);
      }
      if (responseData?.error?.includes('password')) {
        return createAuthError(AUTH_ERRORS.PASSWORD_TOO_SHORT, responseData.error, context);
      }
      return createAuthError(AUTH_ERRORS.INVALID_CREDENTIALS, responseData?.error, context);
    
    case 401:
      if (responseData?.error?.includes('token')) {
        return createAuthError(AUTH_ERRORS.TOKEN_INVALID, responseData.error, context);
      }
      return createAuthError(AUTH_ERRORS.INVALID_CREDENTIALS, responseData?.error, context);
    
    case 403:
      return createAuthError(AUTH_ERRORS.ACCOUNT_LOCKED, responseData?.error, context);
    
    case 429:
      return createAuthError(AUTH_ERRORS.TOO_MANY_REQUESTS, responseData?.error, context);
    
    case 500:
      if (responseData?.error?.includes('database')) {
        return createAuthError(AUTH_ERRORS.DATABASE_ERROR, responseData.error, context);
      }
      return createAuthError(AUTH_ERRORS.SERVER_ERROR, responseData?.error, context);
    
    case 503:
      return createAuthError(AUTH_ERRORS.NETWORK_UNAVAILABLE, responseData?.error, context);
    
    default:
      return createAuthError(AUTH_ERRORS.SERVER_ERROR, `HTTP ${status}: ${responseData?.error || 'Unknown error'}`, context);
  }
}

/**
 * Maps network errors to authentication errors
 */
export function mapNetworkErrorToAuthError(
  error: Error,
  context?: Record<string, unknown>
): AuthError {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout') || error.name === 'AbortError') {
    return createAuthError(AUTH_ERRORS.NETWORK_TIMEOUT, error.message, context);
  }
  
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('econnrefused')) {
    return createAuthError(AUTH_ERRORS.NETWORK_UNAVAILABLE, error.message, context);
  }
  
  return createAuthError(AUTH_ERRORS.SERVER_ERROR, error.message, context);
}

/**
 * Determines if an error should trigger a retry mechanism
 */
export function shouldRetryAuthError(error: AuthError): boolean {
  return error.isRetryable && error.category !== AuthErrorCategory.CREDENTIALS;
}

/**
 * Gets the retry delay for an authentication error
 */
export function getRetryDelay(error: AuthError, attempt: number): number {
  const baseDelay = error.retryAfter || 5;
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(exponentialDelay * 1000 + jitter, 30000); // Cap at 30 seconds
}

/**
 * Formats an authentication error for logging
 */
export function formatAuthErrorForLogging(error: AuthError): string {
  return JSON.stringify({
    category: error.category,
    severity: error.severity,
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
    context: error.context
  }, null, 2);
}

/**
 * Checks if an error is critical and requires immediate attention
 */
export function isCriticalAuthError(error: AuthError): boolean {
  return error.severity === AuthErrorSeverity.CRITICAL;
}