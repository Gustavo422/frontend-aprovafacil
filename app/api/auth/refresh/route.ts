import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';
import { sanitizeToken } from '@/lib/auth-utils';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/refresh');

    if (!isValid) return NextResponse.json({ error: error || 'Invalid backend URL' }, { status: 500 });

    console.log('[DEBUG] Token Refresh - Fazendo requisição para:', url);

    const res = await fetch(url, {
      method: 'POST',
      headers: request.headers,
      body: await request.text(),
    });

    const data = await res.json();
    console.log('[DEBUG] Token Refresh - Resposta:', { status: res.status, success: data.success });

    // Criar a resposta
    const response = NextResponse.json(data, { status: res.status });

    // Se o refresh for bem-sucedido, atualizar o token nos cookies
    // Normalizar formato: aceitar tanto { data: { token, expiresIn } } quanto { accessToken, expiresIn }
    const normalizedToken: string | undefined = data?.data?.token ?? data?.accessToken;
    const normalizedExpiresIn: number | undefined = data?.data?.expiresIn ?? data?.expiresIn;

    if (res.status === 200 && data.success && normalizedToken) {
      console.log('[DEBUG] Refresh bem-sucedido, atualizando token em cookies:', sanitizeToken(normalizedToken));

      // Atualizar cookie HTTP-only para segurança
      // alinhar com expiração do access token se fornecida pelo backend (expiresIn)
      const maxAge = (typeof normalizedExpiresIn === 'number' && normalizedExpiresIn > 0)
        ? normalizedExpiresIn
        : 60 * 60 * 24 * 7; // fallback 7 dias

      response.cookies.set('auth_token_secure', normalizedToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge
      });

      // Atualizar cookie para acesso pelo cliente
      response.cookies.set('auth_token', normalizedToken, {
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge
      });

      console.log('[DEBUG] Cookies atualizados');
    }

    return response;
  });
}