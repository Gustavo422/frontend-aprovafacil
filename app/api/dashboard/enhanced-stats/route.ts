import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar progresso do usuário em simulados
    const { data: progress, error: progressError } = await supabase
      .from('user_simulado_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (progressError) {
      return NextResponse.json(
        { error: 'Erro ao buscar progresso' },
        { status: 500 }
      );
    }

    // Buscar estatísticas por disciplina
    const { data: disciplineStats, error: disciplineError } = await supabase
      .from('user_discipline_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('average_score', { ascending: false });

    if (disciplineError) {
      logger.error('Erro ao buscar estatísticas por disciplina:', { error: disciplineError });
    }

    // Calcular estatísticas básicas
    const totalSimulados = progress?.length || 0;
    let totalQuestoes = 0;
    let totalStudyTime = 0;
    let totalScore = 0;

    // Calcular histórico de performance
    const performanceHistory = [];
    const last30Days = progress?.slice(0, 30) || [];

    for (const p of last30Days) {
      const date = new Date(p.completed_at).toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Buscar questões do simulado para calcular accuracy
      const { data: questoes } = await supabase
        .from('simulado_questions')
        .select('*')
        .eq('simulado_id', p.simulado_id)
        .is('deleted_at', null);

      let accuracy = 0;
      if (questoes && p.answers) {
        const correctCount = questoes.reduce((count, questao, index) => {
          return count + (p.answers[index] === questao.correct_answer ? 1 : 0);
        }, 0);
        accuracy = (correctCount / questoes.length) * 100;
      }

      performanceHistory.push({
        date,
        score: p.score || 0,
        accuracy,
        studyTime: p.time_taken_minutes || 0,
      });

      totalQuestoes += questoes?.length || 0;
      totalStudyTime += p.time_taken_minutes || 0;
      totalScore += p.score || 0;
    }

    // Calcular estatísticas semanais
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = progress?.filter(p => 
      new Date(p.completed_at) >= oneWeekAgo
    ) || [];

    const weeklyStats = {
      simulados: weeklyProgress.length,
      questoes: 0,
      studyTime: weeklyProgress.reduce((sum, p) => sum + (p.time_taken_minutes || 0), 0),
      scoreImprovement: 0,
    };

    // Calcular melhoria de pontuação
    if (progress && progress.length >= 2) {
      const recentScores = progress.slice(0, 5).map(p => p.score || 0);
      const olderScores = progress.slice(5, 10).map(p => p.score || 0);
      
      if (recentScores.length > 0 && olderScores.length > 0) {
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        weeklyStats.scoreImprovement = recentAvg - olderAvg;
      }
    }

    // Calcular taxa de acerto geral
    const averageScore = totalSimulados > 0 ? totalScore / totalSimulados : 0;
    const accuracyRate = averageScore; // Simplificado para este exemplo

    // Calcular probabilidade de aprovação (algoritmo simplificado)
    let approvalProbability = 0;
    if (totalSimulados > 0) {
      const consistencyFactor = Math.min(totalSimulados / 10, 1); // Máximo 1 para 10+ simulados
      const scoreFactor = Math.min(averageScore / 70, 1); // Meta de 70%
      const studyTimeFactor = Math.min(totalStudyTime / 1000, 1); // 1000 minutos como referência
      
      approvalProbability = (consistencyFactor * 0.3 + scoreFactor * 0.5 + studyTimeFactor * 0.2) * 100;
    }

    // Calcular sequência de estudos
    let studyStreak = 0;
    if (progress && progress.length > 0) {
      const today = new Date();
      const currentDate = new Date(today);
      
      for (let i = 0; i < 30; i++) {
        const dayProgress = progress.find(p => {
          const progressDate = new Date(p.completed_at);
          return progressDate.toDateString() === currentDate.toDateString();
        });
        
        if (dayProgress) {
          studyStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Preparar estatísticas por disciplina com cores e tendências
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    const enhancedDisciplineStats = (disciplineStats || []).map((stat, index) => ({
      ...stat,
      accuracy_rate: stat.average_score || 0,
      trend: stat.average_score > 60 ? 'up' : stat.average_score > 40 ? 'stable' : 'down',
      color: colors[index % colors.length],
    }));

    // Calcular progresso da meta
    const targetScore = 70;
    const currentScore = averageScore;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3); // Meta em 3 meses
    const daysRemaining = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const onTrack = currentScore >= (targetScore * 0.7); // 70% da meta

    // Simular ranking competitivo
    const totalUsers = 1000 + Math.floor(Math.random() * 500);
    const position = Math.max(1, Math.floor(totalUsers * (1 - approvalProbability / 100)));
    const percentile = Math.round((1 - position / totalUsers) * 100);

    return NextResponse.json({
      totalSimulados,
      totalQuestoes,
      totalStudyTime,
      averageScore,
      accuracyRate,
      approvalProbability,
      studyStreak,
      weeklyProgress: weeklyStats,
      disciplineStats: enhancedDisciplineStats,
      performanceHistory: performanceHistory.reverse(), // Ordem cronológica
      goalProgress: {
        targetScore,
        currentScore,
        targetDate: targetDate.toISOString(),
        daysRemaining,
        onTrack,
      },
      competitiveRanking: {
        position,
        totalUsers,
        percentile,
      },
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas aprimoradas:', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

