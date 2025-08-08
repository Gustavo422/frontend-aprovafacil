import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl(
      '/api/concurso-categorias', 
      new URL(request.url).search
    );
    
    if (!isValid) return NextResponse.json({ error: error || 'Invalid backend URL' }, { status: 500 });
    
    const res = await fetch(url, {
      method: 'GET',
      headers: request.headers,
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  });
}

export async function POST(request: Request) {
  console.log('NEXT_PUBLIC_BACKEND_API_URL:', process.env.NEXT_PUBLIC_BACKEND_API_URL);
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/concurso-categorias`;
  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
