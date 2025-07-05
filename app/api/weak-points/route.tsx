import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

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
      .select(`
        *,
        simulados!inner(
          id,
          title
        )
      `)
      .eq('user_id', user.id);

    if (progressError) {
      return NextResponse.json(
        { error: 'Erro ao buscar progresso' },
        { status: 500 }
      );
    }

    if (!progress || progress.length === 0) {
      return NextResponse.json([]);
    }

    // Buscar questões dos simulados realizados
    const simuladoIds = progress.map(p => p.simulado_id);
    const { data: questoes, error: questoesError } = await supabase
      .from('simulado_questions')
      .select('*')
      .in('simulado_id', simuladoIds)
      .is('deleted_at', null);

    if (questoesError) {
      return NextResponse.json(
        { error: 'Erro ao buscar questões' },
        { status: 500 }
      );
    }

    // Calcular pontos fracos baseado no desempenho
    const weakPoints = new Map<string, { disciplina: string; tema: string; error_count: number; total_questions: number }>();

    for (const p of progress) {
      const simuladoQuestoes = questoes?.filter(q => q.simulado_id === p.simulado_id) || [];
      
      for (let i = 0; i < simuladoQuestoes.length; i++) {
        const questao = simuladoQuestoes[i];
        const userAnswer = p.answers?.[i];
        const isCorrect = userAnswer === questao.correct_answer;
        
        if (!isCorrect && questao.discipline && questao.topic) {
          const key = `${questao.discipline}-${questao.topic}`;
          const existing = weakPoints.get(key);
          
          if (existing) {
            existing.error_count++;
            existing.total_questions++;
          } else {
            weakPoints.set(key, {
              disciplina: questao.discipline,
              tema: questao.topic,
              error_count: 1,
              total_questions: 1,
            });
          }
        } else if (questao.discipline && questao.topic) {
          const key = `${questao.discipline}-${questao.topic}`;
          const existing = weakPoints.get(key);
          
          if (existing) {
            existing.total_questions++;
          } else {
            weakPoints.set(key, {
              disciplina: questao.discipline,
              tema: questao.topic,
              error_count: 0,
              total_questions: 1,
            });
          }
        }
      }
    }

    // Converter para array e calcular taxa de erro
    const weakPointsArray = Array.from(weakPoints.values())
      .map(point => ({
        ...point,
        error_rate: (point.error_count / point.total_questions) * 100,
      }))
      .filter(point => point.error_rate > 0) // Apenas pontos com erros
      .sort((a, b) => b.error_rate - a.error_rate) // Ordenar por taxa de erro
      .slice(0, 10); // Top 10 pontos fracos

    return NextResponse.json(weakPointsArray);
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 