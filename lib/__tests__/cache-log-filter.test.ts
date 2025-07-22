import { describe, it, expect, beforeEach } from 'vitest';
import {
    CacheLogFilter,
    CacheLogStorage,
    CacheLogEntry,
    CacheLogFilterOptions
} from '../cache-log-filter';
import { CacheLogLevel, CacheLogCategory } from '../cache-logger';
import { CacheType } from '../cache-manager';

describe('CacheLogFilter', () => {
    let logs: CacheLogEntry[];

    beforeEach(() => {
        // Create sample logs for testing
        logs = [
            {
                timestamp: '2023-01-01T10:00:00.000Z',
                level: CacheLogLevel.INFO,
                message: 'Cache hit for key1',
                category: CacheLogCategory.OPERATION,
                operation: 'get',
                cacheType: CacheType.MEMORY,
                key: 'key1',
                result: 'hit',
                duration: 5,
                correlationId: 'corr1'
            },
            {
                timestamp: '2023-01-01T10:01:00.000Z',
                level: CacheLogLevel.DEBUG,
                message: 'Cache miss for key2',
                category: CacheLogCategory.OPERATION,
                operation: 'get',
                cacheType: CacheType.MEMORY,
                key: 'key2',
                result: 'miss',
                duration: 10,
                correlationId: 'corr2'
            },
            {
                timestamp: '2023-01-01T10:02:00.000Z',
                level: CacheLogLevel.ERROR,
                message: 'Cache error for key3',
                category: CacheLogCategory.ERROR,
                operation: 'set',
                cacheType: CacheType.LOCAL_STORAGE,
                key: 'key3',
                result: 'error',
                duration: 150,
                error: 'Test error',
                correlationId: 'corr3'
            },
            {
                timestamp: '2023-01-01T10:03:00.000Z',
                level: CacheLogLevel.WARN,
                message: 'Slow cache operation for key4',
                category: CacheLogCategory.PERFORMANCE,
                operation: 'set',
                cacheType: CacheType.MEMORY,
                key: 'key4',
                result: 'success',
                duration: 200,
                correlationId: 'corr4'
            },
            {
                timestamp: '2023-01-01T10:04:00.000Z',
                level: CacheLogLevel.INFO,
                message: 'Cache cleared',
                category: CacheLogCategory.MANAGEMENT,
                operation: 'clear',
                cacheType: CacheType.MEMORY,
                correlationId: 'corr5'
            }
        ];
    });

    it('should filter logs by level', () => {
        const options: CacheLogFilterOptions = {
            level: CacheLogLevel.INFO
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].message).toBe('Cache hit for key1');
        expect(filtered[1].message).toBe('Cache cleared');
    });

    it('should filter logs by multiple levels', () => {
        const options: CacheLogFilterOptions = {
            level: [CacheLogLevel.ERROR, CacheLogLevel.WARN]
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].message).toBe('Cache error for key3');
        expect(filtered[1].message).toBe('Slow cache operation for key4');
    });

    it('should filter logs by category', () => {
        const options: CacheLogFilterOptions = {
            category: CacheLogCategory.PERFORMANCE
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Slow cache operation for key4');
    });

    it('should filter logs by operation', () => {
        const options: CacheLogFilterOptions = {
            operation: 'set'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].message).toBe('Cache error for key3');
        expect(filtered[1].message).toBe('Slow cache operation for key4');
    });

    it('should filter logs by cache type', () => {
        const options: CacheLogFilterOptions = {
            cacheType: CacheType.LOCAL_STORAGE
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Cache error for key3');
    });

    it('should filter logs by key pattern', () => {
        const options: CacheLogFilterOptions = {
            keyPattern: 'key*'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(4);
    });

    it('should filter logs by specific key pattern', () => {
        const options: CacheLogFilterOptions = {
            keyPattern: 'key?'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(4);
    });

    it('should filter logs by result', () => {
        const options: CacheLogFilterOptions = {
            result: 'error'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Cache error for key3');
    });

    it('should filter logs by duration range', () => {
        const options: CacheLogFilterOptions = {
            minDuration: 100,
            maxDuration: 200
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].message).toBe('Cache error for key3');
        expect(filtered[1].message).toBe('Slow cache operation for key4');
    });

    it('should filter logs by error presence', () => {
        const options: CacheLogFilterOptions = {
            hasError: true
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Cache error for key3');
    });

    it('should filter logs by correlation ID', () => {
        const options: CacheLogFilterOptions = {
            correlationId: 'corr1'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Cache hit for key1');
    });

    it('should filter logs by time range', () => {
        const options: CacheLogFilterOptions = {
            startTime: new Date('2023-01-01T10:02:00.000Z'),
            endTime: new Date('2023-01-01T10:03:00.000Z')
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].message).toBe('Cache error for key3');
        expect(filtered[1].message).toBe('Slow cache operation for key4');
    });

    it('should filter logs by message pattern', () => {
        const options: CacheLogFilterOptions = {
            messagePattern: '*error*'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Cache error for key3');
    });

    it('should limit the number of logs', () => {
        const options: CacheLogFilterOptions = {
            limit: 2,
            sortDirection: 'desc'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(2);
        expect(filtered[0].message).toBe('Cache cleared');
        expect(filtered[1].message).toBe('Slow cache operation for key4');
    });

    it('should sort logs in ascending order', () => {
        const options: CacheLogFilterOptions = {
            sortDirection: 'asc'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(5);
        expect(filtered[0].message).toBe('Cache hit for key1');
        expect(filtered[4].message).toBe('Cache cleared');
    });

    it('should sort logs in descending order', () => {
        const options: CacheLogFilterOptions = {
            sortDirection: 'desc'
        };

        const filtered = CacheLogFilter.filterLogs(logs, options);

        expect(filtered).toHaveLength(5);
        expect(filtered[0].message).toBe('Cache cleared');
        expect(filtered[4].message).toBe('Cache hit for key1');
    });

    it('should find related logs by correlation ID', () => {
        const related = CacheLogFilter.findRelatedLogs(logs, 'corr1');

        expect(related).toHaveLength(1);
        expect(related[0].message).toBe('Cache hit for key1');
    });

    it('should find logs by key', () => {
        const keyLogs = CacheLogFilter.findLogsByKey(logs, 'key2');

        expect(keyLogs).toHaveLength(1);
        expect(keyLogs[0].message).toBe('Cache miss for key2');
    });

    it('should group logs by correlation ID', () => {
        const grouped = CacheLogFilter.groupLogsByCorrelationId(logs);

        expect(Object.keys(grouped)).toHaveLength(5);
        expect(grouped['corr1']).toHaveLength(1);
        expect(grouped['corr2']).toHaveLength(1);
        expect(grouped['corr3']).toHaveLength(1);
        expect(grouped['corr4']).toHaveLength(1);
        expect(grouped['corr5']).toHaveLength(1);
    });
});

describe('CacheLogStorage', () => {
    let storage: CacheLogStorage;

    beforeEach(() => {
        storage = CacheLogStorage.getInstance();
        storage.clearLogs();
    });

    it('should add and retrieve logs', () => {
        const log: CacheLogEntry = {
            timestamp: '2023-01-01T10:00:00.000Z',
            level: CacheLogLevel.INFO,
            message: 'Test log',
            category: CacheLogCategory.OPERATION
        };

        storage.addLog(log);

        const logs = storage.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe('Test log');
    });

    it('should limit the number of logs', () => {
        storage.setMaxLogs(3);

        for (let i = 0; i < 5; i++) {
            storage.addLog({
                timestamp: `2023-01-01T10:0${i}:00.000Z`,
                level: CacheLogLevel.INFO,
                message: `Log ${i}`,
                category: CacheLogCategory.OPERATION
            });
        }

        const logs = storage.getLogs();
        expect(logs).toHaveLength(3);
        expect(logs[0].message).toBe('Log 2');
        expect(logs[1].message).toBe('Log 3');
        expect(logs[2].message).toBe('Log 4');
    });

    it('should clear logs', () => {
        storage.addLog({
            timestamp: '2023-01-01T10:00:00.000Z',
            level: CacheLogLevel.INFO,
            message: 'Test log',
            category: CacheLogCategory.OPERATION
        });

        storage.clearLogs();

        const logs = storage.getLogs();
        expect(logs).toHaveLength(0);
    });

    it('should get filtered logs', () => {
        storage.addLog({
            timestamp: '2023-01-01T10:00:00.000Z',
            level: CacheLogLevel.INFO,
            message: 'Info log',
            category: CacheLogCategory.OPERATION
        });

        storage.addLog({
            timestamp: '2023-01-01T10:01:00.000Z',
            level: CacheLogLevel.ERROR,
            message: 'Error log',
            category: CacheLogCategory.ERROR
        });

        const filtered = storage.getFilteredLogs({
            level: CacheLogLevel.ERROR
        });

        expect(filtered).toHaveLength(1);
        expect(filtered[0].message).toBe('Error log');
    });
});