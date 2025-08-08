'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

type ActivityType = 'success' | 'error' | 'warning' | 'info';

interface ActivityItem {
  id: string;
  type: ActivityType;
  titulo: string;
  descricao: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
}

// Memoized activity icons to prevent recreation on each render
const ActivityIcon = memo(({ type }: { type: ActivityType }) => {
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
});
ActivityIcon.displayName = 'ActivityIcon';

// Memoized activity item component
const ActivityItemComponent = memo(({ activity }: { activity: ActivityItem }) => {
  // Format the date once and memoize it
  const formattedDate = useMemo(() => {
    return new Date(activity.timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [activity.timestamp]);

  return (
    <div className="flex items-start">
      <div className="mr-3 mt-0.5">
        <ActivityIcon type={activity.type} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">
          {activity.titulo}
        </p>
        <p className="text-sm text-muted-foreground">
          {activity.descricao}
        </p>
        <p className="text-xs text-muted-foreground">
          {formattedDate}
        </p>
      </div>
    </div>
  );
});
ActivityItemComponent.displayName = 'ActivityItemComponent';

export const RecentActivity = memo(({ 
  activities, 
  className, 
  maxItems = 5 
}: RecentActivityProps) => {
  // Memoize the sliced activities to prevent unnecessary calculations on re-renders
  const displayedActivities = useMemo(() => {
    return activities.slice(0, maxItems);
  }, [activities, maxItems]);
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atividades Recentes</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <ActivityItemComponent key={activity.id} activity={activity} />
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
});
