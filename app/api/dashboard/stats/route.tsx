import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/dashboard/stats${new URL(request.url).search}`;
  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: request.headers,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 



