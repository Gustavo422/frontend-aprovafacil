import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractAuthToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Processando requisição GET /api/dashboard/activities');
    console.log('[DEBUG] Headers da requisição:', Object.fromEntries(request.headers.entries()));
    
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      console.log('[DEBUG] Token não encontrado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const response = await fetch(`${process.env.BACKEND_API_URL}/api/dashboard/activities`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar atividades' },
        { status: response.status }
      );
    }

    const activities = await response.json();

    return NextResponse.json(activities);

  } catch (error) {
    logger.error('Erro ao buscar atividades:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

