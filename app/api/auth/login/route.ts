import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/login');

    if (!isValid) return error!;

    console.log('[DEBUG] Login - Fazendo requisição para:', url);

    const res = await fetch(url, {
      method: 'POST',
      headers: request.headers,
      body: await request.text(),
    });

    const data = await res.json();
    console.log('[DEBUG] Login - Resposta:', { status: res.status, success: data.success });

    // Criar a resposta
    const response = NextResponse.json(data, { status: res.status });

    // Se o login for bem-sucedido, armazenar o token em cookies
    if (res.status === 200 && data.success && data.data?.token) {
      console.log('[DEBUG] Login bem-sucedido, armazenando token em cookies');

      // Definir cookie HTTP-only para segurança (não acessível via JavaScript)
      response.cookies.set('auth_token_secure', data.data.token, {
        httpOnly: true, // Não permitir acesso pelo JavaScript (proteção contra XSS)
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });
      
      // Definir cookie para acesso pelo cliente (para redundância)
      response.cookies.set('auth_token', data.data.token, {
        httpOnly: false, // Permitir acesso pelo JavaScript
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      });

      console.log('[DEBUG] Cookies definidos');
    }

    return response;
  });
}