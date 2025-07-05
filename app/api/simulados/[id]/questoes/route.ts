import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar as questões do simulado
    const { data: questoes, error } = await supabase
      .from('simulado_questions')
      .select('*')
      .eq('simulado_id', id)
      .is('deleted_at', null)
      .order('question_number', { ascending: true });

    if (error) {
      logger.error('Erro ao buscar questões:', {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar questões' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questoes,
    });
  } catch (error) {
    logger.error('Erro ao processar requisição:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const {
      question_number,
      question_text,
      alternatives,
      correct_answer,
      explanation,
      discipline,
      topic,
      difficulty,
      concurso_id,
    } = body;

    // Validar os dados obrigatórios
    if (
      !question_number ||
      !question_text ||
      !alternatives ||
      !correct_answer
    ) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Criar a questão
    const { data: questao, error } = await supabase
      .from('simulado_questions')
      .insert({
        simulado_id: id,
        question_number,
        question_text,
        alternatives,
        correct_answer,
        explanation,
        discipline,
        topic,
        difficulty,
        concurso_id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar questão:', {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        { error: 'Erro ao criar questão' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Questão criada com sucesso',
      questao,
    });
  } catch (error) {
    logger.error('Erro ao processar requisição:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
