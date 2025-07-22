import { NextResponse } from 'next/server';
import { getBackendUrl, withErrorHandling } from '@/lib/api-utils';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/onboarding');
    
    if (!isValid) return error!;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: request.headers,
      body: await request.text(),
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  });
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { isValid, url, error } = getBackendUrl('/api/onboarding');
    
    if (!isValid) return error!;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: request.headers,
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  });
} 