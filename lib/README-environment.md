# Environment Variable Management

This document explains the enhanced environment variable management system implemented to fix frontend environment loading issues.

## Overview

The system provides:
- **Comprehensive validation** of environment variables with detailed error messages
- **Fallback mechanisms** for missing environment variables
- **Extensive logging** for debugging environment issues
- **Centralized configuration management** through the EnvironmentService
- **API utilities** with built-in environment validation

## Components

### EnvironmentService

The `EnvironmentService` is a singleton that manages all environment variable validation and access.

```typescript
import { environmentService } from './environment-service';

// Get validated configuration
const config = environmentService.getConfig();

// Get backend URL (throws if invalid)
const backendUrl = environmentService.getBackendUrl();

// Check if environment is properly configured
const isConfigured = environmentService.isConfigured();

// Get detailed status for debugging
const status = environmentService.getConfigurationStatus();
```

### API Utils

Enhanced API utilities that integrate with the environment service:

```typescript
import { getBackendUrl, createEnvironmentErrorResponse } from './api-utils';

// Get backend URL with validation
const result = getBackendUrl('/api/endpoint');
if (!result.isValid) {
  return createEnvironmentErrorResponse(result);
}

// Use the validated URL
const response = await fetch(result.url, { ... });
```

## Environment Variables

### Required Variables

- `NEXT_PUBLIC_BACKEND_API_URL`: Backend API URL (fallback: `http://localhost:5000`)

### Optional Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Features

### 1. Validation with Fallbacks

The system validates environment variables and provides fallbacks for missing required variables:

```typescript
// If NEXT_PUBLIC_BACKEND_API_URL is missing, uses http://localhost:5000
const config = environmentService.getConfig();
console.log(config.fallbacksUsed); // ['NEXT_PUBLIC_BACKEND_API_URL']
```

### 2. Detailed Error Messages

When validation fails, you get specific error messages:

```typescript
const config = environmentService.getConfig();
if (!config.isValid) {
  console.log(config.errors);
  // ["Environment variable NEXT_PUBLIC_BACKEND_API_URL has invalid format. Backend API URL must be a valid HTTP/HTTPS URL"]
}
```

### 3. Comprehensive Logging

All environment operations are logged with prefixes for easy debugging:

```
[ENV-SERVICE] Validating environment configuration...
[ENV-SERVICE] Checking NEXT_PUBLIC_BACKEND_API_URL: SET
[ENV-SERVICE] NEXT_PUBLIC_BACKEND_API_URL validation passed
[ENV-SERVICE] Validation complete. Valid: true, Errors: 0, Warnings: 0, Fallbacks: 0
```

### 4. Configuration Status

Get detailed status information for debugging:

```typescript
const status = environmentService.getConfigurationStatus();
console.log(status);
// {
//   isValid: true,
//   summary: "Configuration valid",
//   details: {
//     errors: [],
//     warnings: [],
//     fallbacksUsed: [],
//     variables: {
//       NEXT_PUBLIC_BACKEND_API_URL: { set: true, valid: true, category: 'api' }
//     }
//   }
// }
```

### 5. Backend Connectivity Checking

Check if the backend is reachable:

```typescript
import { checkBackendConnectivity } from './api-utils';

const connectivity = await checkBackendConnectivity('http://localhost:5000');
if (!connectivity.isReachable) {
  console.log(`Backend unreachable: ${connectivity.error}`);
}
```

## Usage Examples

### In API Routes

```typescript
import { getBackendUrl, createEnvironmentErrorResponse, withErrorHandling } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const backendConfig = getBackendUrl('/api/auth/login');
    
    if (!backendConfig.isValid) {
      return createEnvironmentErrorResponse(backendConfig);
    }
    
    const response = await fetch(backendConfig.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await request.json())
    });
    
    return NextResponse.json(await response.json());
  });
}
```

### In Components

```typescript
import { environmentService } from '@/lib/environment-service';

export function DebugPanel() {
  const status = environmentService.getConfigurationStatus();
  
  return (
    <div>
      <h3>Environment Status: {status.summary}</h3>
      {status.details.errors.length > 0 && (
        <div className="errors">
          {status.details.errors.map(error => <p key={error}>{error}</p>)}
        </div>
      )}
    </div>
  );
}
```

### Startup Validation

```typescript
import { validateEnvironmentOnStartup } from '@/lib/example-usage';

// In your app startup (e.g., middleware or layout)
validateEnvironmentOnStartup();
```

## Troubleshooting

### Common Issues

1. **"Backend URL is missing"**
   - Check that `NEXT_PUBLIC_BACKEND_API_URL` is set in your `.env` file
   - Restart your development server after adding environment variables

2. **"Invalid backend URL format"**
   - Ensure the URL starts with `http://` or `https://`
   - Check for typos in the URL

3. **"Backend not reachable"**
   - Verify the backend server is running
   - Check the URL and port number
   - Look for network connectivity issues

### Debug Information

Use the debug functions to get detailed information:

```typescript
import { getEnvironmentDebugInfo, healthCheckWithEnvironment } from '@/lib/example-usage';

// Get environment debug info
console.log(getEnvironmentDebugInfo());

// Get full health check including backend connectivity
const health = await healthCheckWithEnvironment();
console.log(health);
```

## Testing

The system includes comprehensive tests:

```bash
npm test -- tests/unit/environment-service.test.ts
npm test -- tests/unit/api-utils.test.ts
```

## Migration Guide

If you're updating existing code:

1. Replace direct `process.env.NEXT_PUBLIC_BACKEND_API_URL` usage with `getBackendUrl()`
2. Add error handling for invalid environment configurations
3. Use `withErrorHandling()` wrapper for API routes
4. Consider adding startup validation for critical applications