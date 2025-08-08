import { NextResponse } from 'next/server';
import { environmentService } from './environment-service';

// API configuration interface
interface ApiUrlConfig {
  url: string;
  isValid: boolean;
  error?: string;
  fallbackUsed?: boolean;
}

// API request configuration interface
interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// API response interface
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  responseTime: number;
  retryCount?: number;
}

// Connection health check result interface
interface HealthCheckResult {
  isHealthy: boolean;
  responseTime: number;
  status?: number;
  error?: string;
  timestamp: string;
}

/**
 * Gets backend URL with comprehensive error handling and validation
 * @param path Caminho da API no backend
 * @param searchParams Parâmetros de busca opcionais
 * @returns Objeto com URL do backend e status de validação
 */
export function getBackendUrl(path: string, searchParams?: string): ApiUrlConfig {
  console.log(`[API-UTILS] Getting backend URL for path: ${path}`);

  try {
    // Get environment configuration from service
    const envConfig = environmentService.getConfig();
    
    // Check if environment is valid
    if (!envConfig.isValid) {
      console.error('[API-UTILS] Environment configuration invalid:', envConfig.errors);
      return {
        url: '',
        isValid: false,
        error: `Environment configuration errors: ${envConfig.errors.join(', ')}`,
        fallbackUsed: envConfig.fallbacksUsed.length > 0
      };
    }

    // Validate backend URL format
    try {
      new URL(envConfig.backendUrl);
    } catch {
      const errorMessage = `Invalid backend URL format: ${envConfig.backendUrl}`;
      console.error(`[API-UTILS] ${errorMessage}`);
      return {
        url: '',
        isValid: false,
        error: errorMessage,
        fallbackUsed: envConfig.fallbacksUsed.includes('NEXT_PUBLIC_BACKEND_API_URL')
      };
    }

    // Construct final URL
    const finalUrl = `${envConfig.backendUrl}${path}${searchParams || ''}`;
    const fallbackUsed = envConfig.fallbacksUsed.includes('NEXT_PUBLIC_BACKEND_API_URL');
    
    // Log final URL construction
    console.log(`[API-UTILS] Final API URL: ${finalUrl}${fallbackUsed ? ' (using fallback)' : ''}`);

    // Log warnings if any
    if (envConfig.warnings.length > 0) {
      console.warn('[API-UTILS] Environment warnings:', envConfig.warnings);
    }

    return { 
      url: finalUrl, 
      isValid: true, 
      fallbackUsed 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error getting backend URL';
    console.error('[API-UTILS] Error getting backend URL:', errorMessage);
    
    return {
      url: '',
      isValid: false,
      error: errorMessage,
      fallbackUsed: false
    };
  }
}

/**
 * Validates environment configuration and returns detailed status
 * @returns Environment validation result
 */
export function validateEnvironmentConfiguration() {
  return environmentService.getConfigurationStatus();
}

/**
 * Creates a detailed error response for environment configuration issues
 * @param config API URL configuration result
 * @returns NextResponse with detailed error information
 */
export function createEnvironmentErrorResponse(config: ApiUrlConfig): Response {
  const envStatus = environmentService.getConfigurationStatus();
  
  const errorDetails = {
    error: 'Configuração do servidor incompleta',
    details: config.error,
    fallbackUsed: config.fallbackUsed,
    timestamp: new Date().toISOString(),
    troubleshooting: {
      message: 'Verifique as variáveis de ambiente do frontend',
      requiredVars: ['NEXT_PUBLIC_BACKEND_API_URL'],
      currentUrl: config.url || 'não definida',
      environmentStatus: envStatus.summary,
      errors: envStatus.details.errors,
      warnings: envStatus.details.warnings
    }
  };

  console.error('[API-UTILS] Environment configuration error response:', errorDetails);

  return NextResponse.json(errorDetails, { status: 500 });
}

/**
 * Enhanced wrapper for API route error handling with comprehensive logging
 * @param handler Function that processes the request
 * @returns API response or handled error
 */
export async function withErrorHandling(
  handler: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const response = await handler();
    const responseTime = Date.now() - startTime;
    
    console.log(`[API-ROUTE] Request completed successfully (${responseTime}ms)`);
    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Enhanced error logging with more context
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      type: error instanceof Error ? error.constructor.name : typeof error,
      responseTime,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server-side',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    console.error('[API-ERROR] API route error:', errorDetails);

    // Check if it's a network/connectivity error
    const isNetworkError = error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout')
    );

    // Return detailed error response in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse = {
      error: isNetworkError ? 'Erro de conectividade com o servidor' : 'Erro ao processar requisição',
      timestamp: errorDetails.timestamp,
      ...(isDevelopment && { 
        details: errorDetails.message,
        type: errorDetails.type,
        responseTime: errorDetails.responseTime
      }),
      ...(isNetworkError && {
        troubleshooting: {
          message: 'Verifique se o servidor backend está rodando',
          suggestions: [
            'Confirme se o backend está iniciado',
            'Verifique a configuração da URL do backend',
            'Teste a conectividade de rede'
          ]
        }
      })
    };

    const statusCode = isNetworkError ? 503 : 500;
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * Enhanced API error handler specifically for client-side requests
 * @param error The error that occurred
 * @param context Additional context about the request
 * @returns Formatted error response
 */
