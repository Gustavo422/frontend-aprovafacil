/**
 * Frontend Startup Validation Service
 * Provides comprehensive startup checks for environment configuration
 */

import { environmentService, getEnvironmentConfig } from './environment-service';
import { checkBackendConnectivity } from './api-utils';

export interface StartupValidationResult {
  isValid: boolean;
  timestamp: string;
  environment: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fallbacksUsed: string[];
  };
  backend: {
    isReachable: boolean;
    responseTime?: number;
    error?: string;
  } | null;
  recommendations: string[];
  summary: string;
}

/**
 * Startup Validation Service Class
 */
export class StartupValidationService {
  private static instance: StartupValidationService;
  private lastValidation: StartupValidationResult | null = null;

  private constructor() {}

  public static getInstance(): StartupValidationService {
    if (!StartupValidationService.instance) {
      StartupValidationService.instance = new StartupValidationService();
    }
    return StartupValidationService.instance;
  }

  /**
   * Perform comprehensive startup validation
   */
  public async validate(): Promise<StartupValidationResult> {
    console.log('[STARTUP-VALIDATION] Starting comprehensive startup validation...');
    
    const timestamp = new Date().toISOString();
    const recommendations: string[] = [];

    // 1. Validate environment configuration
    console.log('[STARTUP-VALIDATION] Validating environment configuration...');
    const envConfig = getEnvironmentConfig();
    
    const environment = {
      isValid: envConfig.isValid,
      errors: envConfig.errors,
      warnings: envConfig.warnings,
      fallbacksUsed: envConfig.fallbacksUsed
    };

    // 2. Test backend connectivity if environment is valid
    let backend: StartupValidationResult['backend'] = null;
    
    if (envConfig.isValid) {
      console.log('[STARTUP-VALIDATION] Testing backend connectivity...');
      try {
        const backendUrl = environmentService.getBackendUrl().replace(/\/api.*$/, '');
        const connectivity = await checkBackendConnectivity(backendUrl);
        
        backend = {
          isReachable: connectivity.isReachable,
          responseTime: connectivity.responseTime,
          error: connectivity.error
        };

        if (!connectivity.isReachable) {
          recommendations.push('Check if the backend server is running');
          recommendations.push('Verify the NEXT_PUBLIC_BACKEND_API_URL environment variable');
          recommendations.push('Check network connectivity to the backend');
        }
      } catch (error) {
        backend = {
          isReachable: false,
          error: error instanceof Error ? error.message : 'Unknown connectivity error'
        };
        recommendations.push('Backend connectivity test failed - check server status');
      }
    } else {
      recommendations.push('Fix environment configuration before testing backend connectivity');
    }

    // 3. Generate recommendations based on validation results
    if (environment.errors.length > 0) {
      recommendations.push('Fix missing or invalid environment variables');
      recommendations.push('Check .env.local file exists and contains required variables');
    }

    if (environment.warnings.length > 0) {
      recommendations.push('Review environment warnings for potential issues');
    }

    if (environment.fallbacksUsed.length > 0) {
      recommendations.push('Consider setting explicit values for variables using fallbacks');
    }

    // 4. Determine overall validation status
    const isValid = environment.isValid && (backend?.isReachable ?? false);
    
    let summary: string;
    if (isValid) {
      summary = 'Startup validation passed - application ready';
    } else if (!environment.isValid) {
      summary = `Environment configuration invalid (${environment.errors.length} errors)`;
    } else if (backend && !backend.isReachable) {
      summary = 'Environment valid but backend unreachable';
    } else {
      summary = 'Startup validation failed';
    }

    const result: StartupValidationResult = {
      isValid,
      timestamp,
      environment,
      backend,
      recommendations,
      summary
    };

    this.lastValidation = result;

    // Log validation results
    this.logValidationResults(result);

    return result;
  }

  /**
   * Get the last validation result without re-running validation
   */
  public getLastValidation(): StartupValidationResult | null {
    return this.lastValidation;
  }

  /**
   * Check if the application is ready to start
   */
  public async isApplicationReady(): Promise<boolean> {
    const result = await this.validate();
    return result.isValid;
  }

