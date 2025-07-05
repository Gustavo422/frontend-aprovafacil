import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

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

    // Buscar simulados com join para concursos
    const { data: simulados, error } = await supabase
      .from('simulados')
      .select(`
        *,
        concursos (
          id,
          nome,
          categoria,
          ano,
          banca
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar simulados', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: simulados || [],
      count: simulados?.length || 0,
      page: 1,
      limit: 10,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
}
