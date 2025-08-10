/* eslint-disable no-shadow */
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Icons
import { 
  Award, 
  AlertCircle, 
  Clock, 
  FileText, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Brain,
  Users
} from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Recharts
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Components
import { StatsStatusCards } from '@/src/features/guru/components/StatsStatusCards';
import { RecentActivitiesList } from '@/src/features/guru/components/RecentActivitiesList';
import { useConcursoQuery } from '@/src/hooks/useConcursoQuery';
import { useEnhancedStats } from '@/src/features/guru/hooks/useEnhancedStats';
import { useRecentActivities } from '@/src/features/guru/hooks/useRecentActivities';
import { useConcurso } from '@/contexts/ConcursoContext';
import { ErrorBlock } from '@/src/features/guru/components/ErrorBlock';

interface PerformanceStats {
  totalSimulados: number;
  totalQuestoes: number;
  totalStudyTime: number;
  averageScore: number;
  accuracyRate: number;
  approvalProbability: number;
  studyStreak: number;
  weeklyProgress: {
    simulados: number;
    questoes: number;
    studyTime: number;
    scoreImprovement: number;
  };
  disciplinaStats: Array<{
    disciplina: string;
    total_questions: number;
    resposta_corretas: number;
    accuracy_rate: number;
    trend: 'up' | 'down' | 'stable';
    color: string;
  }>;
  performanceHistory: Array<{
    date: string;
    score: number;
    accuracy: number;
    studyTime: number;
  }>;
  goalProgress: {
    targetScore: number;
    currentScore: number;
    targetDate: string;
    daysRemaining: number;
    onTrack: boolean;
  };
  competitiveRanking: {
    position: number;
    totalusuarios: number;
    percentile: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'simulado' | 'questao' | 'flashcard';
  titulo: string;
  descricao: string;
  time: string;
  created_at: string;
  score?: number;
  improvement?: number;
}

export default function DashboardPage() {
  const { activeConcursoId } = useConcurso();

  // Usar o hook customizado para buscar estatísticas de desempenho com filtro automático
  const {
    data: performanceStats = {
      totalSimulados: 0,
      totalQuestoes: 0,
      totalStudyTime: 0,
      averageScore: 0,
      accuracyRate: 0,
      approvalProbability: 0,
      studyStreak: 0,
      weeklyProgress: {
        simulados: 0,
        questoes: 0,
        studyTime: 0,
        scoreImprovement: 0,
      },
      disciplinaStats: [],
      performanceHistory: [],
      goalProgress: {
        targetScore: 70,
        currentScore: 0,
        targetDate: '',
        daysRemaining: 0,
        onTrack: false,
      },
      competitiveRanking: {
        position: 0,
        totalusuarios: 0,
        percentile: 0,
      },
    },
    isLoading: isLoadingStats,
    error: statsError,
    hasConcurso,
    isLoadingConcurso
  } = useEnhancedStats();

  // Usar o hook customizado para buscar atividades recentes com filtro automático
  const {
    data: recentActivities = [],
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useRecentActivities();

  // Loading state
  if (isLoadingStats || isLoadingActivities || isLoadingConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Guru da Aprovação</h1>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError || activitiesError) {
    logger.error('Erro ao buscar dados do dashboard:', {
      statsError: statsError instanceof Error ? statsError.message : String(statsError),
      activitiesError: activitiesError instanceof Error ? activitiesError.message : String(activitiesError),
      concursoId: activeConcursoId,
    });

    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Guru da Aprovação</h1>
        <ErrorBlock
          title="Falha ao carregar o dashboard"
          message="Verifique sua conexão ou tente novamente mais tarde."
          onRetry={() => {
            // Recarrega a página para forçar nova tentativa das queries
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      </div>
    );
  }

  // No concurso selected state
  if (!hasConcurso) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Guru da Aprovação</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">
            Nenhum concurso selecionado
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um concurso para visualizar suas estatísticas de desempenho.
          </p>
        </div>
      </div>
    );
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };



  function formatScoreImprovement(value: number) {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  }

  function formatAccuracy(value: number) {
    return `${value.toFixed(1)}%`;
  }

  function formatRelativeTime(date: string) {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    return formatDate(activityDate);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guru da Aprovação</h1>
          <p className="text-muted-foreground">
            Análise inteligente do seu progresso e probabilidade de aprovação.
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <StatsStatusCards stats={performanceStats} />

      {/* Progresso Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresso Semanal
          </CardTitle>
          <CardDescription>
            Comparação com a semana anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Simulados</span>
                <span className="text-sm text-muted-foreground">
                  {formatScoreImprovement(performanceStats.weeklyProgress.scoreImprovement)}
                </span>
              </div>
              <Progress value={performanceStats.weeklyProgress.simulados} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Questões</span>
                <span className="text-sm text-muted-foreground">
                  {performanceStats.weeklyProgress.questoes}
                </span>
              </div>
              <Progress value={performanceStats.weeklyProgress.questoes} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo de Estudo</span>
                <span className="text-sm text-muted-foreground">
                  {formatStudyTime(performanceStats.weeklyProgress.studyTime)}
                </span>
              </div>
              <Progress value={performanceStats.weeklyProgress.studyTime} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Melhoria</span>
                <span className="text-sm text-muted-foreground">
                  {formatScoreImprovement(performanceStats.weeklyProgress.scoreImprovement)}
                </span>
              </div>
              <Progress value={Math.abs(performanceStats.weeklyProgress.scoreImprovement)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Disciplina */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance por Disciplina
          </CardTitle>
          <CardDescription>
            Taxa de acerto por disciplina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {performanceStats.disciplinaStats.map((disciplina) => (
              <div key={disciplina.disciplina} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{disciplina.disciplina}</span>
                  <div className="flex items-center gap-1">
                    {disciplina.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : disciplina.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {formatAccuracy(disciplina.accuracy_rate)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={disciplina.accuracy_rate} 
                  className="h-2"
                  style={{ 
                    '--progress-color': disciplina.color 
                  } as React.CSSProperties}
                />
                <div className="text-xs text-muted-foreground">
                  {disciplina.resposta_corretas} de {disciplina.total_questions} questões
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Performance */}
      {performanceStats.performanceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Histórico de Performance
            </CardTitle>
            <CardDescription>
              Evolução do seu desempenho ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceStats.performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    formatter={(value: number, name: string) => [
                      name === 'score' ? `${value.toFixed(1)}%` : 
                      name === 'accuracy' ? `${value.toFixed(1)}%` : 
                      formatStudyTime(value),
                      name === 'score' ? 'Pontuação' : 
                      name === 'accuracy' ? 'Taxa de Acerto' : 'Tempo de Estudo'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Pontuação"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Taxa de Acerto"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking Competitivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking Competitivo
          </CardTitle>
          <CardDescription>
            Sua posição em relação aos outros candidatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                #{performanceStats.competitiveRanking.position}
              </div>
              <div className="text-sm text-muted-foreground">
                de {performanceStats.competitiveRanking.totalusuarios} candidatos
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {performanceStats.competitiveRanking.percentile.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Percentil
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            Suas últimas atividades de estudo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivitiesList activities={recentActivities} />
        </CardContent>
      </Card>
    </div>
  );
}