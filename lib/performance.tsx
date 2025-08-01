import { logger } from '@/lib/logger';
import { getCache, setCache, deleteCache, generateCacheKey } from './cache'; // Funções de cache refatoradas
import { getAuditLogger } from './audit';
import { createServerSupabaseClient } from './supabase';

export interface PerformanceStats {
  totalSimulados: number;
  totalQuestoes: number;
  totalStudyTime: number;
  averageScore: number;
  accuracyRate: number;
  weeklyProgress: {
    simulados: number;
    questoes: number;
    studyTime: number;
    scoreImprovement: number;
  };
  disciplinaStats: disciplinaPerformance[];
}

export interface disciplinaPerformance {
  disciplina: string;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  studyTime: number;
  lastActivity: string;
  percentualProgresso: number;
}

interface SimuladoRow {
  id: string;
  pontuacao: number; // CORRIGIDO
  tempo_gasto_minutos: number; // CORRIGIDO
  criado_em: string;
  respostas?: Array<{ correct: boolean }>; // CORRIGIDO
}

interface QuestaoSemanalRow {
  id: string;
  pontuacao: number; // CORRIGIDO
  respostas?: Array<{ correct: boolean }>; // CORRIGIDO
  criado_em: string;
}

interface disciplinaStatsRow {
  disciplina: string;
  total_questoes: number; // CORRIGIDO
  total_acertos: number; // CORRIGIDO
  pontuacao_media: number;
  tempo_estudo_minutos: number;
  ultima_atividade: string; // CORRIGIDO
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Calcula estatísticas completas de desempenho do usuário.
 * Utiliza cache para otimizar as consultas.
 *
 * @param usuarioId - O ID do usuário.
 * @returns As estatísticas de performance completas.
 */
export async function calculateUserPerformance(usuarioId: string): Promise<PerformanceStats> {
  const cacheKey = generateCacheKey('performance', usuarioId, 'complete');
  
  let stats = await getCache<PerformanceStats>(usuarioId, cacheKey);

  if (!stats) {
    const [simuladosStats, questoesStats, disciplinaStats, weeklyProgress] =
      await Promise.all([
        calculateSimuladosStats(usuarioId),
        calculateQuestoesStats(usuarioId),
        calculateDisciplinaStats(usuarioId),
        calculateWeeklyProgress(usuarioId),
      ]);

    stats = {
      totalSimulados: simuladosStats.total,
      totalQuestoes: questoesStats.total,
      totalStudyTime: simuladosStats.totalTime + questoesStats.totalTime,
      averageScore: simuladosStats.averageScore,
      accuracyRate: questoesStats.accuracyRate,
      weeklyProgress,
      disciplinaStats,
    };

    await setCache(usuarioId, cacheKey, stats, 15); // Cache de 15 minutos
  }

  return stats;
}

/**
 * Calcula estatísticas de simulados.
 *
 * @param usuarioId - O ID do usuário.
 * @returns Estatísticas agregadas de simulados.
 */
export async function calculateSimuladosStats(usuarioId: string): Promise<{
  total: number;
  averageScore: number;
  totalTime: number;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('progresso_usuario_simulado') // Tabela correta
      .select('pontuacao, tempo_gasto_minutos')
      .eq('usuario_id', usuarioId) // Coluna correta
      .is('deleted_at', null);
      
    if (error) {
      throw error;
    }

    const simulados = data as SimuladoRow[] | null;

    if (!simulados || simulados.length === 0) {
      return { total: 0, averageScore: 0, totalTime: 0 };
    }

    const total = simulados.length;
    const totalScore = simulados.reduce((acc, item) => acc + (item?.pontuacao || 0), 0);
    const totalTime = simulados.reduce(
      (acc, item) => acc + (item?.tempo_gasto_minutos || 0),
      0
    );
    const averageScore = total > 0 ? totalScore / total : 0;

    return { total, averageScore, totalTime };
  } catch (error) {
    logger.error('Erro ao calcular estatísticas de simulados:', { error });
    return { total: 0, averageScore: 0, totalTime: 0 };
  }
}

/**
 * Calcula estatísticas de questões semanais.
 *
 * @param usuarioId - O ID do usuário.
 * @returns Estatísticas agregadas de questões.
 */
