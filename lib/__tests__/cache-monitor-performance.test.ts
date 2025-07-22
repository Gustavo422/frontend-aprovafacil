import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheMonitor } from '../cache-monitor';
import { cacheManager, CacheType } from '../cache-manager';
import { cacheManagerMonitor } from '../cache-manager-monitor';
import { CacheMetricsCollector } from '../cache-metrics-collector';

// Mock dependencies
vi.mock('../logger', () => ({
    logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

// Helper function to measure execution time
async function measureExecutionTime(fn: () => Promise<void>): Promise<number> {
    const start = performance.now();
    await fn();
    return performance.now() - start;
}

// Helper function to generate random data
function generateRandomData(size: number): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < size; i++) {
        data[`field${i}`] = `value${Math.random()}`;
    }
    return data;
}

describe('Cache Monitor Performance Tests', () => {
    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();

        // Initialize the cache monitor
        await cacheMonitor.initialize();
    });

    afterEach(() => {
        // Clean up
        cacheMonitor.disable();
        cacheManagerMonitor.restoreOriginalMethods();
    });

    describe('Monitoring overhead', () => {
        it('should measure overhead of monitoring on cache operations', async () => {
            // First measure without monitoring
            cacheMonitor.disable();
            cacheManagerMonitor.restoreOriginalMethods();

            const withoutMonitoringTime = await measureExecutionTime(async () => {
                for (let i = 0; i < 100; i++) {
                    await cacheManager.set(`perf-key-${i}`, { value: `data-${i}` });
                    await cacheManager.get(`perf-key-${i}`);
                }
            });

            // Then measure with monitoring
            cacheMonitor.enable();
            cacheManagerMonitor.initialize();

            const withMonitoringTime = await measureExecutionTime(async () => {
                for (let i = 0; i < 100; i++) {
                    await cacheManager.set(`perf-key-${i + 100}`, { value: `data-${i + 100}` });
                    await cacheManager.get(`perf-key-${i + 100}`);
                }
            });

            // Calculate overhead percentage
            const overheadPercentage = ((withMonitoringTime - withoutMonitoringTime) / withoutMonitoringTime) * 100;

            // Log the results
            console.log(`
        Performance Test Results:
        - Without monitoring: ${withoutMonitoringTime.toFixed(2)}ms
        - With monitoring: ${withMonitoringTime.toFixed(2)}ms
        - Overhead: ${overheadPercentage.toFixed(2)}%
      `);

            // The test passes if we can measure the overhead
            // We don't assert a specific value as it will vary by environment
            expect(withMonitoringTime).toBeGreaterThan(0);

            // But we can check that the overhead is reasonable (less than 200%)
            // This is a very generous limit that should accommodate most environments
            expect(overheadPercentage).toBeLessThan(200);
        });

        it('should measure the impact of different sampling rates', async () => {
            // Enable monitoring
            cacheMonitor.enable();
            cacheManagerMonitor.initialize();

            const results: Record<string, number> = {};

            // Test different sampling rates
            const samplingRates = [0.01, 0.1, 0.5, 1.0];

            for (const rate of samplingRates) {
                // Configure sampling rate
                cacheMonitor.updateConfig({
                    metricsConfig: {
                        sampleRate: rate,
                        enabled: true,
                        maxMetricsHistory: 1000,
                        collectSizeMetrics: true,
                        detailedTimings: false
                    }
                });

                // Measure execution time
                const executionTime = await measureExecutionTime(async () => {
                    for (let i = 0; i < 100; i++) {
                        await cacheManager.set(`sampling-key-${rate}-${i}`, { value: `data-${i}` });
                        await cacheManager.get(`sampling-key-${rate}-${i}`);
                    }
                });

                results[`rate_${rate}`] = executionTime;
            }

            // Log the results
            console.log('Sampling Rate Performance Results:');
            for (const [rate, time] of Object.entries(results)) {
                console.log(`- ${rate}: ${time.toFixed(2)}ms`);
            }

            // Verify that higher sampling rates generally lead to higher execution times
            // This might not always be true due to other factors, but it's a reasonable expectation
            expect(results['rate_0.01']).toBeLessThanOrEqual(results['rate_1.0'] * 1.5);
        });
    });

    describe('Large cache scenarios', () => {
        it('should handle large number of cache entries', async () => {
            // Enable monitoring with a low sampling rate
            cacheMonitor.enable();
            cacheMonitor.updateConfig({
                metricsConfig: {
                    sampleRate: 0.01, // 1% sampling rate for performance
                    enabled: true,
                    maxMetricsHistory: 1000,
                    collectSizeMetrics: true,
                    detailedTimings: false
                }
            });
            cacheManagerMonitor.initialize();

            // Create a large number of cache entries
            const entryCount = 1000;

            const executionTime = await measureExecutionTime(async () => {
                for (let i = 0; i < entryCount; i++) {
                    await cacheManager.set(`large-cache-key-${i}`, { value: `data-${i}` });
                }
            });

            // Measure time to get cache statistics
            const statsTime = await measureExecutionTime(async () => {
                await cacheMonitor.calculateCompleteStatistics();
            });

            // Log the results
            console.log(`
        Large Cache Scenario Results:
        - Time to create ${entryCount} entries: ${executionTime.toFixed(2)}ms
        - Time to calculate statistics: ${statsTime.toFixed(2)}ms
      `);

            // The test passes if we can handle the large cache without timing out
            expect(executionTime).toBeGreaterThan(0);
            expect(statsTime).toBeGreaterThan(0);
        });

        it('should handle large cache entries', async () => {
            // Enable monitoring
            cacheMonitor.enable();
            cacheManagerMonitor.initialize();

            // Create cache entries with increasing sizes
            const sizes = [10, 100, 1000];
            const results: Record<string, number> = {};

            for (const size of sizes) {
                const data = generateRandomData(size);

                const executionTime = await measureExecutionTime(async () => {
                    await cacheManager.set(`large-entry-key-${size}`, data);
                    await cacheManager.get(`large-entry-key-${size}`);
                });

                results[`size_${size}`] = executionTime;
            }

            // Log the results
            console.log('Large Entry Size Performance Results:');
            for (const [size, time] of Object.entries(results)) {
                console.log(`- ${size}: ${time.toFixed(2)}ms`);
            }

            // The test passes if we can handle all sizes
            for (const time of Object.values(results)) {
                expect(time).toBeGreaterThan(0);
            }
        });
    });

    describe('Memory consumption', () => {
        it('should measure memory usage of metrics collection', async () => {
            // Create a metrics collector with a large history limit
            const collector = new CacheMetricsCollector({
                enabled: true,
                sampleRate: 0.5,
                maxMetricsHistory: 1000,
                collectSizeMetrics: true,
                detailedTimings: false
            });

            // Start collection
            collector.start();

            // Record a large number of metrics
            const metricCount = 5000;

            for (let i = 0; i < metricCount; i++) {
                collector.recordOperation(
                    'get',
                    CacheType.MEMORY,
                    i % 2 === 0 ? 'hit' : 'miss',
                    Math.random() * 10,
                    { key: `memory-key-${i}` }
                );
            }

            // Get memory usage statistics
            const memoryStats = collector.getMemoryUsageStatistics();

            // Log the results
            console.log(`
        Memory Consumption Results:
        - Metrics count: ${memoryStats.metricsCount}
        - Estimated memory usage: ${(memoryStats.estimatedMemoryUsage / 1024 / 1024).toFixed(2)}MB
        - Buffer utilization: ${(memoryStats.bufferUtilization * 100).toFixed(2)}%
      `);

            // Verify that memory usage is tracked
            expect(memoryStats.estimatedMemoryUsage).toBeGreaterThan(0);
            expect(memoryStats.metricsCount).toBe(metricCount);

            // Test automatic pruning
            collector.setMemoryUsageLimit(memoryStats.estimatedMemoryUsage / 2); // Set limit to half current usage
            collector.forcePrune();

            // Get updated memory stats
            const updatedMemoryStats = collector.getMemoryUsageStatistics();

            // Verify that pruning reduced memory usage
            expect(updatedMemoryStats.estimatedMemoryUsage).toBeLessThan(memoryStats.estimatedMemoryUsage);

            // Stop collection
            collector.stop();
        });

        it('should test circular buffer behavior', async () => {
            // Create a metrics collector with a small history limit
            const collector = new CacheMetricsCollector({
                enabled: true,
                sampleRate: 0.5,
                maxMetricsHistory: 100,
                collectSizeMetrics: true,
                detailedTimings: false
            });

            // Start collection
            collector.start();

            // Record more metrics than the buffer can hold
            const metricCount = 200; // Double the buffer size

            for (let i = 0; i < metricCount; i++) {
                collector.recordOperation(
                    'get',
                    CacheType.MEMORY,
                    'hit',
                    1,
                    { key: `circular-key-${i}` }
                );
            }

            // Get all metrics
            const metrics = collector.getMetrics();

            // Verify that only the most recent metrics are kept
            expect(metrics).toHaveLength(100);

            // The oldest metrics should be discarded, so we should only have keys from the second half
            const keys = metrics.map(m => m.key);
            expect(keys).toContain('circular-key-199'); // Last key should be present
            expect(keys).not.toContain('circular-key-0'); // First key should be discarded

            // Stop collection
            collector.stop();
        });
    });
});