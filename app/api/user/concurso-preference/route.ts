import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractAuthToken, sanitizeToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Processando requisição GET /api/user/concurso-preference');
    console.log('[DEBUG] Headers da requisição:', Object.fromEntries(request.headers.entries()));
    
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

    const backendUrl = `${process.env.BACKEND_API_URL}/api/user/concurso-preference${new URL(request.url).search}`;
    console.log('[DEBUG] Fazendo requisição para:', backendUrl);
    console.log('[DEBUG] Com token:', `Bearer ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);
    
    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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

    const backendUrl = `${process.env.BACKEND_API_URL}/api/user/concurso-preference`;
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: await request.text(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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

    const backendUrl = `${process.env.BACKEND_API_URL}/api/user/concurso-preference`;
    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: await request.text(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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

    const backendUrl = `${process.env.BACKEND_API_URL}/api/user/concurso-preference`;
    const res = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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