export async function calculateQuestoesStats(usuarioId: string): Promise<{
  total: number;
  accuracyRate: number;
  totalTime: number;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('progresso_usuario_questoes_semanais')
      .select('pontuacao, respostas') // 'answers' -> 'respostas'
      .eq('usuario_id', usuarioId)
      .is('deleted_at', null);
        
    if (error) {
      throw error;
    }
      
    const questoes = data as QuestaoSemanalRow[] | null;

    if (!questoes || questoes.length === 0) {
      return { total: 0, accuracyRate: 0, totalTime: 0 };
    }

    const total = questoes.length;
    let correctAnswers = 0;
    let totalQuestions = 0;

    // Calcular taxa de acerto baseada nas respostas
    questoes.forEach(item => {
      if (item.respostas && Array.isArray(item.respostas)) {
        totalQuestions += item.respostas.length;
        correctAnswers += item.respostas.filter(
          (answer: Record<string, unknown>) => answer?.correct === true
        ).length;
      }
    });

    const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalTime = total * 2; // Estimativa de 2 minutos por questão

    return { total, accuracyRate, totalTime };
  } catch (error) {
    logger.error('Erro ao calcular estatísticas de questões:', { error });
    return { total: 0, accuracyRate: 0, totalTime: 0 };
  }
}

/**
 * Calcula estatísticas por disciplina.
 *
 * @param usuarioId - O ID do usuário.
 * @returns Uma lista de estatísticas de performance por disciplina.
 */
export async function calculateDisciplinaStats(
  usuarioId: string
): Promise<disciplinaPerformance[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('estatisticas_usuario_disciplina')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('ultima_atividade', { ascending: false }); // 'last_activity' -> 'ultima_atividade'
        
    if (error) {
      throw error;
    }
      
    const stats = data as disciplinaStatsRow[] | null;

    if (!stats || stats.length === 0) {
      return [];
    }

    return stats.map((item) => ({
      disciplina: item.disciplina,
      totalQuestions: item.total_questoes,
      correctAnswers: item.total_acertos, // CORRIGIDO
      averageScore: item.pontuacao_media,
      studyTime: item.tempo_estudo_minutos,
      lastActivity: item.ultima_atividade, // CORRIGIDO
      percentualProgresso:
        item.total_questoes > 0
          ? (item.total_acertos / item.total_questoes) * 100
          : 0,
    }));
  } catch (error) {
    logger.error('Erro ao calcular estatísticas por disciplina:', { error });
    return [];
  }
}

/**
 * Calcula o progresso semanal do usuário.
 *
 * @param usuarioId - O ID do usuário.
 * @returns Um objeto com o progresso da semana.
 */
export async function calculateWeeklyProgress(usuarioId: string): Promise<{
  simulados: number;
  questoes: number;
  studyTime: number;
  scoreImprovement: number;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Buscar dados da semana atual
    const [simuladosResult, questoesResult] = await Promise.all([
      supabase
        .from('progresso_usuario_simulado') // Tabela correta
        .select('pontuacao, tempo_gasto_minutos')
        .eq('usuario_id', usuarioId) // Coluna correta
        .gte('criado_em', weekAgo)
        .is('deleted_at', null),
      supabase
        .from('progresso_usuario_questoes_semanais')
        .select('pontuacao')
        .eq('usuario_id', usuarioId) // Coluna correta
        .gte('criado_em', weekAgo)
        .is('deleted_at', null),
    ]);

    if (simuladosResult.error) {
      throw new Error(`Erro ao buscar simulados: ${simuladosResult.error.message}`);
    }

    if (questoesResult.error) {
      throw new Error(`Erro ao buscar questões: ${questoesResult.error.message}`);
    }

    const simuladosData = simuladosResult.data as SimuladoRow[] | null;
    const questoesData = questoesResult.data as QuestaoSemanalRow[] | null;

    // Calcular melhoria de pontuação (comparar com semana anterior)
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const weekAgo2 = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [previousWeekResult, currentWeekResult] = await Promise.all([
      supabase
        .from('progresso_usuario_simulado') // Tabela correta
        .select('pontuacao')
        .eq('usuario_id', usuarioId) // Coluna correta
        .gte('criado_em', twoWeeksAgo)
        .lt('criado_em', weekAgo2)
        .is('deleted_at', null),
      supabase
        .from('progresso_usuario_simulado') // Tabela correta
        .select('pontuacao')
        .eq('usuario_id', usuarioId) // Coluna correta
        .gte('criado_em', weekAgo)
        .is('deleted_at', null),
    ]);

    if (previousWeekResult.error) {
      throw new Error(`Erro ao buscar dados da semana anterior: ${previousWeekResult.error.message}`);
    }

    if (currentWeekResult.error) {
      throw new Error(`Erro ao buscar dados da semana atual: ${currentWeekResult.error.message}`);
    }

    const previousWeekData = previousWeekResult.data as Array<{ pontuacao: number }> | null;
    const currentWeekData = currentWeekResult.data as Array<{ pontuacao: number }> | null;

    const previousWeekAvg =
      previousWeekData && previousWeekData.length > 0
        ? previousWeekData.reduce((acc, item) => acc + (item.pontuacao || 0), 0) /
          previousWeekData.length
        : 0;
    const currentWeekAvg =
      currentWeekData && currentWeekData.length > 0
        ? currentWeekData.reduce((acc, item) => acc + (item.pontuacao || 0), 0) /
          currentWeekData.length
        : 0;

    const scoreImprovement =
      previousWeekAvg > 0
        ? ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
        : 0;

    return {
      simulados: simuladosData?.length || 0,
      questoes: questoesData?.length || 0,
      studyTime: simuladosData?.reduce((acc, item) => acc + (item.tempo_gasto_minutos || 0), 0) || 0,
      scoreImprovement,
    };
  } catch (error) {
    logger.error('Erro ao calcular progresso semanal:', { error });
    return { simulados: 0, questoes: 0, studyTime: 0, scoreImprovement: 0 };
  }
}