export function handleApiError(
  error: unknown,
  context: {
    endpoint: string;
    method: string;
    retryCount?: number;
  }
): {
  message: string;
  details?: string;
  isRetryable: boolean;
  suggestions: string[];
} {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  console.error(`[API-CLIENT-ERROR] Error in ${context.method} ${context.endpoint}:`, {
    error: errorMessage,
    retryCount: context.retryCount,
    timestamp: new Date().toISOString()
  });

  // Determine if error is retryable
  const isRetryable = error instanceof Error && (
    error.message.includes('timeout') ||
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('ECONNREFUSED') ||
    error.name === 'AbortError'
  );

  // Generate contextual suggestions
  const suggestions: string[] = [];
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      suggestions.push('Verifique sua conexão com a internet');
      suggestions.push('Tente novamente em alguns segundos');
    } else if (error.message.includes('ECONNREFUSED')) {
      suggestions.push('Verifique se o servidor está rodando');
      suggestions.push('Confirme a URL do backend nas configurações');
    } else if (error.message.includes('404')) {
      suggestions.push('Verifique se o endpoint da API está correto');
      suggestions.push('Confirme se a versão da API está atualizada');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      suggestions.push('Verifique suas credenciais de acesso');
      suggestions.push('Faça login novamente se necessário');
    } else if (error.message.includes('500')) {
      suggestions.push('Erro interno do servidor');
      suggestions.push('Tente novamente em alguns minutos');
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Tente novamente');
    suggestions.push('Verifique sua conexão com a internet');
  }

  return {
    message: isRetryable ? 'Erro de conectividade temporário' : 'Erro na requisição',
    details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    isRetryable,
    suggestions
  };
}

/**
 * Enhanced API client with retry mechanisms and comprehensive error handling
 * @param endpoint API endpoint path
 * @param config Request configuration
 * @returns Promise with API response
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  config: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const startTime = Date.now();
  const maxRetries = config.retries ?? 3;
  const retryDelay = config.retryDelay ?? 1000;
  const timeout = config.timeout ?? 10000;

  console.log(`[API-REQUEST] Starting ${config.method} request to ${endpoint}`, {
    maxRetries,
    timeout,
    retryDelay
  });

  // Get backend URL
  const urlConfig = getBackendUrl(endpoint);
  if (!urlConfig.isValid) {
    console.error('[API-REQUEST] Invalid backend URL configuration:', urlConfig.error);
    return {
      success: false,
      error: urlConfig.error || 'Invalid backend URL configuration',
      status: 0,
      responseTime: Date.now() - startTime
    };
  }

  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptStartTime = Date.now();
    
    try {
      console.log(`[API-REQUEST] Attempt ${attempt + 1}/${maxRetries + 1} for ${config.method} ${endpoint}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Prepare request options
      const requestOptions: RequestInit = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        signal: controller.signal
      };

      // Add body for non-GET requests
      if (config.body && config.method !== 'GET') {
        requestOptions.body = JSON.stringify(config.body);
      }

      // Make the request
      const response = await fetch(urlConfig.url, requestOptions);
      clearTimeout(timeoutId);

      const responseTime = Date.now() - attemptStartTime;
      
      console.log(`[API-REQUEST] Response received: ${response.status} ${response.statusText} (${responseTime}ms)`);

      // Parse response
      let responseData: T | undefined;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : undefined;
      } catch {
        console.warn('[API-REQUEST] Failed to parse response as JSON, using text response');
      }

      // Check if response is successful
      if (response.ok) {
        console.log(`[API-REQUEST] Request successful after ${attempt + 1} attempt(s)`);
        return {
          success: true,
          data: responseData,
          status: response.status,
          responseTime: Date.now() - startTime,
          retryCount: attempt
        };
      }

      // Handle non-2xx responses
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      console.warn(`[API-REQUEST] Non-successful response: ${errorMessage}`);

      // Don't retry for client errors (4xx), only server errors (5xx) and network issues
      if (response.status >= 400 && response.status < 500) {
        return {
          success: false,
          error: errorMessage,
          status: response.status,
          responseTime: Date.now() - startTime,
          retryCount: attempt,
          data: responseData
        };
      }

      lastError = new Error(errorMessage);

    } catch (error) {
      const responseTime = Date.now() - attemptStartTime;
      lastError = error instanceof Error ? error : new Error('Unknown request error');
      
      console.error(`[API-REQUEST] Attempt ${attempt + 1} failed (${responseTime}ms):`, {
        error: lastError.message,
        type: lastError.name,
        endpoint,
        method: config.method
      });

      // Check if it's a timeout error
      if (lastError.name === 'AbortError') {
        console.error(`[API-REQUEST] Request timeout after ${timeout}ms`);
      }
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      const delayMs = retryDelay * Math.pow(2, attempt); // Exponential backoff
      console.log(`[API-REQUEST] Waiting ${delayMs}ms before retry ${attempt + 2}/${maxRetries + 1}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      retryCount++;
    }
  }

  // All attempts failed
  const finalError = lastError?.message || 'Request failed after all retry attempts';
  console.error(`[API-REQUEST] All ${maxRetries + 1} attempts failed for ${config.method} ${endpoint}:`, finalError);

  return {
    success: false,
    error: finalError,
    status: 0,
    responseTime: Date.now() - startTime,
    retryCount
  };
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options: Omit<ApiRequestConfig, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: Omit<ApiRequestConfig, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: Omit<ApiRequestConfig, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options: Omit<ApiRequestConfig, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Enhanced health check utility with detailed diagnostics
 * @param backendUrl Backend URL to check (optional, will use environment config if not provided)
 * @returns Promise with detailed health check result
 */
