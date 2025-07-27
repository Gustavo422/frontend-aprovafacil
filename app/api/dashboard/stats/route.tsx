import { NextResponse } from 'next/server';
import { extractAuthToken } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    // Obter token de autenticação
    const token = extractAuthToken(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const backendUrl = `${process.env.BACKEND_API_URL}/api/dashboard/stats${new URL(request.url).search}`;
    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Erro na rota dashboard/stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}



