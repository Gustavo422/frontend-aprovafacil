import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';
import { extractAuthToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/me');

    if (!isValid) return NextResponse.json({ error: error || 'Invalid backend URL' }, { status: 500 });

    console.log('[DEBUG] Auth Check - Fazendo requisição para:', url);

    // Garantir que o backend receba Authorization: Bearer <token>
    const token = extractAuthToken(request);
    const headers = new Headers(request.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let res = await fetch(url, { method: 'GET', headers });

    // Se 401, tenta refresh e repete uma vez
    if (res.status === 401) {
      console.log('[DEBUG] Auth Check - 401 recebido, tentando refresh de token');
      const refreshCfg = getBackendUrl('/api/auth/refresh');
      if (refreshCfg.isValid) {
        const refreshRes = await fetch(refreshCfg.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: 'auth-me-retry' }),
        });
        if (refreshRes.ok) {
          console.log('[DEBUG] Auth Check - Refresh OK, repetindo chamada /auth/me');
          res = await fetch(url, { method: 'GET', headers });
        } else {
          console.log('[DEBUG] Auth Check - Refresh falhou');
        }
      }
    }

    const data = await res.json();
    console.log('[DEBUG] Auth Check - Resposta:', { status: res.status, success: data.success });

    return NextResponse.json(data, { status: res.status });
  });
}