export async function performHealthCheck(backendUrl?: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    // Use provided URL or get from environment
    let targetUrl = backendUrl;
    if (!targetUrl) {
      const urlConfig = getBackendUrl('/health');
      if (!urlConfig.isValid) {
        return {
          isHealthy: false,
          responseTime: Date.now() - startTime,
          error: urlConfig.error || 'Invalid backend URL configuration',
          timestamp
        };
      }
      targetUrl = urlConfig.url;
    } else {
      targetUrl = `${backendUrl}/health`;
    }

    console.log(`[HEALTH-CHECK] Performing health check: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = response.ok;

    console.log(`[HEALTH-CHECK] Health check result: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${responseTime}ms, status: ${response.status})`);

    return {
      isHealthy,
      responseTime,
      status: response.status,
      timestamp,
      ...((!isHealthy) && { error: `HTTP ${response.status}: ${response.statusText}` })
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown health check error';
    
    console.error(`[HEALTH-CHECK] Health check failed (${responseTime}ms):`, errorMessage);
    
    return {
      isHealthy: false,
      responseTime,
      error: errorMessage,
      timestamp
    };
  }
}

/**
 * Utility function to check if backend is reachable (legacy compatibility)
 * @param backendUrl Backend URL to check
 * @returns Promise with connectivity status
 */
export async function checkBackendConnectivity(backendUrl: string): Promise<{
  isReachable: boolean;
  responseTime?: number;
  error?: string;
}> {
  const result = await performHealthCheck(backendUrl);
  return {
    isReachable: result.isHealthy,
    responseTime: result.responseTime,
    error: result.error
  };
}

/**
 * Comprehensive connection diagnostics utility
 * @returns Promise with detailed connection diagnostics
 */
export async function runConnectionDiagnostics(): Promise<{
  environment: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  connectivity: HealthCheckResult;
  recommendations: string[];
}> {
  console.log('[DIAGNOSTICS] Running comprehensive connection diagnostics...');
  
  // Check environment configuration
  const envStatus = environmentService.getConfigurationStatus();
  
  // Perform health check
  const healthCheck = await performHealthCheck();
  
  // Generate recommendations based on results
  const recommendations: string[] = [];
  
  if (!envStatus.isValid) {
    recommendations.push('Fix environment variable configuration');
    if (envStatus.details.errors.includes('NEXT_PUBLIC_BACKEND_API_URL not found')) {
      recommendations.push('Set NEXT_PUBLIC_BACKEND_API_URL environment variable');
    }
  }
  
  if (!healthCheck.isHealthy) {
    recommendations.push('Check backend server status');
    if (healthCheck.error?.includes('timeout')) {
      recommendations.push('Verify backend server is running and accessible');
    }
    if (healthCheck.error?.includes('ECONNREFUSED')) {
      recommendations.push('Ensure backend server is started on the correct port');
    }
  }
  
  if (healthCheck.responseTime > 5000) {
    recommendations.push('Backend response time is slow, check server performance');
  }
  
  const diagnostics = {
    environment: {
      isValid: envStatus.isValid,
      errors: envStatus.details.errors,
      warnings: envStatus.details.warnings
    },
    connectivity: healthCheck,
    recommendations
  };
  
  console.log('[DIAGNOSTICS] Connection diagnostics completed:', diagnostics);
  
  return diagnostics;
}