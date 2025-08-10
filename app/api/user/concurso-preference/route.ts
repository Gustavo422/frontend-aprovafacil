import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractAuthToken, sanitizeHeadersForLog, sanitizeToken } from '@/lib/auth-utils';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

function ensureCorrelationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id');
  if (incoming) return incoming;
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `${time}-${rand}`;
}

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Processando requisição GET /api/user/concurso-preference');
    console.log('[DEBUG] Headers da requisição:', sanitizeHeadersForLog(request.headers));
    
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    console.log('[DEBUG] Token extraído:', token ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : 'Nenhum');
    
    if (!token) {
      console.log('[DEBUG] Token não encontrado, retornando 401');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o token é um JWT válido
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('[DEBUG] Token não é um JWT válido');
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }
      
      // Decodificar payload do token
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.token) payload.token = sanitizeToken(payload.token);
      console.log('[DEBUG] Payload do token:', payload);
    } catch (error) {
      console.log('[DEBUG] Erro ao decodificar token:', error);
    }

    const urlConfig = getBackendUrl('/api/user/concurso-preference', new URL(request.url).search);
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    console.log('[DEBUG] Fazendo requisição para:', urlConfig.url);
    console.log('[DEBUG] Com token:', `Bearer ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
    const correlationId = ensureCorrelationId(request);
    
    const res = await fetch(urlConfig.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logger.error('Erro ao buscar preferência do usuário:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const urlConfig = getBackendUrl('/api/user/concurso-preference');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const correlationId = ensureCorrelationId(request);
    const res = await fetch(urlConfig.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: await request.text(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logger.error('Erro ao criar preferência do usuário:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const urlConfig = getBackendUrl('/api/user/concurso-preference');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const correlationId = ensureCorrelationId(request);
    const res = await fetch(urlConfig.url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: await request.text(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logger.error('Erro ao atualizar preferência do usuário:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const urlConfig = getBackendUrl('/api/user/concurso-preference');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const correlationId = ensureCorrelationId(request);
    const res = await fetch(urlConfig.url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logger.error('Erro ao deletar preferência do usuário:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}