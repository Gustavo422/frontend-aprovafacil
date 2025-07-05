import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { SupabaseClient } from '@supabase/supabase-js';

// Schema de validação para submissão de simulado
const submitSimuladoSchema = z.object({
  answers: z.array(z.string()),
  timeSpent: z.number().min(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Validar dados da requisição
    const body = await request.json();
    const validatedData = submitSimuladoSchema.parse(body);

    // Verificar se o simulado existe
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (simuladoError || !simulado) {
      return NextResponse.json(
        { error: 'Simulado não encontrado' },
        { status: 404 }
      );
    }

    // Buscar questões do simulado
    const { data: questoes, error: questoesError } = await supabase
      .from('simulado_questions')
      .select('*')
      .eq('simulado_id', id)
      .is('deleted_at', null)
      .order('question_number', { ascending: true });

    if (questoesError || !questoes) {
      return NextResponse.json(
        { error: 'Erro ao buscar questões do simulado' },
        { status: 500 }
      );
    }

    // Validar se o número de respostas corresponde ao número de questões
    if (validatedData.answers.length !== questoes.length) {
      return NextResponse.json(
        { error: 'Número de respostas não corresponde ao número de questões' },
        { status: 400 }
      );
    }

    // Calcular pontuação
    let correctAnswers = 0;
    const detailedResults = questoes.map((questao, index) => {
      const userAnswer = validatedData.answers[index];
      const isCorrect = userAnswer === questao.correct_answer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: questao.id,
        questionNumber: questao.question_number,
        userAnswer,
        correctAnswer: questao.correct_answer,
        isCorrect,
        discipline: questao.discipline,
        topic: questao.topic,
        difficulty: questao.difficulty,
      };
    });

    const score = Math.round((correctAnswers / questoes.length) * 100);
    const timeSpentMinutes = Math.round(validatedData.timeSpent / 60);

    // Verificar se já existe um progresso para este usuário e simulado
    const { data: existingProgress } = await supabase
      .from('user_simulado_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('simulado_id', id)
      .single();

    let progressResult;

    if (existingProgress) {
      // Atualizar progresso existente
      const { data, error } = await supabase
        .from('user_simulado_progress')
        .update({
          score,
          completed_at: validatedData.completedAt,
          time_taken_minutes: timeSpentMinutes,
          answers: validatedData.answers,
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      progressResult = { data, error };
    } else {
      // Criar novo progresso
      const { data, error } = await supabase
        .from('user_simulado_progress')
        .insert({
          user_id: user.id,
          simulado_id: id,
          score,
          completed_at: validatedData.completedAt,
          time_taken_minutes: timeSpentMinutes,
          answers: validatedData.answers,
        })
        .select()
        .single();

      progressResult = { data, error };
    }

    if (progressResult.error) {
      logger.error('Erro ao salvar progresso:', { error: progressResult.error });
      return NextResponse.json(
        { error: 'Erro ao salvar progresso do simulado' },
        { status: 500 }
      );
    }

    // Atualizar estatísticas por disciplina
    await updateDisciplineStats(supabase, user.id, detailedResults);

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'SIMULADO_COMPLETED',
      table_name: 'user_simulado_progress',
      record_id: progressResult.data.id,
      new_values: {
        simulado_id: id,
        score,
        time_taken_minutes: timeSpentMinutes,
      },
    });

    return NextResponse.json({
      success: true,
      results: {
        score,
        correctAnswers,
        totalQuestions: questoes.length,
        timeSpentMinutes,
        accuracyRate: Math.round((correctAnswers / questoes.length) * 100),
        detailedResults,
      },
      progress: progressResult.data,
    });

  } catch (error) {
    logger.error('Erro ao processar submissão:', { 
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

interface DetailedResult {
  questionId: string;
  questionNumber: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  discipline?: string;
  topic?: string;
  difficulty?: string;
}

// Função auxiliar para atualizar estatísticas por disciplina
async function updateDisciplineStats(
  supabase: SupabaseClient,
  userId: string,
  results: DetailedResult[]
) {
  try {
    // Agrupar resultados por disciplina
    const disciplineGroups = results.reduce((acc, result) => {
      if (!result.discipline) return acc;
      
      if (!acc[result.discipline]) {
        acc[result.discipline] = {
          total: 0,
          correct: 0,
        };
      }
      
      acc[result.discipline].total++;
      if (result.isCorrect) {
        acc[result.discipline].correct++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    // Atualizar estatísticas para cada disciplina
    for (const [disciplina, stats] of Object.entries(disciplineGroups)) {
      // Buscar estatística existente
      const { data: existingStat } = await supabase
        .from('user_discipline_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('disciplina', disciplina)
        .single();

      if (existingStat) {
        // Atualizar estatística existente
        const newTotalQuestions = existingStat.total_questions + stats.total;
        const newCorrectAnswers = existingStat.correct_answers + stats.correct;
        const newAverageScore = (newCorrectAnswers / newTotalQuestions) * 100;

        await supabase
          .from('user_discipline_stats')
          .update({
            total_questions: newTotalQuestions,
            correct_answers: newCorrectAnswers,
            average_score: newAverageScore,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStat.id);
      } else {
        // Criar nova estatística
        const averageScore = (stats.correct / stats.total) * 100;

        await supabase
          .from('user_discipline_stats')
          .insert({
            user_id: userId,
            disciplina,
            total_questions: stats.total,
            correct_answers: stats.correct,
            average_score: averageScore,
            study_time_minutes: 0, // Será atualizado em outras operações
            last_activity: new Date().toISOString(),
          });
      }
    }
  } catch (error) {
    logger.error('Erro ao atualizar estatísticas de disciplina:', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

