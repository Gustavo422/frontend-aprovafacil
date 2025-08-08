import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache-monitor';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Initialize cache monitor if not already initialized
    if (!cacheMonitor.isInitialized()) {
      await cacheMonitor.initialize();
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const rootKey = searchParams.get('rootKey');
    const maxDepth = parseInt(searchParams.get('maxDepth') || '3', 10);
    const maxNodes = parseInt(searchParams.get('maxNodes') || '50', 10);
    const includeExpired = searchParams.get('includeExpired') === 'true';
    
    if (!rootKey) {
      return NextResponse.json(
        { error: 'Root key is required' },
        { status: 400 }
      );
    }
    
    // Build relationship graph
    const graph = await cacheMonitor.buildCacheRelationshipGraph({
      rootKey,
      maxDepth,
      maxNodes,
      includeExpired,
      includeMetadata: true
    });
    
    // Generate visualizations
    const mermaidDiagram = await cacheMonitor.generateCacheRelationshipMermaidDiagram({
      rootKey,
      maxDepth,
      maxNodes,
      includeExpired
    });
    
    const d3Json = await cacheMonitor.generateCacheRelationshipD3Json({
      rootKey,
      maxDepth,
      maxNodes,
      includeExpired
    });
    
    return NextResponse.json({
      graph,
      visualizations: {
        mermaid: mermaidDiagram,
        d3: d3Json
      }
    });
  } catch (error) {
    logger.error('Error fetching cache relationships', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch cache relationships' },
      { status: 500 }
    );
  }
}