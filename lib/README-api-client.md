# Enhanced API Client Documentation

This document describes the enhanced API client utilities with retry mechanisms, timeout handling, and comprehensive error handling.

## Features

### 🔄 Automatic Retry Mechanisms
- Configurable retry attempts for failed requests
- Exponential backoff for retry delays
- Smart retry logic (only retries server errors and network issues, not client errors)

### ⏱️ Timeout Handling
- Configurable request timeouts
- Automatic request cancellation on timeout
- Detailed timeout error reporting

### 🔍 Comprehensive Error Handling
- Detailed error logging with context
- User-friendly error messages in Portuguese
- Contextual suggestions for error resolution
- Distinction between retryable and non-retryable errors

### 🏥 Health Check Utilities
- Backend connectivity verification
- Response time measurement
- Detailed health status reporting

### 🔧 Connection Diagnostics
- Environment configuration validation
- Connectivity testing
- Automated troubleshooting recommendations

## API Reference

### Core Functions

#### `apiRequest<T>(endpoint: string, config: ApiRequestConfig): Promise<ApiResponse<T>>`

Makes an HTTP request with retry mechanisms and comprehensive error handling.

**Parameters:**
- `endpoint`: API endpoint path (e.g., '/api/users')
- `config`: Request configuration object

**Configuration Options:**
```typescript
interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;        // Default: 10000ms
  retries?: number;        // Default: 3
  retryDelay?: number;     // Default: 1000ms (with exponential backoff)
}
```

**Response:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  responseTime: number;
  retryCount?: number;
}
```

**Example:**
```typescript
const result = await apiRequest('/api/users', {
  method: 'GET',
  timeout: 5000,
  retries: 3,
  retryDelay: 1000
});

