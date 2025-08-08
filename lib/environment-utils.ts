/**
 * Environment Variable Management Utilities
 * Provides utility functions for environment variable handling and validation
 */

import { environmentService } from './environment-service';

export interface EnvironmentVariable {
  key: string;
  value?: string;
  isSet: boolean;
  isValid: boolean;
  category: string;
  description?: string;
  fallbackUsed?: boolean;
}

export interface EnvironmentSummary {
  totalVariables: number;
  setVariables: number;
  validVariables: number;
  invalidVariables: number;
  fallbacksUsed: number;
  byCategory: Record<string, {
    total: number;
    valid: number;
    invalid: number;
  }>;
}

/**
 * Environment Variable Management Class
 */
export class EnvironmentUtils {
  private static instance: EnvironmentUtils;

  private constructor() {}

  public static getInstance(): EnvironmentUtils {
    if (!EnvironmentUtils.instance) {
      EnvironmentUtils.instance = new EnvironmentUtils();
    }
    return EnvironmentUtils.instance;
  }

  /**
   * Get environment variable with validation and fallback
   */
  public getVariable(key: string, fallback?: string): string | undefined {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
      if (fallback !== undefined) {
        console.warn(`[ENV-UTILS] Using fallback for ${key}: ${fallback}`);
        return fallback;
      }
      return undefined;
    }
    
