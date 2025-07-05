import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { apostila_content_id, completed, progress_percentage } = body;

    // Validar os dados
    if (!apostila_content_id) {
      return NextResponse.json(
        { error: 'ID do conteúdo da apostila é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar o progresso
    const { data, error } = await supabase
      .from('user_apostila_progress')
      .upsert({
        user_id: user.id,
        apostila_content_id,
        completed: completed !== undefined ? completed : false,
        progress_percentage:
          progress_percentage !== undefined ? progress_percentage : 0,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      logger.error('Erro ao atualizar progresso:', { error });
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
    logger.error('Erro ao processar requisição:', { error });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // TODO: Implementar lógica para buscar progresso da apostila
    return NextResponse.json({ progress: 0 });
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
