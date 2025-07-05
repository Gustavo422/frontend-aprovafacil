import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    logger.info('Testando busca de simulado:', { id });

    // Criar cliente Supabase corretamente
    const supabase = await createRouteHandlerClient();

    // Buscar detalhes do simulado sem verificar autenticação
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (simuladoError) {
      logger.error('Erro ao buscar simulado:', {
        error: simuladoError.message,
        code: simuladoError.code,
        details: simuladoError.details,
        simuladoId: id,
      });
      return NextResponse.json(
        { error: 'Simulado não encontrado', details: simuladoError },
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
      logger.error('Erro ao buscar questões:', {
        error: questoesError.message,
        code: questoesError.code,
        details: questoesError.details,
        simuladoId: id,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar questões', details: questoesError },
        { status: 500 }
      );
    }

    logger.info('Dados encontrados:', {
      simulado: simulado ? 'Sim' : 'Não',
      questoes: questoes ? questoes.length : 0,
      simuladoId: id,
    });

    return NextResponse.json({
      simulado,
      questoes,
      test: true,
    });
  } catch (error) {
    logger.error('Erro ao processar requisição:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      simuladoId: id,
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
} 