    return value;
  }

  /**
   * Get required environment variable (throws if missing)
   */
  public getRequiredVariable(key: string, description?: string): string {
    const value = this.getVariable(key);
    
    if (!value) {
      const errorMsg = `Required environment variable ${key} is missing${description ? `: ${description}` : ''}`;
      console.error(`[ENV-UTILS] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    return value;
  }

  /**
   * Get boolean environment variable
   */
  public getBooleanVariable(key: string, fallback = false): boolean {
    const value = this.getVariable(key);
    
    if (!value) {
      return fallback;
    }
    
    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }

  /**
   * Get numeric environment variable
   */
  public getNumericVariable(key: string, fallback?: number): number | undefined {
    const value = this.getVariable(key);
    
    if (!value) {
      return fallback;
    }
    
    const numValue = parseInt(value, 10);
    
    if (isNaN(numValue)) {
      console.warn(`[ENV-UTILS] Invalid numeric value for ${key}: ${value}, using fallback: ${fallback}`);
      return fallback;
    }
    
    return numValue;
  }

  /**
   * Get array environment variable (comma-separated)
   */
  public getArrayVariable(key: string, fallback: string[] = []): string[] {
    const value = this.getVariable(key);
    
    if (!value) {
      return fallback;
    }
    
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Validate URL format
   */
  public validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get URL environment variable with validation
   */
  public getUrlVariable(key: string, fallback?: string): string | undefined {
    const value = this.getVariable(key, fallback);
    
    if (!value) {
      return undefined;
    }
    
    if (!this.validateUrl(value)) {
      console.warn(`[ENV-UTILS] Invalid URL format for ${key}: ${value}`);
      return fallback;
    }
    
    return value;
  }

  /**
   * Get environment variables by prefix
   */
  public getVariablesByPrefix(prefix: string): Record<string, string> {
    const variables: Record<string, string> = {};
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(prefix)) {
        const value = process.env[key];
        if (value) {
          variables[key] = value;
        }
      }
    });
    
    return variables;
  }

  /**
   * Get all environment variables with metadata
   */
  public getAllVariables(): EnvironmentVariable[] {
    const config = environmentService.getConfigurationStatus();
    const variables: EnvironmentVariable[] = [];
    
    Object.entries(config.details.variables).forEach(([key, info]) => {
      variables.push({
        key,
        value: info.set ? process.env[key] : undefined,
        isSet: info.set,
        isValid: info.valid,
        category: info.category,
        fallbackUsed: config.details.fallbacksUsed.includes(key)
      });
    });
    
    return variables;
  }

  /**
   * Get environment summary statistics
   */
  public getEnvironmentSummary(): EnvironmentSummary {
    const variables = this.getAllVariables();
    const byCategory: Record<string, { total: number; valid: number; invalid: number }> = {};
    
    variables.forEach(variable => {
      if (!byCategory[variable.category]) {
        byCategory[variable.category] = { total: 0, valid: 0, invalid: 0 };
      }
      
      byCategory[variable.category].total++;
      if (variable.isValid) {
        byCategory[variable.category].valid++;
      } else {
        byCategory[variable.category].invalid++;
      }
    });
    
    return {
      totalVariables: variables.length,
      setVariables: variables.filter(v => v.isSet).length,
      validVariables: variables.filter(v => v.isValid).length,
      invalidVariables: variables.filter(v => !v.isValid).length,
      fallbacksUsed: variables.filter(v => v.fallbackUsed).length,
      byCategory
    };
  }

  /**
   * Generate environment configuration report
   */
  public generateConfigurationReport(): string {
    const summary = this.getEnvironmentSummary();
    const variables = this.getAllVariables();
    
    let report = '=== Environment Configuration Report ===\n\n';
    
    // Summary
    report += 'SUMMARY:\n';
    report += `- Total Variables: ${summary.totalVariables}\n`;
    report += `- Set Variables: ${summary.setVariables}\n`;
    report += `- Valid Variables: ${summary.validVariables}\n`;
    report += `- Invalid Variables: ${summary.invalidVariables}\n`;
    report += `- Fallbacks Used: ${summary.fallbacksUsed}\n\n`;
    
    // By Category
    report += 'BY CATEGORY:\n';
    Object.entries(summary.byCategory).forEach(([category, stats]) => {
      report += `- ${category.toUpperCase()}: ${stats.valid}/${stats.total} valid\n`;
    });
    report += '\n';
    
    // Variable Details
    report += 'VARIABLE DETAILS:\n';
    const categories = [...new Set(variables.map(v => v.category))];
    
    categories.forEach(category => {
      report += `\n${category.toUpperCase()}:\n`;
      const categoryVars = variables.filter(v => v.category === category);
      
      categoryVars.forEach(variable => {
        const status = variable.isSet ? (variable.isValid ? '✓' : '✗') : '○';
        const fallback = variable.fallbackUsed ? ' (fallback)' : '';
        report += `  ${status} ${variable.key}: ${variable.isSet ? 'SET' : 'NOT SET'}${fallback}\n`;
      });
    });
    
    return report;
  }

  /**
   * Validate specific environment variable patterns
   */
  public validatePattern(value: string, pattern: RegExp, description?: string): boolean {
    const isValid = pattern.test(value);
    
    if (!isValid && description) {
      console.warn(`[ENV-UTILS] Pattern validation failed: ${description}`);
    }
    
    return isValid;
  }

  /**
   * Sanitize environment variable for logging (hide sensitive data)
   */
  public sanitizeForLogging(key: string, value: string): string {
    const sensitivePatterns = [
      /secret/i,
      /key/i,
      /password/i,
      /token/i,
      /auth/i
    ];
    
    const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      if (value.length <= 8) {
        return '***';
      }
      return `${value.substring(0, 4) }***${ value.substring(value.length - 4)}`;
    }
    
    return value;
  }

  /**
   * Export environment configuration for debugging (sanitized)
   */
  public exportConfiguration(): Record<string, string> {
    const variables = this.getAllVariables();
    const config: Record<string, string> = {};
    
    variables.forEach(variable => {
      if (variable.isSet && variable.value) {
        config[variable.key] = this.sanitizeForLogging(variable.key, variable.value);
      }
    });
    
    return config;
  }

  /**
   * Check if running in development mode
   */
  public isDevelopment(): boolean {
    return this.getVariable('NODE_ENV', 'development') === 'development';
  }

  /**
   * Check if running in production mode
   */
  public isProduction(): boolean {
    return this.getVariable('NODE_ENV') === 'production';
  }

  /**
   * Check if running in test mode
   */
  public isTest(): boolean {
    return this.getVariable('NODE_ENV') === 'test';
  }

  /**
   * Get application environment info
   */
  public getEnvironmentInfo(): {
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
    platform: string;
    nodeVersion: string;
  } {
    return {
      nodeEnv: this.getVariable('NODE_ENV', 'development')!,
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      isTest: this.isTest(),
      platform: process.platform,
      nodeVersion: process.version
    };
  }
}

// Export singleton instance
export const environmentUtils = EnvironmentUtils.getInstance();

// Export convenience functions
export const getEnvVar = (key: string, fallback?: string) => environmentUtils.getVariable(key, fallback);
export const getRequiredEnvVar = (key: string, description?: string) => environmentUtils.getRequiredVariable(key, description);
export const getBooleanEnvVar = (key: string, fallback?: boolean) => environmentUtils.getBooleanVariable(key, fallback);
export const getNumericEnvVar = (key: string, fallback?: number) => environmentUtils.getNumericVariable(key, fallback);
export const getArrayEnvVar = (key: string, fallback?: string[]) => environmentUtils.getArrayVariable(key, fallback);
export const getUrlEnvVar = (key: string, fallback?: string) => environmentUtils.getUrlVariable(key, fallback);
export const getEnvVarsByPrefix = (prefix: string) => environmentUtils.getVariablesByPrefix(prefix);
export const generateEnvReport = () => environmentUtils.generateConfigurationReport();
export const isDevelopment = () => environmentUtils.isDevelopment();
export const isProduction = () => environmentUtils.isProduction();
export const isTest = () => environmentUtils.isTest();