import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  const supabase = await createRouteHandlerClient();

  try {
    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { flashcard_id, status, next_review } = body;

    // Validar os dados
    if (!flashcard_id || !status) {
      return NextResponse.json(
        { error: 'ID do flashcard e status são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar o status
    const statusValidos = ['novo', 'aprendendo', 'revisando', 'dominado'];
    if (!statusValidos.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    // Buscar o progresso atual
    const { data: progressAtual, error: buscaError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_id', flashcard_id)
      .maybeSingle();

    if (buscaError) {
      logger.error('Erro ao buscar progresso atual:', {
        error: buscaError instanceof Error ? buscaError.message : String(buscaError),
      });
      return NextResponse.json(
        { error: 'Erro ao buscar progresso atual' },
        { status: 500 }
      );
    }

    // Calcular a próxima revisão baseada no status
    let proximaRevisao = next_review;
    if (!proximaRevisao) {
      const agora = new Date();
      let diasParaRevisao = 1;

      switch (status) {
        case 'aprendendo':
          diasParaRevisao = 1;
          break;
        case 'revisando':
          diasParaRevisao = 3;
          break;
        case 'dominado':
          diasParaRevisao = 7;
          break;
        default:
          diasParaRevisao = 1;
      }

      proximaRevisao = new Date(
        agora.getTime() + diasParaRevisao * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    // Atualizar o progresso
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .upsert({
        user_id: user.id,
        flashcard_id,
        status,
        next_review: proximaRevisao,
        review_count: progressAtual ? progressAtual.review_count + 1 : 1,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      logger.error('Erro ao atualizar progresso:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Erro ao atualizar progresso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Progresso atualizado com sucesso',
      data,
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

export async function GET(_request: Request) {
  const { searchParams } = new URL(_request.url);
  const status = searchParams.get('status');
  const limit = Number.parseInt(searchParams.get('limit') || '10');

  const supabase = await createRouteHandlerClient();

  try {
    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Construir a query base
    let query = supabase
      .from('user_flashcard_progress')
      .select(
        `
        *,
        flashcards (
          id,
          front,
          back,
          disciplina,
          tema,
          subtema
        )
      `
      )
      .eq('user_id', user.id);

    // Aplicar filtros se fornecidos
    if (status) {
      query = query.eq('status', status);
    }

    // Filtrar por flashcards que precisam de revisão
    const agora = new Date().toISOString();
    query = query.lte('next_review', agora);

    // Limitar resultados
    query = query.limit(limit);

    // Executar a query
    const { data: progress, error } = await query;

    if (error) {
      logger.error('Erro ao buscar progresso:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Erro ao buscar progresso' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      progress,
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
