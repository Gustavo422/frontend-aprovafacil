import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(_request: Request) {
  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o plano de estudos ativo do usuário
    const { data: planos, error } = await supabase
      .from('plano_estudos')
      .select(
        `
        *,
        disciplinas_plano (
          disciplina_id,
          disciplinas (
            nome
          )
        )
      `
      )
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single();

    if (error) {
      logger.error('Erro ao buscar plano de estudos', { error: error.message });
      return NextResponse.json(
        { error: 'Erro ao buscar plano de estudos' },
        { status: 500 }
      );
    }

    if (!planos) {
      return NextResponse.json({
        message: 'Nenhum plano de estudos encontrado',
        hasActivePlan: false,
      });
    }

    // Buscar informações do concurso separadamente se necessário
    if (planos.concurso_id) {
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('id, nome, categoria, ano, banca')
        .eq('id', planos.concurso_id)
        .single();

      if (!concursoError && concurso) {
        planos.concursos = concurso;
      }
    }

    return NextResponse.json({
      hasActivePlan: !!planos,
      planoEstudo: planos,
    });
  } catch (error) {
    logger.error('Erro interno', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const { concursoId, startDate, endDate, hoursPerDay } = body;

    // Validar os dados
    if (!startDate || !endDate || !hoursPerDay) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Buscar os assuntos do mapa de assuntos para o concurso
    let query = supabase.from('mapa_assuntos').select('*');
    if (concursoId) {
      query = query.eq('concurso_id', concursoId);
    }

    const { data: assuntos, error: assuntosError } = await query;

    if (assuntosError) {
      logger.error('Erro ao buscar assuntos:', {
        error: assuntosError.message,
        details: assuntosError,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar assuntos' },
        { status: 500 }
      );
    }

    // Gerar um cronograma de estudos baseado nos assuntos e no tempo disponível
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Distribuir os assuntos pelos dias disponíveis
    const schedule: Record<string, unknown> = {};

    for (let i = 0; i < diffDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      // Distribuir assuntos para este dia
      const assuntosPerDay = Math.ceil(assuntos.length / diffDays);
      const startIndex = i * assuntosPerDay;
      const endIndex = Math.min(startIndex + assuntosPerDay, assuntos.length);
      const assuntosDodia = assuntos.slice(startIndex, endIndex);

      schedule[dateString] = {
        assuntos: assuntosDodia.map(a => ({
          id: a.id,
          disciplina: a.disciplina,
          tema: a.tema,
          subtema: a.subtema,
          horasEstudo:
            Math.round((hoursPerDay / assuntosDodia.length) * 10) / 10,
        })),
        totalHoras: hoursPerDay,
      };
    }

    // Salvar o plano de estudos
    const { data: planoEstudo, error } = await supabase
      .from('planos_estudo')
      .insert({
        user_id: user.id,
        concurso_id: concursoId || null,
        start_date: startDate,
        end_date: endDate,
        schedule,
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao salvar plano de estudos:', {
        error: error.message,
        details: error,
      });
      return NextResponse.json(
        { error: 'Erro ao salvar plano de estudos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Plano de estudos criado com sucesso',
      planoEstudo,
    });
  } catch (error) {
    logger.error('Erro interno', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
