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

    const activities = [];

    // Buscar atividades de simulados
    const { data: simuladoProgress } = await supabase
      .from('user_simulado_progress')
      .select(`
        *,
        simulados (
          title,
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (simuladoProgress) {
      for (const progress of simuladoProgress) {
        activities.push({
          id: `simulado-${progress.id}`,
          type: 'simulado',
          title: progress.simulados?.title || 'Simulado',
          description: `Pontuação: ${progress.score}% - ${progress.simulados?.difficulty || 'Médio'}`,
          time: progress.time_taken_minutes ? `${progress.time_taken_minutes}min` : '',
          created_at: progress.completed_at,
          score: progress.score,
          improvement: 0, // Será calculado comparando com simulados anteriores
        });
      }
    }

    // Buscar atividades de flashcards
    const { data: flashcardProgress } = await supabase
      .from('user_flashcard_progress')
      .select(`
        *,
        flashcards (
          front,
          disciplina
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (flashcardProgress) {
      for (const progress of flashcardProgress) {
        activities.push({
          id: `flashcard-${progress.id}`,
          type: 'flashcard',
          title: 'Revisão de Flashcard',
          description: `${progress.flashcards?.disciplina || 'Disciplina'} - ${progress.status}`,
          time: '',
          created_at: progress.updated_at,
        });
      }
    }

    // Buscar atividades de apostilas
    const { data: apostilaProgress } = await supabase
      .from('user_apostila_progress')
      .select(`
        *,
        apostila_content (
          title,
          apostilas (
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (apostilaProgress) {
      for (const progress of apostilaProgress) {
        activities.push({
          id: `apostila-${progress.id}`,
          type: 'questao',
          title: 'Estudo de Apostila',
          description: `${progress.apostila_content?.apostilas?.title || 'Apostila'} - ${progress.progress_percentage}% concluído`,
          time: '',
          created_at: progress.updated_at,
        });
      }
    }

    // Ordenar todas as atividades por data
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calcular melhorias para simulados
    if (simuladoProgress && simuladoProgress.length > 1) {
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        if (activity.type === 'simulado' && activity.score) {
          // Encontrar simulado anterior
          const previousSimulado = simuladoProgress.find((p, index) => 
            index > simuladoProgress.findIndex(sp => sp.id === activity.id.replace('simulado-', ''))
          );
          
          if (previousSimulado && previousSimulado.score) {
            activity.improvement = activity.score - previousSimulado.score;
          }
        }
      }
    }

    return NextResponse.json(activities.slice(0, 10));

  } catch (error) {
    logger.error('Erro ao buscar atividades:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

