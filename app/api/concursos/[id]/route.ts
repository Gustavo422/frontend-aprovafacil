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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const urlConfig = getBackendUrl(`/api/concursos/${id}`);
  if (!urlConfig.isValid) {
    return createEnvironmentErrorResponse(urlConfig);
  }

  const correlationId = ensureCorrelationId(request);

  const res = await fetch(urlConfig.url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId } });
}


