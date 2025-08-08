/**
 * Startup Validation Demo
 * Demonstrates how to use the environment validation services
 */

import { validateEnvironmentOnStartup } from './startup-validation';
import { environmentUtils, generateEnvReport } from './environment-utils';

/**
 * Demo function to show startup validation in action
 */
export async function runStartupValidationDemo(): Promise<void> {
    console.log('=== Frontend Startup Validation Demo ===\n');

    try {
        // 1. Show environment info
        console.log('1. Environment Information:');
        const envInfo = environmentUtils.getEnvironmentInfo();
        console.log(`   - Node Environment: ${envInfo.nodeEnv}`);
        console.log(`   - Is Development: ${envInfo.isDevelopment}`);
        console.log(`   - Is Production: ${envInfo.isProduction}`);
        console.log(`   - Platform: ${envInfo.platform}`);
        console.log(`   - Node Version: ${envInfo.nodeVersion}\n`);

        // 2. Run startup validation
        console.log('2. Running Startup Validation...');
        const validationResult = await validateEnvironmentOnStartup();

        console.log(`   - Overall Status: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`   - Summary: ${validationResult.summary}`);
        console.log(`   - Environment Errors: ${validationResult.environment.errors.length}`);
        console.log(`   - Environment Warnings: ${validationResult.environment.warnings.length}`);
        console.log(`   - Fallbacks Used: ${validationResult.environment.fallbacksUsed.length}`);

        if (validationResult.backend) {
            console.log(`   - Backend Reachable: ${validationResult.backend.isReachable ? '✅' : '❌'}`);
            if (validationResult.backend.responseTime) {
                console.log(`   - Backend Response Time: ${validationResult.backend.responseTime}ms`);
            }
        }
        console.log();

        // 3. Show recommendations if any
        if (validationResult.recommendations.length > 0) {
            console.log('3. Recommendations:');
            validationResult.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
            console.log();
        }

        // 4. Generate environment report
        console.log('4. Environment Configuration Report:');
        const report = generateEnvReport();
        console.log(report);

        // 5. Show specific environment variables
        console.log('5. Key Environment Variables:');
        console.log(`   - Backend URL: ${environmentUtils.getVariable('NEXT_PUBLIC_BACKEND_API_URL', 'NOT SET')}`);
        console.log(`   - Supabase URL: ${environmentUtils.getVariable('NEXT_PUBLIC_SUPABASE_URL', 'NOT SET')}`);
        console.log(`   - Node Environment: ${environmentUtils.getVariable('NODE_ENV', 'development')}`);
        console.log();

        console.log('=== Demo Complete ===');

    } catch (error) {
        console.error('Demo failed:', error);
        throw error;
    }
}

/**
 * Quick validation check for use in application startup
 */
export async function quickStartupCheck(): Promise<boolean> {
    try {
        const result = await validateEnvironmentOnStartup();

        if (!result.isValid) {
            console.error('❌ Startup validation failed!');
            console.error('Issues found:');

            result.environment.errors.forEach(error => {
                console.error(`   - ${error}`);
            });

            if (result.backend && !result.backend.isReachable) {
                console.error(`   - Backend unreachable: ${result.backend.error}`);
            }

            console.error('\nRecommendations:');
            result.recommendations.forEach(rec => {
                console.error(`   - ${rec}`);
            });

            return false;
        }

        console.log('✅ Startup validation passed');

        if (result.environment.warnings.length > 0) {
            console.warn('⚠️  Configuration warnings:');
            result.environment.warnings.forEach(warning => {
                console.warn(`   - ${warning}`);
            });
        }

        return true;
    } catch (error) {
        console.error('❌ Startup validation error:', error);
        return false;
    }
}

// Export for use in Next.js applications
const startupDemo = {
    runDemo: runStartupValidationDemo,
    quickCheck: quickStartupCheck
};

export default startupDemo;