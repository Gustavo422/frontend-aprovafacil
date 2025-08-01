import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractAuthToken, sanitizeToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Processando requisição GET /api/dashboard/enhanced-stats');
    console.log('[DEBUG] Headers da requisição:', Object.fromEntries(request.headers.entries()));
    
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      console.log('[DEBUG] Token não encontrado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const backendUrl = `${process.env.BACKEND_API_URL}/api/dashboard/enhanced-stats${new URL(request.url).search}`;
    console.log('[DEBUG] Fazendo requisição para:', backendUrl);
    console.log('[DEBUG] Com token:', sanitizeToken(token));
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('[DEBUG] Status da resposta:', response.status);
    
    const data = await response.json();
    console.log('[DEBUG] Dados recebidos:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas aprimoradas:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}