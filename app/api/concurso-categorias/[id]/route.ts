import { createSupabaseClient } from '@/src/lib/supabase';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';
import { extractAuthToken } from '@/lib/auth-utils';

function ensureCorrelationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id');
  if (incoming) return incoming;
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `${time}-${rand}`;
}

// ========================================
// GET - Buscar categoria por ID
// ========================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Token de autenticação
    const token = extractAuthToken(request) || (await supabase.auth.getSession()).data.session?.access_token || '';
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const urlConfig = getBackendUrl(`/api/concurso-categorias/${id}`);
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }

    const correlationId = ensureCorrelationId(request);

    // Repassar a requisição para o backend
    const response = await fetch(urlConfig.url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Erro ao buscar categoria' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { headers: { 'x-correlation-id': correlationId }, status: 200 });
  } catch (error) {
    logger.error('Erro interno:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 