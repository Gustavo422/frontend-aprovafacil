'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

type ActivityType = 'success' | 'error' | 'warning' | 'info';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
}

const getActivityIcon = (type: ActivityType) => {
  const iconClass = 'h-4 w-4';
  
  switch (type) {
    case 'success':
      return <CheckCircle2 className={cn(iconClass, 'text-green-500')} />;
    case 'error':
      return <AlertCircle className={cn(iconClass, 'text-red-500')} />;
    case 'warning':
      return <AlertCircle className={cn(iconClass, 'text-yellow-500')} />;
    case 'info':
    default:
      return <Info className={cn(iconClass, 'text-blue-500')} />;
  }
};

export function RecentActivity({ 
  activities, 
  className, 
  maxItems = 5 
}: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atividades Recentes</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className="mr-3 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade recente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
