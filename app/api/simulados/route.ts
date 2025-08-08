import { extractAuthToken } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Frontend: Processando requisição GET /api/simulados');
    console.log('[DEBUG] Frontend: Headers da requisição:', (await import('@/lib/auth-utils')).sanitizeHeadersForLog(request.headers));
    
    const token = extractAuthToken(request);
    console.log('[DEBUG] Frontend: Token extraído:', token ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : 'null');
    
    if (!token) {
      console.log('[DEBUG] Frontend: Token não encontrado, retornando 401');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/simulados${new URL(request.url).search}`;
    console.log('[DEBUG] Frontend: Fazendo requisição para backend:', backendUrl);
    
    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[DEBUG] Frontend: Resposta do backend - Status:', res.status);
    const data = await res.json();
    console.log('[DEBUG] Frontend: Resposta do backend - Data:', data);
    
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[DEBUG] Frontend: Erro ao buscar simulados:', error);
    logger.error('Erro ao buscar simulados:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}