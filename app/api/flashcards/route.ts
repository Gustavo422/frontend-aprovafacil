import { createRouteHandlerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar flashcards do banco
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar flashcards' },
        { status: 500 }
      );
    }

    return NextResponse.json(flashcards || []);
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(_request: Request) {
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
    const body = await _request.json();
    const { front, back, disciplina, tema, subtema, concurso_id } = body;

    // Validar os dados obrigatórios
    if (!front || !back || !disciplina || !tema) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Criar o flashcard
    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .insert({
        front,
        back,
        disciplina,
        tema,
        subtema,
        concurso_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar flashcard' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Flashcard criado com sucesso',
      flashcard,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
