import React from 'react';
import { Award, Calendar, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { EnhancedStatsDTO } from '../api/contracts';
import { cn } from '@/lib/utils';

export interface StatsStatusCardsProps {
  stats: EnhancedStatsDTO;
}

function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}

function formatAccuracy(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function StatsStatusCards({ stats }: StatsStatusCardsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className={cn('border-l-4 pl-3', stats.approvalProbability >= 80 ? 'border-l-green-500' : stats.approvalProbability >= 60 ? 'border-l-yellow-500' : 'border-l-red-500')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Probabilidade de Aprovação</div>
                  <div className="text-2xl font-bold">{stats.approvalProbability.toFixed(1)}%</div>
                </div>
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Taxa de Acerto</div>
                <div className="text-2xl font-bold">{formatAccuracy(stats.accuracyRate)}</div>
              </div>
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Tempo de Estudo</div>
                <div className="text-2xl font-bold">{formatStudyTime(stats.totalStudyTime)}</div>
              </div>
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Sequência de Estudo</div>
                <div className="text-2xl font-bold">{stats.studyStreak} dias</div>
              </div>
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso Semanal</CardTitle>
          <CardDescription>Comparação com a semana anterior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Simulados</span>
                <span className="text-sm text-muted-foreground">{stats.weeklyProgress.scoreImprovement > 0 ? `+${stats.weeklyProgress.scoreImprovement.toFixed(1)}%` : `${stats.weeklyProgress.scoreImprovement.toFixed(1)}%`}</span>
              </div>
              <Progress value={stats.weeklyProgress.simulados} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Questões</span>
                <span className="text-sm text-muted-foreground">{stats.weeklyProgress.questoes}</span>
              </div>
              <Progress value={stats.weeklyProgress.questoes} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo de Estudo</span>
                <span className="text-sm text-muted-foreground">{formatStudyTime(stats.weeklyProgress.studyTime)}</span>
              </div>
              <Progress value={stats.weeklyProgress.studyTime} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Melhoria</span>
                <span className="text-sm text-muted-foreground">{stats.weeklyProgress.scoreImprovement > 0 ? `+${stats.weeklyProgress.scoreImprovement.toFixed(1)}%` : `${stats.weeklyProgress.scoreImprovement.toFixed(1)}%`}</span>
              </div>
              <Progress value={Math.abs(stats.weeklyProgress.scoreImprovement)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}