  /**
   * Get startup health status for monitoring
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: StartupValidationResult;
  }> {
    const validation = await this.validate();
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (validation.isValid) {
      status = 'healthy';
    } else if (validation.environment.isValid) {
      status = 'degraded'; // Environment OK but backend issues
    } else {
      status = 'unhealthy'; // Environment configuration issues
    }

    return {
      status,
      details: validation
    };
  }

  /**
   * Log validation results in a structured format
   */
  private logValidationResults(result: StartupValidationResult): void {
    console.log('[STARTUP-VALIDATION] Validation Results:');
    console.log(`[STARTUP-VALIDATION] Overall Status: ${result.isValid ? '✓ VALID' : '✗ INVALID'}`);
    console.log(`[STARTUP-VALIDATION] Summary: ${result.summary}`);
    
    // Environment results
    console.log('[STARTUP-VALIDATION] Environment Configuration:');
    console.log(`[STARTUP-VALIDATION]   Status: ${result.environment.isValid ? '✓ Valid' : '✗ Invalid'}`);
    console.log(`[STARTUP-VALIDATION]   Errors: ${result.environment.errors.length}`);
    console.log(`[STARTUP-VALIDATION]   Warnings: ${result.environment.warnings.length}`);
    console.log(`[STARTUP-VALIDATION]   Fallbacks Used: ${result.environment.fallbacksUsed.length}`);

    if (result.environment.errors.length > 0) {
      console.error('[STARTUP-VALIDATION] Environment Errors:');
      result.environment.errors.forEach((error, index) => {
        console.error(`[STARTUP-VALIDATION]   ${index + 1}. ${error}`);
      });
    }

    if (result.environment.warnings.length > 0) {
      console.warn('[STARTUP-VALIDATION] Environment Warnings:');
      result.environment.warnings.forEach((warning, index) => {
        console.warn(`[STARTUP-VALIDATION]   ${index + 1}. ${warning}`);
      });
    }

    // Backend connectivity results
    if (result.backend) {
      console.log('[STARTUP-VALIDATION] Backend Connectivity:');
      console.log(`[STARTUP-VALIDATION]   Status: ${result.backend.isReachable ? '✓ Reachable' : '✗ Unreachable'}`);
      if (result.backend.responseTime) {
        console.log(`[STARTUP-VALIDATION]   Response Time: ${result.backend.responseTime}ms`);
      }
      if (result.backend.error) {
        console.error(`[STARTUP-VALIDATION]   Error: ${result.backend.error}`);
      }
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      console.log('[STARTUP-VALIDATION] Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`[STARTUP-VALIDATION]   ${index + 1}. ${rec}`);
      });
    }

    console.log(`[STARTUP-VALIDATION] Validation completed at ${result.timestamp}`);
  }
}

// Export singleton instance
export const startupValidationService = StartupValidationService.getInstance();

/**
 * Convenience function to run startup validation
 */
export const validateApplicationStartup = async (): Promise<StartupValidationResult> => {
  return startupValidationService.validate();
};

/**
 * Convenience function to check if application is ready
 */
export const isApplicationReady = async (): Promise<boolean> => {
  return startupValidationService.isApplicationReady();
};

/**
 * Enhanced startup validation that can exit process in production
 */
export const validateEnvironmentOnStartup = async (): Promise<StartupValidationResult> => {
  console.log('[ENV-STARTUP] Starting frontend environment validation...');
  
  const result = await validateApplicationStartup();
  
  if (!result.isValid) {
    console.error('[ENV-STARTUP] Startup validation failed!');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('[ENV-STARTUP] Critical startup validation failure in production');
      console.error('[ENV-STARTUP] Application may not function correctly');
      
      // In a Next.js environment, we can't exit the process, but we can log critical errors
      console.error('[ENV-STARTUP] Please fix the following issues:');
      result.recommendations.forEach((rec, index) => {
        console.error(`[ENV-STARTUP] ${index + 1}. ${rec}`);
      });
    }
  } else {
    console.log('[ENV-STARTUP] Frontend startup validation completed successfully');
  }
  
  return result;
};

/**
 * Get startup validation status for health checks
 */
export const getStartupHealthStatus = async () => {
  return startupValidationService.getHealthStatus();
};