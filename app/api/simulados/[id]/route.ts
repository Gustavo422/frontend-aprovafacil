import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar detalhes do simulado
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (simuladoError) {
      return NextResponse.json(
        { error: 'Simulado não encontrado', details: simuladoError.message },
        { status: 404 }
      );
    }

    // Buscar as questões do simulado
    const { data: questoes, error: questoesError } = await supabase
      .from('simulado_questions')
      .select('*')
      .eq('simulado_id', id)
      .is('deleted_at', null)
      .order('question_number', { ascending: true });

    if (questoesError) {
      return NextResponse.json(
        { error: 'Erro ao buscar questões', details: questoesError.message },
        { status: 500 }
      );
    }

    // Verificar se o usuário já realizou este simulado
    const { data: progress, error: progressError } = await supabase
      .from('user_simulado_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('simulado_id', id)
      .maybeSingle();

    if (progressError) {
      // Log silencioso do erro, mas não falhar a requisição
    }

    return NextResponse.json({
      simulado,
      questoes: questoes || [],
      alreadyCompleted: !!progress,
      progress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { answers, score, timeTaken } = body;

    // Validar os dados
    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'Dados incompletos: answers é obrigatório' }, { status: 400 });
    }

    if (typeof score !== 'number' || isNaN(score)) {
      return NextResponse.json({ error: 'Dados inválidos: score deve ser um número' }, { status: 400 });
    }

    if (typeof timeTaken !== 'number' || isNaN(timeTaken)) {
      return NextResponse.json({ error: 'Dados inválidos: timeTaken deve ser um número' }, { status: 400 });
    }

    // Verificar se o usuário tem perfil na tabela users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: 'Erro ao verificar perfil do usuário' },
        { status: 500 }
      );
    }

    // Se o usuário não tem perfil, criar automaticamente
    if (!userProfile) {
      const { error: createProfileError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          created_at: new Date().toISOString(),
        });

      if (createProfileError) {
        return NextResponse.json(
          { error: 'Erro ao criar perfil do usuário' },
          { status: 500 }
        );
      }
    }

    // Salvar o progresso - primeiro verificar se já existe
    const { data: existingProgress, error: checkError } = await supabase
      .from('user_simulado_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('simulado_id', id)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: 'Erro ao verificar progresso existente', details: checkError.message },
        { status: 500 }
      );
    }

    let saveError;
    if (existingProgress) {
      // Atualizar progresso existente
      const { error } = await supabase
        .from('user_simulado_progress')
        .update({
          score: score,
          time_taken_minutes: Math.round(timeTaken / 60), // Converter segundos para minutos
          answers: answers,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);
      saveError = error;
    } else {
      // Inserir novo progresso
      const { error } = await supabase
        .from('user_simulado_progress')
        .insert({
          user_id: user.id,
          simulado_id: id,
          score: score,
          time_taken_minutes: Math.round(timeTaken / 60), // Converter segundos para minutos
          answers: answers,
          completed_at: new Date().toISOString(),
        });
      saveError = error;
    }

    if (saveError) {
      return NextResponse.json(
        { error: 'Erro ao salvar progresso', details: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
}
