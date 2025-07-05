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

    // Buscar estatísticas de simulados
    const { data: simuladosStats, error: simuladosError } = await supabase
      .from('user_simulado_progress')
      .select('*')
      .eq('user_id', user.id);

    if (simuladosError) {
      logger.error('Erro ao buscar estatísticas de simulados:', {
        error: simuladosError,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const totalSimulados = simuladosStats?.length || 0;
    const totalQuestoes =
      simuladosStats?.reduce((acc, curr) => {
        const answers = curr.answers as Record<string, string>;
        return acc + Object.keys(answers).length;
      }, 0) || 0;

    const totalAcertos =
      simuladosStats?.reduce((acc, curr) => {
        return acc + curr.score;
      }, 0) || 0;

    const taxaAcerto =
      totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

    const tempoEstudo =
      simuladosStats?.reduce((acc, curr) => {
        return acc + curr.time_taken_minutes;
      }, 0) || 0;

    // Buscar plano de estudos ativo
    const { data: planoEstudo, error: planoError } = await supabase
      .from('planos_estudo')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planoError) {
      logger.error('Erro ao buscar plano de estudos:', { error: planoError });
      return NextResponse.json(
        { error: 'Erro ao buscar plano de estudos' },
        { status: 500 }
      );
    }

    // Buscar informações do concurso do plano de estudos
    if (planoEstudo && planoEstudo.concurso_id) {
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('id, nome, categoria, ano, banca')
        .eq('id', planoEstudo.concurso_id)
        .single();

      if (!concursoError && concurso) {
        planoEstudo.concursos = concurso;
      }
    }

    // Buscar atividades recentes
    const { data: atividadesRecentes, error: atividadesError } = await supabase
      .from('user_simulado_progress')
      .select('*, simulados(id, title, description, difficulty)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (atividadesError) {
      logger.error('Erro ao buscar atividades recentes:', {
        error: atividadesError,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar atividades recentes' },
        { status: 500 }
      );
    }

    // Buscar informações dos concursos das atividades recentes
    if (atividadesRecentes && atividadesRecentes.length > 0) {
      const concursoIds = atividadesRecentes
        .map(a => a.simulados?.concurso_id)
        .filter(id => id !== null && id !== undefined) as string[];

      if (concursoIds.length > 0) {
        const { data: concursos, error: concursosError } = await supabase
          .from('concursos')
          .select('id, nome, categoria')
          .in('id', concursoIds);

        if (!concursosError && concursos) {
          const concursosMap = new Map(concursos.map(c => [c.id, c]));
          atividadesRecentes.forEach(atividade => {
            if (atividade.simulados && atividade.simulados.concurso_id) {
              atividade.simulados.concursos = concursosMap.get(
                atividade.simulados.concurso_id
              );
            }
          });
        }
      }
    }

    // Buscar estatísticas por disciplina
    const { data: disciplinaStats, error: disciplinaError } = await supabase
      .from('user_discipline_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('average_score', { ascending: false });

    if (disciplinaError) {
      logger.error('Erro ao buscar estatísticas por disciplina:', {
        error: disciplinaError,
      });
    }

    // Buscar concursos disponíveis
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('*')
      .eq('is_active', true)
      .order('ano', { ascending: false });

    if (concursosError) {
      logger.error('Erro ao buscar concursos:', { error: concursosError });
    }

    // Calcular pontos fracos baseados nas estatísticas de disciplina
    const pontosFracos =
      disciplinaStats
        ?.filter(stat => stat.average_score < 70)
        .map(stat => ({
          disciplina: stat.disciplina,
          acertos: Math.round(stat.average_score),
        }))
        .slice(0, 5) || [];

    return NextResponse.json({
      estatisticas: {
        totalSimulados,
        totalQuestoes,
        totalAcertos,
        taxaAcerto: Math.round(taxaAcerto * 100) / 100,
        tempoEstudo,
      },
      planoEstudo,
      atividadesRecentes,
      desempenhoPorDisciplina: disciplinaStats || [],
      pontosFracos,
      concursos: concursos || [],
    });
  } catch (error) {
    logger.error('Erro ao processar requisição:', { error });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
