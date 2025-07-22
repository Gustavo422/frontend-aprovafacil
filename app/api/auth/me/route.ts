import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/me');

    if (!isValid) return error!;

    console.log('[DEBUG] Auth Check - Fazendo requisição para:', url);

    // Forward the request to the backend
    const res = await fetch(url, {
      method: 'GET',
      headers: request.headers,
    });

    const data = await res.json();
    console.log('[DEBUG] Auth Check - Resposta:', { status: res.status, success: data.success });

    return NextResponse.json(data, { status: res.status });
  });
}