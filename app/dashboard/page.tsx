'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ExportJsonButton } from '@/components/ui/export-json-button';
import {
  FileText,
  ListChecks,
  Clock,
  Target,
  BookOpen,
  Calendar,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
  disciplineStats: Array<{
    disciplina: string;
    total_questions: number;
    correct_answers: number;
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
    totalUsers: number;
    percentile: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'simulado' | 'questao' | 'flashcard';
  title: string;
  description: string;
  time: string;
  created_at: string;
  score?: number;
  improvement?: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
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
    disciplineStats: [],
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
      totalUsers: 0,
      percentile: 0,
    },
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar estatísticas de performance
        const statsResponse = await fetch('/api/dashboard/enhanced-stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setPerformanceStats(statsData);
        }
        
        // Buscar atividades recentes
        const activitiesResponse = await fetch('/api/dashboard/activities');
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setRecentActivities(activitiesData);
        }

      } catch (error) {
        logger.error('Erro ao buscar dados do dashboard:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setError('Erro ao carregar dados do dashboard. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Formatar tempo de estudo
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  // Formatar taxa de acerto
  const formatAccuracy = (rate: number) => `${Math.round(rate)}%`;

  // Formatar melhoria de pontuação
  const formatScoreImprovement = (improvement: number) => {
    const sign = improvement >= 0 ? '+' : '';
    return `${sign}${Math.round(improvement)}%`;
  };

  // Formatar tempo relativo
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d atrás`;
    }
  };

  // Determinar status de aprovação
  const getApprovalStatus = (probability: number) => {
    if (probability >= 80) return { text: 'Excelente', bg: 'bg-green-100', color: 'text-green-800' };
    if (probability >= 60) return { text: 'Bom', bg: 'bg-blue-100', color: 'text-blue-800' };
    if (probability >= 40) return { text: 'Regular', bg: 'bg-yellow-100', color: 'text-yellow-800' };
    return { text: 'Precisa Melhorar', bg: 'bg-red-100', color: 'text-red-800' };
  };

  const getDashboardData = () => {
    return {
      performanceStats,
      recentActivities,
      exportInfo: {
        timestamp: new Date().toISOString(),
        exportType: 'dashboard-performance',
        version: '1.0'
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Erro ao carregar dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const approvalStatus = getApprovalStatus(performanceStats.approvalProbability);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header com Indicador de Aprovação */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e veja o quão próximo você está da aprovação
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Probabilidade de Aprovação</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{Math.round(performanceStats.approvalProbability)}%</div>
              <Badge className={`${approvalStatus.bg} ${approvalStatus.color} border-0`}>
                {approvalStatus.text}
              </Badge>
            </div>
          </div>
        </div>

        {/* Barra de Progresso para Aprovação */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso para Aprovação</span>
                <span className="text-sm text-muted-foreground">
                  Meta: {performanceStats.goalProgress.targetScore}%
                </span>
              </div>
              <Progress 
                value={performanceStats.approvalProbability} 
                className="h-3"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="flex items-center gap-1">
                  {performanceStats.goalProgress.onTrack ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                  {performanceStats.goalProgress.onTrack ? 'No caminho certo' : 'Precisa acelerar'}
                </span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards Melhorados */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Simulados Realizados
            </CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              {performanceStats.weeklyProgress.simulados > 0 && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceStats.totalSimulados}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatScoreImprovement(performanceStats.weeklyProgress.simulados)} esta semana
            </p>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span>Sequência: {performanceStats.studyStreak} dias</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Acerto
            </CardTitle>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              {performanceStats.weeklyProgress.scoreImprovement > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAccuracy(performanceStats.accuracyRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatScoreImprovement(performanceStats.weeklyProgress.scoreImprovement)} esta semana
            </p>
            <div className="mt-2">
              <Progress 
                value={performanceStats.accuracyRate} 
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo de Estudo
            </CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <Brain className="h-3 w-3 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatStudyTime(performanceStats.totalStudyTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatStudyTime(performanceStats.weeklyProgress.studyTime)} esta semana
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Média diária: {formatStudyTime(Math.round(performanceStats.totalStudyTime / 30))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ranking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <BarChart3 className="h-3 w-3 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{performanceStats.competitiveRanking.position}
            </div>
            <p className="text-xs text-muted-foreground">
              Top {Math.round(performanceStats.competitiveRanking.percentile)}% dos usuários
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              de {performanceStats.competitiveRanking.totalUsers} usuários
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Performance Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Evolução do Desempenho</CardTitle>
            <CardDescription>
              Acompanhe sua evolução ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceStats.performanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceStats.performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
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
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Complete mais simulados para ver sua evolução
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discipline Performance */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Desempenho por Disciplina</CardTitle>
            <CardDescription>
              Identifique seus pontos fortes e fracos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceStats.disciplineStats.length > 0 ? (
              <div className="space-y-4">
                {performanceStats.disciplineStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{stat.disciplina}</span>
                        {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      </div>
                      <span className="text-sm font-bold" style={{ color: stat.color }}>
                        {formatAccuracy(stat.accuracy_rate)}
                      </span>
                    </div>
                    <Progress 
                      value={stat.accuracy_rate} 
                      className="h-2"
                      style={{ 
                        '--progress-background': stat.color 
                      } as React.CSSProperties}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{stat.correct_answers} acertos</span>
                      <span>{stat.total_questions} questões</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Complete simulados para ver estatísticas por disciplina
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Meta de Aprovação</CardTitle>
            <CardDescription>
              Acompanhe seu progresso em direção à meta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pontuação Atual</span>
              <span className="text-2xl font-bold">{Math.round(performanceStats.goalProgress.currentScore)}%</span>
            </div>
            <Progress 
              value={(performanceStats.goalProgress.currentScore / performanceStats.goalProgress.targetScore) * 100} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Meta: {performanceStats.goalProgress.targetScore}%
              </span>
              <span className={performanceStats.goalProgress.onTrack ? 'text-green-600' : 'text-yellow-600'}>
                {performanceStats.goalProgress.daysRemaining} dias restantes
              </span>
            </div>
            {!performanceStats.goalProgress.onTrack && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Acelere seus estudos para atingir a meta!
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Suas últimas atividades na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map(activity => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    {activity.type === 'simulado' && <FileText className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'questao' && <ListChecks className="h-4 w-4 text-green-500" />}
                    {activity.type === 'flashcard' && <BookOpen className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.created_at)}</p>
                      {activity.score && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.score}%
                        </Badge>
                      )}
                      {activity.improvement && activity.improvement > 0 && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          +{activity.improvement}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma atividade recente
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece a estudar para ver suas atividades aqui
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/simulados">
          <Card className="card-hover cursor-pointer group transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Simulados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Pratique com simulados completos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/questoes-semanais">
          <Card className="card-hover cursor-pointer group transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Questões Semanais
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Questões selecionadas semanalmente
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/flashcards">
          <Card className="card-hover cursor-pointer group transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Revisão com flashcards dinâmicos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/apostilas">
          <Card className="card-hover cursor-pointer group transition-all duration-200 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apostilas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Material de estudo organizado
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Botão de Exportação */}
      <div className="flex justify-end pt-6 border-t">
        <ExportJsonButton
          data={getDashboardData()}
          filename="dashboard-performance-report"
          variant="default"
          className="bg-indigo-600 hover:bg-indigo-700"
        />
      </div>
    </div>
  );
}