/**
 * Atualiza estatísticas de disciplina após atividade.
 *
 * @param usuarioId - O ID do usuário.
 * @param disciplina - A disciplina a ser atualizada.
 * @param questionsAnswered - O número de questões respondidas.
 * @param correctAnswers - O número de respostas corretas.
 * @param studyTimeMinutes - O tempo de estudo em minutos.
 */
export async function updateDisciplinaStats(
  usuarioId: string,
  disciplina: string,
  questionsAnswered: number,
  correctAnswers: number,
  studyTimeMinutes: number
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: existingStats } = await supabase
      .from('estatisticas_usuario_disciplina')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('disciplina', disciplina)
      .single();

    const now = new Date().toISOString();

    if (existingStats) {
      // Atualizar estatísticas existentes
      const newTotalQuestions =
        existingStats.total_questoes + questionsAnswered;
      const newCorrectAnswers =
        existingStats.total_acertos + correctAnswers;
      const newAverageScore =
        newTotalQuestions > 0
          ? (newCorrectAnswers / newTotalQuestions) * 100
          : 0;
      const newStudyTime =
        existingStats.tempo_estudo_minutos + studyTimeMinutes;

      await supabase
        .from('estatisticas_usuario_disciplina')
        .update({
          total_questoes: newTotalQuestions,
          total_acertos: newCorrectAnswers,
          pontuacao_media: newAverageScore,
          tempo_estudo_minutos: newStudyTime,
          ultima_atividade: now,
          atualizado_em: now,
        })
        .eq('id', existingStats.id);
    } else {
      // Criar novas estatísticas
      await supabase.from('estatisticas_usuario_disciplina').insert({
        usuario_id: usuarioId,
        disciplina,
        total_questoes: questionsAnswered,
        total_acertos: correctAnswers,
        pontuacao_media:
          questionsAnswered > 0
            ? (correctAnswers / questionsAnswered) * 100
            : 0,
        tempo_estudo_minutos: studyTimeMinutes,
        ultima_atividade: now,
      });
    }

    // Limpar cache relacionado
    await deleteCache(
      usuarioId,
      generateCacheKey('disciplinaStats', usuarioId, disciplina)
    );
    await deleteCache(
      usuarioId,
      generateCacheKey('performance', usuarioId, 'complete')
    );
  } catch (error) {
    logger.error('Erro ao atualizar estatísticas de disciplina:', { error });
  }
}

/**
 * Atualiza estatísticas gerais do usuário.
 *
 * @param usuarioId - O ID do usuário.
 * @param questionsAnswered - O número de questões respondidas.
 * @param correctAnswers - O número de respostas corretas.
 * @param studyTimeMinutes - O tempo de estudo em minutos.
 */
