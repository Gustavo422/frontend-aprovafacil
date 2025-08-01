import { NextRequest, NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache-monitor';
import { cacheManagerMonitor } from '@/lib/cache-manager-monitor-extension';
import { CacheType } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Initialize cache monitor if not already initialized
    if (!cacheMonitor.isInitialized()) {
      await cacheMonitor.initialize();
    }

    // Get request body
    const body = await request.json();
    const { action, keys, cacheType, usuarioId, pattern } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'invalidate':
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
          return NextResponse.json(
            { error: 'Keys array is required for invalidate action' },
            { status: 400 }
          );
        }
        
        if (typeof cacheManagerMonitor.invalidateMultiple === 'function') {
          result = await cacheManagerMonitor.invalidateMultiple(
            keys,
            { type: cacheType as CacheType, usuarioId }
          );
        } else {
          throw new Error('Método invalidateMultiple não implementado');
        }
        break;
        
      case 'clearByType':
        if (!cacheType) {
          return NextResponse.json(
            { error: 'Cache type is required for clearByType action' },
            { status: 400 }
          );
        }
        
        if (typeof cacheManagerMonitor.clearByType === 'function') {
          await cacheManagerMonitor.clearByType(
            cacheType as CacheType,
            usuarioId
          );
        } else {
          throw new Error('Método clearByType não implementado');
        }
        
        result = { success: true };
        break;
        
      case 'clearByPattern':
        if (!pattern) {
          return NextResponse.json(
            { error: 'Pattern is required for clearByPattern action' },
            { status: 400 }
          );
        }
        
        // Get all keys matching the pattern
        const entries = await cacheMonitor.getAllCacheEntries({
          cacheType: cacheType as CacheType,
          pattern,
          includeExpired: false
        });
        
        // Extract keys
        const keysToInvalidate = entries.map(entry => entry.key);
        
        if (typeof cacheManagerMonitor.invalidateMultiple === 'function') {
          result = await cacheManagerMonitor.invalidateMultiple(
            keysToInvalidate,
            { type: cacheType as CacheType, usuarioId }
          );
        } else {
          throw new Error('Método invalidateMultiple não implementado');
        }
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ result });
  } catch (error) {
    // Check if this is a confirmation required error
    if (error instanceof Error && error.message.includes('Confirmation required')) {
      return NextResponse.json(
        { 
          error: error.message,
          requiresConfirmation: true,
          confirmationToken: error.message.split('confirmationToken: ')[1]
        },
        { status: 428 } // Precondition Required
      );
    }
    
    logger.error('Error managing cache', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to manage cache' },
      { status: 500 }
    );
  }
}