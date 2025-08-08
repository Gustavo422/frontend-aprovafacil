'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExportJsonButton } from '@/components/ui/export-json-button';
import {
  RefreshCw,
  Database,
  BarChart3,
  AlertTriangle,
  Info,
  Clock,
  PieChart,
  Activity
} from 'lucide-react';
import { useToast } from '@/features/shared/hooks/use-toast';
import { CacheMetricsChart } from './components/cache-metrics-chart';
import { CacheOperationsChart } from './components/cache-operations-chart';
import { CacheSizeChart } from './components/cache-size-chart';
import { CacheTypeDistribution } from './components/cache-type-distribution';
import { CacheInspector } from './components/cache-inspector';
import { CacheManagement } from './components/cache-management';
import { CacheConfig } from './components/cache-config';
import { CacheType } from '@/lib/cache-manager';

interface CacheStatistics {
  hitRate: number;
  missRate: number;
  averageDuration: number;
  operationCounts: {
    get: number;
    set: number;
    delete: number;
    invalidate: number;
    clear: number;
  };
  errorRate: number;
  totalOperations: number;
  cacheSize?: number;
  entryCount?: number;
}

interface CacheTypeStatistics {
  cacheType: CacheType;
  counts: {
    active: number;
    expired: number;
    total: number;
  };
  size?: number;
  largestEntries?: Array<{
    key: string;
    size: number;
  }>;
}

interface CompleteStatistics {
  totalEntries: number;
  byType: Record<CacheType, CacheTypeStatistics>;
  expiration: {
    expiringInNextMinute: number;
    expiringInNextHour: number;
    expiringInNextDay: number;
    expiringInNextWeek: number;
    expiringLater: number;
    expired: number;
  };
  timestamp: Date;
}

