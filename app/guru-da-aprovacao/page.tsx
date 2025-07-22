'use client';

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Cardtitulo, Carddescricao } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Icons
import { 
  Award, 
  AlertCircle, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  ListChecks, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
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
import { StatusCard } from '@/components/dashboard/status-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';

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
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar estatísticas de desempenho
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

  // Obter status de aprovação
  const getApprovalStatus = (probability: number) => {
    if (probability >= 80) return { text: 'Excelente', bg: 'bg-green-100', color: 'text-green-800' };
    if (probability >= 60) return { text: 'Bom', bg: 'bg-blue-100', color: 'text-blue-800' };
    if (probability >= 40) return { text: 'Médio', bg: 'bg-yellow-100', color: 'text-yellow-800' };
    return { text: 'Precisa Melhorar', bg: 'bg-red-100', color: 'text-red-800' };
  };

  // Adicionar funções utilitárias fictícias para evitar erro de função não definida
  function formatScoreImprovement(value: number) {
    return `${value > 0 ? '+' : ''}${value}%`;
  }
  function formatAccuracy(value: number) {
    return `${value}%`;
  }

  // Adicionar função fictícia para evitar erro de função não definida
  function formatRelativeTime(date: string) {
    try {
      const now = new Date();
      const activityDate = new Date(date);
      const diffInMs = now.getTime() - activityDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Formatar data completa para português
      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
      };

      if (diffInMinutes < 1) {
        return 'Agora mesmo';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} min atrás`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h atrás`;
      } else if (diffInDays < 7) {
        return `${diffInDays} dias atrás`;
      } else {
        return formatDate(activityDate);
      }
    } catch {
      // Fallback para caso a data seja inválida
      return 'Data não disponível';
    }
  }

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

  // Removido ExportDashboardButton e getDashboardData não utilizados

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Erro ao carregar dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="px-4 py-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const approvalStatus = getApprovalStatus(performanceStats.approvalProbability);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e desempenho
        </p>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          titulo="Simulados Realizados"
          value={performanceStats.totalSimulados}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          descricao={`${performanceStats.weeklyProgress.simulados} esta semana`}
          trend={{
            value: performanceStats.weeklyProgress.simulados > 0 ? `+${performanceStats.weeklyProgress.simulados}` : '0',
            type: performanceStats.weeklyProgress.simulados > 0 ? 'up' : 'neutral'
          }}
        />
        
        <StatusCard
          titulo="Questões Respondidas"
          value={performanceStats.totalQuestoes}
          icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
          descricao={`${performanceStats.weeklyProgress.questoes} esta semana`}
          trend={{
            value: performanceStats.weeklyProgress.questoes > 0 ? `+${performanceStats.weeklyProgress.questoes}` : '0',
            type: performanceStats.weeklyProgress.questoes > 0 ? 'up' : 'neutral'
          }}
        />
        
        <StatusCard
          titulo="Tempo de Estudo"
          value={formatStudyTime(performanceStats.totalStudyTime)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          descricao={`${formatStudyTime(performanceStats.weeklyProgress.studyTime)} esta semana`}
          trend={{
            value: performanceStats.weeklyProgress.studyTime > 0 ? `+${performanceStats.weeklyProgress.studyTime}%` : '0%',
            type: performanceStats.weeklyProgress.studyTime > 0 ? 'up' : 'neutral'
          }}
        />
        
        <StatusCard
          titulo="Probabilidade de Aprovação"
          value={`${Math.round(performanceStats.approvalProbability)}%`}
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
          descricao={
            approvalStatus.text === 'Excelente' ? 'Excelente' :
            approvalStatus.text === 'Bom' ? 'Bom' :
            approvalStatus.text === 'Médio' ? 'Médio' :
            'Precisa Melhorar'
          }
          classnome={cn(
            'border-2',
            approvalStatus.text === 'Excelente' ? 'border-green-500/20' :
            approvalStatus.text === 'Bom' ? 'border-blue-500/20' :
            approvalStatus.text === 'Médio' ? 'border-yellow-500/20' :
            'border-red-500/20'
          )}
        />
      </div>

      {/* Gráficos e Atividades */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de Desempenho */}
        <Card className="col-span-4">
          <CardHeader>
            <Cardtitulo>Evolução do Desempenho</Cardtitulo>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceStats.performanceHistory}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Pontuação']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="col-span-3">
          <CardHeader>
            <Cardtitulo>Atividades Recentes</Cardtitulo>
          </CardHeader>
          <CardContent>
            <RecentActivity 
              activities={recentActivities.map(act => ({
                id: act.id,
                type: act.type === 'simulado' ? 'success' : 
                      act.type === 'questao' ? 'info' : 'warning',
                titulo: act.titulo,
                descricao: act.descricao,
                timestamp: new Date(act.created_at)
              }))} 
            />
            <Button variant="ghost" className="w-full mt-4">
              Ver todas as atividades
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Estatísticas Melhorados */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Cardtitulo className="text-sm font-medium">
              Simulados Realizados
            </Cardtitulo>
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
                <Brain className="h-3 w-3 text-purple-400" />
                <span>Sequência: {performanceStats.studyStreak} dias</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Cardtitulo className="text-sm font-medium">
              Taxa de Acerto
            </Cardtitulo>
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
            <Cardtitulo className="text-sm font-medium">
              Tempo de Estudo
            </Cardtitulo>
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
            <Cardtitulo className="text-sm font-medium">
              Ranking
            </Cardtitulo>
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
              de {performanceStats.competitiveRanking.totalusuarios} usuários
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Gráfico de Desempenho */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <Cardtitulo>Evolução do Desempenho</Cardtitulo>
            <Carddescricao>
              Acompanhe sua evolução ao longo do tempo
            </Carddescricao>
          </CardHeader>
          <CardContent>
            {performanceStats.performanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceStats.performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend formatter={(value) => value === 'score' ? 'Pontuação' : value === 'accuracy' ? 'Taxa de Acerto' : value} />
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

        {/* Desempenho por Disciplina */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <Cardtitulo>Desempenho por Disciplina</Cardtitulo>
            <Carddescricao>
              Identifique seus pontos fortes e fracos
            </Carddescricao>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceStats.disciplinaStats.length > 0 ? (
              <div className="space-y-4">
                {performanceStats.disciplinaStats.map((stat, index) => (
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
                      <span>{stat.resposta_corretas} acertos</span>
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

      {/* Grid Secundário */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progresso da Meta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Cardtitulo>Visão Geral do Desempenho</Cardtitulo>
              <Carddescricao>
                Acompanhe seu progresso e desempenho nos simulados
              </Carddescricao>
            </div>
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

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <Cardtitulo>Atividades Recentes</Cardtitulo>
            <Carddescricao>
              Suas últimas atividades na plataforma
            </Carddescricao>
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
                    <p className="text-sm font-medium">{activity.titulo}</p>
                    <p className="text-sm text-muted-foreground">{activity.descricao}</p>
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

      {/* Ações Rápidas */}
      {/* REMOVIDO: Grid de links rápidos para Simulados, Questões Semanais, Flashcards e Apostilas */}
    </div>
  );
}