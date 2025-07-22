import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  const backendUrl = `${process.env.BACKEND_API_URL}/api/mapa-assuntos/status`;
  const res = await fetch(backendUrl, {
    method: 'PUT',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
