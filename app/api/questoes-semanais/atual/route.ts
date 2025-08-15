import { NextResponse } from 'next/server';
import { extractAuthToken } from '@/lib/auth-utils';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const token = extractAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const urlConfig = getBackendUrl('/api/questoes-semanais/atual');
    if (!urlConfig.isValid) {
      return createEnvironmentErrorResponse(urlConfig);
    }

    const correlationId = request.headers.get('x-correlation-id') ?? undefined;

    const res = await fetch(urlConfig.url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


