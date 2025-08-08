'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CacheType } from '@/lib/cache-manager';
import { useToast } from '@/features/shared/hooks/use-toast';
import {
  Save,
  RefreshCw,
  Settings,
  Loader2,
  RotateCcw,
  Info,
  BarChart3,
  Database,
  AlertTriangle,
  Shield,
  Gauge,
  FileText
} from 'lucide-react';

interface CacheMonitorConfig {
  enabled: boolean;
  metricsEnabled: boolean;
  monitoredCacheTypes: CacheType[];
  logLevel: string;
  dashboardEnabled: boolean;
  persistConfig: boolean;
  metricsConfig: {
    maxMetricsHistory: number;
    samplingRate: number;
    detailedLogging: boolean;
    collectSizeMetrics: boolean;
    performanceAlertThreshold: number;
  };
  productionMode: boolean;
}

export function CacheConfig() {
  const [config, setConfig] = useState<CacheMonitorConfig>({
    enabled: true,
    metricsEnabled: true,
    monitoredCacheTypes: [
      CacheType.MEMORY,
      CacheType.LOCAL_STORAGE,
      CacheType.SESSION_STORAGE,
      CacheType.SUPABASE
    ],
    logLevel: 'info',
    dashboardEnabled: true,
    persistConfig: true,
    metricsConfig: {
      maxMetricsHistory: 1000,
      samplingRate: 100,
      detailedLogging: true,
      collectSizeMetrics: true,
      performanceAlertThreshold: 500
    },
    productionMode: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/cache-monitor/config');
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading configuration',
        descricao: error instanceof Error ? error.message : 'Failed to load configuration',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/cache-monitor/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.validationErrors) {
          throw new Error(`Validation errors: ${errorData.validationErrors.join(', ')}`);
        }
        throw new Error('Failed to save configuration');
      }
      
      const data = await response.json();
      setConfig(data.config);
      
      toast({
        title: 'Configuration saved',
        descricao: 'Cache monitor configuration has been updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving configuration',
        descricao: error instanceof Error ? error.message : 'Failed to save configuration',
      });
    } finally {
      setIsSaving(false);
    }
  }, [config, toast]);

  const handleResetConfig = useCallback(async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/admin/cache-monitor/config', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset configuration');
      }
      
      const data = await response.json();
      setConfig(data.config);
      
      toast({
        title: 'Configuration reset',
        descricao: 'Cache monitor configuration has been reset to defaults.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error resetting configuration',
        descricao: error instanceof Error ? error.message : 'Failed to reset configuration',
      });
    } finally {
      setIsResetting(false);
    }
  }, [toast]);

  const toggleCacheType = useCallback((cacheType: CacheType) => {
    setConfig(prevConfig => {
      const monitoredCacheTypes = [...prevConfig.monitoredCacheTypes];
      
      if (monitoredCacheTypes.includes(cacheType)) {
        return {
          ...prevConfig,
          monitoredCacheTypes: monitoredCacheTypes.filter(type => type !== cacheType)
        };
      } 
        return {
          ...prevConfig,
          monitoredCacheTypes: [...monitoredCacheTypes, cacheType]
        };
      
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              <span>Monitor Configuration</span>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={fetchConfig}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="logging">Logging</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Enable Monitoring</label>
                    <p className="text-xs text-muted-foreground">
                      Turn cache monitoring on or off
                    </p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Enable Metrics Collection</label>
                    <p className="text-xs text-muted-foreground">
                      Collect performance metrics for cache operations
                    </p>
                  </div>
                  <Switch
                    checked={config.metricsEnabled}
                    onCheckedChange={(checked) => setConfig({ ...config, metricsEnabled: checked })}
                    disabled={!config.enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Dashboard Enabled</label>
                    <p className="text-xs text-muted-foreground">
                      Show monitoring dashboard in admin panel
                    </p>
                  </div>
                  <Switch
                    checked={config.dashboardEnabled}
                    onCheckedChange={(checked) => setConfig({ ...config, dashboardEnabled: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Persist Configuration</label>
                    <p className="text-xs text-muted-foreground">
                      Save configuration between application restarts
                    </p>
                  </div>
                  <Switch
                    checked={config.persistConfig}
                    onCheckedChange={(checked) => setConfig({ ...config, persistConfig: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Production Mode</label>
                    <p className="text-xs text-muted-foreground">
                      Optimize for production environment (reduces overhead)
                    </p>
                  </div>
                  <Switch
                    checked={config.productionMode}
                    onCheckedChange={(checked) => setConfig({ ...config, productionMode: checked })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Monitored Cache Types
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="memory-cache"
                      checked={config.monitoredCacheTypes.includes(CacheType.MEMORY)}
                      onCheckedChange={() => toggleCacheType(CacheType.MEMORY)}
                    />
                    <label
                      htmlFor="memory-cache"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Memory Cache
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="local-storage-cache"
                      checked={config.monitoredCacheTypes.includes(CacheType.LOCAL_STORAGE)}
                      onCheckedChange={() => toggleCacheType(CacheType.LOCAL_STORAGE)}
                    />
                    <label
                      htmlFor="local-storage-cache"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Local Storage Cache
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="session-storage-cache"
                      checked={config.monitoredCacheTypes.includes(CacheType.SESSION_STORAGE)}
                      onCheckedChange={() => toggleCacheType(CacheType.SESSION_STORAGE)}
                    />
                    <label
                      htmlFor="session-storage-cache"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Session Storage Cache
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="supabase-cache"
                      checked={config.monitoredCacheTypes.includes(CacheType.SUPABASE)}
                      onCheckedChange={() => toggleCacheType(CacheType.SUPABASE)}
                    />
                    <label
                      htmlFor="supabase-cache"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Supabase Cache
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Metrics Configuration Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Metrics Collection Settings
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Max Metrics History</label>
                      <span className="text-sm">{config.metricsConfig.maxMetricsHistory} entries</span>
                    </div>
                    <Slider
                      value={[config.metricsConfig.maxMetricsHistory]}
                      min={100}
                      max={10000}
                      step={100}
                      onValueChange={(value) => setConfig({
                        ...config,
                        metricsConfig: {
                          ...config.metricsConfig,
                          maxMetricsHistory: value[0]
                        }
                      })}
                      disabled={!config.metricsEnabled || !config.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of metrics entries to keep in memory
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Sampling Rate</label>
                      <span className="text-sm">{config.metricsConfig.samplingRate}%</span>
                    </div>
                    <Slider
                      value={[config.metricsConfig.samplingRate]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(value) => setConfig({
                        ...config,
                        metricsConfig: {
                          ...config.metricsConfig,
                          samplingRate: value[0]
                        }
                      })}
                      disabled={!config.metricsEnabled || !config.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of operations to monitor (lower values reduce overhead)
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Collect Size Metrics</label>
                      <p className="text-xs text-muted-foreground">
                        Track memory usage of cache entries
                      </p>
                    </div>
                    <Switch
                      checked={config.metricsConfig.collectSizeMetrics}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        metricsConfig: {
                          ...config.metricsConfig,
                          collectSizeMetrics: checked
                        }
                      })}
                      disabled={!config.metricsEnabled || !config.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Performance Alert Threshold</label>
                      <span className="text-sm">{config.metricsConfig.performanceAlertThreshold} ms</span>
                    </div>
                    <Slider
                      value={[config.metricsConfig.performanceAlertThreshold]}
                      min={50}
                      max={2000}
                      step={50}
                      onValueChange={(value) => setConfig({
                        ...config,
                        metricsConfig: {
                          ...config.metricsConfig,
                          performanceAlertThreshold: value[0]
                        }
                      })}
                      disabled={!config.metricsEnabled || !config.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Threshold in milliseconds for triggering performance alerts
                    </p>
                  </div>
                </div>
              </div>
              
              <Alert>
                <Gauge className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm">
                    Lower sampling rates reduce monitoring overhead but provide less accurate metrics.
                    For production, a sampling rate of 10-20% is recommended.
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            {/* Logging Configuration Tab */}
            <TabsContent value="logging" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Logging Configuration
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Log Level</label>
                    <Select
                      value={config.logLevel}
                      onValueChange={(value) => setConfig({ ...config, logLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select log level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trace">Trace</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Controls the verbosity of cache monitoring logs
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Detailed Logging</label>
                      <p className="text-xs text-muted-foreground">
                        Enable detailed timing and context information in logs
                      </p>
                    </div>
                    <Switch
                      checked={config.metricsConfig.detailedLogging}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        metricsConfig: {
                          ...config.metricsConfig,
                          detailedLogging: checked
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Log Level Guide</h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-red-100">error</Badge>
                      <span>Only critical errors that affect functionality</span>
                    </li>
                    <li className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-amber-100">warn</Badge>
                      <span>Warnings and potential issues</span>
                    </li>
                    <li className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-blue-100">info</Badge>
                      <span>General information about cache operations</span>
                    </li>
                    <li className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-100">debug</Badge>
                      <span>Detailed information for debugging</span>
                    </li>
                    <li className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-purple-100">trace</Badge>
                      <span>Very verbose, includes all operations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            {/* Advanced Settings Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Advanced Settings
                </h3>
                
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">Warning</p>
                    <p className="text-sm">
                      These settings can significantly impact application performance.
                      Only modify if you understand the implications.
                    </p>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Auto-Adjust Sampling Rate</label>
                      <p className="text-xs text-muted-foreground">
                        Automatically reduce sampling rate under high load
                      </p>
                    </div>
                    <Switch
                      checked={config.productionMode}
                      onCheckedChange={(checked) => setConfig({ ...config, productionMode: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Adaptive Logging</label>
                      <p className="text-xs text-muted-foreground">
                        Increase log detail when performance issues are detected
                      </p>
                    </div>
                    <Switch
                      checked={config.metricsConfig.detailedLogging}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        metricsConfig: {
                          ...config.metricsConfig,
                          detailedLogging: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Actions */}
          <div className="flex justify-between pt-4 mt-6 border-t">
            <Button
              onClick={handleResetConfig}
              variant="outline"
              disabled={isResetting || isSaving}
            >
              {isResetting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Reset to Defaults
            </Button>
            
            <Button
              onClick={handleSaveConfig}
              disabled={isSaving || isResetting}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Configuration Tips</p>
            <p className="text-sm">
              For production environments, consider reducing the sampling rate and disabling detailed logging to minimize overhead.
              The memory usage of the monitoring system is directly proportional to the max metrics history setting.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}