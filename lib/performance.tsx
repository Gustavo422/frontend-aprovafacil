import { logger } from '@/lib/logger';
import { CacheManager } from './cache';
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
  disciplineStats: DisciplinePerformance[];
}

export interface DisciplinePerformance {
  disciplina: string;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  studyTime: number;
  lastActivity: string;
  progressPercentage: number;
}

interface SimuladoRow {
  id: string;
  score: number;
  time_taken_minutes: number;
  created_at: string;
  answers?: Array<{ correct: boolean }>;
}

interface QuestaoSemanalRow {
  id: string;
  score: number;
  answers?: Array<{ correct: boolean }>;
  created_at: string;
}

interface DisciplineStatsRow {
  disciplina: string;
  total_questions: number;
  correct_answers: number;
  average_score: number;
  study_time_minutes: number;
  last_activity: string;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class PerformanceCalculator {
  private static instance: PerformanceCalculator;
  private cache = CacheManager.getInstance();
  private auditLogger: ReturnType<typeof getAuditLogger> | null = null;

  private constructor() {}

  public static getInstance(): PerformanceCalculator {
    if (!PerformanceCalculator.instance) {
      PerformanceCalculator.instance = new PerformanceCalculator();
    }
    return PerformanceCalculator.instance;
  }

  private async initialize() {
    if (!this.auditLogger) {
      const supabaseClient = await createServerSupabaseClient();
      this.auditLogger = getAuditLogger(supabaseClient);
    }
  }

  /**
   * Calcula estatísticas completas de desempenho do usuário
   */
  async calculateUserPerformance(userId: string): Promise<PerformanceStats> {
    const cacheKey = CacheManager.generatePerformanceKey(userId, 'complete');

    // Tentar obter do cache primeiro
    let stats = await this.cache.get<PerformanceStats>(userId, cacheKey);

    if (!stats) {
      // Calcular estatísticas
      const [simuladosStats, questoesStats, disciplineStats, weeklyProgress] =
        await Promise.all([
          this.calculateSimuladosStats(userId),
          this.calculateQuestoesStats(userId),
          this.calculateDisciplineStats(userId),
          this.calculateWeeklyProgress(userId),
        ]);

      stats = {
        totalSimulados: simuladosStats.total,
        totalQuestoes: questoesStats.total,
        totalStudyTime: simuladosStats.totalTime + questoesStats.totalTime,
        averageScore: simuladosStats.averageScore,
        accuracyRate: questoesStats.accuracyRate,
        weeklyProgress,
        disciplineStats,
      };

      // Salvar no cache por 15 minutos
      await this.cache.set(userId, cacheKey, stats, 15);
    }

    return stats;
  }

  /**
   * Calcula estatísticas de simulados
   */
  async calculateSimuladosStats(userId: string): Promise<{
    total: number;
    averageScore: number;
    totalTime: number;
  }> {
    try {
      const supabaseClient = await createServerSupabaseClient();
      const { data, error } = await supabaseClient
        .from('user_simulados')
        .select('score, time_taken_minutes')
        .eq('user_id', userId)
        .is('deleted_at', null);
      
      if (error) {
        throw error;
      }

      const simulados = data as SimuladoRow[] | null;

      if (!simulados || simulados.length === 0) {
        return { total: 0, averageScore: 0, totalTime: 0 };
      }

      const total = simulados.length;
      const totalScore = simulados.reduce((acc, item) => acc + (item?.score || 0), 0);
      const totalTime = simulados.reduce(
        (acc, item) => acc + (item?.time_taken_minutes || 0),
        0
      );
      const averageScore = total > 0 ? totalScore / total : 0;

      return { total, averageScore, totalTime };
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de simulados:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error,
      });
      return { total: 0, averageScore: 0, totalTime: 0 };
    }
  }

  /**
   * Calcula estatísticas de questões semanais
   */
  async calculateQuestoesStats(userId: string): Promise<{
    total: number;
    accuracyRate: number;
    totalTime: number;
  }> {
    try {
      const supabaseClient = await createServerSupabaseClient();
      const { data, error } = await supabaseClient
        .from('user_questoes_semanais_progress')
        .select('score, answers')
        .eq('user_id', userId)
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
        if (item.answers && Array.isArray(item.answers)) {
          totalQuestions += item.answers.length;
          correctAnswers += item.answers.filter(
            (answer: Record<string, unknown>) => answer?.correct === true
          ).length;
        }
      });

      const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const totalTime = total * 2; // Estimativa de 2 minutos por questão

      return { total, accuracyRate, totalTime };
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de questões:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error,
      });
      return { total: 0, accuracyRate: 0, totalTime: 0 };
    }
  }

  /**
   * Calcula estatísticas por disciplina
   */
  async calculateDisciplineStats(
    userId: string
  ): Promise<DisciplinePerformance[]> {
    try {
      const supabaseClient = await createServerSupabaseClient();
      const { data, error } = await supabaseClient
        .from('user_discipline_stats')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const stats = data as DisciplineStatsRow[] | null;

      if (!stats || stats.length === 0) {
        return [];
      }

      return stats.map((item) => ({
        disciplina: item.disciplina,
        totalQuestions: item.total_questions,
        correctAnswers: item.correct_answers,
        averageScore: item.average_score,
        studyTime: item.study_time_minutes,
        lastActivity: item.last_activity,
        progressPercentage:
          item.total_questions > 0
            ? (item.correct_answers / item.total_questions) * 100
            : 0,
      }));
    } catch (error) {
      logger.error('Erro ao calcular estatísticas por disciplina:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error,
      });
      return [];
    }
  }

  /**
   * Calcula progresso semanal
   */
  async calculateWeeklyProgress(userId: string): Promise<{
    simulados: number;
    questoes: number;
    studyTime: number;
    scoreImprovement: number;
  }> {
    try {
      const supabaseClient = await createServerSupabaseClient();
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Buscar dados da semana atual
      const [simuladosResult, questoesResult] = await Promise.all([
        supabaseClient
          .from('user_simulados')
          .select('score, time_taken_minutes')
          .eq('user_id', userId)
          .gte('created_at', weekAgo)
          .is('deleted_at', null),
        supabaseClient
          .from('user_questoes_semanais_progress')
          .select('score')
          .eq('user_id', userId)
          .gte('created_at', weekAgo)
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
        supabaseClient
          .from('user_simulados')
          .select('score')
          .eq('user_id', userId)
          .gte('created_at', twoWeeksAgo)
          .lt('created_at', weekAgo2)
          .is('deleted_at', null),
        supabaseClient
          .from('user_simulados')
          .select('score')
          .eq('user_id', userId)
          .gte('created_at', weekAgo)
          .is('deleted_at', null),
      ]);

      if (previousWeekResult.error) {
        throw new Error(`Erro ao buscar dados da semana anterior: ${previousWeekResult.error.message}`);
      }

      if (currentWeekResult.error) {
        throw new Error(`Erro ao buscar dados da semana atual: ${currentWeekResult.error.message}`);
      }

      const previousWeekData = previousWeekResult.data as Array<{ score: number }> | null;
      const currentWeekData = currentWeekResult.data as Array<{ score: number }> | null;

      const previousWeekAvg =
        previousWeekData && previousWeekData.length > 0
          ? previousWeekData.reduce((acc, item) => acc + (item.score || 0), 0) /
            previousWeekData.length
          : 0;
      const currentWeekAvg =
        currentWeekData && currentWeekData.length > 0
          ? currentWeekData.reduce((acc, item) => acc + (item.score || 0), 0) /
            currentWeekData.length
          : 0;

      const scoreImprovement =
        previousWeekAvg > 0
          ? ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
          : 0;

      return {
        simulados: simuladosData?.length || 0,
        questoes: questoesData?.length || 0,
        studyTime: simuladosData?.reduce((acc, item) => acc + (item.time_taken_minutes || 0), 0) || 0,
        scoreImprovement,
      };
    } catch (error) {
      logger.error('Erro ao calcular progresso semanal:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error,
      });
      return {
        simulados: 0,
        questoes: 0,
        studyTime: 0,
        scoreImprovement: 0,
      };
    }
  }

  /**
   * Atualiza estatísticas de disciplina após atividade
   */
  async updateDisciplineStats(
    userId: string,
    disciplina: string,
    questionsAnswered: number,
    correctAnswers: number,
    studyTimeMinutes: number
  ): Promise<void> {
    try {
      const supabaseClient = await createServerSupabaseClient();
      const { data: existingStats } = await supabaseClient
        .from('user_discipline_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('disciplina', disciplina)
        .single();

      const now = new Date().toISOString();

      if (existingStats) {
        // Atualizar estatísticas existentes
        const newTotalQuestions =
          existingStats.total_questions + questionsAnswered;
        const newCorrectAnswers =
          existingStats.correct_answers + correctAnswers;
        const newAverageScore =
          newTotalQuestions > 0
            ? (newCorrectAnswers / newTotalQuestions) * 100
            : 0;
        const newStudyTime =
          existingStats.study_time_minutes + studyTimeMinutes;

        await supabaseClient
          .from('user_discipline_stats')
          .update({
            total_questions: newTotalQuestions,
            correct_answers: newCorrectAnswers,
            average_score: newAverageScore,
            study_time_minutes: newStudyTime,
            last_activity: now,
            updated_at: now,
          })
          .eq('id', existingStats.id);
      } else {
        // Criar novas estatísticas
        await supabaseClient.from('user_discipline_stats').insert({
          user_id: userId,
          disciplina,
          total_questions: questionsAnswered,
          correct_answers: correctAnswers,
          average_score:
            questionsAnswered > 0
              ? (correctAnswers / questionsAnswered) * 100
              : 0,
          study_time_minutes: studyTimeMinutes,
          last_activity: now,
        });
      }

      // Limpar cache relacionado
      await this.cache.delete(
        userId,
        CacheManager.generateDisciplineStatsKey(userId, disciplina)
      );
      await this.cache.delete(
        userId,
        CacheManager.generatePerformanceKey(userId, 'complete')
      );
    } catch (error) {
      logger.error('Erro ao atualizar estatísticas de disciplina:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Atualiza estatísticas gerais do usuário
   */
  async updateUserStats(
    userId: string,
    questionsAnswered: number,
    correctAnswers: number,
    studyTimeMinutes: number
  ): Promise<void> {
    try {
      const supabaseClient = await createServerSupabaseClient();
      const { data: user } = await supabaseClient
        .from('users')
        .select(
          'total_questions_answered, total_correct_answers, study_time_minutes, average_score'
        )
        .eq('id', userId)
        .single();

      if (user) {
        const newTotalQuestions =
          user.total_questions_answered + questionsAnswered;
        const newCorrectAnswers = user.total_correct_answers + correctAnswers;
        const newStudyTime = user.study_time_minutes + studyTimeMinutes;
        const newAverageScore =
          newTotalQuestions > 0
            ? (newCorrectAnswers / newTotalQuestions) * 100
            : 0;

        await supabaseClient
          .from('users')
          .update({
            total_questions_answered: newTotalQuestions,
            total_correct_answers: newCorrectAnswers,
            study_time_minutes: newStudyTime,
            average_score: newAverageScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // Limpar cache
      await this.cache.delete(
        userId,
        CacheManager.generatePerformanceKey(userId, 'complete')
      );
    } catch (error) {
      logger.error('Erro ao atualizar estatísticas do usuário:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Registra conclusão de simulado e atualiza estatísticas
   */
  async recordSimuladoCompletion(
    userId: string,
    simuladoId: string,
    score: number,
    timeTaken: number,
    answers: Record<string, unknown>[]
  ): Promise<void> {
    try {
      // Registrar no progresso
      const supabaseClient = await createServerSupabaseClient();
      await supabaseClient.from('user_simulado_progress').insert({
        user_id: userId,
        simulado_id: simuladoId,
        score,
        time_taken_minutes: timeTaken,
        answers,
        completed_at: new Date().toISOString(),
      });

      // Atualizar estatísticas
      await this.updateUserStats(userId, 1, score > 50 ? 1 : 0, timeTaken);

      // Registrar no log de auditoria
      if (this.auditLogger) {
        await this.auditLogger.logSimuladoComplete(
          userId,
          simuladoId,
          score,
          timeTaken
        );
      }

      // Limpar cache
      await this.cache.delete(
        userId,
        CacheManager.generatePerformanceKey(userId, 'simulados')
      );
      await this.cache.delete(
        userId,
        CacheManager.generatePerformanceKey(userId, 'complete')
      );
    } catch (error) {
      logger.error('Erro ao registrar conclusão de simulado:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Registra conclusão de questões semanais e atualiza estatísticas
   */
  async recordQuestaoCompletion(
    userId: string,
    questaoId: string,
    score: number,
    answers: Record<string, unknown>[]
  ): Promise<void> {
    try {
      // Registrar no progresso
      const supabaseClient = await createServerSupabaseClient();
      await supabaseClient.from('user_questoes_semanais_progress').insert({
        user_id: userId,
        questoes_semanais_id: questaoId,
        score,
        answers,
        completed_at: new Date().toISOString(),
      });

      // Calcular estatísticas das respostas
      const correctAnswers = answers.filter(
        (answer: Record<string, unknown>) => answer.correct === true
      ).length;
      const totalQuestions = answers.length;

      // Atualizar estatísticas
      await this.updateUserStats(
        userId,
        totalQuestions,
        correctAnswers,
        totalQuestions * 2
      ); // 2 min por questão

      // Atualizar estatísticas por disciplina (se disponível)
      // TODO: Extrair disciplina das questões

      // Registrar no log de auditoria
      if (this.auditLogger) {
        await this.auditLogger.logQuestaoComplete(userId, questaoId, score);
      }

      // Limpar cache
      await this.cache.delete(
        userId,
        CacheManager.generatePerformanceKey(userId, 'questoes')
      );
      await this.cache.delete(
        userId,
        CacheManager.generatePerformanceKey(userId, 'complete')
      );
    } catch (error) {
      logger.error('Erro ao registrar conclusão de questões:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Função utilitária para obter instância do calculador
export const getPerformanceCalculator = () =>
  PerformanceCalculator.getInstance();

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Mede o tempo de execução de uma operação
   */
  async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        metadata,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        operation: `${operation}_error`,
        duration,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      
      throw error;
    }
  }

  /**
   * Registra uma métrica de performance
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Log para operações lentas (>1s)
    if (metric.duration > 1000) {
      logger.warn('Operação lenta detectada:', {
        operation: metric.operation,
        duration: metric.duration,
        metadata: metric.metadata,
      });
    }
  }

  /**
   * Obtém métricas de performance
   */
  getMetrics(
    operation?: string,
    timeRange?: { start: Date; end: Date }
  ): PerformanceMetrics[] {
    let filteredMetrics = this.metrics;

    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filteredMetrics;
  }

  /**
   * Calcula estatísticas de performance
   */
  getStats(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
  } {
    const metrics = this.getMetrics(operation);
    
    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0,
      };
    }

    const durations = metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    
    return {
      count: metrics.length,
      avgDuration: totalDuration / metrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration,
    };
  }

  /**
   * Limpa métricas antigas (mais de 24 horas)
   */
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
  }

  /**
   * Exporta métricas para análise
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const getPerformanceMonitor = () => PerformanceMonitor.getInstance();

// Decorator para medir performance de métodos
export function measurePerformance(operation?: string) {
  return function (
    target: Record<string, unknown>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const monitor = getPerformanceMonitor();
      const operationName = operation || `${target.constructor?.name || 'Unknown'}.${propertyKey}`;
      
      return await monitor.measureOperation(
        operationName,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );
    };

    return descriptor;
  };
}
