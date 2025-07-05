import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  const { searchParams } = new URL(_request.url);
  const concursoId = searchParams.get('concurso_id');
  const disciplina = searchParams.get('disciplina');

  try {
    // Criar cliente Supabase corretamente
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Erro de autenticação:', {
        error: authError?.message || 'Usuário não autenticado',
        user: user?.id,
      });
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Construir a query base
    let query = supabase.from('mapa_assuntos').select('*');

    // Aplicar filtros se fornecidos
    if (concursoId) {
      query = query.eq('concurso_id', concursoId);
    }

    if (disciplina) {
      query = query.eq('disciplina', disciplina);
    }

    // Executar a query
    const { data: assuntos, error } = await query;

    if (error) {
      logger.error('Erro ao buscar mapa de assuntos:', {
        error: error.message,
        details: error,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar mapa de assuntos' },
        { status: 500 }
      );
    }

    // Buscar o status dos assuntos para o usuário
    const { data: statusAssuntos, error: statusError } = await supabase
      .from('user_mapa_assuntos_status')
      .select('*')
      .eq('user_id', user.id);

    if (statusError) {
      logger.error('Erro ao buscar status dos assuntos:', {
        error: statusError.message,
        details: statusError,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar status dos assuntos' },
        { status: 500 }
      );
    }

    // Mapear os status para os assuntos
    const assuntosComStatus = assuntos.map(assunto => {
      const status = statusAssuntos?.find(
        s => s.mapa_assunto_id === assunto.id
      );
      return {
        ...assunto,
        status: status?.status || 'nao_estudado',
      };
    });

    // Agrupar por disciplina
    const assuntosPorDisciplina: Record<string, unknown[]> = {};

    assuntosComStatus.forEach(assunto => {
      if (!assuntosPorDisciplina[assunto.disciplina]) {
        assuntosPorDisciplina[assunto.disciplina] = [];
      }
      assuntosPorDisciplina[assunto.disciplina].push(assunto);
    });

    logger.info('Mapa de assuntos buscado com sucesso:', {
      userId: user.id,
      totalAssuntos: assuntos.length,
      disciplinas: Object.keys(assuntosPorDisciplina),
    });

    return NextResponse.json({
      assuntosPorDisciplina,
    });
  } catch (error) {
    logger.error('Erro ao processar requisição:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Criar cliente Supabase corretamente
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Erro de autenticação:', {
        error: authError?.message || 'Usuário não autenticado',
        user: user?.id,
      });
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { disciplina, tema, subtema, concurso_id } = body;

    // Validar os dados obrigatórios
    if (!disciplina || !tema) {
      return NextResponse.json(
        { error: 'Disciplina e tema são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar o assunto
    const { data: assunto, error } = await supabase
      .from('mapa_assuntos')
      .insert({
        disciplina,
        tema,
        subtema,
        concurso_id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar assunto:', {
        error: error.message,
        details: error,
        userId: user.id,
        disciplina,
        tema,
      });
      return NextResponse.json(
        { error: 'Erro ao criar assunto' },
        { status: 500 }
      );
    }

    logger.info('Assunto criado com sucesso:', {
      userId: user.id,
      assuntoId: assunto.id,
      disciplina,
      tema,
    });

    return NextResponse.json({
      message: 'Assunto criado com sucesso',
      assunto,
    });
  } catch (error) {
    logger.error('Erro ao processar requisição:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
