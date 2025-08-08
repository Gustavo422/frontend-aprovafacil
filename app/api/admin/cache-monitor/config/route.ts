import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { cacheMonitorConfig } from '@/lib/cache-monitor-config';
import type { CacheType } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';

/**
 * GET handler for retrieving cache monitor configuration
 */
export async function GET() {
  try {
    // Get current configuration
    const config = cacheMonitorConfig.getConfig();
    
    // Convert to API-friendly format
    const apiConfig = {
      enabled: config.enabled,
      metricsEnabled: config.metricsEnabled,
      monitoredCacheTypes: config.monitoredCacheTypes,
      logLevel: config.logLevel,
      dashboardEnabled: config.dashboardEnabled,
      persistConfig: config.persistConfig,
      metricsConfig: {
        enabled: config.metricsConfig.enabled,
        maxMetricsHistory: config.metricsConfig.maxMetricsHistory,
        samplingRate: config.metricsConfig.sampleRate * 100, // Convert from 0-1 to percentage
        detailedLogging: config.metricsConfig.detailedTimings,
        collectSizeMetrics: config.metricsConfig.collectSizeMetrics,
        performanceAlertThreshold: 500 // Default value, not in current config
      },
      productionMode: process.env.NODE_ENV === 'production'
    };
    
    return NextResponse.json({ config: apiConfig });
  } catch (error) {
    logger.error('Failed to get cache monitor configuration', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to get cache monitor configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for updating cache monitor configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate configuration
    const validationErrors = cacheMonitorConfig.validateConfig({
      enabled: body.enabled,
      metricsEnabled: body.metricsEnabled,
      logLevel: body.logLevel,
      dashboardEnabled: body.dashboardEnabled,
      persistConfig: body.persistConfig,
      monitoredCacheTypes: body.monitoredCacheTypes,
      metricsConfig: {
        enabled: body.metricsConfig?.enabled ?? true,
        maxMetricsHistory: body.metricsConfig?.maxMetricsHistory,
        sampleRate: body.metricsConfig?.samplingRate / 100, // Convert from percentage to 0-1
        detailedTimings: body.metricsConfig?.detailedLogging,
        collectSizeMetrics: body.metricsConfig?.collectSizeMetrics
      }
    });
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid configuration', validationErrors },
        { status: 400 }
      );
    }
    
    // Update configuration
    cacheMonitorConfig.updateConfig({
      enabled: body.enabled,
      metricsEnabled: body.metricsEnabled,
      logLevel: body.logLevel as 'error' | 'warn' | 'info' | 'debug' | 'trace',
      dashboardEnabled: body.dashboardEnabled,
      persistConfig: body.persistConfig,
      monitoredCacheTypes: body.monitoredCacheTypes as CacheType[],
      metricsConfig: {
        enabled: body.metricsConfig?.enabled ?? true,
        maxMetricsHistory: body.metricsConfig?.maxMetricsHistory,
        sampleRate: body.metricsConfig?.samplingRate / 100, // Convert from percentage to 0-1
        detailedTimings: body.metricsConfig?.detailedLogging,
        collectSizeMetrics: body.metricsConfig?.collectSizeMetrics
      }
    });
    
    // Save configuration
    await cacheMonitorConfig.saveConfig();
    
    // Get updated configuration
    const config = cacheMonitorConfig.getConfig();
    
    // Convert to API-friendly format
    const apiConfig = {
      enabled: config.enabled,
      metricsEnabled: config.metricsEnabled,
      monitoredCacheTypes: config.monitoredCacheTypes,
      logLevel: config.logLevel,
      dashboardEnabled: config.dashboardEnabled,
      persistConfig: config.persistConfig,
      metricsConfig: {
        enabled: config.metricsConfig.enabled,
        maxMetricsHistory: config.metricsConfig.maxMetricsHistory,
        samplingRate: config.metricsConfig.sampleRate * 100, // Convert from 0-1 to percentage
        detailedLogging: config.metricsConfig.detailedTimings,
        collectSizeMetrics: config.metricsConfig.collectSizeMetrics,
        performanceAlertThreshold: 500 // Default value, not in current config
      },
      productionMode: process.env.NODE_ENV === 'production'
    };
    
    return NextResponse.json({ config: apiConfig });
  } catch (error) {
    logger.error('Failed to update cache monitor configuration', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to update cache monitor configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for resetting cache monitor configuration to defaults
 */
export async function DELETE() {
  try {
    // Reset configuration
    cacheMonitorConfig.resetConfig();
    
    // Get updated configuration
    const config = cacheMonitorConfig.getConfig();
    
    // Convert to API-friendly format
    const apiConfig = {
      enabled: config.enabled,
      metricsEnabled: config.metricsEnabled,
      monitoredCacheTypes: config.monitoredCacheTypes,
      logLevel: config.logLevel,
      dashboardEnabled: config.dashboardEnabled,
      persistConfig: config.persistConfig,
      metricsConfig: {
        enabled: config.metricsConfig.enabled,
        maxMetricsHistory: config.metricsConfig.maxMetricsHistory,
        samplingRate: config.metricsConfig.sampleRate * 100, // Convert from 0-1 to percentage
        detailedLogging: config.metricsConfig.detailedTimings,
        collectSizeMetrics: config.metricsConfig.collectSizeMetrics,
        performanceAlertThreshold: 500 // Default value, not in current config
      },
      productionMode: process.env.NODE_ENV === 'production'
    };
    
    return NextResponse.json({ config: apiConfig });
  } catch (error) {
    logger.error('Failed to reset cache monitor configuration', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to reset cache monitor configuration' },
      { status: 500 }
    );
  }
}