"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, Cardtitulo } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Alert, Alertdescricao, Alerttitulo } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Activity,
  Database,
  Server,
  Cpu
} from 'lucide-react';

// Types
interface PerformanceData {
  system: {
    cpuUsage: number;
    memoryUsage: number;
    loadAverage: number[];
    activeConnections: number;
    uptime: number;
  };
  database: {
    avgResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    connectionPoolUsage: number;
    activeQueries: number;
  };
  endpoints: Array<{
    endpoint: string;
    method: string;
    count: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  }>;
  alerts: Array<{
    id: string;
    timestamp: number;
    type: 'warning' | 'critical';
    category: 'system' | 'database' | 'endpoint' | 'error';
    message: string;
    value: number;
    threshold: number;
    status: 'active' | 'acknowledged' | 'resolved';
  }>;
  timestamp: number;
}

// Time range options
const timeRangeOptions = [
  { label: '1 hora', value: 3600000 },
  { label: '6 horas', value: 21600000 },
  { label: '12 horas', value: 43200000 },
  { label: '24 horas', value: 86400000 }
];

export function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(3600000); // Default to 1 hour
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // Default to 1 minute
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/monitor/performance?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.status}`);
      }
      
      const data = await response.json();
      // Log temporário para verificar dados
      console.log('[DEBUG] performance-dashboard - Dados recebidos:', {
        hasData: !!data,
        dataStructure: data ? Object.keys(data) : 'no data',
        dataData: data.data,
        dataLength: data.data ? Object.keys(data.data).length : 0
      });
      setPerformanceData(data.data || data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError(`Error fetching performance data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Handle alert acknowledgement
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitor/performance/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.status}`);
      }
      
      // Refresh data after acknowledgement
      fetchPerformanceData();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitor/performance/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to resolve alert: ${response.status}`);
      }
      
      // Refresh data after resolution
      fetchPerformanceData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Set up automatic refresh
  useEffect(() => {
    fetchPerformanceData();
    
    const intervalId = setInterval(() => {
      fetchPerformanceData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchPerformanceData, refreshInterval]);

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} segundos atrás`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutos atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} horas atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days} dias atrás`;
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Render system overview
  const renderSystemOverview = () => {
    if (!performanceData) return null;
    
    const { system, database } = performanceData;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Cardtitulo className="text-sm font-medium flex items-center">
              <Cpu className="mr-2 h-4 w-4" />
              CPU Usage
            </Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{system.cpuUsage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Load Avg: {system.loadAverage.map(l => l.toFixed(2)).join(', ')}
            </p>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${system.cpuUsage > 80 ? 'bg-destructive' : system.cpuUsage > 60 ? 'bg-warning' : 'bg-primary'}`} 
                style={{ width: `${Math.min(system.cpuUsage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <Cardtitulo className="text-sm font-medium flex items-center">
              <Server className="mr-2 h-4 w-4" />
              Memory Usage
            </Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{system.memoryUsage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Active Connections: {system.activeConnections}
            </p>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${system.memoryUsage > 80 ? 'bg-destructive' : system.memoryUsage > 60 ? 'bg-warning' : 'bg-primary'}`} 
                style={{ width: `${Math.min(system.memoryUsage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <Cardtitulo className="text-sm font-medium flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Database Response
            </Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{database.avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Max: {database.maxResponseTime.toFixed(0)}ms
            </p>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${database.avgResponseTime > 500 ? 'bg-destructive' : database.avgResponseTime > 200 ? 'bg-warning' : 'bg-primary'}`} 
                style={{ width: `${Math.min((database.avgResponseTime / 1000) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <Cardtitulo className="text-sm font-medium flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              System Status
            </Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.alerts.filter(a => a.status === 'active').length > 0 ? (
                <span className="text-destructive">Alertas Ativos</span>
              ) : (
                <span className="text-primary">Saudável</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {formatUptime(system.uptime)}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant={performanceData.alerts.filter(a => a.status === 'active' && a.type === 'critical').length > 0 ? "destructive" : "outline"}>
                {performanceData.alerts.filter(a => a.status === 'active' && a.type === 'critical').length} Críticos
              </Badge>
              <Badge variant={performanceData.alerts.filter(a => a.status === 'active' && a.type === 'warning').length > 0 ? "warning" : "outline"}>
                {performanceData.alerts.filter(a => a.status === 'active' && a.type === 'warning').length} Avisos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render performance charts
  const renderPerformanceCharts = () => {
    if (!performanceData) return null;
    
    // Create chart data
    const endpointData = performanceData.endpoints
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <Cardtitulo>Tempo de Resposta por Endpoint (Top 10)</Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={endpointData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="endpoint" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}ms`, name === 'avgResponseTime' ? 'Média' : '95º Percentil']}
                    labelFormatter={(label) => `Endpoint: ${label}`}
                  />
                  <Legend formatter={(value) => value === 'avgResponseTime' ? 'Tempo Médio' : 'Tempo (95º Percentil)'} />
                  <Bar dataKey="avgResponseTime" name="avgResponseTime" fill="#3b82f6" />
                  <Bar dataKey="p95ResponseTime" name="p95ResponseTime" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Cardtitulo>Requisições por Endpoint (Top 10)</Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={endpointData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="endpoint" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Requisições']}
                    labelFormatter={(label) => `Endpoint: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Requisições" fill="#10b981">
                    {endpointData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.errorRate > 0.1 ? '#ef4444' : entry.errorRate > 0.05 ? '#f97316' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render alerts
  const renderAlerts = () => {
    if (!performanceData) return null;
    
    const { alerts } = performanceData;
    const activeAlerts = alerts.filter(a => a.status === 'active');
    
    if (activeAlerts.length === 0) {
      return (
        <div className="mt-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <Alerttitulo>Sem alertas ativos</Alerttitulo>
            <Alertdescricao>
              Todos os sistemas estão operando normalmente.
            </Alertdescricao>
          </Alert>
        </div>
      );
    }
    
    return (
      <div className="mt-6 space-y-4">
        {activeAlerts.map(alert => (
          <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2">
                {alert.type === 'critical' ? (
                  <AlertCircle className="h-4 w-4 mt-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-1" />
                )}
                <div>
                  <Alerttitulo className="mb-1">
                    {alert.type === 'critical' ? 'Alerta Crítico' : 'Aviso'}: {alert.category}
                  </Alerttitulo>
                  <Alertdescricao>
                    <p>{alert.message}</p>
                    <p className="text-xs mt-1">
                      Valor: {alert.value} (Limite: {alert.threshold}) • {formatTimeAgo(alert.timestamp)}
                    </p>
                  </Alertdescricao>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  Reconhecer
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleResolveAlert(alert.id)}
                >
                  Resolver
                </Button>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    );
  };

  // Render endpoint table
  const renderEndpointTable = () => {
    if (!performanceData) return null;
    
    const { endpoints } = performanceData;
    
    return (
      <div className="mt-6">
        <Card>
          <CardHeader>
            <Cardtitulo>Desempenho dos Endpoints</Cardtitulo>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Endpoint</th>
                    <th className="text-left py-3 px-4">Método</th>
                    <th className="text-right py-3 px-4">Requisições</th>
                    <th className="text-right py-3 px-4">Tempo Médio</th>
                    <th className="text-right py-3 px-4">95º Percentil</th>
                    <th className="text-right py-3 px-4">Taxa de Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((endpoint, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 max-w-[200px] truncate">{endpoint.endpoint}</td>
                      <td className="py-2 px-4">
                        <Badge variant={
                          endpoint.method === 'GET' ? 'default' :
                          endpoint.method === 'POST' ? 'secondary' :
                          endpoint.method === 'PUT' ? 'outline' :
                          endpoint.method === 'DELETE' ? 'destructive' : 'default'
                        }>
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-right">{endpoint.count}</td>
                      <td className="py-2 px-4 text-right">
                        <span className={
                          endpoint.avgResponseTime > 1000 ? 'text-destructive' :
                          endpoint.avgResponseTime > 500 ? 'text-warning' : ''
                        }>
                          {endpoint.avgResponseTime.toFixed(0)}ms
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className={
                          endpoint.p95ResponseTime > 1000 ? 'text-destructive' :
                          endpoint.p95ResponseTime > 500 ? 'text-warning' : ''
                        }>
                          {endpoint.p95ResponseTime.toFixed(0)}ms
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className={
                          endpoint.errorRate > 0.1 ? 'text-destructive' :
                          endpoint.errorRate > 0.05 ? 'text-warning' : ''
                        }>
                          {(endpoint.errorRate * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do desempenho do sistema
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Intervalo:</span>
            <select 
              className="border rounded px-2 py-1 text-sm"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
            >
              <option value={10000}>10 segundos</option>
              <option value={30000}>30 segundos</option>
              <option value={60000}>1 minuto</option>
              <option value={300000}>5 minutos</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Período:</span>
            <select 
              className="border rounded px-2 py-1 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value, 10))}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>
      
      {error ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <Alerttitulo>Erro</Alerttitulo>
          <Alertdescricao>{error}</Alertdescricao>
        </Alert>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Última atualização: {lastRefreshed.toLocaleTimeString()}
            </div>
            
            {performanceData?.alerts && performanceData.alerts.filter(a => a.status === 'active').length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {performanceData.alerts.filter(a => a.status === 'active' && a.type === 'critical').length} Críticos
                </Badge>
                <Badge variant="warning">
                  {performanceData.alerts.filter(a => a.status === 'active' && a.type === 'warning').length} Avisos
                </Badge>
              </div>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {renderSystemOverview()}
              {renderPerformanceCharts()}
            </TabsContent>
            
            <TabsContent value="endpoints">
              {renderEndpointTable()}
            </TabsContent>
            
            <TabsContent value="alerts">
              {renderAlerts()}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}