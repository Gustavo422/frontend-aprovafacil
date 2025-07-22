import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/refresh');

    if (!isValid) return error!;

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
    if (res.status === 200 && data.success && data.data?.token) {
      console.log('[DEBUG] Refresh bem-sucedido, atualizando token em cookies');

      // Atualizar cookie HTTP-only para segurança
      response.cookies.set('auth_token_secure', data.data.token, {
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });
      
      // Atualizar cookie para acesso pelo cliente
      response.cookies.set('auth_token', data.data.token, {
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });

      console.log('[DEBUG] Cookies atualizados');
    }

    return response;
  });
}