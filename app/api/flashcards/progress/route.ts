import { extractAuthToken } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const token = extractAuthToken(request);
    if (!token) {
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
    // Repassar a requisição para o backend
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/flashcards/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        flashcard_id,
        status,
        next_review,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Erro ao atualizar progresso' },
        { status: response.status }
      );
    }
    const data = await response.json();
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

export async function GET(request: Request) {
  try {
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '10';
    // Construir parâmetros da query
    const params = new URLSearchParams({
      limit,
      ...(status && { status }),
    });
    // Repassar a requisição para o backend
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/flashcards/progress?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar progresso' },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json({
      progress: data.progress,
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
