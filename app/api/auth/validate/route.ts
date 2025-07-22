import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/auth/me');

    if (!isValid) return error!;

    // Passar o cabeçalho de autorização para o backend
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  });
}