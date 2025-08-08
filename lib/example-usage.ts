/**
 * Example usage of the enhanced environment service and API utils
 * This file demonstrates how to use the new environment handling features
 */

import { getBackendUrl, createEnvironmentErrorResponse, checkBackendConnectivity, withErrorHandling } from './api-utils';
import { environmentService, getEnvironmentConfig } from './environment-service';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Example API route handler that demonstrates proper environment handling
 */
export async function exampleApiHandler(request: NextRequest) {
  return withErrorHandling(async () => {
    // Get backend URL with comprehensive validation
    const backendConfig = getBackendUrl('/api/auth/login');
    
    if (!backendConfig.isValid) {
      console.error('[EXAMPLE-API] Backend configuration invalid:', backendConfig.error);
      return createEnvironmentErrorResponse(backendConfig);
    }

    // Log if fallback is being used
    if (backendConfig.fallbackUsed) {
      console.warn('[EXAMPLE-API] Using fallback backend URL');
    }

    // Check backend connectivity before making requests
    const connectivity = await checkBackendConnectivity(backendConfig.url.replace('/api/auth/login', ''));
    
    if (!connectivity.isReachable) {
      console.error('[EXAMPLE-API] Backend not reachable:', connectivity.error);
      return NextResponse.json({
        error: 'Backend não está disponível',
        details: connectivity.error,
        responseTime: connectivity.responseTime,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Make the actual API request
    const response = await fetch(backendConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json())
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  });
}

/**
 * Example function to check environment status for debugging
 */
export function getEnvironmentDebugInfo() {
  const envService = environmentService;
  const status = envService.getConfigurationStatus();
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: {
      isValid: status.isValid,
      summary: status.summary,
      errors: status.details.errors,
      warnings: status.details.warnings,
      fallbacksUsed: status.details.fallbacksUsed,
      variables: Object.entries(status.details.variables).map(([key, info]) => ({
        name: key,
        set: info.set,
        valid: info.valid,
        category: info.category
      }))
    },
    backendUrl: envService.isConfigured() ? envService.getBackendUrl() : 'Not configured'
  };
}

/**
 * Example middleware function that validates environment on startup
 */
export function validateEnvironmentOnStartup() {
  console.log('[ENV-STARTUP] Validating environment configuration...');
  
  const config = getEnvironmentConfig();
  
  if (!config.isValid) {
    console.error('[ENV-STARTUP] Environment configuration is invalid!');
    console.error('[ENV-STARTUP] Errors:', config.errors);
    
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      console.error('[ENV-STARTUP] Exiting due to invalid configuration in production');
      process.exit(1);
    }
  } else {
    console.log('[ENV-STARTUP] Environment configuration is valid');
    
    if (config.warnings.length > 0) {
      console.warn('[ENV-STARTUP] Configuration warnings:', config.warnings);
    }
    
    if (config.fallbacksUsed.length > 0) {
      console.warn('[ENV-STARTUP] Using fallback values for:', config.fallbacksUsed);
    }
  }
  
  return config;
}

/**
 * Example health check function that includes environment status
 */
export async function healthCheckWithEnvironment() {
  const envStatus = getEnvironmentDebugInfo();
  const backendUrl = envStatus.backendUrl;
  
  let backendHealth = null;
  if (backendUrl !== 'Not configured') {
    try {
      backendHealth = await checkBackendConnectivity(backendUrl);
    } catch (error) {
      backendHealth = {
        isReachable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envStatus,
    backend: backendHealth,
    overall: {
      healthy: envStatus.configuration.isValid && (backendHealth?.isReachable ?? false),
      issues: [
        ...envStatus.configuration.errors,
        ...(backendHealth && !backendHealth.isReachable ? [`Backend unreachable: ${backendHealth.error}`] : [])
      ]
    }
  };
}
/*
*
 * Enhanced API Client Examples
 * Demonstrates the new retry mechanisms and error handling features
 */

import { 
  apiRequest, 
  apiGet, 
  apiPost, 
  performHealthCheck,
  runConnectionDiagnostics,
  handleApiError
} from './api-utils';

/**
 * Example: Simple GET request with automatic retries
 */
export async function exampleGetWithRetries() {
  try {
    const result = await apiGet('/api/users', {
      timeout: 5000,
      retries: 3,
      retryDelay: 1000
    });

    if (result.success) {
      console.log('GET request successful:', result.data);
      console.log('Response time:', `${result.responseTime }ms`);
      console.log('Retry count:', result.retryCount);
      return result.data;
    } 
      console.error('GET request failed:', result.error);
      throw new Error(result.error);
    
  } catch (error) {
    const errorInfo = handleApiError(error, {
      endpoint: '/api/users',
      method: 'GET'
    });
    console.error('Request error:', errorInfo.message);
    console.log('Suggestions:', errorInfo.suggestions);
    throw error;
  }
}

/**
 * Example: POST request with custom headers and retry configuration
 */
export async function examplePostWithCustomConfig() {
  try {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    
    const result = await apiPost('/api/users', userData, {
      timeout: 10000,
      retries: 2,
      retryDelay: 2000,
      headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value'
      }
    });

    if (result.success) {
      console.log('POST request successful:', result.data);
      console.log('Status:', result.status);
      return result.data;
    } 
      console.error('POST request failed:', result.error);
      throw new Error(result.error);
    
  } catch (error) {
    const errorInfo = handleApiError(error, {
      endpoint: '/api/users',
      method: 'POST'
    });
    console.error('Request error:', errorInfo);
    throw error;
  }
}

/**
 * Example: Advanced API request with full configuration
 */
export async function exampleAdvancedApiRequest() {
  try {
    const result = await apiRequest('/api/complex-operation', {
      method: 'PUT',
      body: { operation: 'update', data: { id: 1, value: 'new value' } },
      timeout: 15000,
      retries: 5,
      retryDelay: 1500,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      }
    });

    console.log('Advanced request result:', {
      success: result.success,
      status: result.status,
      responseTime: result.responseTime,
      retryCount: result.retryCount,
      data: result.data
    });

    return result;
  } catch (error) {
    console.error('Advanced request failed:', error);
    throw error;
  }
}

/**
 * Example: Enhanced health check with detailed diagnostics
 */
export async function exampleEnhancedHealthCheck() {
  try {
    const healthResult = await performHealthCheck();
    
    console.log('Health check result:', {
      isHealthy: healthResult.isHealthy,
      responseTime: `${healthResult.responseTime }ms`,
      status: healthResult.status,
      timestamp: healthResult.timestamp,
      error: healthResult.error
    });

    return healthResult;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

/**
 * Example: Comprehensive connection diagnostics
 */
export async function exampleConnectionDiagnostics() {
  try {
    const diagnostics = await runConnectionDiagnostics();
    
    console.log('Diagnostics result:', {
      environment: diagnostics.environment,
      connectivity: diagnostics.connectivity,
      recommendations: diagnostics.recommendations
    });

    if (diagnostics.recommendations.length > 0) {
      console.log('\nRecommendations:');
      diagnostics.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    return diagnostics;
  } catch (error) {
    console.error('Diagnostics failed:', error);
    throw error;
  }
}

/**
 * Example: Error handling for different types of errors
 */
export function exampleErrorHandling() {
  console.log('=== Error Handling Examples ===');

  // Timeout error
  const timeoutError = new Error('Request timeout');
  timeoutError.name = 'AbortError';
  const timeoutResult = handleApiError(timeoutError, {
    endpoint: '/api/slow-endpoint',
    method: 'GET'
  });
  console.log('Timeout error handling:', timeoutResult);

  // Network error
  const networkError = new Error('ECONNREFUSED');
  const networkResult = handleApiError(networkError, {
    endpoint: '/api/test',
    method: 'POST'
  });
  console.log('Network error handling:', networkResult);

  // Authentication error
  const authError = new Error('HTTP 401: Unauthorized');
  const authResult = handleApiError(authError, {
    endpoint: '/api/protected',
    method: 'GET'
  });
  console.log('Auth error handling:', authResult);

  // Server error
  const serverError = new Error('HTTP 500: Internal Server Error');
  const serverResult = handleApiError(serverError, {
    endpoint: '/api/data',
    method: 'GET'
  });
  console.log('Server error handling:', serverResult);

  return {
    timeout: timeoutResult,
    network: networkResult,
    auth: authResult,
    server: serverResult
  };
}

/**
 * Example: Login flow with enhanced error handling
 */
export async function exampleLoginFlow(email: string, password: string) {
  try {
    console.log('[LOGIN] Starting login process...');
    
    // First, check if backend is healthy
    const healthCheck = await performHealthCheck();
    if (!healthCheck.isHealthy) {
      throw new Error(`Backend is not healthy: ${healthCheck.error}`);
    }

    // Attempt login with retry mechanism
    const loginResult = await apiPost('/api/auth/login', 
      { email, password },
      {
        timeout: 10000,
        retries: 2,
        retryDelay: 1000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (loginResult.success) {
      console.log('[LOGIN] Login successful');
      console.log('[LOGIN] Response time:', `${loginResult.responseTime }ms`);
      if (loginResult.retryCount && loginResult.retryCount > 0) {
        console.log('[LOGIN] Required', loginResult.retryCount, 'retries');
      }
      return loginResult.data;
    } 
      console.error('[LOGIN] Login failed:', loginResult.error);
      
      // Handle specific error cases
      if (loginResult.status === 401) {
        throw new Error('Credenciais inválidas');
      } else if (loginResult.status === 429) {
        throw new Error('Muitas tentativas de login. Tente novamente mais tarde.');
      } else if (loginResult.status >= 500) {
        throw new Error('Erro interno do servidor. Tente novamente.');
      } else {
        throw new Error(loginResult.error || 'Erro desconhecido no login');
      }
    
  } catch (error) {
    const errorInfo = handleApiError(error, {
      endpoint: '/api/auth/login',
      method: 'POST'
    });
    
    console.error('[LOGIN] Login error:', errorInfo.message);
    console.log('[LOGIN] Error suggestions:', errorInfo.suggestions);
    
    // Return user-friendly error message
    throw new Error(errorInfo.message);
  }
}

/**
 * Example: Batch operations with individual error handling
 */
export async function exampleBatchOperations(operations: Array<{id: string, data: unknown}>) {
  const results = [];
  
  for (const operation of operations) {
    try {
      console.log(`[BATCH] Processing operation ${operation.id}...`);
      
      const result = await apiPost(`/api/operations/${operation.id}`, operation.data, {
        timeout: 5000,
        retries: 1,
        retryDelay: 500
      });
      
      if (result.success) {
        results.push({
          id: operation.id,
          success: true,
          data: result.data,
          responseTime: result.responseTime
        });
        console.log(`[BATCH] Operation ${operation.id} completed successfully`);
      } else {
        results.push({
          id: operation.id,
          success: false,
          error: result.error,
          status: result.status
        });
        console.error(`[BATCH] Operation ${operation.id} failed:`, result.error);
      }
    } catch (error) {
      const errorInfo = handleApiError(error, {
        endpoint: `/api/operations/${operation.id}`,
        method: 'POST'
      });
      
      results.push({
        id: operation.id,
        success: false,
        error: errorInfo.message,
        isRetryable: errorInfo.isRetryable,
        suggestions: errorInfo.suggestions
      });
      
      console.error(`[BATCH] Operation ${operation.id} error:`, errorInfo.message);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`[BATCH] Batch completed: ${successCount} successful, ${failureCount} failed`);
  
  return {
    results,
    summary: {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      successRate: (successCount / results.length) * 100
    }
  };
}