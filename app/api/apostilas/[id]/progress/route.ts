import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = `${process.env.BACKEND_API_URL}/api/apostilas/${id}/progress`;
  const res = await fetch(backendUrl, {
    method: 'PUT',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = `${process.env.BACKEND_API_URL}/api/apostilas/${id}/progress${new URL(request.url).search}`;
  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: request.headers,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
