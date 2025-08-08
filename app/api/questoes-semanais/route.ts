import { extractAuthToken } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const urlConfig = getBackendUrl('/api/questoes-semanais', new URL(request.url).search);
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const res = await fetch(urlConfig.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    logger.error('Erro ao buscar questões semanais:', {
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
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const urlConfig = getBackendUrl('/api/questoes-semanais');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const res = await fetch(urlConfig.url, {
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
    logger.error('Erro ao criar questão semanal:', {
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
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const urlConfig = getBackendUrl('/api/questoes-semanais');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const res = await fetch(urlConfig.url, {
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
    logger.error('Erro ao atualizar questão semanal:', {
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
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const urlConfig = getBackendUrl('/api/questoes-semanais');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }
    const res = await fetch(urlConfig.url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: await request.text(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    logger.error('Erro ao deletar questão semanal:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}