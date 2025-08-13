import { NextResponse } from 'next/server';
import { extractAuthToken } from '@/lib/auth-utils';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

function ensureCorrelationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id');
  if (incoming && incoming.trim().length > 0) return incoming;
  const random = Math.random().toString(36).slice(2, 10);
  return `simulados-${Date.now()}-${random}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = extractAuthToken(request);
  const correlationId = ensureCorrelationId(request);
  const { isValid, url, error } = getBackendUrl(`/api/v1/simulados/${slug}/submit`);
  if (!isValid) {
    const res = createEnvironmentErrorResponse({ isValid, url, error });
    return new NextResponse(res.body, { status: res.status, headers: { 'x-correlation-id': correlationId } });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
    },
    body: await request.text(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId } });
}