export default function CacheMonitorPage() {
  const [statistics, setStatistics] = useState<CacheStatistics | null>(null);
  const [completeStats, setCompleteStats] = useState<CompleteStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('hour'); // hour, day, week, month
  const { toast } = useToast();

  const fetchCacheStatistics = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate the data
      const response = await fetch('/api/admin/cache-monitor/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch cache statistics');
      }

      const data = await response.json();
      setStatistics(data.statistics);
      setCompleteStats(data.completeStatistics);

      toast({
        title: 'Statistics updated',
        descricao: 'Cache monitoring statistics have been updated.',
      });
    } catch (error) {
      console.error('Error fetching cache statistics:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading statistics',
        descricao: 'Could not load cache monitoring statistics.',
      });

      // For demo purposes, set mock data
      setStatistics({
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
      });

      // Inicialização correta de statisticsByType
      const statisticsByType: Record<CacheType, CacheTypeStatistics> = {
        [CacheType.MEMORY]: { cacheType: CacheType.MEMORY, counts: { active: 0, expired: 0, total: 0 } },
        [CacheType.SUPABASE]: { cacheType: CacheType.SUPABASE, counts: { active: 0, expired: 0, total: 0 } },
        [CacheType.LOCAL_STORAGE]: { cacheType: CacheType.LOCAL_STORAGE, counts: { active: 0, expired: 0, total: 0 } },
        [CacheType.SESSION_STORAGE]: { cacheType: CacheType.SESSION_STORAGE, counts: { active: 0, expired: 0, total: 0 } },
      };

      setCompleteStats({
        totalEntries: 85,
        byType: statisticsByType,
        expiration: {
          expiringInNextMinute: 2,
          expiringInNextHour: 8,
          expiringInNextDay: 15,
          expiringInNextWeek: 25,
          expiringLater: 28,
          expired: 7
        },
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCacheStatistics();

    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchCacheStatistics();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchCacheStatistics]);

  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined) return 'N/A';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getExportData = () => {
    return {
      statistics,
      completeStatistics: completeStats,
      exportInfo: {
        timestamp: new Date().toISOString(),
        exportType: 'cache-monitoring',
        version: '1.0'
      }
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cache Monitor</h1>
          <p className="text-muted-foreground">
            Monitor and analyze cache performance metrics in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchCacheStatistics}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspector">Inspector</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Cache Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completeStats?.totalEntries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Cached items across all types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics ? `${(statistics.hitRate * 100).toFixed(1)}%` : '0%'}</div>
                <p className="text-xs text-muted-foreground">
                  Cache effectiveness
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics ? `${statistics.averageDuration.toFixed(2)}ms` : '0ms'}</div>
                <p className="text-xs text-muted-foreground">
                  Average operation time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                <Database className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(statistics?.cacheSize)}</div>
                <p className="text-xs text-muted-foreground">
                  Memory usage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Hit/Miss Rate Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Hit/Miss Rate</CardTitle>
                <CardDescription>
                  Performance of cache retrieval operations
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <CacheMetricsChart
                  hitRate={statistics?.hitRate || 0}
                  missRate={statistics?.missRate || 0}
                />
              </CardContent>
            </Card>

            {/* Operations Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Operations</CardTitle>
                <CardDescription>
                   Distribution of operation types
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <CacheOperationsChart
                  operations={statistics?.operationCounts || {
                    get: 0,
                    set: 0,
                    delete: 0,
                    invalidate: 0,
                    clear: 0
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-md shadow-sm">
              <Button
                variant={timeRange === 'hour' ? 'default' : 'outline'}
                onClick={() => setTimeRange('hour')}
                className="rounded-l-md rounded-r-none"
              >
                Hour
              </Button>
              <Button
                variant={timeRange === 'day' ? 'default' : 'outline'}
                onClick={() => setTimeRange('day')}
                className="rounded-none border-l-0 border-r-0"
              >
                Day
              </Button>
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                onClick={() => setTimeRange('week')}
                className="rounded-none border-r-0"
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeRange('month')}
                className="rounded-r-md rounded-l-none"
              >
                Month
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache Performance Over Time</CardTitle>
              <CardDescription>
                 Hit rate and operation duration trends
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {/* This would be a time-series chart in a real implementation */}
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Time-series data would be displayed here for the selected time range: {timeRange}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Size Over Time</CardTitle>
                <CardDescription>
                   Memory usage trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <CacheSizeChart
                  cacheSize={statistics?.cacheSize || 0}
                  entryCount={statistics?.entryCount || 0}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
                <CardDescription>
                   Cache operation failures
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">
                        {statistics && typeof statistics.errorRate === 'number' ? `${(statistics.errorRate * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={statistics && typeof statistics.errorRate === 'number' && statistics.errorRate > 0.05 ? "#ef4444" : "#10b981"}
                        strokeWidth="10"
                        strokeDasharray={`${statistics && typeof statistics.errorRate === 'number' ? statistics.errorRate * 283 : 0} 283`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                  <p className="mt-4 text-center text-muted-foreground">
                    {statistics && typeof statistics.errorRate === 'number' && statistics.errorRate > 0.05
                      ? "High error rate detected"
                      : "Error rate is within acceptable range"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        {/* Inspector Tab */}
        <TabsContent value="inspector" className="space-y-4">
          <CacheInspector />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Type Distribution</CardTitle>
              <CardDescription>
                 Distribution of cache entries by type
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <CacheTypeDistribution
                distribution={completeStats ? completeStats.byType : {
                  [CacheType.MEMORY]: { cacheType: CacheType.MEMORY, counts: { active: 0, expired: 0, total: 0 } },
                  [CacheType.SUPABASE]: { cacheType: CacheType.SUPABASE, counts: { active: 0, expired: 0, total: 0 } },
                  [CacheType.LOCAL_STORAGE]: { cacheType: CacheType.LOCAL_STORAGE, counts: { active: 0, expired: 0, total: 0 } },
                  [CacheType.SESSION_STORAGE]: { cacheType: CacheType.SESSION_STORAGE, counts: { active: 0, expired: 0, total: 0 } },
                }}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Expiration Timeline</CardTitle>
                <CardDescription>
                   When cache entries will expire
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {completeStats && (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span>Next minute</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(completeStats.expiration.expiringInNextMinute / completeStats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{completeStats.expiration.expiringInNextMinute}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Next hour</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${(completeStats.expiration.expiringInNextHour / completeStats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{completeStats.expiration.expiringInNextHour}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Next day</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-400 h-2.5 rounded-full"
                          style={{ width: `${(completeStats.expiration.expiringInNextDay / completeStats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{completeStats.expiration.expiringInNextDay}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Next week</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-300 h-2.5 rounded-full"
                          style={{ width: `${(completeStats.expiration.expiringInNextWeek / completeStats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{completeStats.expiration.expiringInNextWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Later</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-200 h-2.5 rounded-full"
                          style={{ width: `${(completeStats.expiration.expiringLater / completeStats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{completeStats.expiration.expiringLater}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Expired</span>
                      <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-red-400 h-2.5 rounded-full"
                          style={{ width: `${(completeStats.expiration.expired / completeStats.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{completeStats.expiration.expired}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active vs Expired</CardTitle>
                <CardDescription>
                   Current status of cache entries
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {completeStats && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative w-48 h-48">
                      <PieChart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground opacity-20" />
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Active entries */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="10"
                          strokeDasharray={`${((completeStats.totalEntries - completeStats.expiration.expired) / completeStats.totalEntries) * 283} 283`}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                        />
                        {/* Expired entries */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="10"
                          strokeDasharray={`${(completeStats.expiration.expired / completeStats.totalEntries) * 283} 283`}
                          strokeDashoffset={`${((completeStats.totalEntries - completeStats.expiration.expired) / completeStats.totalEntries) * 283}`}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-8 mt-6">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                        <span>Active: {completeStats.totalEntries - completeStats.expiration.expired}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                        <span>Expired: {completeStats.expiration.expired}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-4">
          <CacheManagement />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <CacheConfig />
        </TabsContent>
      </Tabs>

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">About Cache Monitoring</p>
            <p className="text-sm">
              This dashboard provides real-time insights into the application&apos;s multi-layered cache system.
              Monitor performance metrics, analyze cache usage patterns, and identify potential bottlenecks.
              Data is automatically refreshed every 30 seconds.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Warning for High Error Rate */}
      {statistics && typeof statistics.errorRate === 'number' && statistics.errorRate > 0.05 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> High cache error rate detected ({(statistics.errorRate * 100).toFixed(1)}%).
            This may indicate issues with the cache system or underlying storage.
          </AlertDescription>
        </Alert>
      )}

      {/* Export Button */}
      <div className="flex justify-end pt-4 border-t">
        <ExportJsonButton
          data={getExportData()}
          filename="cache-monitoring-report"
        />
      </div>
    </div>
  );
}