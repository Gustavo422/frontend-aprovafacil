import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../ui/popover';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface Alert {
  id: string;
  timestamp: number;
  type: 'warning' | 'critical';
  category: 'system' | 'database' | 'endpoint' | 'error';
  message: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
}

export function AlertIndicator() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitor/alerts?status=active');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }
      
      const data = await response.json();
      // Log temporário para verificar dados
      console.log('[DEBUG] alert-indicator - Dados recebidos:', {
        hasData: !!data,
        dataStructure: data ? Object.keys(data) : 'no data',
        dataData: data.data,
        dataLength: data.data?.length || 0
      });
      setAlerts(data.data || data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitor/alerts/acknowledge/${alertId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.status}`);
      }
      
      // Remove the alert from the list
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s atrás`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  // Fetch alerts on mount and periodically
  useEffect(() => {
    fetchAlerts();
    
    const intervalId = setInterval(() => {
      fetchAlerts();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Count alerts by type
  const criticalCount = alerts.filter(alert => alert.type === 'critical').length;
  const warningCount = alerts.filter(alert => alert.type === 'warning').length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={() => setOpen(!open)}
        >
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <Badge 
              variant={criticalCount > 0 ? "destructive" : "warning"}
              className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 flex items-center justify-center"
            >
              {alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-medium">Alertas do Sistema</h3>
          <div className="flex gap-1">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} Críticos</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning">{warningCount} Avisos</Badge>
            )}
          </div>
        </div>
        
        <Separator />
        
        <ScrollArea className="h-80">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum alerta ativo
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`flex items-start justify-between p-2 rounded-md ${
                    alert.type === 'critical' ? 'bg-destructive/10' : 'bg-warning/10'
                  }`}
                >
                  <div className="flex gap-2">
                    {alert.type === 'critical' ? (
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                      </p>
                      <p className="text-xs">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        <div className="p-2 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => window.location.href = '/dashboard/monitoring'}
          >
            Ver Todos
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}