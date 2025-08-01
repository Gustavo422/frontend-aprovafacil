'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type StatusCardProps = {
  titulo: string;
  value: string | number;
  icon: ReactNode;
  descricao?: string;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  classnome?: string;
};

export function StatusCard({
  titulo,
  value,
  icon,
  descricao,
  trend,
  classnome,
}: StatusCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', classnome)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {descricao && (
          <p className="text-xs text-muted-foreground">{descricao}</p>
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
