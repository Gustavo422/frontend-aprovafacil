/**
 * Environment Service
 * Centralized service for environment variable management and validation
 */

// Environment configuration interface
export interface EnvironmentConfig {
  backendUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fallbacksUsed: string[];
}

// Environment variable definitions with validation rules
const ENV_DEFINITIONS = {
  NEXT_PUBLIC_BACKEND_API_URL: {
    required: true,
    fallback: 'http://localhost:5000',
    pattern: /^https?:\/\/.+/,
    description: 'Backend API URL must be a valid HTTP/HTTPS URL',
    category: 'api'
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    required: false,
    fallback: '',
    pattern: /^https:\/\/.+\.supabase\.co$/,
    description: 'Supabase URL must be a valid Supabase URL',
    category: 'database'
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: false,
    fallback: '',
    pattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    description: 'Supabase anon key must be a valid JWT token',
    category: 'database'
  }
} as const;

type EnvKey = keyof typeof ENV_DEFINITIONS;

/**
 * Environment Service Class
 * Provides centralized environment variable management
 */
export class EnvironmentService {
  private static instance: EnvironmentService;
  private config: EnvironmentConfig | null = null;
  private lastValidation = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  /**
   * Validates and caches environment configuration
   */
  private validateAndCacheConfig(): EnvironmentConfig {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.config && (now - this.lastValidation) < this.CACHE_DURATION) {
      return this.config;
    }

    console.log('[ENV-SERVICE] Validating environment configuration...');

    const errors: string[] = [];
    const warnings: string[] = [];
    const fallbacksUsed: string[] = [];
    const values: Record<string, string> = {};

    // Validate each environment variable
    Object.entries(ENV_DEFINITIONS).forEach(([key, definition]) => {
      const envKey = key as EnvKey;
      let value = process.env[envKey];

      console.log(`[ENV-SERVICE] Checking ${envKey}: ${value ? 'SET' : 'NOT SET'}`);

      // Handle missing required variables
      if (!value || value.trim() === '') {
        if (definition.required) {
          if (definition.fallback) {
            value = definition.fallback;
            fallbacksUsed.push(envKey);
            warnings.push(`Using fallback for required variable ${envKey}: ${definition.fallback}`);
            console.warn(`[ENV-SERVICE] Using fallback for ${envKey}`);
          } else {
            errors.push(`Required environment variable ${envKey} is missing. ${(definition as { description: string }).description}`);
            console.error(`[ENV-SERVICE] Missing required variable: ${envKey}`);
          }
        } else {
          console.log(`[ENV-SERVICE] Optional variable ${envKey} not set`);
        }
      }

      // Validate format if value exists
      if (value && value.trim() !== '') {
        if (definition.pattern && !definition.pattern.test(value)) {
          const errorMsg = `Environment variable ${envKey} has invalid format. ${definition.description}`;
          
          if (definition.required && definition.fallback) {
            value = definition.fallback;
            fallbacksUsed.push(envKey);
            warnings.push(`${errorMsg} Using fallback: ${definition.fallback}`);
            console.warn(`[ENV-SERVICE] Invalid format for ${envKey}, using fallback`);
          } else {
            errors.push(errorMsg);
            console.error(`[ENV-SERVICE] Invalid format for ${envKey}`);
          }
        } else {
          console.log(`[ENV-SERVICE] ${envKey} validation passed`);
        }
      }

      if (value && value.trim() !== '') {
        values[envKey] = value;
      }
    });

    // Create configuration object
    this.config = {
      backendUrl: values.NEXT_PUBLIC_BACKEND_API_URL || '',
      supabaseUrl: values.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: values.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isValid: errors.length === 0,
      errors,
      warnings,
      fallbacksUsed
    };

    this.lastValidation = now;

    // Log validation summary
    console.log(`[ENV-SERVICE] Validation complete. Valid: ${this.config.isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}, Fallbacks: ${fallbacksUsed.length}`);

    return this.config;
  }

  /**
   * Get current environment configuration
   */
  public getConfig(): EnvironmentConfig {
    return this.validateAndCacheConfig();
  }

  /**
   * Get backend URL with validation
   */
  public getBackendUrl(): string {
    const config = this.getConfig();
    if (!config.isValid) {
      throw new Error(`Environment configuration invalid: ${config.errors.join(', ')}`);
    }
    return config.backendUrl;
  }

  /**
   * Check if environment is properly configured
   */
  public isConfigured(): boolean {
    return this.getConfig().isValid;
  }

  /**
   * Get detailed configuration status for debugging
   */
  public getConfigurationStatus(): {
    isValid: boolean;
    summary: string;
    details: {
      errors: string[];
      warnings: string[];
      fallbacksUsed: string[];
      variables: Record<string, { set: boolean; valid: boolean; category: string }>;
    };
  } {
    const config = this.getConfig();
    const variables: Record<string, { set: boolean; valid: boolean; category: string }> = {};

    // Check each variable status
    Object.entries(ENV_DEFINITIONS).forEach(([key, definition]) => {
      const envKey = key as EnvKey;
      const value = process.env[envKey];
      const isSet = !!(value && value.trim() !== '');
      const isValid = !isSet || !definition.pattern || definition.pattern.test(value);

      variables[envKey] = {
        set: isSet,
        valid: isValid,
        category: definition.category
      };
    });

    const summary = config.isValid 
      ? `Configuration valid${config.fallbacksUsed.length > 0 ? ' (with fallbacks)' : ''}`
      : `Configuration invalid: ${config.errors.length} error(s)`;

    return {
      isValid: config.isValid,
      summary,
      details: {
        errors: config.errors,
        warnings: config.warnings,
        fallbacksUsed: config.fallbacksUsed,
        variables
      }
    };
  }

  /**
   * Force refresh of environment configuration
   */
  public refresh(): EnvironmentConfig {
    this.config = null;
    this.lastValidation = 0;
    return this.validateAndCacheConfig();
  }

  /**
   * Get environment variable with fallback
   */
  public getEnvVar(key: EnvKey): string | undefined {
    const definition = ENV_DEFINITIONS[key];
    const value = process.env[key];

    if (!value || value.trim() === '') {
      return definition.fallback || undefined;
    }

    return value;
  }
}

// Export singleton instance
export const environmentService = EnvironmentService.getInstance();

// Export convenience functions
export const getBackendUrl = () => environmentService.getBackendUrl();
export const isEnvironmentConfigured = () => environmentService.isConfigured();
export const getEnvironmentConfig = () => environmentService.getConfig();
export const refreshEnvironmentConfig = () => environmentService.refresh();