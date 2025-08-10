import React from 'react';
import type { ActivityDTO } from '../api/contracts';
import { Clock, FileText, Brain, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface RecentActivitiesListProps {
  activities: ActivityDTO[];
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
  return activityDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function RecentActivitiesList({ activities }: RecentActivitiesListProps) {
  if (!activities?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma atividade recente encontrada.</p>
        <p className="text-sm">Comece a estudar para ver suas atividades aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
          <div className="flex-shrink-0">
            {activity.type === 'simulado' && <FileText className="h-5 w-5 text-blue-500" />}
            {activity.type === 'questao' && <Target className="h-5 w-5 text-green-500" />}
            {activity.type === 'flashcard' && <Brain className="h-5 w-5 text-purple-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium truncate">{activity.titulo}</h4>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{activity.descricao}</p>
            {activity.score !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium">Pontuação: {activity.score}%</span>
                {activity.improvement !== undefined && (
                  <Badge variant={activity.improvement > 0 ? 'default' : 'secondary'}>
                    {activity.improvement > 0 ? `+${activity.improvement.toFixed(1)}%` : `${activity.improvement.toFixed(1)}%`}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


