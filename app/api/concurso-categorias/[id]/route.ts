import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

// ========================================
// GET - Buscar categoria por ID
// ========================================

export async function GET(
  _request: Request,
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

    const { id } = params;

    // Buscar categoria
    const { data: categoria, error } = await supabase
      .from('concurso_categorias')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 404 }
        );
      }
      
      logger.error('Erro ao buscar categoria:', {
        error: error.message,
        categoriaId: id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Erro ao buscar categoria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: categoria,
    });
  } catch (error) {
    logger.error('Erro interno:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 