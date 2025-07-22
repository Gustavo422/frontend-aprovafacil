import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/logout');

    if (!isValid) return error!;

    console.log('[DEBUG] Logout - Fazendo requisição para:', url);

    // Forward the request to the backend
    const res = await fetch(url, {
      method: 'POST',
      headers: request.headers,
      body: await request.text(),
    });

    const data = await res.json();
    console.log('[DEBUG] Logout - Resposta:', { status: res.status, success: data.success });

    // Create the response
    const response = NextResponse.json(data, { status: res.status });

    // Clear all authentication cookies
    response.cookies.set('auth_token_secure', '', {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0 // Expire immediately
    });
    
    response.cookies.set('auth_token', '', {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0 // Expire immediately
    });

    console.log('[DEBUG] Cookies removidos');

    return response;
  });
}