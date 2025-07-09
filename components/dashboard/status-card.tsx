'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type StatusCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  className?: string;
};

export function StatusCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatusCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            'mt-2 flex items-center text-xs',
            trend.type === 'up' ? 'text-green-500' : 
            trend.type === 'down' ? 'text-red-500' : 'text-amber-500'
          )}>
            {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'} {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
