import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/example${new URL(request.url).search}`;
  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: request.headers,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/example`;
  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
