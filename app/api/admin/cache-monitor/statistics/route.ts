import { NextRequest, NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache-monitor';
import { CacheType } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';

/**
 * GET handler for retrieving cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const cacheTypeParam = searchParams.get('cacheType');
    const cacheType = cacheTypeParam ? (cacheTypeParam as CacheType) : undefined;
    const timeRangeParam = searchParams.get('timeRange');
    
    // Parse time range
    let timeRange: [Date, Date] | undefined;
    if (timeRangeParam) {
      const now = new Date();
      const hours = parseInt(timeRangeParam, 10) || 1;
      const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
      timeRange = [startTime, now];
    }
    
    // Get metrics statistics
    const statistics = cacheMonitor.getStatistics({
      cacheType,
      timeRange
    });
    
    // Get complete statistics
    const completeStatistics = await cacheMonitor.calculateCompleteStatistics({
      includeExpired: true,
      pattern: searchParams.get('pattern') || undefined,
      maxLargestEntries: 10
    });
    
    return NextResponse.json({
      statistics,
      completeStatistics
    });
  } catch (error) {
    logger.error('Failed to get cache statistics', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return mock data for development
    return NextResponse.json({
      statistics: {
        hitRate: 0.75,
        missRate: 0.25,
        averageDuration: 12.5,
        operationCounts: {
          get: 120,
          set: 45,
          delete: 8,
          invalidate: 15,
          clear: 2
        },
        errorRate: 0.03,
        totalOperations: 190,
        cacheSize: 1024 * 1024 * 2.5, // 2.5 MB
        entryCount: 85
      },
      completeStatistics: {
        totalEntries: 85,
        byType: {
          [CacheType.MEMORY]: {
            cacheType: CacheType.MEMORY,
            counts: { active: 45, expired: 5, total: 50 },
            size: 1024 * 512, // 512 KB
            largestEntries: [
              { key: 'performance:user123:stats', size: 102400 },
              { key: 'entity:question:list', size: 51200 }
            ]
          },
          [CacheType.LOCAL_STORAGE]: {
            cacheType: CacheType.LOCAL_STORAGE,
            counts: { active: 15, expired: 2, total: 17 },
            size: 1024 * 256, // 256 KB
          },
          [CacheType.SESSION_STORAGE]: {
            cacheType: CacheType.SESSION_STORAGE,
            counts: { active: 8, expired: 0, total: 8 },
            size: 1024 * 128, // 128 KB
          },
          [CacheType.SUPABASE]: {
            cacheType: CacheType.SUPABASE,
            counts: { active: 10, expired: 0, total: 10 },
            size: 1024 * 1024 * 1.5, // 1.5 MB
          }
        },
        expiration: {
          expiringInNextMinute: 2,
          expiringInNextHour: 8,
          expiringInNextDay: 15,
          expiringInNextWeek: 25,
          expiringLater: 28,
          expired: 7
        },
        timestamp: new Date()
      }
    });
  }
}