if (result.success) {
  console.log('Data:', result.data);
  console.log('Response time:', result.responseTime + 'ms');
} else {
  console.error('Error:', result.error);
}
```

### Convenience Methods

#### `apiGet<T>(endpoint: string, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>`

Convenience method for GET requests.

```typescript
const users = await apiGet('/api/users', {
  timeout: 5000,
  retries: 2
});
```

#### `apiPost<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>`

Convenience method for POST requests.

```typescript
const newUser = await apiPost('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, {
  timeout: 10000,
  retries: 1
});
```

#### `apiPut<T>(endpoint: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>`

Convenience method for PUT requests.

#### `apiDelete<T>(endpoint: string, options?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>`

Convenience method for DELETE requests.

### Health Check Functions

#### `performHealthCheck(backendUrl?: string): Promise<HealthCheckResult>`

Performs a comprehensive health check on the backend.

```typescript
const health = await performHealthCheck();
console.log('Backend healthy:', health.isHealthy);
console.log('Response time:', health.responseTime + 'ms');
```

#### `runConnectionDiagnostics(): Promise<DiagnosticsResult>`

Runs comprehensive connection diagnostics including environment validation and connectivity testing.

```typescript
const diagnostics = await runConnectionDiagnostics();
console.log('Environment valid:', diagnostics.environment.isValid);
console.log('Backend healthy:', diagnostics.connectivity.isHealthy);
console.log('Recommendations:', diagnostics.recommendations);
```

### Error Handling

#### `handleApiError(error: unknown, context: ErrorContext): ErrorInfo`

Processes and categorizes API errors, providing user-friendly messages and suggestions.

```typescript
try {
  await apiGet('/api/data');
} catch (error) {
  const errorInfo = handleApiError(error, {
    endpoint: '/api/data',
    method: 'GET'
  });
  
  console.log('Error message:', errorInfo.message);
  console.log('Is retryable:', errorInfo.isRetryable);
  console.log('Suggestions:', errorInfo.suggestions);
}
```

## Usage Examples

### Basic GET Request with Retries

```typescript
import { apiGet } from './api-utils';

async function fetchUsers() {
  try {
    const result = await apiGet('/api/users', {
      timeout: 5000,
      retries: 3,
      retryDelay: 1000
    });

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}
```

### POST Request with Custom Headers

```typescript
import { apiPost } from './api-utils';

async function createUser(userData: any, authToken: string) {
  const result = await apiPost('/api/users', userData, {
    timeout: 10000,
    retries: 2,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-Client-Version': '1.0.0'
    }
  });

  if (result.success) {
    console.log('User created successfully');
    console.log('Response time:', result.responseTime + 'ms');
    return result.data;
  } else {
    throw new Error(result.error);
  }
}
```

### Login Flow with Error Handling

```typescript
import { apiPost, handleApiError } from './api-utils';

async function login(email: string, password: string) {
  try {
    const result = await apiPost('/api/auth/login', 
      { email, password },
      {
        timeout: 10000,
        retries: 2,
        retryDelay: 1000
      }
    );

    if (result.success) {
      return result.data;
    } else {
      // Handle specific HTTP status codes
      if (result.status === 401) {
        throw new Error('Credenciais inválidas');
      } else if (result.status === 429) {
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        throw new Error(result.error || 'Erro no login');
      }
    }
  } catch (error) {
    const errorInfo = handleApiError(error, {
      endpoint: '/api/auth/login',
      method: 'POST'
    });
    
    console.error('Login error:', errorInfo.message);
    console.log('Suggestions:', errorInfo.suggestions);
    
    throw new Error(errorInfo.message);
  }
}
```

### Health Check and Diagnostics

```typescript
import { performHealthCheck, runConnectionDiagnostics } from './api-utils';

async function checkSystemHealth() {
  // Quick health check
  const health = await performHealthCheck();
  
  if (!health.isHealthy) {
    console.error('Backend is unhealthy:', health.error);
    
    // Run detailed diagnostics
    const diagnostics = await runConnectionDiagnostics();
    
    console.log('Environment issues:', diagnostics.environment.errors);
    console.log('Recommendations:');
    diagnostics.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    return false;
  }
  
  console.log('System is healthy');
  return true;
}
```

## Error Types and Handling

### Retryable Errors
These errors will trigger automatic retries:
- Network timeouts (`AbortError`)
- Connection refused (`ECONNREFUSED`)
- Network errors
- Server errors (5xx status codes)

### Non-Retryable Errors
These errors will not trigger retries:
- Client errors (4xx status codes)
- Authentication errors (401, 403)
- Validation errors (400, 422)

### Error Messages
All error messages are provided in Portuguese for better user experience:

- **Timeout**: "Erro de conectividade temporário"
- **Network**: "Erro de conectividade temporário"
- **Authentication**: "Erro na requisição"
- **Server Error**: "Erro na requisição"

### Error Suggestions
The system provides contextual suggestions based on error types:

- **Timeout**: "Verifique sua conexão com a internet", "Tente novamente em alguns segundos"
- **Connection Refused**: "Verifique se o servidor está rodando", "Confirme a URL do backend"
- **Authentication**: "Verifique suas credenciais", "Faça login novamente"
- **Server Error**: "Erro interno do servidor", "Tente novamente em alguns minutos"

## Configuration

### Default Values
```typescript
const defaultConfig = {
  timeout: 10000,      // 10 seconds
  retries: 3,          // 3 retry attempts
  retryDelay: 1000     // 1 second base delay (with exponential backoff)
};
```

### Exponential Backoff
Retry delays increase exponentially:
- 1st retry: 1000ms
- 2nd retry: 2000ms
- 3rd retry: 4000ms

### Environment Variables
The API client uses these environment variables:
- `NEXT_PUBLIC_BACKEND_API_URL`: Backend API base URL
- `NODE_ENV`: Environment mode (affects error detail level)

## Best Practices

1. **Always handle errors**: Use try-catch blocks and the `handleApiError` function
2. **Set appropriate timeouts**: Longer for complex operations, shorter for simple requests
3. **Use retries judiciously**: More retries for critical operations, fewer for user-initiated actions
4. **Check health before critical operations**: Use `performHealthCheck()` before important workflows
5. **Log retry information**: Monitor `retryCount` in responses to identify problematic endpoints
6. **Use diagnostics for troubleshooting**: Run `runConnectionDiagnostics()` when issues occur

## Migration from Legacy API

### Old Way
```typescript
// Legacy approach
const response = await fetch('/api/users');
if (!response.ok) {
  throw new Error('Request failed');
}
const data = await response.json();
```

### New Way
```typescript
// Enhanced approach
const result = await apiGet('/api/users', {
  timeout: 5000,
  retries: 2
});

if (result.success) {
  const data = result.data;
  console.log('Response time:', result.responseTime + 'ms');
} else {
  console.error('Request failed:', result.error);
}
```

## Testing

The enhanced API client includes comprehensive test coverage:
- Unit tests for all functions
- Mock implementations for testing
- Error scenario testing
- Retry mechanism testing
- Timeout handling testing

Run tests with:
```bash
npm test -- tests/unit/api-utils.test.ts
```