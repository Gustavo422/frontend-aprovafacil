import { NextRequest, NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache-monitor';
import { cacheManagerMonitor } from '@/lib/cache-manager-monitor-extension';
import { CacheType } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';

// Definir o tipo para as entradas importadas
interface ImportedCacheEntry {
  key: string;
  cacheType: string;
  data: unknown;
  expiresAt: string;
  createdAt: string;
  relatedKeys?: string[];
}

export async function POST(request: NextRequest) {
    try {
        // Initialize cache monitor if not already initialized
        if (!cacheMonitor.isInitialized()) {
            await cacheMonitor.initialize();
        }

        // Get request body
        const body = await request.json();
        const { importData, options } = body;

        if (!importData || !importData.entries || !Array.isArray(importData.entries)) {
            return NextResponse.json(
                { error: 'Invalid import data format' },
                { status: 400 }
            );
        }

        const { entries } = importData;
        const { overwrite = true, usuarioId } = options || {};

        // Validate entries
        const validEntries = entries.filter((entry: ImportedCacheEntry) => {
            return (
                entry.key &&
                typeof entry.key === 'string' &&
                entry.cacheType &&
                Object.values(CacheType).includes(entry.cacheType as CacheType) &&
                entry.data !== undefined &&
                entry.expiresAt &&
                entry.createdAt
            );
        });

        if (validEntries.length === 0) {
            return NextResponse.json(
                { error: 'No valid cache entries found in import data' },
                { status: 400 }
            );
        }

        // Import entries
        const results = [];

        for (const entry of validEntries) {
            try {
                // Convert date strings to Date objects
                const expiresAt = new Date(entry.expiresAt);
                const createdAt = new Date(entry.createdAt);

                // Skip expired entries
                if (expiresAt < new Date()) {
                    results.push({
                        operation: 'import',
                        key: entry.key,
                        cacheType: entry.cacheType,
                        success: false,
                        error: 'Entry is expired'
                    });
                    continue;
                }

                // Check if entry exists and we're not overwriting
                if (!overwrite) {
                    const existingEntry = await cacheMonitor.getCacheEntryMetadata(
                        entry.key,
                        entry.cacheType,
                        usuarioId
                    );

                    if (existingEntry) {
                        results.push({
                            operation: 'import',
                            key: entry.key,
                            cacheType: entry.cacheType,
                            success: false,
                            error: 'Entry already exists and overwrite is disabled'
                        });
                        continue;
                    }
                }

                // Set the entry in cache with the original metadata
                if (!cacheManagerMonitor.setWithMetadata) throw new Error('Método setWithMetadata não implementado');
                await cacheManagerMonitor.setWithMetadata(
                    entry.key,
                    entry.data,
                    {
                        type: entry.cacheType,
                        usuarioId,
                        expiresAt,
                        createdAt,
                        relatedKeys: entry.relatedKeys
                    }
                );

                results.push({
                    operation: 'import',
                    key: entry.key,
                    cacheType: entry.cacheType,
                    success: true
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                results.push({
                    operation: 'import',
                    key: entry.key,
                    cacheType: entry.cacheType,
                    success: false,
                    error: errorMessage
                });

                logger.warn('Failed to import cache entry', {
                    key: entry.key,
                    cacheType: entry.cacheType,
                    error: errorMessage,
                    usuarioId
                });
            }
        }

        // Create detailed audit log
        const successCount = results.filter(r => r.success).length;
        logger.info('Imported cache entries', {
            operation: 'import',
            totalEntries: validEntries.length,
            successCount,
            failureCount: validEntries.length - successCount,
            usuarioId,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            result: results,
            summary: {
                total: validEntries.length,
                successful: successCount,
                failed: validEntries.length - successCount
            }
        });
    } catch (error) {
        logger.error('Error importing cache entries', {
            error: error instanceof Error ? error.message : String(error)
        });

        return NextResponse.json(
            { error: 'Failed to import cache entries' },
            { status: 500 }
        );
    }
}