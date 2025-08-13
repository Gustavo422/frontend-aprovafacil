import { NextResponse } from 'next/server';
import { extractAuthToken } from '@/lib/auth-utils';
import { getBackendUrl, createEnvironmentErrorResponse } from '@/lib/api-utils';

function ensureCorrelationId(request: Request): string {
  const incoming = request.headers.get('x-correlation-id');
  if (incoming && incoming.trim().length > 0) return incoming;
  const random = Math.random().toString(36).slice(2, 10);
  return `simulados-${Date.now()}-${random}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = extractAuthToken(request);
  const correlationId = ensureCorrelationId(request);
  const { isValid, url, error } = getBackendUrl(`/api/v1/simulados/${slug}`, new URL(request.url).search);
  if (!isValid) {
    const res = createEnvironmentErrorResponse({ isValid, url, error });
    return new NextResponse(res.body, { status: res.status, headers: { 'x-correlation-id': correlationId } });
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
      'x-request-id': correlationId,
      ...(request.headers.get('if-none-match') ? { 'If-None-Match': request.headers.get('if-none-match') as string } : {}),
      ...(request.headers.get('if-modified-since') ? { 'If-Modified-Since': request.headers.get('if-modified-since') as string } : {}),
    },
  });
  const outEtag = res.headers.get('ETag');
  const outLastMod = res.headers.get('Last-Modified');
  if (res.status === 304) {
    return new Response(null, { status: 304, headers: { 'x-correlation-id': correlationId, 'x-request-id': res.headers.get('x-request-id') ?? correlationId, ...(outEtag ? { ETag: outEtag } : {}), ...(outLastMod ? { 'Last-Modified': outLastMod } : {}) } });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status, headers: { 'x-correlation-id': correlationId, 'x-request-id': res.headers.get('x-request-id') ?? correlationId, ...(outEtag ? { ETag: outEtag } : {}), ...(outLastMod ? { 'Last-Modified': outLastMod } : {}) } });
}


