import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/apostilas/${params.id}/progress`;
  const res = await fetch(backendUrl, {
    method: 'PUT',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/apostilas/${params.id}/progress${new URL(request.url).search}`;
  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: request.headers,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
