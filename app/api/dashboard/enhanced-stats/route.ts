import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractAuthToken, sanitizeHeadersForLog, sanitizeToken } from '@/lib/auth-utils';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Processando requisição GET /api/dashboard/enhanced-stats');
    console.log('[DEBUG] Headers da requisição:', sanitizeHeadersForLog(request.headers));
    
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      console.log('[DEBUG] Token não encontrado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const urlConfig = getBackendUrl('/api/dashboard/enhanced-stats', new URL(request.url).search);
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    console.log('[DEBUG] Fazendo requisição para:', urlConfig.url);
    console.log('[DEBUG] Com token:', sanitizeToken(token));
    
    const response = await fetch(urlConfig.url, {
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