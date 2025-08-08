import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/verify-reset-token`;
  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

