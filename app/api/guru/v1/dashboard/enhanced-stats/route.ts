import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { extractAuthToken, sanitizeHeadersForLog, sanitizeToken } from '@/lib/auth-utils';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';
import { getFeatureFlagConfig } from '@/src/features/guru/config/feature-flags';

function ensureCorrelationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id');
  if (incoming) return incoming;
  // Geração leve
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `${time}-${rand}`;
}

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] GET /api/guru/v1/dashboard/enhanced-stats');
    console.log('[DEBUG] Headers:', sanitizeHeadersForLog(request.headers));

    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const correlationId = ensureCorrelationId(request);

    const { guruNewModuleEndpoint } = getFeatureFlagConfig();
    const urlConfig = getBackendUrl(guruNewModuleEndpoint.enhancedStats, new URL(request.url).search);
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }

    const response = await fetch(urlConfig.url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logger.error('Erro ao buscar guru enhanced stats:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

