import { NextRequest, NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache-monitor';
import { CacheType } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Initialize cache monitor if not already initialized
    if (!cacheMonitor.isInitialized()) {
      await cacheMonitor.initialize();
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const cacheTypeParam = searchParams.get('cacheType');
    const cacheType = cacheTypeParam ? (cacheTypeParam as CacheType) : undefined;
    const patternParam = searchParams.get('pattern');
    const pattern = patternParam ? patternParam : undefined;
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    
    // Get all cache entries
    const entries = await cacheMonitor.getAllCacheEntries({
      cacheType,
      pattern,
      includeExpired,
      includeData: true,
      limit
    });
    
    return NextResponse.json({ entries });
  } catch (error) {
    logger.error('Error fetching cache entries', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch cache entries' },
      { status: 500 }
    );
  }
}