export async function updateUserStats(
  usuarioId: string,
  questionsAnswered: number,
  correctAnswers: number,
  studyTimeMinutes: number
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: user } = await supabase
      .from('usuarios')
      .select(
        'total_questoes_respondidas, total_resposta_corretas, tempo_estudo_minutos, pontuacao_media'
      )
      .eq('id', usuarioId)
      .single();

    if (user) {
      const newTotalQuestions =
        user.total_questoes_respondidas + questionsAnswered;
      const newCorrectAnswers = user.total_resposta_corretas + correctAnswers;
      const newStudyTime = user.tempo_estudo_minutos + studyTimeMinutes;
      const newAverageScore =
        newTotalQuestions > 0
          ? (newCorrectAnswers / newTotalQuestions) * 100
          : 0;

      await supabase
        .from('usuarios')
        .update({
          total_questoes_respondidas: newTotalQuestions,
          total_resposta_corretas: newCorrectAnswers,
          tempo_estudo_minutos: newStudyTime,
          pontuacao_media: newAverageScore,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', usuarioId);
    }

    // Limpar cache
    await deleteCache(
      usuarioId,
      generateCacheKey('performance', usuarioId, 'complete')
    );
  } catch (error) {
    logger.error('Erro ao atualizar estatísticas do usuário:', { error });
  }
}

/**
 * Registra conclusão de simulado e atualiza estatísticas.
 *
 * @param usuarioId - O ID do usuário.
 * @param simuladoId - O ID do simulado concluído.
 * @param score - A pontuação do simulado.
 * @param timeTaken - O tempo gasto em minutos.
 * @param answers - As respostas do simulado.
 */
export async function recordSimuladoCompletion(
  usuarioId: string,
  simuladoId: string,
  score: number,
  timeTaken: number,
  answers: Record<string, unknown>[]
): Promise<void> {
  try {
    // Registrar no progresso
    const supabase = await createServerSupabaseClient();
    await supabase.from('progresso_usuario_simulado').insert({
      usuario_id: usuarioId,
      simulado_id: simuladoId,
      pontuacao: score,
      tempo_gasto_minutos: timeTaken,
      respostas: answers,
      concluido_at: new Date().toISOString(),
    });

    // Atualizar estatísticas
    await updateUserStats(usuarioId, 1, score > 50 ? 1 : 0, timeTaken);

    // Registrar no log de auditoria
    const auditLogger = getAuditLogger();
    if (auditLogger) {
      await auditLogger.logSimuladoComplete(
        usuarioId,
        simuladoId,
        score,
        timeTaken
      );
    }

    // Limpar cache
    await deleteCache(
      usuarioId,
      generateCacheKey('simulados', usuarioId)
    );
    await deleteCache(
      usuarioId,
      generateCacheKey('performance', usuarioId, 'complete')
    );
  } catch (error) {
    logger.error('Erro ao registrar conclusão de simulado:', { error });
  }
}

/**
 * Registra conclusão de questões semanais e atualiza estatísticas.
 *
 * @param usuarioId - O ID do usuário.
 * @param questaoId - O ID da questão concluída.
 * @param score - A pontuação da questão.
 * @param answers - As respostas da questão.
 */
export async function recordQuestaoCompletion(
  usuarioId: string,
  questaoId: string,
  score: number,
  answers: Record<string, unknown>[]
): Promise<void> {
  try {
    // Registrar no progresso
    const supabase = await createServerSupabaseClient();
    await supabase.from('progresso_usuario_questoes_semanais').insert({
      usuario_id: usuarioId,
      questoes_semanais_id: questaoId,
      pontuacao: score,
      respostas: answers,
      concluido_at: new Date().toISOString(),
    });

    // Calcular estatísticas das respostas
    const correctAnswers = answers.filter(
      (answer: Record<string, unknown>) => answer.correct === true
    ).length;
    const totalQuestions = answers.length;

    // Atualizar estatísticas
    await updateUserStats(
      usuarioId,
      totalQuestions,
      correctAnswers,
      totalQuestions * 2
    ); // 2 min por questão

    // Atualizar estatísticas por disciplina (se disponível)
    // TODO: Extrair disciplina das questões

    // Registrar no log de auditoria
    const auditLogger = getAuditLogger();
    if (auditLogger) {
      await auditLogger.logQuestaoComplete(usuarioId, questaoId, score);
    }

    // Limpar cache
    await deleteCache(
      usuarioId,
      generateCacheKey('questoes', usuarioId)
    );
    await deleteCache(
      usuarioId,
      generateCacheKey('performance', usuarioId, 'complete')
    );
  } catch (error) {
    logger.error('Erro ao registrar conclusão de questões:', { error });
  }
}
