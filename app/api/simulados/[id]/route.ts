import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const backendUrl = `${process.env.BACKEND_API_URL}/api/simulados/${id}${new URL(request.url).search}`;
  const res = await fetch(backendUrl, {
    method: 'GET',
    headers: request.headers,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const backendUrl = `${process.env.BACKEND_API_URL}/api/simulados/${id}`;
  const res = await fetch(backendUrl, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
