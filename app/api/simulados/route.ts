import { extractAuthToken } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

function ensureCorrelationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id');
  if (incoming && incoming.trim().length > 0) return incoming;
  const random = Math.random().toString(36).slice(2, 10);
  return `simulados-${Date.now()}-${random}`;
}

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Frontend: Processando requisição GET /api/simulados');
    console.log('[DEBUG] Frontend: Headers da requisição:', (await import('@/lib/auth-utils')).sanitizeHeadersForLog(request.headers));
    
    const token = extractAuthToken(request);
    console.log('[DEBUG] Frontend: Token extraído:', token ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : 'null');
    const correlationId = ensureCorrelationId(request);
    
    if (!token) {
      console.log('[DEBUG] Frontend: Token não encontrado, retornando 401');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401, headers: { 'x-correlation-id': correlationId } });
    }
    
    const urlConfig = getBackendUrl('/api/v1/simulados', new URL(request.url).search);
    if (!urlConfig.isValid) {
      const res = createEnvironmentErrorResponse(urlConfig);
      return new NextResponse(res.body, { status: res.status, headers: { 'x-correlation-id': correlationId } });
    }
    console.log('[DEBUG] Frontend: Fazendo requisição para backend:', urlConfig.url);
    
    const res = await fetch(urlConfig.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
        'x-request-id': correlationId,
        ...(request.headers.get('if-none-match') ? { 'If-None-Match': request.headers.get('if-none-match') as string } : {}),
        ...(request.headers.get('if-modified-since') ? { 'If-Modified-Since': request.headers.get('if-modified-since') as string } : {}),
      },
    });
    
    console.log('[DEBUG] Frontend: Resposta do backend - Status:', res.status);
    const outEtag = res.headers.get('ETag');
    const outLastMod = res.headers.get('Last-Modified');
    if (res.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          'x-correlation-id': correlationId,
          'x-request-id': res.headers.get('x-request-id') ?? correlationId,
          ...(outEtag ? { ETag: outEtag } : {}),
          ...(outLastMod ? { 'Last-Modified': outLastMod } : {}),
        },
      });
    }
    const data = await res.json();
    console.log('[DEBUG] Frontend: Resposta do backend - Data:', data);
    
    return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId, 'x-request-id': res.headers.get('x-request-id') ?? correlationId, ...(outEtag ? { ETag: outEtag } : {}), ...(outLastMod ? { 'Last-Modified': outLastMod } : {}) } });
  } catch (error) {
    console.error('[DEBUG] Frontend: Erro ao buscar simulados:', error);
    logger.error('Erro ao buscar simulados:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const correlationId = ensureCorrelationId(request);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}