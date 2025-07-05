import { createRouteHandlerClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { ConteudoFiltradoResponse } from '@/types/concurso';

// ========================================
// GET - Buscar conteúdo filtrado
// ========================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Parâmetros obrigatórios
  const categoriaId = searchParams.get('categoria_id');
  const concursoId = searchParams.get('concurso_id');
  
  // Parâmetros opcionais
  const disciplina = searchParams.get('disciplina');
  const dificuldade = searchParams.get('dificuldade');
  const isPublic = searchParams.get('is_public');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Validar parâmetros obrigatórios
    if (!categoriaId || !concursoId) {
      return NextResponse.json(
        { error: 'categoria_id e concurso_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // ========================================
    // BUSCAR SIMULADOS
    // ========================================

    let simuladosQuery = supabase
      .from('simulados')
      .select(`
        *,
        concursos (
          *,
          concurso_categorias (*)
        )
      `)
      .eq('categoria_id', categoriaId)
      .eq('concurso_id', concursoId)
      .is('deleted_at', null);

    if (isPublic !== null) {
      simuladosQuery = simuladosQuery.eq('is_public', isPublic === 'true');
    }

    const { data: simulados, error: simuladosError } = await simuladosQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (simuladosError) {
      logger.error('Erro ao buscar simulados:', {
        error: simuladosError.message,
        userId: user.id,
        categoriaId,
        concursoId,
      });
    }

    // ========================================
    // BUSCAR FLASHCARDS
    // ========================================

    let flashcardsQuery = supabase
      .from('flashcards')
      .select(`
        *,
        concursos (
          *,
          concurso_categorias (*)
        )
      `)
      .eq('categoria_id', categoriaId)
      .eq('concurso_id', concursoId);

    if (disciplina) {
      flashcardsQuery = flashcardsQuery.eq('disciplina', disciplina);
    }

    const { data: flashcards, error: flashcardsError } = await flashcardsQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (flashcardsError) {
      logger.error('Erro ao buscar flashcards:', {
        error: flashcardsError.message,
        userId: user.id,
        categoriaId,
        concursoId,
      });
    }

    // ========================================
    // BUSCAR APOSTILAS
    // ========================================

    const apostilasQuery = supabase
      .from('apostilas')
      .select(`
        *,
        concursos (
          *,
          concurso_categorias (*)
        )
      `)
      .eq('categoria_id', categoriaId)
      .eq('concurso_id', concursoId);

    const { data: apostilas, error: apostilasError } = await apostilasQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (apostilasError) {
      logger.error('Erro ao buscar apostilas:', {
        error: apostilasError.message,
        userId: user.id,
        categoriaId,
        concursoId,
      });
    }

    // ========================================
    // BUSCAR MAPA DE ASSUNTOS
    // ========================================

    let mapaAssuntosQuery = supabase
      .from('mapa_assuntos')
      .select(`
        *,
        concursos (
          *,
          concurso_categorias (*)
        )
      `)
      .eq('categoria_id', categoriaId)
      .eq('concurso_id', concursoId);

    if (disciplina) {
      mapaAssuntosQuery = mapaAssuntosQuery.eq('disciplina', disciplina);
    }

    const { data: mapaAssuntos, error: mapaAssuntosError } = await mapaAssuntosQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (mapaAssuntosError) {
      logger.error('Erro ao buscar mapa de assuntos:', {
        error: mapaAssuntosError.message,
        userId: user.id,
        categoriaId,
        concursoId,
      });
    }

    // ========================================
    // CONTAR TOTAL DE ITENS
    // ========================================

    const [
      { count: totalSimulados },
      { count: totalFlashcards },
      { count: totalApostilas },
      { count: totalMapaAssuntos }
    ] = await Promise.all([
      supabase
        .from('simulados')
        .select('*', { count: 'exact', head: true })
        .eq('categoria_id', categoriaId)
        .eq('concurso_id', concursoId)
        .is('deleted_at', null),
      supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('categoria_id', categoriaId)
        .eq('concurso_id', concursoId),
      supabase
        .from('apostilas')
        .select('*', { count: 'exact', head: true })
        .eq('categoria_id', categoriaId)
        .eq('concurso_id', concursoId),
      supabase
        .from('mapa_assuntos')
        .select('*', { count: 'exact', head: true })
        .eq('categoria_id', categoriaId)
        .eq('concurso_id', concursoId)
    ]);

    const total = (totalSimulados || 0) + (totalFlashcards || 0) + (totalApostilas || 0) + (totalMapaAssuntos || 0);

    // ========================================
    // MONTAR RESPOSTA
    // ========================================

    const response: ConteudoFiltradoResponse = {
      data: {
        simulados: simulados || [],
        flashcards: flashcards || [],
        apostilas: apostilas || [],
        mapaAssuntos: mapaAssuntos || [],
      },
      total,
      page,
      limit,
    };

    // Log da consulta
    logger.info('Conteúdo filtrado consultado:', {
      userId: user.id,
      categoriaId,
      concursoId,
      disciplina,
      dificuldade,
      totalSimulados: simulados?.length || 0,
      totalFlashcards: flashcards?.length || 0,
      totalApostilas: apostilas?.length || 0,
      totalMapaAssuntos: mapaAssuntos?.length || 0,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Erro interno ao buscar conteúdo filtrado:', {
      error: error instanceof Error ? error.message : String(error),
      categoriaId,
      concursoId,
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 