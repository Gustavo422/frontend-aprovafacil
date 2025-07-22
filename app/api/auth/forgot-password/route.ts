import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/auth/forgot-password`;
  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

